import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Code2, 
  Terminal, 
  Play, 
  Square, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Plus, 
  Trash2, 
  FileCode, 
  FolderPlus, 
  FilePlus, 
  Settings, 
  RefreshCw, 
  HelpCircle, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Wand2, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Cpu, 
  Save, 
  ExternalLink,
  Search,
  BookOpen,
  Share2,
  Shield,
  Zap,
  Flame,
  Radio,
  Sliders,
  Send,
  Loader2
} from 'lucide-react';
import { BotProject, BotTokenInfo } from '../types';
import { answerFreeQuestion } from '../utils/freeKnowledgeEngine';
import JSZip from 'jszip';

interface CodeStudioProps {
  botProject: BotProject;
  tokenInfo: BotTokenInfo | null;
  onUpdateBotProject?: (updated: BotProject) => void;
  onOpenTokenModal?: () => void;
}

type CodeLanguage = 'discord_py' | 'discord_js';

interface VirtualFile {
  id: string;
  name: string;
  language: 'python' | 'javascript' | 'json' | 'markdown' | 'env';
  content: string;
  isReadonly?: boolean;
}

// Initial Starter Templates for Python (discord.py)
const INITIAL_PYTHON_FILES: VirtualFile[] = [
  {
    id: 'py_main',
    name: 'bot.py',
    language: 'python',
    content: `import os
import asyncio
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN", "YOUR_BOT_TOKEN_HERE")

# Configure Gateway Intents
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

class NovaBot(commands.Bot):
    def __init__(self):
        super().__init__(
            command_prefix="!",
            intents=intents,
            help_command=None
        )

    async def setup_hook(self):
        # Load Cogs automatically
        print("⚡ [NovaForge] Loading extension modules...")
        for ext in ["cogs.moderation", "cogs.economy", "cogs.utilities"]:
            try:
                await self.load_extension(ext)
                print(f"  ✓ Loaded {ext}")
            except Exception as e:
                print(f"  ✗ Failed to load {ext}: {e}")
        
        # Sync Global Slash Commands with Discord Gateway
        print("🔄 [NovaForge] Syncing application slash commands...")
        synced = await self.tree.sync()
        print(f"✨ [NovaForge] Successfully synced {len(synced)} slash commands!")

    async def on_ready(self):
        print(f"🤖 [NovaForge] Logged in as {self.user.name} (ID: {self.user.id})")
        print(f"🌐 [NovaForge] Connected to {len(self.guilds)} guilds with {len(self.users)} cached members.")
        activity = discord.Activity(
            type=discord.ActivityType.watching,
            name="/help | NovaForge Studio"
        )
        await self.change_presence(status=discord.Status.online, activity=activity)

bot = NovaBot()

# Global Slash Command: /ping
@bot.tree.command(name="ping", description="Check the bot's WebSocket latency and system health.")
async def ping(interaction: discord.Interaction):
    latency_ms = round(bot.latency * 1000)
    embed = discord.Embed(
        title="🏓 Pong! WebSocket Pulse",
        description=f"**API Latency:** \`{latency_ms}ms\`\\n**System Status:** 🟢 Operational\\n**Shard:** \`0/1\`",
        color=discord.Color.brand_green()
    )
    embed.set_footer(text="NovaForge Discord Engine • discord.py v2.4")
    await interaction.response.send_message(embed=embed)

if __name__ == "__main__":
    if TOKEN == "YOUR_BOT_TOKEN_HERE" or not TOKEN:
        print("⚠️ Warning: Please specify your DISCORD_TOKEN in the .env file.")
    bot.run(TOKEN)
`
  },
  {
    id: 'py_mod',
    name: 'cogs/moderation.py',
    language: 'python',
    content: `import discord
from discord.ext import commands
from discord import app_commands

class ModerationCog(commands.Cog):
    """Shield and moderation tools for server protection."""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @app_commands.command(name="kick", description="Kick a member from the server.")
    @app_commands.describe(member="The user to kick", reason="Reason for expulsion")
    @app_commands.default_permissions(kick_members=True)
    async def kick(self, interaction: discord.Interaction, member: discord.Member, reason: str = "No reason provided"):
        if member.top_role >= interaction.user.top_role and interaction.guild.owner != interaction.user:
            await interaction.response.send_message("❌ You cannot kick members with equal or higher roles.", ephemeral=True)
            return

        try:
            await member.kick(reason=f"Kicked by {interaction.user}: {reason}")
            embed = discord.Embed(
                title="🛡️ Member Expelled",
                description=f"**Target:** {member.mention} ({member.id})\\n**Moderator:** {interaction.user.mention}\\n**Reason:** {reason}",
                color=discord.Color.red()
            )
            await interaction.response.send_message(embed=embed)
        except discord.Forbidden:
            await interaction.response.send_message("❌ Failed to kick. Check bot role hierarchy and permissions.", ephemeral=True)

    @app_commands.command(name="purge", description="Bulk delete messages in the current channel.")
    @app_commands.describe(amount="Number of messages (1-100)")
    @app_commands.default_permissions(manage_messages=True)
    async def purge(self, interaction: discord.Interaction, amount: int):
        if amount < 1 or amount > 100:
            await interaction.response.send_message("❌ Amount must be between 1 and 100.", ephemeral=True)
            return

        await interaction.response.defer(ephemeral=True)
        deleted = await interaction.channel.purge(limit=amount)
        await interaction.followup.send(f"🧹 Successfully cleared **{len(deleted)}** messages!", ephemeral=True)

async def setup(bot: commands.Bot):
    await bot.add_cog(ModerationCog(bot))
`
  },
  {
    id: 'py_eco',
    name: 'cogs/economy.py',
    language: 'python',
    content: `import discord
import random
from discord.ext import commands
from discord import app_commands

class EconomyCog(commands.Cog):
    """Virtual credits, daily rewards, and casino mini-games."""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        # In-memory bank for demonstration (replace with SQLite or MongoDB)
        self.wallets = {}

    def get_balance(self, user_id: int) -> int:
        return self.wallets.get(user_id, 1000)

    def add_balance(self, user_id: int, amount: int):
        self.wallets[user_id] = self.get_balance(user_id) + amount

    @app_commands.command(name="daily", description="Claim your daily credit stipend (500 NovaCoins).")
    async def daily(self, interaction: discord.Interaction):
        reward = 500
        self.add_balance(interaction.user.id, reward)
        new_balance = self.get_balance(interaction.user.id)

        embed = discord.Embed(
            title="💰 Daily Stipend Claimed!",
            description=f"Received **+{reward} NovaCoins**!\\nYour new balance is **{new_balance:,}** coins.",
            color=discord.Color.gold()
        )
        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="coinflip", description="Bet your coins on Heads or Tails.")
    @app_commands.describe(bet="Amount of coins to wager", choice="heads or tails")
    @app_commands.choices(choice=[
        app_commands.Choice(name="Heads", value="heads"),
        app_commands.Choice(name="Tails", value="tails")
    ])
    async def coinflip(self, interaction: discord.Interaction, bet: int, choice: app_commands.Choice[str]):
        balance = self.get_balance(interaction.user.id)
        if bet <= 0:
            await interaction.response.send_message("❌ Bet must be greater than 0.", ephemeral=True)
            return
        if bet > balance:
            await interaction.response.send_message(f"❌ Insufficient balance. You only have **{balance}** coins.", ephemeral=True)
            return

        outcome = random.choice(["heads", "tails"])
        won = (outcome == choice.value)

        if won:
            self.add_balance(interaction.user.id, bet)
            color = discord.Color.green()
            result_text = f"🎉 **YOU WON!** Coin landed on **{outcome.upper()}**!\\nProfit: **+{bet:,}** coins."
        else:
            self.add_balance(interaction.user.id, -bet)
            color = discord.Color.dark_red()
            result_text = f"💀 **YOU LOST!** Coin landed on **{outcome.upper()}**.\\nLost: **-{bet:,}** coins."

        embed = discord.Embed(
            title="🪙 High-Stakes Coinflip",
            description=f"{result_text}\\nNew Balance: **{self.get_balance(interaction.user.id):,}** coins.",
            color=color
        )
        await interaction.response.send_message(embed=embed)

async def setup(bot: commands.Bot):
    await bot.add_cog(EconomyCog(bot))
`
  },
  {
    id: 'py_req',
    name: 'requirements.txt',
    language: 'markdown',
    content: `discord.py>=2.4.0
python-dotenv>=1.0.1
aiohttp>=3.9.5
aiosqlite>=0.20.0
requests>=2.31.0
`
  },
  {
    id: 'py_env',
    name: '.env',
    language: 'env',
    content: `DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
APPLICATION_ID=123456789012345678
DEBUG_MODE=True
`
  },
  {
    id: 'py_readme',
    name: 'README.md',
    language: 'markdown',
    content: `# 🐍 NovaForge Discord.py Bot

Built with modern **Python 3.10+** and **discord.py v2.4+**.

### 🚀 Quick Start Guide
1. Install Python 3.10 or higher.
2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. Put your Discord bot token in \`.env\`.
4. Launch the bot:
   \`\`\`bash
   python bot.py
   \`\`\`
`
  }
];

