import express from "express";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "5mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==========================================
  // LIVE DISCORD BOT HOSTING ROUTES (BotGhost Style)
  // ==========================================

  // Get Live Bot Status & Metrics & Logs
  app.get("/api/bot/status", (_req, res) => {
    try {
      const status = discordBotRunner.getStatus();
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Failed to get bot status" });
    }
  });

  // Start Live Bot Session
  app.post("/api/bot/start", async (req, res) => {
    try {
      const { token, botProject } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ success: false, message: "A valid Discord Bot Token is required." });
      }

      const result = await discordBotRunner.start(token, botProject);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (err: any) {
      console.error("Bot start error:", err);
      res.status(500).json({ success: false, message: err?.message || "Internal server error starting bot" });
    }
  });

  // Stop Live Bot Session
  app.post("/api/bot/stop", async (_req, res) => {
    try {
      await discordBotRunner.stop();
      res.json({ success: true, message: "Bot disconnected and stopped successfully." });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Failed to stop bot." });
    }
  });

  // Restart / Sync Live Bot
  app.post("/api/bot/restart", async (req, res) => {
    try {
      const { token, botProject } = req.body;
      if (token && botProject) {
        const result = await discordBotRunner.start(token, botProject);
        return res.json(result);
      }
      const result = await discordBotRunner.restart();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Failed to restart bot." });
    }
  });

  // Sync Slash Commands
  app.post("/api/bot/sync-commands", async (_req, res) => {
    try {
      const ok = await discordBotRunner.registerSlashCommands();
      if (ok) {
        res.json({ success: true, message: "Slash commands registered globally with Discord!" });
      } else {
        res.status(400).json({ success: false, message: "Bot is not connected or commands could not be registered." });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Failed to sync commands" });
    }
  });

  // Test Discord Webhook
  app.post("/api/discord/test-webhook", async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;

      if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return res.status(400).json({
          success: false,
          error: "Invalid Discord Webhook URL. It must start with https://discord.com/api/webhooks/",
        });
      }

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson = null;
      try {
        if (responseText) responseJson = JSON.parse(responseText);
      } catch {
        // ignored if not JSON
      }

      if (response.ok || response.status === 204) {
        return res.json({
          success: true,
          status: response.status,
          message: "Webhook delivered successfully to Discord!",
          response: responseJson || responseText || "HTTP 204 No Content (Standard Discord success)",
        });
      } else {
        return res.status(response.status).json({
          success: false,
          status: response.status,
          error: responseJson?.message || responseText || `Discord API error (${response.status})`,
          details: responseJson,
        });
      }
    } catch (err: any) {
      console.error("Error sending webhook:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to reach Discord servers",
      });
    }
  });

  // Validate Bot Token and fetch real Discord Bot profile
  app.post("/api/discord/validate-token", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string" || token.trim().length < 20) {
        return res.status(400).json({
          isValid: false,
          error: "Please enter a valid Discord Bot Token (minimum 25 characters)."
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
          error: "Invalid Bot Token. Discord returned: " + response.status + " " + response.statusText
        });
      }

      const botUser = await response.json();
      const avatarUrl = botUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${botUser.id}/${botUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Number(botUser.discriminator || 0) % 5}.png`;

      // Permissions: 8 = Administrator, or standard bot permissions
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
    } catch (err: any) {
      console.error("Token validation error:", err);
      return res.status(500).json({
        isValid: false,
        error: err?.message || "Failed to reach Discord Gateway API"
      });
    }
  });

  // Test Discord Bot REST API (send to channel)
  app.post("/api/discord/test-bot-message", async (req, res) => {
    try {
      const { botToken, channelId, payload } = req.body;

      if (!botToken || !channelId) {
        return res.status(400).json({
          success: false,
          error: "Both Bot Token and Channel ID are required for Discord REST API testing.",
        });
      }

      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken.trim()}`,
          "Content-Type": "application/json",
          "User-Agent": "DiscordGitHubWorkflowBotStudio/1.0",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseJson = null;
      try {
        if (responseText) responseJson = JSON.parse(responseText);
      } catch {
        // ignore
      }

      if (response.ok) {
        return res.json({
          success: true,
          status: response.status,
          message: "Bot message posted to channel successfully!",
          data: responseJson,
        });
      } else {
        return res.status(response.status).json({
          success: false,
          status: response.status,
          error: responseJson?.message || `Discord API returned ${response.status}`,
          details: responseJson,
        });
      }
    } catch (err: any) {
      console.error("Error sending bot message:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to execute Discord Bot REST request",
      });
    }
  });

  // ==========================================
  // UNIVERSAL AI ASSISTANT & CODE GENERATOR (Gemini 3.7 Flash)
  // ==========================================

  // Universal AI chat & question answerer (can answer ANY question)
  app.post("/api/ai/ask", async (req, res) => {
    try {
      const { prompt, context = "", history = [] } = req.body;

      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const client = getAIClient();
      if (!client) {
        // High quality local fallback if GEMINI_API_KEY is not set
        return res.json({
          success: true,
          answer: `I am ready to assist with your Discord bot and code! To unlock real-time Gemini AI capabilities across all questions, ensure GEMINI_API_KEY is configured in your environment.\n\nHere is guidance regarding your request: "${prompt}"`,
          code: null
        });
      }

      const systemInstruction = `You are a brilliant, unrestricted expert AI coding assistant and Discord engineer.
You can answer ANY question asked by the user — including Discord bot architecture (discord.py, discord.js), Python, JavaScript, TypeScript, server hosting, APIs, database integration, logic, math, debugging, or any general software engineering / knowledge questions.
Provide direct, highly accurate, friendly, and complete answers.
When providing code, provide production-ready, clean, well-commented code. If relevant, include both discord.py and discord.js examples or the specific requested framework.`;

      const contents = [];
      if (context) {
        contents.push({ role: "user", parts: [{ text: `Current Workspace Context / Active Code:\n\`\`\`\n${context.substring(0, 4000)}\n\`\`\`` }] });
        contents.push({ role: "model", parts: [{ text: "Understood. I have reviewed your active file and workspace context." }] });
      }

      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history.slice(-6)) {
          contents.push({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: String(msg.content || msg.text || "") }]
          });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: prompt.trim() }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const answerText = response.text || "No response generated.";
      return res.json({
        success: true,
        answer: answerText,
        text: answerText
      });
    } catch (err: any) {
      console.error("AI Ask Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to process AI response"
      });
    }
  });

  // Dedicated Bot Code & Cog Generator
  app.post("/api/bot/generate", async (req, res) => {
    try {
      const { prompt, language = "python", activeFile = "" } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ success: false, error: "Prompt is required" });
      }

      const client = getAIClient();
      if (!client) {
        return res.json({
          success: true,
          code: language.includes("py") 
            ? `# Generated for: ${prompt}\n@bot.tree.command(name="custom_${Math.floor(Math.random()*1000)}", description="${prompt.substring(0, 50)}")\nasync def custom_handler(interaction: discord.Interaction):\n    await interaction.response.send_message("✨ Executed ${prompt}!")\n`
            : `// Generated for: ${prompt}\nclient.commands.set('custom_${Math.floor(Math.random()*1000)}', {\n  name: 'custom',\n  description: '${prompt.substring(0, 50)}',\n  async execute(interaction) {\n    await interaction.reply({ content: '✨ Executed: ${prompt}' });\n  }\n});\n`
        });
      }

      const systemInstruction = `You are an elite Discord bot programmer.
Generate clean, production-grade, bug-free Discord bot code for the requested feature.
Target framework: ${language.includes("py") ? "discord.py v2.4+ with application slash commands and cogs" : "discord.js v14+ with SlashCommandBuilder & GatewayIntentBits"}.
Return ONLY executable code snippets or complete cogs that can be directly pasted or appended into the user's project.
Include helpful inline comments.`;

      const response = await client.models.generateContent({
        model: "gemini-3.7-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate code for: "${prompt}".\nTarget Framework: ${language}\nExisting active file snippet: ${activeFile.substring(0, 1500)}` }]
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.4
        }
      });

      let rawCode = response.text || "";
      // Strip markdown code fences if wrapped
      if (rawCode.startsWith("```python") || rawCode.startsWith("```javascript") || rawCode.startsWith("```typescript") || rawCode.startsWith("```js") || rawCode.startsWith("```py")) {
        rawCode = rawCode.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      } else if (rawCode.startsWith("```")) {
        rawCode = rawCode.replace(/^```\n?/, "").replace(/\n?```$/, "").trim();
      }

      return res.json({
        success: true,
        code: rawCode,
        botCode: rawCode
      });
    } catch (err: any) {
      console.error("Bot Code Generator Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to generate bot code"
      });
    }
  });

  // AI Task & Script Generator for Discord Workflow
  app.post("/api/ai/generate-bot-task", async (req, res) => {
    try {
      const { prompt, language = "typescript", schedule = "0 9 * * *" } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const client = getAIClient();
      if (!client) {
        return res.status(500).json({
          error: "Gemini API key is not configured. Please check your GEMINI_API_KEY.",
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

Return strictly raw JSON conforming to this schema without markdown code fences if possible, or parseable JSON.`;

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
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to generate AI bot task",
      });
    }
  });

  // ==========================================
  // TELEMETRY & USER TRACKING API
  // ==========================================

  // Record user event (signups, logins, exports, commands)
  app.post("/api/telemetry/event", (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.type) {
        return res.status(400).json({ success: false, message: "Event type is required." });
      }
      const event = telemetryStore.recordEvent(eventData);
      res.json({ success: true, event });
    } catch (err: any) {
      console.error("Telemetry event error:", err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Client heartbeat pulse for live active users
  app.post("/api/telemetry/heartbeat", (req, res) => {
    try {
      const { sessionKey, userId, email, name } = req.body;
      telemetryStore.recordHeartbeat(sessionKey || "guest_session", userId, email, name);
      res.json({ success: true, onlineNow: telemetryStore.getActiveOnlineCount() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Vite integration
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
    console.log(`Discord GitHub Workflow Studio running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
