import { BotTaskTemplate } from '../types';

export const BOT_TEMPLATES: BotTaskTemplate[] = [
  {
    id: 'scheduled-announcements',
    title: 'Scheduled Server Announcement & Daily Digest',
    tagline: 'Broadcasts rich dynamic scheduled alerts, daily quotes, or events with embeds.',
    category: 'announcements',
    icon: 'Megaphone',
    defaultCron: '0 9 * * *', // Daily at 9am UTC
    cronDescription: 'Every day at 09:00 UTC (Runs automatically via GitHub Actions schedule)',
    language: 'javascript',
    requiredSecrets: ['DISCORD_WEBHOOK_URL'],
    highlights: [
      'Zero external dependencies (uses native Node.js fetch)',
      'Rich embed styling with dynamic timestamps & footer',
      'Supports optional role pings (@everyone or @here)',
      'Runs in < 5 seconds on GitHub free tier'
    ],
    samplePayload: {
      username: 'Server Broadcast Bot',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      content: '📢 **Scheduled Server Broadcast**',
      embeds: [
        {
          title: '☀️ Daily Community Briefing & Highlights',
          description: 'Good morning everyone! Here is your scheduled daily briefing and server announcements.\n\n* ✨ **Daily Goal:** Ship something awesome and help a peer.\n* 🗓️ **Upcoming Event:** Community voice lounge today at 18:00 UTC.\n* 💡 **Tip:** Check the `#announcements` pin for rule updates.',
          color: 5793266, // #5865F2 Blurple
          fields: [
            {
              name: '📅 Date & Time',
              value: 'Automated UTC schedule via GitHub Actions',
              inline: true
            },
            {
              name: '⚡ Status',
              value: '🟢 All systems operational',
              inline: true
            }
          ],
          footer: {
            text: 'Hosted on GitHub Actions • Serverless Cron Bot'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: Scheduled Discord Announcement

on:
  schedule:
    # Runs at 09:00 UTC every day
    - cron: '0 9 * * *'
  workflow_dispatch: # Allows manual trigger from GitHub Actions tab

jobs:
  post-announcement:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Discord Bot Announcement Script
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
        run: node index.js
`,
    scriptFilename: 'index.js',
    scriptCode: `/**
 * Scheduled Discord Announcement Bot
 * Executes inside GitHub Actions on a cron schedule
 */

async function sendAnnouncement() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("❌ ERROR: DISCORD_WEBHOOK_URL secret is not set in GitHub repository secrets.");
    process.exit(1);
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });

  const payload = {
    username: "Server Broadcast Bot",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    content: "📢 **Scheduled Server Broadcast**",
    embeds: [
      {
        title: "☀️ " + dateStr + " Community Briefing",
        description: "Good day everyone! This automated message was scheduled and dispatched automatically by our GitHub Actions workflow.\\n\\n* ✨ **Daily Focus:** Keep building, learning, and sharing!\\n* 💬 **Voice Lounge:** Open for casual work sessions.\\n* 🛡️ **Support:** Tag moderators in #help if needed.",
        color: 0x5865F2,
        fields: [
          {
            name: "⏱️ Execution Time",
            value: now.toUTCString(),
            inline: true
          },
          {
            name: "⚡ Infrastructure",
            value: "GitHub Actions Serverless",
            inline: true
          }
        ],
        footer: {
          text: "Automated via GitHub Workflow • Zero Server Costs"
        },
        timestamp: now.toISOString()
      }
    ]
  };

  console.log("🚀 Sending announcement to Discord webhook...");
  
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok || response.status === 204) {
    console.log("✅ Announcement posted to Discord successfully!");
  } else {
    const errorText = await response.text();
    console.error("❌ Failed to send announcement. HTTP " + response.status + ": " + errorText);
    process.exit(1);
  }
}

sendAnnouncement().catch((err) => {
  console.error("💥 Unhandled Error:", err);
  process.exit(1);
});
`,
    manifestFilename: 'package.json',
    manifestCode: `{
  "name": "discord-scheduled-announcement-bot",
  "version": "1.0.0",
  "description": "Serverless scheduled Discord announcement bot running on GitHub Actions",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
    readme: `# Discord Scheduled Announcement Bot (GitHub Actions)

This repository automatically sends scheduled announcements and embeds to your Discord server on a recurring schedule using **GitHub Actions**.

## 🚀 Setup Guide

### 1. Get Discord Webhook URL
1. In your Discord server, go to **Server Settings** -> **Integrations** -> **Webhooks**.
2. Click **New Webhook**, choose the channel (e.g. \`#announcements\`), and click **Copy Webhook URL**.

### 2. Add Secret to GitHub
1. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret**.
3. Name: \`DISCORD_WEBHOOK_URL\`
4. Value: Paste your Discord Webhook URL.
5. Click **Add secret**.

### 3. Test Run
1. Go to the **Actions** tab in your GitHub repository.
2. Select **Scheduled Discord Announcement**.
3. Click **Run workflow** -> **Run workflow**.
4. Check your Discord channel to see the announcement!
`
  },
  {
    id: 'uptime-health-monitor',
    title: 'Website & API Uptime Monitor with Alert Embeds',
    tagline: 'Pings websites/APIs every 15-30 mins and alerts Discord if an endpoint goes down.',
    category: 'monitoring',
    icon: 'Activity',
    defaultCron: '*/15 * * * *', // Every 15 mins
    cronDescription: 'Every 15 minutes (Cron: */15 * * * *)',
    language: 'javascript',
    requiredSecrets: ['DISCORD_WEBHOOK_URL', 'TARGET_URLS'],
    highlights: [
      'Pings multiple API / Web endpoints & records latency',
      'Sends Green status embed or Urgent Red alert embed on HTTP failure',
      'Records response times in milliseconds',
      'Configurable alert thresholds'
    ],
    samplePayload: {
      username: 'Uptime Sentinel',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/2.png',
      embeds: [
        {
          title: '🟢 System Health Report: All Endpoints Operational',
          description: 'Scheduled uptime check completed across all monitored services.',
          color: 5763719, // #57F287 Green
          fields: [
            {
              name: '🌐 API Service',
              value: '`https://api.example.com`\nStatus: `200 OK` (142ms)',
              inline: true
            },
            {
              name: '🖥️ Web App',
              value: '`https://app.example.com`\nStatus: `200 OK` (98ms)',
              inline: true
            },
            {
              name: '🛡️ Auth Gateway',
              value: '`https://auth.example.com`\nStatus: `200 OK` (115ms)',
              inline: true
            }
          ],
          footer: {
            text: 'GitHub Actions Uptime Watchdog • Checked 3 endpoints'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: Discord Uptime Monitor

on:
  schedule:
    # Runs every 15 minutes
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Check Endpoints & Post to Discord
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
          TARGET_URLS: \${{ secrets.TARGET_URLS || 'https://google.com,https://github.com' }}
        run: node monitor.js
`,
    scriptFilename: 'monitor.js',
    scriptCode: `/**
 * Automated Uptime Monitor for Discord via GitHub Actions
 */

async function runMonitor() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("❌ DISCORD_WEBHOOK_URL is required in repository secrets.");
    process.exit(1);
  }

  const rawTargets = process.env.TARGET_URLS || "https://google.com,https://github.com";
  const targets = rawTargets.split(",").map(u => u.trim()).filter(Boolean);

  console.log("🔍 Checking " + targets.length + " endpoints...");

  const results = [];
  let hasFailure = false;

  for (const url of targets) {
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
      const latency = Date.now() - start;
      const ok = res.status >= 200 && res.status < 400;
      if (!ok) hasFailure = true;

      results.push({
        url,
        status: res.status,
        statusText: res.statusText,
        latency,
        ok
      });
    } catch (err) {
      hasFailure = true;
      results.push({
        url,
        status: 0,
        statusText: err.name === 'TimeoutError' ? 'TIMEOUT' : 'CONNECTION_ERROR',
        latency: Date.now() - start,
        ok: false
      });
    }
  }

  // Create Discord Embed
  const embedColor = hasFailure ? 0xED4245 : 0x57F287;
  const embedTitle = hasFailure 
    ? "🚨 ALERT: One or More Endpoints Are DOWN!" 
    : "🟢 System Health: All Endpoints Operational";

  const fields = results.map(r => ({
    name: (r.ok ? "🟢 " : "🔴 ") + r.url.replace(/^https?:\\/\\//, ''),
    value: "Status: \`" + r.status + " " + r.statusText + "\`\\nLatency: \`" + r.latency + "ms\`",
    inline: true
  }));

  const payload = {
    username: "Uptime Sentinel",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/2.png",
    content: hasFailure ? "⚠️ **Service Outage Detected!**" : undefined,
    embeds: [
      {
        title: embedTitle,
        description: "Watchdog checked **" + results.length + "** target URLs at " + new Date().toUTCString() + ".",
        color: embedColor,
        fields,
        footer: {
          text: "Automated GitHub Actions Uptime Watchdog"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const discordRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (discordRes.ok || discordRes.status === 204) {
    console.log("✅ Uptime report delivered to Discord!");
  } else {
    console.error("❌ Failed to send to Discord:", await discordRes.text());
    process.exit(1);
  }
}

runMonitor().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
`,
    manifestFilename: 'package.json',
    manifestCode: `{
  "name": "discord-uptime-monitor",
  "version": "1.0.0",
  "type": "module",
  "main": "monitor.js"
}`,
    readme: `# Discord Uptime Monitor (GitHub Actions)

Monitors endpoints every 15 minutes and posts health status alerts directly to Discord.

## Secrets:
- \`DISCORD_WEBHOOK_URL\`: Your Discord channel webhook
- \`TARGET_URLS\`: Comma-separated list of URLs (e.g. \`https://my-api.com/health,https://my-site.com\`)
`
  },
  {
    id: 'ai-daily-briefing',
    title: 'AI News & Daily Briefing Generator (Gemini Powered)',
    tagline: 'Generates automated AI digests, tech news summaries, or customized daily themes.',
    category: 'ai',
    icon: 'Sparkles',
    defaultCron: '0 8 * * *',
    cronDescription: 'Every day at 08:00 UTC (Cron: 0 8 * * *)',
    language: 'javascript',
    requiredSecrets: ['DISCORD_WEBHOOK_URL', 'GEMINI_API_KEY'],
    highlights: [
      'Uses Google Gemini AI (gemini-3.7-flash) to write fresh content daily',
      'Never repeats static text; creates engaging community discussion starters',
      'Configurable prompt topic (Tech News, Daily Trivia, Coding Tips, Crypto, Gaming)',
      'Rich multi-section Discord Embed'
    ],
    samplePayload: {
      username: 'Gemini AI Host',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/4.png',
      content: '🤖 **Here is today\'s AI-Curated Tech Briefing**',
      embeds: [
        {
          title: '⚡ Today in Tech & Software Engineering',
          description: 'Here are the key software engineering trends and highlights for today:\n\n1. **TypeScript 5.8:** Performance optimizations and narrowed union checking.\n2. **AI Agents:** Serverless workflow runners are gaining massive adoption for cron automation.\n3. **Web Standards:** ECMAScript proposal updates for async iterators.',
          color: 10181046,
          fields: [
            {
              name: '💡 Daily Dev Tip',
              value: 'Use `AbortSignal.timeout(5000)` in native fetch instead of custom setTimeout wrappers for cleaner code.',
              inline: false
            },
            {
              name: '🧠 Community Prompt',
              value: 'What is your favorite CI/CD workflow trick? Reply below!',
              inline: false
            }
          ],
          footer: {
            text: 'Powered by Gemini AI • Hosted on GitHub Actions'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: AI Discord Daily Briefing

on:
  schedule:
    # Runs at 08:00 UTC daily
    - cron: '0 8 * * *'
  workflow_dispatch:

jobs:
  generate-ai-briefing:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Generate AI Content & Post to Discord
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          TOPIC: "Top Software Engineering Trends, Daily Coding Tip, and Discussion Question"
        run: node briefing.js
`,
    scriptFilename: 'briefing.js',
    scriptCode: `/**
 * AI-Powered Scheduled Discord Briefing
 * Uses @google/genai and runs inside GitHub Actions
 */

import { GoogleGenAI } from "@google/genai";

async function run() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!webhookUrl) {
    console.error("❌ Missing DISCORD_WEBHOOK_URL secret.");
    process.exit(1);
  }
  if (!geminiApiKey) {
    console.error("❌ Missing GEMINI_API_KEY secret.");
    process.exit(1);
  }

  const topic = process.env.TOPIC || "Software engineering news, tips, and daily inspiration";
  console.log("🧠 Asking Gemini to generate daily briefing for: " + topic + "...");

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const prompt = "You are an enthusiastic Discord bot community curator. Write today's briefing about " + topic + ". Return ONLY a valid JSON object matching this schema: { \\"title\\": \\"Short catchy title\\", \\"summary\\": \\"3-4 bullet points of interesting insights or news\\", \\"tipTitle\\": \\"Short tip header\\", \\"tipContent\\": \\"A concise actionable tip or fact\\", \\"discussionQuestion\\": \\"An engaging question for the Discord server members to answer\\" }";

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.7
    }
  });

  const content = JSON.parse(response.text || "{}");

  const payload = {
    username: "Gemini AI Host",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/4.png",
    content: "🤖 **Here is today's AI-Curated Daily Briefing!**",
    embeds: [
      {
        title: content.title || "⚡ Daily Tech Briefing",
        description: content.summary,
        color: 0x9B59B6,
        fields: [
          {
            name: "💡 " + (content.tipTitle || "Daily Tip"),
            value: content.tipContent || "Stay curious!",
            inline: false
          },
          {
            name: "💬 Community Question of the Day",
            value: content.discussionQuestion || "What are you working on today?",
            inline: false
          }
        ],
        footer: {
          text: "Generated by Gemini 3.7 Flash • Serverless GitHub Actions"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  console.log("🚀 Posting AI content to Discord...");
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok || res.status === 204) {
    console.log("✅ Successfully sent AI briefing to Discord!");
  } else {
    console.error("❌ Failed to send to Discord:", await res.text());
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
`,
    manifestFilename: 'package.json',
    manifestCode: `{
  "name": "discord-ai-daily-briefing",
  "version": "1.0.0",
  "type": "module",
  "main": "briefing.js",
  "dependencies": {
    "@google/genai": "^2.4.0"
  }
}`,
    readme: `# AI-Powered Discord Daily Briefing Bot

Generates fresh, dynamic daily community briefings using **Gemini 3.7 Flash** and posts them straight into your Discord channel.

## GitHub Secrets:
1. \`DISCORD_WEBHOOK_URL\`: Your Discord Channel Webhook URL
2. \`GEMINI_API_KEY\`: Your Google Gemini API Key
`
  },
  {
    id: 'discord-js-bot-client',
    title: 'Discord.js Bot Token Runner (Channel Cleaner / Janitor)',
    tagline: 'Runs a full Discord.js client in GitHub Actions to purge old bot clutter or manage roles.',
    category: 'automation',
    icon: 'Shield',
    defaultCron: '0 0 * * 0',
    cronDescription: 'Every Sunday at 00:00 UTC (Weekly maintenance)',
    language: 'javascript',
    requiredSecrets: ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'],
    highlights: [
      'Full Discord REST & Gateway Bot authorization (`discord.js` v14)',
      'Performs administrative tasks: bulk channel cleanup, pinned message sync',
      'Gracefully logs in, runs routine, sends summary embed, and shuts down safely',
      'Prevents GitHub workflow timeouts with automatic client destruction'
    ],
    samplePayload: {
      username: 'Server Janitor Bot',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png',
      embeds: [
        {
          title: '🧹 Channel Maintenance Completed',
          description: 'Routine weekly cleanup was executed by GitHub Actions scheduled workflow.',
          color: 3447003,
          fields: [
            {
              name: '📁 Cleaned Channel',
              value: '<#123456789012345678>',
              inline: true
            },
            {
              name: '🗑️ Messages Purged',
              value: '`47 bot commands & spam`',
              inline: true
            },
            {
              name: '⏱️ Duration',
              value: '`3.2s`',
              inline: true
            }
          ],
          footer: {
            text: 'Discord.js v14 • Scheduled Maintenance'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: Discord Bot Scheduled Janitor

on:
  schedule:
    # Runs every Sunday at 00:00 UTC
    - cron: '0 0 * * 0'
  workflow_dispatch:

jobs:
  run-bot-task:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install discord.js
        run: npm install

      - name: Execute Bot Maintenance
        env:
          DISCORD_BOT_TOKEN: \${{ secrets.DISCORD_BOT_TOKEN }}
          DISCORD_CHANNEL_ID: \${{ secrets.DISCORD_CHANNEL_ID }}
        run: node bot.js
`,
    scriptFilename: 'bot.js',
    scriptCode: `/**
 * Discord.js Scheduled Bot Runner
 * Connects to Discord Gateway, performs maintenance, logs result, and exits cleanly.
 */

import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    console.error("❌ Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID in secrets.");
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", async () => {
    console.log("🤖 Logged in as " + client.user.tag + "!");

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error("Target channel not found or is not a text channel.");
      }

      console.log("🧹 Fetching messages in #" + channel.name + "...");
      const messages = await channel.messages.fetch({ limit: 50 });
      
      const toDelete = messages.filter(m => !m.pinned && (m.author.bot || m.content.startsWith("!")));
      console.log("Found " + toDelete.size + " messages eligible for purge.");

      let deletedCount = 0;
      if (toDelete.size > 0) {
        const deleted = await channel.bulkDelete(toDelete, true);
        deletedCount = deleted.size;
      }

      const embed = new EmbedBuilder()
        .setTitle("🧹 Channel Maintenance Completed")
        .setDescription("Automated cleanup executed for **#" + channel.name + "**.")
        .setColor(0x3498DB)
        .addFields(
          { name: "🗑️ Messages Purged", value: "\`" + deletedCount + " items\`", inline: true },
          { name: "⚡ Trigger", value: "GitHub Actions Cron", inline: true }
        )
        .setFooter({ text: "Discord.js Bot • Serverless Worker" })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      console.log("✅ Cleanup finished and report sent!");

    } catch (err) {
      console.error("❌ Error during bot execution:", err);
      process.exitCode = 1;
    } finally {
      console.log("👋 Disconnecting Discord client...");
      await client.destroy();
      process.exit();
    }
  });

  console.log("🔑 Logging in to Discord...");
  await client.login(token);
}

main();
`,
    manifestFilename: 'package.json',
    manifestCode: `{
  "name": "discord-bot-token-janitor",
  "version": "1.0.0",
  "type": "module",
  "main": "bot.js",
  "dependencies": {
    "discord.js": "^14.17.3"
  }
}`,
    readme: `# Discord.js Bot Token Runner (GitHub Actions)

Performs server administration and message cleanup on a schedule.

## Requirements:
1. Create a Bot in the Discord Developer Portal.
2. Enable Message Content Intent in Bot settings.
3. Invite the bot with Manage Messages permissions.
4. Add \`DISCORD_BOT_TOKEN\` and \`DISCORD_CHANNEL_ID\` to GitHub Repository Secrets.
`
  },
  {
    id: 'python-discord-bot',
    title: 'Python Scheduled Bot (discord.py & requests)',
    tagline: 'Runs Python automated tasks, scraping, data aggregation, and Discord posts.',
    category: 'developer',
    icon: 'Code2',
    defaultCron: '0 12 * * 1-5',
    cronDescription: 'Weekdays at 12:00 UTC (Cron: 0 12 * * 1-5)',
    language: 'python',
    requiredSecrets: ['DISCORD_WEBHOOK_URL'],
    highlights: [
      'Native Python 3.11/3.12 environment in GitHub Actions',
      'Uses requests library for lightweight Discord webhook dispatch',
      'Ideal for Python data science, web scraping, and machine learning alerts',
      'No complex server hosting required'
    ],
    samplePayload: {
      username: 'Python Dispatcher',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/3.png',
      content: '🐍 **Python Data Pipeline Complete**',
      embeds: [
        {
          title: '📊 Scheduled Data Processing Report',
          description: 'The automated Python worker completed batch calculations and published results to Discord.',
          color: 15844367,
          fields: [
            {
              name: '🐍 Python Version',
              value: '`Python 3.12.x`',
              inline: true
            },
            {
              name: '📈 Records Processed',
              value: '`1,420 items`',
              inline: true
            },
            {
              name: '⏱️ Runtime',
              value: '`1.84s`',
              inline: true
            }
          ],
          footer: {
            text: 'Python 3 • GitHub Actions Scheduled Job'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: Python Discord Scheduled Task

on:
  schedule:
    # Runs at 12:00 UTC Monday through Friday
    - cron: '0 12 * * 1-5'
  workflow_dispatch:

jobs:
  run-python-task:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install Dependencies
        run: pip install -r requirements.txt

      - name: Run Python Bot Script
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
        run: python main.py
`,
    scriptFilename: 'main.py',
    scriptCode: `"""
Python Scheduled Discord Bot Runner
Executes via GitHub Actions on a cron schedule
"""

import os
import sys
import datetime
import requests

def send_discord_report():
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        print("❌ Error: DISCORD_WEBHOOK_URL environment variable is missing.", file=sys.stderr)
        sys.exit(1)

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    payload = {
        "username": "Python Dispatcher",
        "avatar_url": "https://cdn.discordapp.com/embed/avatars/3.png",
        "content": "🐍 **Python Data Pipeline Complete**",
        "embeds": [
            {
                "title": "📊 Scheduled Python Data Processing Report",
                "description": "Python task executed successfully inside GitHub Actions runner.",
                "color": 0xF1C40F,
                "fields": [
                    {
                        "name": "🐍 Environment",
                        "value": f"Python {sys.version.split()[0]} on Linux",
                        "inline": True
                    },
                    {
                        "name": "⚙️ Status",
                        "value": "🟢 Success (Exit code 0)",
                        "inline": True
                    }
                ],
                "footer": {
                    "text": "Automated via GitHub Actions Workflow"
                },
                "timestamp": now_iso
            }
        ]
    }

    print("🚀 Sending payload to Discord...")
    response = requests.post(webhook_url, json=payload, timeout=10)

    if response.status_code in [200, 204]:
        print("✅ Message successfully sent to Discord!")
    else:
        print(f"❌ Failed to send. Status: {response.status_code}, Response: {response.text}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    send_discord_report()
`,
    manifestFilename: 'requirements.txt',
    manifestCode: `requests>=2.31.0
urllib3>=2.0.0
`,
    readme: `# Python Scheduled Discord Bot (GitHub Actions)

Runs Python automated scripts on a schedule and dispatches rich status embeds to Discord.

## Secrets:
- \`DISCORD_WEBHOOK_URL\`: Your Discord webhook endpoint
`
  },
  {
    id: 'github-pulse-monitor',
    title: 'GitHub Activity Pulse & Release Watcher',
    tagline: 'Summarizes latest commits, merged PRs, and new releases into your Discord dev channel.',
    category: 'developer',
    icon: 'GitPullRequest',
    defaultCron: '0 17 * * 5',
    cronDescription: 'Every Friday at 17:00 UTC (Weekly sprint recap)',
    language: 'javascript',
    requiredSecrets: ['DISCORD_WEBHOOK_URL', 'GITHUB_TOKEN'],
    highlights: [
      'Uses built-in GITHUB_TOKEN (zero manual token configuration needed!)',
      'Queries GitHub REST API for latest commits & PRs',
      'Formatted changelog embed for engineering teams'
    ],
    samplePayload: {
      username: 'GitHub Activity Bot',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/5.png',
      embeds: [
        {
          title: '🐙 Weekly Engineering Pulse & Changelog',
          description: 'Here is the summary of activity merged into `main` this week:',
          color: 2303786,
          fields: [
            {
              name: '✨ New Features',
              value: '• Added automated Discord webhook scheduler\n• Added cron expression validator',
              inline: false
            },
            {
              name: '🐛 Bug Fixes',
              value: '• Fixed Discord rate limit retry headers\n• Corrected UTC timezone offsets',
              inline: false
            }
          ],
          footer: {
            text: 'GitHub Actions • Repo Pulse'
          },
          timestamp: new Date().toISOString()
        }
      ]
    },
    workflowYaml: `name: Weekly GitHub Activity to Discord

on:
  schedule:
    - cron: '0 17 * * 5' # Friday 5pm UTC
  workflow_dispatch:

jobs:
  report-activity:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 50

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Parse Commits & Post to Discord
        env:
          DISCORD_WEBHOOK_URL: \${{ secrets.DISCORD_WEBHOOK_URL }}
          GITHUB_REPOSITORY: \${{ github.repository }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: node changelog.js
`,
    scriptFilename: 'changelog.js',
    scriptCode: `/**
 * GitHub Activity to Discord Pulse
 */

import { execSync } from "child_process";

async function run() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("❌ Missing DISCORD_WEBHOOK_URL");
    process.exit(1);
  }

  const repo = process.env.GITHUB_REPOSITORY || "my-org/my-project";

  let commits = "";
  try {
    commits = execSync('git log -n 5 --pretty=format:"• %s (%an)"').toString();
  } catch (err) {
    commits = "• Routine workflow maintenance & automated tasks";
  }

  const payload = {
    username: "GitHub Activity Pulse",
    avatar_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    embeds: [
      {
        title: "🐙 Latest Activity for " + repo,
        description: "Recent commits merged into default branch:\\n\\n" + commits,
        color: 0x24292E,
        fields: [
          {
            name: "🔗 Repository",
            value: "[View on GitHub](https://github.com/" + repo + ")",
            inline: true
          },
          {
            name: "⚡ Run Type",
            value: "Scheduled Weekly Digest",
            inline: true
          }
        ],
        footer: {
          text: "Automated via GitHub Actions"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok || res.status === 204) {
    console.log("✅ Posted commit digest to Discord!");
  } else {
    console.error("❌ Discord Error:", await res.text());
    process.exit(1);
  }
}

run();
`,
    manifestFilename: 'package.json',
    manifestCode: `{
  "name": "discord-github-pulse",
  "version": "1.0.0",
  "type": "module",
  "main": "changelog.js"
}`,
    readme: `# GitHub Activity Pulse to Discord

Posts recent commits and changelog updates automatically to Discord using GitHub Actions.
`
  }
];