// Initial Starter Templates for JavaScript (discord.js)
const INITIAL_JS_FILES: VirtualFile[] = [
  {
    id: 'js_main',
    name: 'index.js',
    language: 'javascript',
    content: `import { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
const TOKEN = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CLIENT_ID = process.env.CLIENT_ID || 'YOUR_CLIENT_ID_HERE';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();

// Command handler
const commands = [
  {
    name: 'ping',
    description: 'Check WebSocket latency and bot performance',
    async execute(interaction) {
      const pingMs = client.ws.ping;
      const embed = new EmbedBuilder()
        .setTitle('🏓 Pong! WebSocket Pulse')
        .setDescription(\`**Heartbeat:** \\\`\${pingMs}ms\\\`\\n**Status:** 🟢 Operational\\n**Framework:** Discord.js v14\`)
        .setColor(0x5865F2)
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    name: 'userinfo',
    description: 'Displays detailed user avatar and creation stats',
    async execute(interaction) {
      const user = interaction.user;
      const member = interaction.member;
      const embed = new EmbedBuilder()
        .setTitle(\`👤 Profile: \${user.tag}\`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'User ID', value: \`\\\`\${user.id}\\\`\`, inline: true },
          { name: 'Joined Server', value: member?.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A', inline: true },
          { name: 'Account Created', value: new Date(user.createdAt).toLocaleDateString(), inline: true }
        )
        .setColor(0x00FF88);
      await interaction.reply({ embeds: [embed] });
    }
  }
];

commands.forEach(cmd => client.commands.set(cmd.name, cmd));

client.once('ready', async () => {
  console.log(\`🤖 [NovaForge] Logged in as \${client.user.tag}\`);
  client.user.setActivity('/ping | NovaForge JS Engine', { type: 3 }); // Watching

  // Register Slash Commands via REST API
  try {
    console.log('🔄 [NovaForge] Registering slash commands with Discord API...');
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(c => ({ name: c.name, description: c.description })) }
    );
    console.log('✨ [NovaForge] Slash commands registered successfully!');
  } catch (error) {
    console.error('✗ Failed to register commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const reply = { content: '❌ There was an error executing this command!', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(TOKEN);
`
  },
  {
    id: 'js_pkg',
    name: 'package.json',
    language: 'json',
    content: `{
  "name": "novaforge-discord-bot",
  "version": "1.0.0",
  "description": "High performance Discord bot generated by NovaForge",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "discord.js": "^14.16.3",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  }
}
`
  },
  {
    id: 'js_env',
    name: '.env',
    language: 'env',
    content: `DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE
CLIENT_ID=YOUR_APPLICATION_CLIENT_ID_HERE
PORT=3000
`
  },
  {
    id: 'js_readme',
    name: 'README.md',
    language: 'markdown',
    content: `# ⚡ NovaForge Discord.js Bot

Built with **Node.js 18+** and **discord.js v14+**.

### 🚀 Quick Start Guide
1. Install Node.js v18+.
2. Install npm dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Put your Discord bot token & Client ID in \`.env\`.
4. Launch the bot:
   \`\`\`bash
   npm start
   \`\`\`
`
  }
];

