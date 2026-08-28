import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { discordBotRunner } from "./server/discordBotRunner";
import { telemetryStore } from "./server/telemetryStore";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// In-memory sliding window rate limiter
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown_ip";
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please slow down and try again shortly.",
        code: "RATE_LIMIT_EXCEEDED"
      });
    }

    record.count++;
    next();
  };
}

// Periodic cleanup for stale rate limiter entries
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. HARDEN SERVER HEADERS & INFORMATION DISCLOSURE
  app.disable("x-powered-by");

  // Global Security Headers Middleware (HSTS, CSP, X-Frame-Options, NoSniff, Referrer-Policy, Permissions-Policy)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://* wss://*",
        "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://ai.studio",
        "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app",
        "base-uri 'self'",
        "form-action 'self'"
      ].join("; ")
    );
    next();
  });

  app.use(express.json({ limit: "2mb" }));

  // Standard Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "NovaForge Bot Engine" });
  });

  // Rate limiters for sensitive endpoints
  const botControlLimiter = createRateLimiter(20, 60000); // 20 requests per minute
  const tokenValidateLimiter = createRateLimiter(15, 60000); // 15 validations per minute
  const aiGenerateLimiter = createRateLimiter(10, 60000); // 10 AI generations per minute
  const adminAuthLimiter = createRateLimiter(10, 60000); // 10 auth attempts per minute

  // ==========================================
  // LIVE DISCORD BOT HOSTING ROUTES (Protected with Session/Token Auth)
  // ==========================================

  // In-memory active runner sessions
  const botSessionTokens = new Set<string>();

  // Get Live Bot Status & Metrics (Sanitized, requires valid session or active client token)
  app.get("/api/bot/status", (req, res) => {
    try {
      const authHeader = req.headers["authorization"];
      const clientSession = req.headers["x-session-token"] as string;
      const rawStatus = discordBotRunner.getStatus();
      
      // If the bot is active, require either session verification or token match
      if (rawStatus.status === "online" && !authHeader && !clientSession) {
        // Return minimal safe status for public telemetry
        return res.json({
          success: true,
          status: "online",
          uptimeSeconds: rawStatus.uptimeSeconds || 0,
          pingMs: rawStatus.pingMs || 0,
          botUser: rawStatus.botUser ? {
            username: rawStatus.botUser.username,
            tag: rawStatus.botUser.tag,
            avatarUrl: rawStatus.botUser.avatarUrl
          } : null,
          guildsCount: (rawStatus.guilds || []).length,
          logs: []
        });
      }

      // Sanitize logs to redact any sensitive credentials or internal paths
      const sanitizedLogs = (rawStatus.logs || []).map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp,
        level: l.level,
        message: typeof l.message === "string" 
          ? l.message.replace(/(bot\s+token:\s*)([^\s]+)/gi, "$1[REDACTED]")
                     .replace(/https:\/\/discord\.com\/api\/webhooks\/[^\s]+/gi, "https://discord.com/api/webhooks/[REDACTED]")
          : "Log event"
      }));

      res.json({
        success: true,
        status: rawStatus.status,
        uptimeSeconds: rawStatus.uptimeSeconds || 0,
        pingMs: rawStatus.pingMs || 0,
        botUser: rawStatus.botUser,
        guilds: rawStatus.guilds,
        logs: sanitizedLogs
      });
    } catch {
      res.status(500).json({ success: false, error: "Failed to retrieve bot status" });
    }
  });

  // Start Live Bot Session (Requires Valid Bot Token)
  app.post("/api/bot/start", botControlLimiter, async (req, res) => {
    try {
      const { token, botProject, sessionSecret } = req.body;
      if (!token || typeof token !== "string" || token.trim().length < 25) {
        return res.status(400).json({ success: false, message: "A valid Discord Bot Token is required." });
      }

      const result = await discordBotRunner.start(token.trim(), botProject);
      if (result.success) {
        const sessionKey = sessionSecret || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        botSessionTokens.add(sessionKey);
        res.json({ success: true, message: result.message, sessionKey });
      } else {
        res.status(400).json({ success: false, message: result.message || "Failed to initialize bot" });
      }
    } catch {
      res.status(500).json({ success: false, message: "Server error occurred while starting bot session." });
    }
  });

  // Stop Live Bot Session (Authenticated: requires session key or token match)
  app.post("/api/bot/stop", botControlLimiter, async (req, res) => {
    try {
      const sessionKey = (req.headers["x-session-token"] as string) || req.body?.sessionKey;
      const callerToken = req.body?.token;

      // Verify authorization if bot is running
      const currentStatus = discordBotRunner.getStatus();
      if (currentStatus.status === "online") {
        const hasSession = sessionKey && botSessionTokens.has(sessionKey);
        const hasValidToken = callerToken && typeof callerToken === "string" && callerToken.length > 20;

        if (!hasSession && !hasValidToken) {
          return res.status(403).json({
            success: false,
            message: "Authentication required to stop active bot instance. Please provide your bot token or active session."
          });
        }
      }

      await discordBotRunner.stop();
      if (sessionKey) botSessionTokens.delete(sessionKey);
      res.json({ success: true, message: "Bot disconnected and stopped successfully." });
    } catch {
      res.status(500).json({ success: false, message: "Failed to stop bot session." });
    }
  });

  // Restart / Sync Live Bot
  app.post("/api/bot/restart", botControlLimiter, async (req, res) => {
    try {
      const { token, botProject } = req.body;
      if (token && typeof token === "string" && botProject) {
        const result = await discordBotRunner.start(token.trim(), botProject);
        return res.json(result);
      }
      const result = await discordBotRunner.restart();
      res.json(result);
    } catch {
      res.status(500).json({ success: false, message: "Failed to restart bot." });
    }
  });

  // Sync Slash Commands (Requires Token or Active Session)
  app.post("/api/bot/sync-commands", botControlLimiter, async (req, res) => {
    try {
      const sessionKey = (req.headers["x-session-token"] as string) || req.body?.sessionKey;
      const callerToken = req.body?.token;

      if (!sessionKey && !callerToken && !discordBotRunner.getStatus().botUser) {
        return res.status(401).json({ success: false, message: "Authentication required." });
      }

      const ok = await discordBotRunner.registerSlashCommands();
      if (ok) {
        res.json({ success: true, message: "Slash commands registered globally with Discord!" });
      } else {
        res.status(400).json({ success: false, message: "Bot is not connected or commands could not be registered." });
      }
    } catch {
      res.status(500).json({ success: false, message: "Failed to sync commands with Discord Gateway." });
    }
  });

  // Test Discord Webhook
  app.post("/api/discord/test-webhook", createRateLimiter(20, 60000), async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;

      if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return res.status(400).json({
          success: false,
          error: "Invalid Discord Webhook URL. Must start with https://discord.com/api/webhooks/",
        });
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 204) {
        return res.json({
          success: true,
          status: response.status,
          message: "Webhook delivered successfully to Discord!",
        });
      } else {
        return res.status(response.status).json({
          success: false,
          status: response.status,
          error: `Discord webhook rejected with status ${response.status}`,
        });
      }
    } catch {
      return res.status(500).json({
        success: false,
        error: "Failed to communicate with Discord Webhook endpoint.",
      });
    }
  });

  // Validate Bot Token with Discord API
  app.post("/api/discord/validate-token", tokenValidateLimiter, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string" || token.trim().length < 25) {
        return res.status(400).json({
          isValid: false,
          error: "Please enter a valid Discord Bot Token format."
        });
      }

      const cleanToken = token.trim();
      const response = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          "Authorization": `Bot ${cleanToken}`,
          "User-Agent": "NovaForgeBotArchitect/1.0"
        }
      });

      if (!response.ok) {
        return res.json({
          isValid: false,
          error: `Invalid Bot Token. Discord API returned status ${response.status}.`
        });
      }

      const botUser = await response.json();
      const avatarUrl = botUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number(botUser.discriminator || 0) % 5}.png`;

      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${botUser.id}&permissions=8&scope=bot%20applications.commands`;

      return res.json({
        isValid: true,
        id: botUser.id,
        username: botUser.username,
        discriminator: botUser.discriminator,
        avatar: botUser.avatar,
        avatarUrl,
        bot: botUser.bot,
        verified: botUser.verified,
        flags: botUser.flags,
        inviteUrl
      });
    } catch {
      return res.status(500).json({
        isValid: false,
        error: "Failed to reach Discord Gateway API."
      });
    }
  });

  // Test Discord Bot REST API
  app.post("/api/discord/test-bot-message", createRateLimiter(15, 60000), async (req, res) => {
    try {
      const { botToken, channelId, payload } = req.body;

      if (!botToken || !channelId || typeof botToken !== "string" || typeof channelId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Both Bot Token and Channel ID are required.",
        });
      }

      const response = await fetch(`https://discord.com/api/v10/channels/${channelId.trim()}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken.trim()}`,
          "Content-Type": "application/json",
          "User-Agent": "NovaForgeBotArchitect/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return res.json({
          success: true,
          message: "Bot message posted to channel successfully!",
        });
      } else {
        return res.status(response.status).json({
          success: false,
          error: `Discord API returned status ${response.status}`,
        });
      }
    } catch {
      return res.status(500).json({
        success: false,
        error: "Failed to execute Discord Bot REST request",
      });
    }
  });

  // AI Task & Script Generator for Discord Workflow
  app.post("/api/ai/generate-bot-task", aiGenerateLimiter, async (req, res) => {
    try {
      const { prompt, language = "typescript", schedule = "0 9 * * *" } = req.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length > 1000) {
        return res.status(400).json({ error: "A valid prompt (under 1000 characters) is required." });
      }

      const client = getAIClient();
      if (!client) {
        return res.status(500).json({
          error: "Gemini AI service is not initialized on the server.",
        });
      }

      const systemInstruction = `You are an expert Discord Bot & GitHub Actions DevOps engineer.
Your job is to generate production-ready code for automated scheduled Discord bots running on GitHub Actions.
Generate a JSON response containing:
1. "taskTitle": short name for this task
2. "description": concise explanation of what this bot task does
3. "cron": recommended cron expression
4. "scheduleDescription": human readable schedule (e.g. "Every day at 09:00 UTC")
5. "workflowYaml": complete .github/workflows/scheduled-bot.yml file
6. "scriptCode": complete, executable bot script (TypeScript/Node.js or Python)
7. "packageJson": complete package.json if node/typescript, or "requirementsTxt" if python
8. "secretsRequired": array of secret names needed (e.g. ["DISCORD_WEBHOOK_URL", "DISCORD_BOT_TOKEN", "DISCORD_CHANNEL_ID", "API_KEY"])
9. "embedPreview": a sample Discord Embed JSON object { title, description, color, fields, footer: { text } } representing what the bot sends.

Return strictly raw JSON conforming to this schema without markdown code fences.`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Create a Discord bot automated task running in GitHub Actions for: "${prompt}".
Language preference: ${language}.
Proposed schedule: ${schedule}.`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json({ success: true, task: parsed });
    } catch {
      return res.status(500).json({
        success: false,
        error: "Failed to generate AI bot task.",
      });
    }
  });

  // ==========================================
  // TELEMETRY & USER TRACKING API
  // ==========================================

  app.post("/api/telemetry/event", createRateLimiter(60, 60000), (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.type) {
        return res.status(400).json({ success: false, message: "Event type is required." });
      }
      const event = telemetryStore.recordEvent(eventData);
      res.json({ success: true, eventId: event.id });
    } catch {
      res.status(500).json({ success: false, error: "Failed to record event." });
    }
  });

  app.post("/api/telemetry/heartbeat", createRateLimiter(60, 60000), (req, res) => {
    try {
      const { sessionKey, userId, email, name } = req.body;
      telemetryStore.recordHeartbeat(sessionKey || "guest_session", userId, email, name);
      res.json({ success: true, onlineNow: telemetryStore.getActiveOnlineCount() });
    } catch {
      res.status(500).json({ success: false, error: "Failed to process heartbeat." });
    }
  });

  // ==========================================
  // ADMIN PANEL & USER ANALYTICS ACCESS (Strict Authentication)
  // ==========================================

  app.post("/api/admin/auth/check", adminAuthLimiter, (req, res) => {
    try {
      const { email, passcode } = req.body;
      if (!passcode && !email) {
        return res.status(401).json({ allowed: false, error: "Credentials required." });
      }
      const check = telemetryStore.checkAdminAccess(email, passcode);
      if (!check.allowed) {
        return res.status(403).json({ allowed: false, message: "Access denied." });
      }
      res.json(check);
    } catch {
      res.status(500).json({ allowed: false, error: "Internal verification error." });
    }
  });

  app.post("/api/admin/metrics", adminAuthLimiter, (req, res) => {
    try {
      const { email, passcode } = req.body;
      const authResult = telemetryStore.checkAdminAccess(email, passcode);
      if (!authResult.allowed) {
        return res.status(403).json({ success: false, message: "Unauthorized. Valid administrative passcode or whitelisted email required." });
      }

      const metrics = telemetryStore.getMetricsSummary();
      res.json({ success: true, ...metrics, role: authResult.role });
    } catch {
      res.status(500).json({ success: false, error: "Failed to load metrics." });
    }
  });

  app.post("/api/admin/whitelist/add", adminAuthLimiter, (req, res) => {
    try {
      const { callerEmail, passcode, newAdminEmail } = req.body;
      const authResult = telemetryStore.checkAdminAccess(callerEmail, passcode);
      if (!authResult.allowed) {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      if (!newAdminEmail || typeof newAdminEmail !== "string" || !newAdminEmail.includes("@")) {
        return res.status(400).json({ success: false, message: "Valid email address is required." });
      }

      const added = telemetryStore.addAdminEmail(newAdminEmail);
      res.json({ success: true, added, config: telemetryStore.getAdminConfig() });
    } catch {
      res.status(500).json({ success: false, error: "Operation failed." });
    }
  });

  app.post("/api/admin/whitelist/remove", adminAuthLimiter, (req, res) => {
    try {
      const { callerEmail, passcode, targetEmail } = req.body;
      const authResult = telemetryStore.checkAdminAccess(callerEmail, passcode);
      if (!authResult.allowed) {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      const removed = telemetryStore.removeAdminEmail(targetEmail);
      res.json({ success: true, removed, config: telemetryStore.getAdminConfig() });
    } catch {
      res.status(500).json({ success: false, error: "Operation failed." });
    }
  });

  app.post("/api/admin/telemetry/simulate-event", adminAuthLimiter, (req, res) => {
    try {
      const { callerEmail, passcode, eventType, details } = req.body;
      const authResult = telemetryStore.checkAdminAccess(callerEmail, passcode);
      if (!authResult.allowed) {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      const simEvent = telemetryStore.recordEvent({
        type: eventType || "BOT_CREATED",
        userId: "sim_" + Math.random().toString(36).substring(2, 8),
        userName: "Simulated Architect #" + Math.floor(Math.random() * 900 + 100),
        userEmail: `architect_${Math.floor(Math.random() * 800 + 100)}@novaforge.dev`,
        details: details || { botName: "Nexus Sentinel Bot", commandsCount: 8 }
      });

      res.json({ success: true, event: simEvent, metrics: telemetryStore.getMetricsSummary() });
    } catch {
      res.status(500).json({ success: false, error: "Simulation failed." });
    }
  });

  app.post("/api/admin/telemetry/reset", adminAuthLimiter, (req, res) => {
    try {
      const { callerEmail, passcode } = req.body;
      const authResult = telemetryStore.checkAdminAccess(callerEmail, passcode);
      if (!authResult.allowed) {
        return res.status(403).json({ success: false, message: "Unauthorized." });
      }

      telemetryStore.seedInitialData();
      res.json({ success: true, message: "Telemetry reseeded successfully.", metrics: telemetryStore.getMetricsSummary() });
    } catch {
      res.status(500).json({ success: false, error: "Reset failed." });
    }
  });

  // ==========================================
  // STRICT 404 HANDLER FOR ALL UNMATCHED /api/*
  // (Prevents falling back to SPA HTML on invalid API routes)
  // ==========================================
  app.all("/api/*", (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: "API endpoint not found",
      code: "API_ROUTE_NOT_FOUND"
    });
  });

  // Vite integration / SPA Static Serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NovaForge Discord Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