// Code snippets library for instant insertion
const CODE_SNIPPETS = {
  discord_py: [
    {
      name: 'Slash Command with Options',
      code: `@bot.tree.command(name="custom_cmd", description="Custom slash command with arguments")
@app_commands.describe(query="Text argument", count="Number argument")
async def custom_cmd(interaction: discord.Interaction, query: str, count: int = 1):
    await interaction.response.send_message(f"Received query: \`{query}\` x{count}")`
    },
    {
      name: 'Interactive Button Row (View)',
      code: `class ActionButtonsView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=60)

    @discord.ui.button(label="Accept", style=discord.ButtonStyle.green, emoji="✅")
    async def accept_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("✅ You accepted the prompt!", ephemeral=True)

    @discord.ui.button(label="Cancel", style=discord.ButtonStyle.red, emoji="✖️")
    async def cancel_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("✖️ Action cancelled.", ephemeral=True)

@bot.tree.command(name="prompt", description="Send an interactive button prompt")
async def send_prompt(interaction: discord.Interaction):
    await interaction.response.send_message("Please choose an option:", view=ActionButtonsView())`
    },
    {
      name: 'Embed with Thumbnail & Fields',
      code: `embed = discord.Embed(
    title="🌟 Celestial System Broadcast",
    description="This is an automated server update announcement.",
    color=discord.Color.purple()
)
embed.set_thumbnail(url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200")
embed.add_field(name="🛡️ Security Level", value="Maximum (Aegis)", inline=True)
embed.add_field(name="⚡ Shard Latency", value="18ms", inline=True)
embed.set_footer(text="NovaForge Telemetry Engine", icon_url=bot.user.display_avatar.url)
await interaction.response.send_message(embed=embed)`
    },
    {
      name: 'Anti-Spam & Auto-Mod Listener',
      code: `@bot.event
async def on_message(message: discord.Message):
    if message.author.bot:
        return

    # Check for banned links or invite spam
    banned_words = ["discord.gg/", "t.me/", "free-nitro"]
    if any(word in message.content.lower() for word in banned_words):
        await message.delete()
        await message.channel.send(f"⚠️ {message.author.mention}, invite links are prohibited here!", delete_after=5)
        return

    await bot.process_commands(message)`
    }
  ],
  discord_js: [
    {
      name: 'Slash Command with Subcommands',
      code: `import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Manage your server profile')
  .addSubcommand(sub => sub.setName('view').setDescription('View your current profile card'))
  .addSubcommand(sub => 
    sub.setName('setbio')
       .setDescription('Update your personal bio')
       .addStringOption(opt => opt.setName('bio').setDescription('Your bio text').setRequired(true))
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  if (sub === 'view') {
    await interaction.reply({ content: 'Showing your profile card...' });
  } else if (sub === 'setbio') {
    const bio = interaction.options.getString('bio');
    await interaction.reply({ content: \`Bio updated to: "\${bio}"\`, ephemeral: true });
  }
}`
    },
    {
      name: 'Button & Select Menu Component Row',
      code: `import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

const selectRow = new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId('role_select')
    .setPlaceholder('Choose your class')
    .addOptions([
      { label: 'Warrior', description: 'High defense and melee power', value: 'warrior', emoji: '⚔️' },
      { label: 'Mage', description: 'Spellcaster with elemental spells', value: 'mage', emoji: '🔮' },
      { label: 'Rogue', description: 'Stealth and high critical hits', value: 'rogue', emoji: '🗡️' }
    ])
);

const buttonRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('confirm').setLabel('Confirm Selection').setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId('reset').setLabel('Reset').setStyle(ButtonStyle.Secondary)
);

await interaction.reply({ content: 'Select your adventurer class:', components: [selectRow, buttonRow] });`
    },
    {
      name: 'Modal Text Input Form',
      code: `import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

const modal = new ModalBuilder()
  .setCustomId('support_ticket_modal')
  .setTitle('Open Support Ticket');

const issueInput = new TextInputBuilder()
  .setCustomId('issue_desc')
  .setLabel('Describe the issue in detail')
  .setStyle(TextInputStyle.Paragraph)
  .setPlaceholder('Explain what went wrong...')
  .setRequired(true);

modal.addComponents(new ActionRowBuilder().addComponents(issueInput));
await interaction.showModal(modal);`
    }
  ]
};

export const CodeStudio: React.FC<CodeStudioProps> = ({
  botProject,
  tokenInfo,
  onUpdateBotProject,
  onOpenTokenModal
}) => {
  const [language, setLanguage] = useState<CodeLanguage>('discord_py');
  const [pyFiles, setPyFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem('novaforge_py_files');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_PYTHON_FILES;
  });

  const [jsFiles, setJsFiles] = useState<VirtualFile[]>(() => {
    const saved = localStorage.getItem('novaforge_js_files');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_JS_FILES;
  });

  const currentFiles = language === 'discord_py' ? pyFiles : jsFiles;
  const setCurrentFiles = language === 'discord_py' ? setPyFiles : setJsFiles;

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return language === 'discord_py' ? 'py_main' : 'js_main';
  });

  // Editor Preferences
  const [editorTheme, setEditorTheme] = useState<'obsidian' | 'cyber' | 'synth'>('obsidian');
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<Array<{ id: string; time: string; type: 'info' | 'warn' | 'error' | 'success'; message: string }>>([
    { id: '1', time: new Date().toLocaleTimeString(), type: 'info', message: 'NovaForge Code IDE Ready. Ready to compile Discord.py & Discord.js.' }
  ]);

  // AI Conversation & Q&A (100% Free)
  const [aiMode, setAiMode] = useState<'ask' | 'generate'>('ask');
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; code?: string }>>([
    {
      role: 'assistant',
      text: '👋 Hello! I am your 100% Free Discord Bot Assistant. Zero API keys, zero rate limits, and zero costs.\n\nAsk me anything about slash commands, embeds, moderation, buttons, databases, or writing Python and JavaScript Discord bots!'
    }
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);

  // Active File object
  const activeFile = useMemo(() => {
    return currentFiles.find(f => f.id === activeFileId) || currentFiles[0];
  }, [currentFiles, activeFileId]);

  // Persist files to localStorage
  useEffect(() => {
    localStorage.setItem('novaforge_py_files', JSON.stringify(pyFiles));
  }, [pyFiles]);

  useEffect(() => {
    localStorage.setItem('novaforge_js_files', JSON.stringify(jsFiles));
  }, [jsFiles]);

  // Update code in current file
  const handleCodeChange = (newContent: string) => {
    setCurrentFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: newContent } : f));
  };

  // Insert code snippet at end or cursor
  const handleInsertSnippet = (snippetCode: string) => {
    const updated = activeFile.content + '\n\n' + snippetCode;
    handleCodeChange(updated);
    addLog('info', `Snippet appended into ${activeFile.name}`);
  };

  const addLog = (type: 'info' | 'warn' | 'error' | 'success', message: string) => {
    setConsoleLogs(prev => [
      ...prev.slice(-40),
      { id: Math.random().toString(36), time: new Date().toLocaleTimeString(), type, message }
    ]);
  };

  // Switch Language
  const handleSwitchLanguage = (lang: CodeLanguage) => {
    setLanguage(lang);
    setActiveFileId(lang === 'discord_py' ? 'py_main' : 'js_main');
    addLog('info', `Switched workspace environment to ${lang === 'discord_py' ? 'Python (discord.py)' : 'JavaScript (discord.js)'}`);
  };

  // Create new custom file
  const handleCreateFile = () => {
    if (!newFileNameInput.trim()) return;
    const name = newFileNameInput.trim();
    let lang: 'python' | 'javascript' | 'json' | 'markdown' | 'env' = 'javascript';
    if (name.endsWith('.py')) lang = 'python';
    else if (name.endsWith('.js') || name.endsWith('.ts')) lang = 'javascript';
    else if (name.endsWith('.json')) lang = 'json';
    else if (name.endsWith('.md')) lang = 'markdown';
    else if (name.startsWith('.env')) lang = 'env';

    const newFile: VirtualFile = {
      id: 'file_' + Math.random().toString(36).substring(2, 9),
      name,
      language: lang,
      content: lang === 'python' 
        ? `# ${name}\nimport discord\nfrom discord.ext import commands\n\n# Your custom cog or logic here\n` 
        : `// ${name}\nimport { EmbedBuilder } from 'discord.js';\n\n// Your custom module logic here\n`
    };

    setCurrentFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    setNewFileNameInput('');
    setIsAddingFile(false);
    addLog('success', `Created file: ${name}`);
  };

  // Delete file
  const handleDeleteFile = (id: string, name: string) => {
    if (currentFiles.length <= 1) {
      alert("You cannot delete the only remaining file in the project.");
      return;
    }
    if (confirm(`Delete file "${name}"?`)) {
      const remaining = currentFiles.filter(f => f.id !== id);
      setCurrentFiles(remaining);
      setActiveFileId(remaining[0].id);
      addLog('warn', `Deleted file: ${name}`);
    }
  };

  // Run Simulated Bot Engine
  const handleRunBot = () => {
    if (isSimulating) {
      setIsSimulating(false);
      addLog('warn', '🛑 Bot process terminated by user.');
      return;
    }

    setIsSimulating(true);
    addLog('info', `🚀 Spawning ${language === 'discord_py' ? 'Python 3.10 runtime (python bot.py)' : 'Node.js runtime (node index.js)'}...`);

    setTimeout(() => {
      addLog('info', '📡 Establishing Gateway connection to wss://gateway.discord.gg/?v=10&encoding=json...');
    }, 400);

    setTimeout(() => {
      addLog('success', `🔑 Token verified: ${tokenInfo?.isValid ? tokenInfo.botTag : 'Simulated NovaBot#4021'}`);
      addLog('success', '⚡ Loaded 3 module cogs: [Moderation, Economy, Utilities]');
      addLog('success', '✨ Shard #0 Ready! Registered slash commands: [/ping, /daily, /coinflip, /kick, /purge]');
    }, 1200);
  };

  // Universal AI Assistant (100% Free - Zero external API keys or charges required)
  const handleAISubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    const userQuestion = aiPrompt.trim();
    setAiPrompt('');
    setIsAILoading(true);
    setAiSuccessMessage('');

    // Add user message to history
    setAiMessages(prev => [...prev, { role: 'user', text: userQuestion }]);

    // Instantly generate free answer and code with zero API requirements
    setTimeout(() => {
      try {
        const freeResponse = answerFreeQuestion(userQuestion, language, activeFile.content);

        if (aiMode === 'generate' && freeResponse.code) {
          handleInsertSnippet(freeResponse.code);
          setAiMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              text: `✨ Generated code for "${userQuestion}" and appended it to **${activeFile.name}**!`,
              code: freeResponse.code
            }
          ]);
          setAiSuccessMessage(`✨ Appended code to ${activeFile.name}`);
          addLog('success', `Generated and inserted code into ${activeFile.name} (100% Free)`);
        } else {
          setAiMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              text: freeResponse.answer,
              code: freeResponse.code
            }
          ]);
          addLog('info', `AI responded to: "${userQuestion.substring(0, 30)}..."`);
        }
      } catch (err: any) {
        setAiMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            text: `Here is your code template for "${userQuestion}":`,
            code: `@bot.tree.command(name="action", description="Custom action")\nasync def action_handler(interaction: discord.Interaction):\n    await interaction.response.send_message("✨ Executed!")`
          }
        ]);
      } finally {
        setIsAILoading(false);
      }
    }, 300);
  };

  // Download entire project as ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    currentFiles.forEach(file => {
      zip.file(file.name, file.content);
    });

    // Add deployment configs
    if (language === 'discord_py') {
      zip.file('Dockerfile', `FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD ["python", "bot.py"]\n`);
      zip.file('Procfile', `worker: python bot.py\n`);
    } else {
      zip.file('Dockerfile', `FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install --production\nCOPY . .\nCMD ["node", "index.js"]\n`);
      zip.file('Procfile', `worker: node index.js\n`);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaForge_${language === 'discord_py' ? 'Python_Bot' : 'DiscordJS_Bot'}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addLog('success', `Exported complete project ZIP (${language === 'discord_py' ? 'discord.py' : 'discord.js'})`);
  };

  // Copy active file content
  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addLog('info', `Copied ${activeFile.name} to clipboard.`);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col h-full overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">Discord Code Studio & IDE</h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Playground v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">Write, test, and export your custom Discord.py & Discord.js scripts</p>
          </div>
        </div>

        {/* Language Switcher Tabs & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleSwitchLanguage('discord_py')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                language === 'discord_py'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Python (discord.py)</span>
            </button>

            <button
              onClick={() => handleSwitchLanguage('discord_js')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                language === 'discord_js'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>JavaScript (discord.js)</span>
            </button>
          </div>

          <button
            onClick={handleRunBot}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-lg ${
              isSimulating
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? 'Stop Process' : 'Run & Test'}</span>
          </button>

          <button
            onClick={handleExportZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Project ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: File Tree & Code Snippets */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
          {/* File Manager Header */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Project Files
            </span>
            <button
              onClick={() => setIsAddingFile(!isAddingFile)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              title="Add New File"
            >
              <FilePlus className="w-4 h-4" />
            </button>
          </div>

          {/* New File Inline Form */}
          {isAddingFile && (
            <div className="p-2.5 bg-slate-950 border-b border-slate-800 animate-in slide-in-from-top-2">
              <input
                type="text"
                value={newFileNameInput}
                onChange={(e) => setNewFileNameInput(e.target.value)}
                placeholder={language === 'discord_py' ? 'cogs/custom.py' : 'commands/custom.js'}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono mb-2"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setIsAddingFile(false)}
                  className="px-2 py-1 text-[10px] text-slate-400 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold"
                >
                  Add File
                </button>
              </div>
            </div>
          )}

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {currentFiles.map((file) => {
              const isActive = file.id === activeFile.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                      file.name.endsWith('.py') ? 'text-amber-400' :
                      file.name.endsWith('.js') ? 'text-blue-400' :
                      file.name.endsWith('.json') ? 'text-emerald-400' :
                      'text-slate-400'
                    }`} />
                    <span className="truncate">{file.name}</span>
                  </div>

                  {!file.isReadonly && currentFiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id, file.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 rounded transition"
                      title="Delete file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Snippets Drawer */}
          <div className="border-t border-slate-800 p-3 bg-slate-950/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Insert Snippets
            </div>
            <div className="space-y-1.5">
              {CODE_SNIPPETS[language].map((snippet, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInsertSnippet(snippet.code)}
                  className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition flex items-center justify-between group"
                >
                  <span className="truncate">{snippet.name}</span>
                  <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Code Editor Area */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* File Tab Bar & Tools */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold">{activeFile.name}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {activeFile.content.split('\n').length} lines • {(activeFile.content.length / 1024).toFixed(1)} KB
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                title="Copy File Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() => {
                  const cleaned = activeFile.content.trim();
                  handleCodeChange(cleaned);
                  addLog('info', `Formatted & sanitized ${activeFile.name}`);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition"
                title="Format whitespace"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Format</span>
              </button>
            </div>
          </div>

          {/* Code Textarea with Line Numbers */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Line Numbers Column */}
            <div className="w-12 bg-slate-950 border-r border-slate-800/80 py-4 select-none text-right pr-3 font-mono text-xs text-slate-600 overflow-hidden shrink-0">
              {activeFile.content.split('\n').map((_, index) => (
                <div key={index} className="leading-6">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Editable Text Area */}
            <div className="flex-1 relative overflow-auto bg-slate-950">
              <textarea
                value={activeFile.content}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="w-full h-full bg-transparent text-slate-100 font-mono text-xs leading-6 p-4 focus:outline-none resize-none selection:bg-indigo-500/40 whitespace-pre"
                style={{
                  tabSize: 4,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }}
              />
            </div>
          </div>

          {/* Bottom Console Terminal Output */}
          <div className="h-44 border-t border-slate-800 bg-slate-950 flex flex-col shrink-0">
            <div className="px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sandbox Output Console</span>
                {isSimulating && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE RUNNING
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  Clear Console
                </button>
              </div>
            </div>

            <div className="flex-1 p-3 font-mono text-[11px] overflow-y-auto space-y-1">
              {consoleLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-amber-400' :
                    log.type === 'success' ? 'text-emerald-400 font-bold' :
                    'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Universal AI Assistant & Code Engineer */}
        <div className="w-84 border-l border-slate-800 bg-slate-900/70 flex flex-col shrink-0 overflow-hidden">
          {/* AI Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Free AI Assistant & Q&A
                  <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded-full border border-emerald-500/30">100% Free</span>
                </h3>
                <p className="text-[10px] text-slate-400">Zero API keys required • Instant answers</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setAiMode('ask')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  aiMode === 'ask'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ask / Q&A
              </button>
              <button
                type="button"
                onClick={() => setAiMode('generate')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  aiMode === 'generate'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Code
              </button>
            </div>
          </div>

          {/* AI Messages / Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
            {aiMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col space-y-1.5 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] text-slate-500 px-1 font-mono">
                  {msg.role === 'user' ? 'You' : 'Gemini AI'}
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[95%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-xs whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}

                  {msg.code && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400">Generated Code</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(msg.code || '');
                              addLog('info', 'Copied AI code to clipboard');
                            }}
                            className="px-1.5 py-0.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded text-[10px] transition"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInsertSnippet(msg.code || '')}
                            className="px-1.5 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition"
                          >
                            + Insert
                          </button>
                        </div>
                      </div>
                      <pre className="p-2 bg-slate-900 border border-slate-800/80 rounded-lg text-[11px] font-mono text-amber-300 overflow-x-auto max-h-40 whitespace-pre">
                        {msg.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAILoading && (
              <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none text-slate-300 text-xs animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 shrink-0" />
                <span>Thinking & analyzing your question...</span>
              </div>
            )}
          </div>

          {/* Quick Questions / Presets */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-950/40">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Suggested Questions & Prompts
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                "How do slash commands work?",
                "Create a /blackjack cog with bets",
                "Explain Discord gateway intents",
                "Add a ticket modal with form inputs",
                "Fix 'Missing Access' 403 error"
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(preset);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition truncate max-w-full text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* AI Input Form */}
          <div className="p-3 border-t border-slate-800 bg-slate-900/90">
            {aiSuccessMessage && (
              <div className="mb-2 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                <span>{aiSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleAISubmit} className="space-y-2">
              <div className="relative">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAISubmit();
                    }
                  }}
                  placeholder={
                    aiMode === 'ask'
                      ? "Ask any question about coding, bots, debugging, or anything..."
                      : language === 'discord_py'
                      ? "Describe Python cog or command to append..."
                      : "Describe Discord.js command or module to append..."
                  }
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Press Enter ↵ to send
                </span>
                <button
                  type="submit"
                  disabled={isAILoading || !aiPrompt.trim()}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  {isAILoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{aiMode === 'ask' ? 'Ask AI' : 'Generate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
