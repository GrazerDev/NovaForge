import { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, ActivityType } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import { BotProject, SlashCommandConfig } from '../src/types';

interface BotLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface GuildInfo {
  id: string;
  name: string;
  memberCount: number;
  iconUrl?: string | null;
}

class DiscordBotRunner {
  private client: Client | null = null;
  private token: string | null = null;
  private currentProject: BotProject | null = null;
  private status: 'offline' | 'connecting' | 'online' | 'error' = 'offline';
  private errorMessage: string | null = null;
  private startTime: number | null = null;
  private logs: BotLog[] = [];
  private aiClient: GoogleGenAI | null = null;

  // In-memory player economies & RPG data for live discord users
  private userBalances: Map<string, { coins: number; xp: number; level: number; lastDaily: number; inventory: string[] }> = new Map();
  // In-memory active blackjack games: userId -> gameState
  private activeBlackjackGames: Map<string, { bet: number; playerHand: number[]; dealerHand: number[]; isFinished: boolean }> = new Map();
  // In-memory warnings: guildId_userId -> count
  private userWarnings: Map<string, number> = new Map();

  constructor() {
    this.addLog('info', 'NovaForge Discord Bot Hosting Engine initialized.');
  }

  private getAI(): GoogleGenAI | null {
    if (!this.aiClient && process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.aiClient;
  }

  private addLog(level: 'info' | 'warn' | 'error' | 'success', message: string) {
    const log: BotLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    this.logs.push(log);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
    console.log(`[DiscordBotRunner] [${level.toUpperCase()}] ${message}`);
  }

  public getStatus() {
    let ping = 0;
    let guilds: GuildInfo[] = [];

    if (this.client && this.client.isReady()) {
      ping = this.client.ws.ping;
      guilds = this.client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        iconUrl: g.iconURL()
      }));
    }

    const uptimeSeconds = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    return {
      status: this.status,
      error: this.errorMessage,
      uptimeSeconds,
      pingMs: ping > 0 ? ping : 18,
      botUser: this.client?.user ? {
        id: this.client.user.id,
        username: this.client.user.username,
        tag: this.client.user.tag,
        avatarUrl: this.client.user.displayAvatarURL()
      } : null,
      guilds,
      logs: [...this.logs].reverse()
    };
  }

  public async start(token: string, project: BotProject): Promise<{ success: boolean; message: string; error?: string }> {
    if (!token || token.trim().length < 25) {
      return { success: false, message: 'Invalid Discord Bot Token provided.' };
    }

    // If already running with same token, just sync commands and update project
    if (this.client && this.status === 'online' && this.token === token.trim()) {
      this.currentProject = project;
      await this.updatePresence();
      await this.registerSlashCommands();
      this.addLog('success', `Updated live bot project configuration for "${project.name}".`);
      return { success: true, message: 'Bot configuration re-synced live on Discord!' };
    }

    // Otherwise stop existing client
    await this.stop();

    this.token = token.trim();
    this.currentProject = project;
    this.status = 'connecting';
    this.errorMessage = null;
    this.addLog('info', `Connecting to Discord Gateway with Bot Token for "${project.name}"...`);

    try {
      // First attempt: try with full intents
      let client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions
        ],
        partials: [Partials.Message, Partials.Channel, Partials.Reaction]
      });

      this.client = client;
      this.setupEventHandlers();

      try {
        await this.client.login(this.token);
      } catch (loginErr: any) {
        if (loginErr?.message?.includes('disallowed intents') || loginErr?.code === 'DisallowedIntents') {
          this.addLog('warn', 'Privileged intents (MessageContent / GuildMembers) disabled in Discord Developer Portal. Falling back to Standard Slash & Guild Intents...');
          
          try {
            this.client.destroy();
          } catch {}

          // Fallback to non-privileged standard gateway intents (Guilds + GuildMessages + Reactions)
          this.client = new Client({
            intents: [
              GatewayIntentBits.Guilds,
              GatewayIntentBits.GuildMessages,
              GatewayIntentBits.GuildMessageReactions
            ],
            partials: [Partials.Message, Partials.Channel, Partials.Reaction]
          });
          this.setupEventHandlers();
          await this.client.login(this.token);
          this.addLog('success', 'Logged in successfully using Standard Slash & Guild Intents!');
        } else {
          throw loginErr;
        }
      }

      this.status = 'online';
      this.startTime = Date.now();
      this.addLog('success', `Bot logged in successfully as @${this.client.user?.tag}! (ID: ${this.client.user?.id})`);

      // Update Presence & Activity
      await this.updatePresence();

      // Register Slash Commands with Discord REST API
      await this.registerSlashCommands();

      return {
        success: true,
        message: `Bot successfully connected to Discord as @${this.client.user?.tag}!`
      };
    } catch (err: any) {
      this.status = 'error';
      this.errorMessage = err?.message || 'Failed to login to Discord.';
      this.addLog('error', `Discord Login Error: ${this.errorMessage}`);
      return {
        success: false,
        message: this.errorMessage || 'Failed to connect to Discord.',
        error: this.errorMessage || undefined
      };
    }
  }

  public async stop(): Promise<void> {
    if (this.client) {
      this.addLog('warn', 'Disconnecting Discord client and shutting down live session...');
      try {
        this.client.destroy();
      } catch (e) {
        // ignore
      }
      this.client = null;
    }
    this.status = 'offline';
    this.startTime = null;
  }

  public async restart(): Promise<{ success: boolean; message: string }> {
    if (!this.token || !this.currentProject) {
      return { success: false, message: 'No active bot session to restart.' };
    }
    return this.start(this.token, this.currentProject);
  }

  public async registerSlashCommands(): Promise<boolean> {
    if (!this.client?.user || !this.token || !this.currentProject) return false;

    try {
      this.addLog('info', 'Registering Slash Commands with Discord REST API...');
      const rest = new REST({ version: '10' }).setToken(this.token);

      const commandsData: any[] = [];

      // 1. AI Commands
      const aiCmd = new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask Gemini AI anything with smart Discord context')
        .addStringOption(opt =>
          opt.setName('prompt')
            .setDescription('Your question or prompt for the AI')
            .setRequired(true)
        );
      commandsData.push(aiCmd.toJSON());

      const askAlias = new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Chat with AI (Gemini Powered)')
        .addStringOption(opt =>
          opt.setName('prompt')
            .setDescription('Prompt for the AI')
            .setRequired(true)
        );
      commandsData.push(askAlias.toJSON());

      // 2. Economy & RPG Commands
      if (this.currentProject.economy?.enabled !== false) {
        commandsData.push(
          new SlashCommandBuilder().setName('daily').setDescription('Claim your daily currency reward').toJSON(),
          new SlashCommandBuilder().setName('balance').setDescription('Check your wallet coins and bank balance').toJSON(),
          new SlashCommandBuilder().setName('shop').setDescription('View available virtual shop items').toJSON()
        );
      }

      if (this.currentProject.rpg?.enabled !== false) {
        commandsData.push(
          new SlashCommandBuilder().setName('mine').setDescription('Mine for ores, gems, and RPG XP').toJSON(),
          new SlashCommandBuilder().setName('dungeon').setDescription('Battle dungeon boss monsters for loot and glory').toJSON(),
          new SlashCommandBuilder().setName('profile').setDescription('View your RPG level, equipment, and rank card').toJSON()
        );
      }

      // 3. Casino
      commandsData.push(
        new SlashCommandBuilder()
          .setName('blackjack')
          .setDescription('Play a live interactive game of Blackjack')
          .addIntegerOption(opt =>
            opt.setName('bet')
              .setDescription('Amount of coins to bet (default: 50)')
              .setMinValue(10)
          ).toJSON(),
        new SlashCommandBuilder()
          .setName('coinflip')
          .setDescription('Flip a lucky coin to double your bet')
          .addStringOption(opt =>
            opt.setName('choice')
              .setDescription('Heads or Tails')
              .setRequired(true)
              .addChoices(
                { name: 'Heads', value: 'heads' },
                { name: 'Tails', value: 'tails' }
              )
          )
          .addIntegerOption(opt =>
            opt.setName('bet')
              .setDescription('Amount of coins to bet')
              .setMinValue(10)
          ).toJSON()
      );

      // 4. Ticket Desk
      if (this.currentProject.tickets?.enabled !== false) {
        commandsData.push(
          new SlashCommandBuilder()
            .setName('ticket-panel')
            .setDescription('Deploy interactive support ticket creation embed in this channel')
            .toJSON()
        );
      }

      // 5. Moderation
      if (this.currentProject.moderation?.enabled !== false) {
        commandsData.push(
          new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Issue an official warning strike to a member')
            .addUserOption(opt => opt.setName('target').setDescription('Member to warn').setRequired(true))
            .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
            .toJSON(),
          new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Bulk purge recent messages from channel')
            .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
            .toJSON()
        );
      }

      // 6. General Utility
      commandsData.push(
        new SlashCommandBuilder().setName('help').setDescription('List all bot commands and features').toJSON(),
        new SlashCommandBuilder().setName('ping').setDescription('Check bot websocket latency and server response time').toJSON(),
        new SlashCommandBuilder().setName('botinfo').setDescription('View bot statistics, host status, and uptime').toJSON()
      );

      // 7. Custom Slash Commands from Project IDE
      if (this.currentProject.commands && Array.isArray(this.currentProject.commands)) {
        for (const customCmd of this.currentProject.commands) {
          if (!customCmd.enabled || !customCmd.name) continue;
          const cleanName = customCmd.name.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
          if (commandsData.some(c => c.name === cleanName)) continue; // skip duplicates

          const builder = new SlashCommandBuilder()
            .setName(cleanName)
            .setDescription(customCmd.description ? customCmd.description.slice(0, 100) : 'Custom NovaForge command');

          if (customCmd.options && Array.isArray(customCmd.options)) {
            for (const opt of customCmd.options) {
              const optName = opt.name.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
              if (opt.type === 'USER') {
                builder.addUserOption(o => o.setName(optName).setDescription(opt.description || 'User').setRequired(!!opt.required));
              } else if (opt.type === 'INTEGER') {
                builder.addIntegerOption(o => o.setName(optName).setDescription(opt.description || 'Number').setRequired(!!opt.required));
              } else {
                builder.addStringOption(o => o.setName(optName).setDescription(opt.description || 'Text input').setRequired(!!opt.required));
              }
            }
          }
          commandsData.push(builder.toJSON());
        }
      }

      // Register globally
      await rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: commandsData }
      );

      this.addLog('success', `Registered ${commandsData.length} Slash Commands with Discord Global API!`);
      return true;
    } catch (err: any) {
      this.addLog('error', `Failed to register slash commands: ${err?.message}`);
      return false;
    }
  }

  private async updatePresence() {
    if (!this.client?.user || !this.currentProject) return;

    let actType = ActivityType.Playing;
    if (this.currentProject.activityType === 'WATCHING') actType = ActivityType.Watching;
    if (this.currentProject.activityType === 'LISTENING') actType = ActivityType.Listening;
    if (this.currentProject.activityType === 'COMPETING') actType = ActivityType.Competing;

    this.client.user.setPresence({
      activities: [{
        name: this.currentProject.activityText || 'NovaForge Discord Bot IDE',
        type: actType
      }],
      status: 'online'
    });
  }

  private setupEventHandlers() {
    if (!this.client) return;

    // Ready Event
    this.client.on('ready', () => {
      this.addLog('success', `Discord Gateway Handshake Complete! Connected to ${this.client?.guilds.cache.size || 0} server(s).`);
    });

    // Interaction Create Event (Slash Commands & Buttons)
    this.client.on('interactionCreate', async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          await this.handleSlashCommand(interaction);
        } else if (interaction.isButton()) {
          await this.handleButtonInteraction(interaction);
        }
      } catch (err: any) {
        this.addLog('error', `Error handling interaction: ${err?.message}`);
        try {
          if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '⚠️ An error occurred while executing this command.', ephemeral: true });
          }
        } catch {
          // ignore
        }
      }
    });

    // Message Create Event (AI Mentions, Auto-Mod, XP)
    this.client.on('messageCreate', async (message) => {
      try {
        if (message.author.bot) return;

        // 1. Auto-Mod Check
        const isViolating = await this.handleAutoMod(message);
        if (isViolating) return;

        // 2. AI Mention Auto-Reply
        if (this.client?.user && message.mentions.has(this.client.user) && !message.mentions.everyone) {
          await this.handleAIMention(message);
          return;
        }

        // 3. XP Accumulation
        this.handleXPGain(message.author.id, message.author.username);

        // 4. Auto-Responders
        this.handleAutoResponders(message);
      } catch (err: any) {
        this.addLog('warn', `Error in message handler: ${err?.message}`);
      }
    });

    // Welcome Member Event
    this.client.on('guildMemberAdd', async (member) => {
      try {
        if (!this.currentProject?.welcome?.enabled) return;
        const cfg = this.currentProject.welcome;

        // Find welcome channel
        const channel = member.guild.channels.cache.find(
          c => c.name.toLowerCase() === cfg.channelName.replace('#', '').toLowerCase() && c.isTextBased()
        );

        if (channel && channel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(cfg.embed.color || 0x5865F2)
            .setTitle(cfg.embed.title?.replace('{user}', member.user.username) || `Welcome to ${member.guild.name}!`)
            .setDescription(cfg.embed.description?.replace('{user}', `<@${member.id}>`).replace('{guild}', member.guild.name) || `Welcome <@${member.id}>! We are thrilled to have you here.`)
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();

          if (cfg.embed.footer?.text) {
            embed.setFooter({ text: cfg.embed.footer.text });
          }

          await (channel as any).send({
            content: cfg.messageText ? cfg.messageText.replace('{user}', `<@${member.id}>`) : undefined,
            embeds: [embed]
          });
          this.addLog('info', `Dispatched Welcome Embed for @${member.user.tag} in #${channel.name}`);
        }
      } catch (err: any) {
        this.addLog('warn', `Welcome event error: ${err?.message}`);
      }
    });
  }

  // Handle Slash Commands
  private async handleSlashCommand(interaction: any) {
    const { commandName } = interaction;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    this.addLog('info', `[SLASH] /${commandName} executed by @${interaction.user.tag} in #${interaction.channel?.name || 'DM'}`);

    // --- AI /ask & /ai ---
    if (commandName === 'ask' || commandName === 'ai') {
      await interaction.deferReply();
      const prompt = interaction.options.getString('prompt');
      const ai = this.getAI();

      if (!ai) {
        await interaction.editReply('⚠️ Gemini AI is not configured. Please ensure `GEMINI_API_KEY` is provided.');
        return;
      }

      try {
        const persona = this.currentProject?.description || 'A helpful, intelligent Discord AI assistant.';
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are the AI brain of the Discord bot "${this.currentProject?.name || 'NovaForge'}". Persona: ${persona}. Respond in a concise, friendly, Discord-formatted style with bolding, bullet points, and emojis where appropriate. Keep it under 1800 characters.`,
            temperature: 0.7
          }
        });

        const replyText = response.text || 'I could not generate a response at this time.';

        const embed = new EmbedBuilder()
          .setColor(0x818CF8)
          .setAuthor({
            name: `${this.currentProject?.name || 'NovaForge'} AI Brain`,
            iconURL: this.client?.user?.displayAvatarURL()
          })
          .setTitle(`🧠 Query: "${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}"`)
          .setDescription(replyText)
          .setFooter({ text: `Requested by @${username} • Powered by Gemini 3.7 Flash`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } catch (err: any) {
        await interaction.editReply(`⚠️ AI Generation failed: ${err?.message}`);
      }
      return;
    }

    // --- /ping ---
    if (commandName === 'ping') {
      const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const wsPing = this.client?.ws.ping || 0;

      const embed = new EmbedBuilder()
        .setColor(0x22C55E)
        .setTitle('🏓 Pong! NovaForge Live Gateway Status')
        .addFields(
          { name: '⚡ Roundtrip Latency', value: `\`${latency}ms\``, inline: true },
          { name: '🌐 Discord WebSocket Ping', value: `\`${wsPing}ms\``, inline: true },
          { name: '🟢 Bot Host State', value: '`ONLINE 24/7`', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
      return;
    }

    // --- /daily ---
    if (commandName === 'daily') {
      const userData = this.getUserData(userId);
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (now - userData.lastDaily < oneDay) {
        const remainingHours = Math.ceil((oneDay - (now - userData.lastDaily)) / (1000 * 60 * 60));
        await interaction.reply({
          content: `⏳ You have already claimed your daily reward! Come back in **${remainingHours} hours**.`,
          ephemeral: true
        });
        return;
      }

      const dailyAmt = this.currentProject?.economy?.dailyAmount || 500;
      userData.coins += dailyAmt;
      userData.lastDaily = now;
      this.userBalances.set(userId, userData);

      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('💰 Daily Reward Claimed!')
        .setDescription(`You received **+${dailyAmt} ${this.currentProject?.economy?.currencyName || 'Coins'}**! 🌟`)
        .addFields(
          { name: '💵 Current Balance', value: `\`${userData.coins.toLocaleString()} Coins\``, inline: true },
          { name: '⭐ Level', value: `\`Lvl ${userData.level}\``, inline: true }
        )
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/9028/9028032.png')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // --- /balance ---
    if (commandName === 'balance') {
      const userData = this.getUserData(userId);
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setAuthor({ name: `${username}'s Wallet & Bank`, iconURL: interaction.user.displayAvatarURL() })
        .addFields(
          { name: '🪙 Wallet Coins', value: `\`${userData.coins.toLocaleString()} Coins\``, inline: true },
          { name: '🏦 Bank Storage', value: '`10,000 Coins`', inline: true },
          { name: '📊 Net Worth', value: `\`${(userData.coins + 10000).toLocaleString()} Coins\``, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // --- /mine ---
    if (commandName === 'mine') {
      const userData = this.getUserData(userId);
      const ores = [
        { name: '💎 Diamond Ore', value: 250, xp: 80, emoji: '💎' },
        { name: '🪙 Gold Ingot', value: 120, xp: 45, emoji: '🪙' },
        { name: '⚙️ Iron Chunk', value: 60, xp: 25, emoji: '⚙️' },
        { name: '🪨 Raw Coal', value: 25, xp: 15, emoji: '🪨' }
      ];
      const mined = ores[Math.floor(Math.random() * ores.length)];
      userData.coins += mined.value;
      userData.xp += mined.xp;
      this.checkLevelUp(userData);
      this.userBalances.set(userId, userData);

      const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('⛏️ Mining Expedition Successful!')
        .setDescription(`You swung your pickaxe deep into the caves and extracted **${mined.emoji} ${mined.name}**!`)
        .addFields(
          { name: '💰 Earned', value: `+${mined.value} Coins`, inline: true },
          { name: '✨ XP Gained', value: `+${mined.xp} XP`, inline: true },
          { name: '💼 Total Balance', value: `${userData.coins} Coins`, inline: true }
        )
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_mine_again').setLabel('Mine Again ⛏️').setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // --- /dungeon ---
    if (commandName === 'dungeon') {
      const userData = this.getUserData(userId);
      const bosses = [
        { name: '🔥 Infernal Dragon', hp: 850, reward: 600, xp: 220, emoji: '🐉' },
        { name: '💀 Shadow Lich King', hp: 550, reward: 400, xp: 150, emoji: '💀' },
        { name: '🧟 Armored Golem', hp: 300, reward: 200, xp: 80, emoji: '🗿' }
      ];
      const boss = bosses[Math.floor(Math.random() * bosses.length)];

      const playerWon = Math.random() > 0.3; // 70% win rate
      if (playerWon) {
        userData.coins += boss.reward;
        userData.xp += boss.xp;
        this.checkLevelUp(userData);
        this.userBalances.set(userId, userData);

        const embed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle(`⚔️ Dungeon Raid: Victory Against ${boss.emoji} ${boss.name}!`)
          .setDescription(`You entered the dungeon crypt and defeated **${boss.name}** after a brutal battle!`)
          .addFields(
            { name: '🏆 Loot Reward', value: `+${boss.reward} Coins`, inline: true },
            { name: '⭐ Hero XP', value: `+${boss.xp} XP`, inline: true },
            { name: '🗡️ Level', value: `Lvl ${userData.level}`, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x475569)
          .setTitle(`💀 Defeat in the Catacombs!`)
          .setDescription(`The **${boss.name}** overpowered you with a critical attack! You retreated back to the tavern to heal.`)
          .setFooter({ text: 'Upgrade your weapons or level up to try again!' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
      return;
    }

    // --- /blackjack ---
    if (commandName === 'blackjack') {
      const bet = interaction.options.getInteger('bet') || 50;
      const userData = this.getUserData(userId);

      if (userData.coins < bet) {
        await interaction.reply({ content: `❌ You do not have enough coins to bet **${bet}**. Your balance is **${userData.coins}**.`, ephemeral: true });
        return;
      }

      userData.coins -= bet;
      this.userBalances.set(userId, userData);

      const playerCard1 = Math.floor(Math.random() * 10) + 2;
      const playerCard2 = Math.floor(Math.random() * 10) + 2;
      const dealerCard1 = Math.floor(Math.random() * 10) + 2;

      const playerTotal = playerCard1 + playerCard2;
      this.activeBlackjackGames.set(userId, {
        bet,
        playerHand: [playerCard1, playerCard2],
        dealerHand: [dealerCard1],
        isFinished: false
      });

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🃏 High-Roller Blackjack Table')
        .setDescription(`**Bet Amount:** \`${bet} Coins\``)
        .addFields(
          { name: `🧑 Your Hand (${playerTotal})`, value: `\`${playerCard1} + ${playerCard2} = ${playerTotal}\``, inline: true },
          { name: `🎰 Dealer Shows`, value: `\`${dealerCard1} + ❓\``, inline: true }
        )
        .setFooter({ text: 'Click [Hit] to draw another card or [Stand] to lock in your hand.' });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_bj_hit').setLabel('Hit 🃏').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('btn_bj_stand').setLabel('Stand 🛑').setStyle(ButtonStyle.Danger)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // --- /ticket-panel ---
    if (commandName === 'ticket-panel') {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎫 Official Server Support Desk')
        .setDescription('Need help with your account, reporting a bug, or claiming server rewards?\n\nClick the button below to open a private ticket channel with our support staff.')
        .setFooter({ text: 'NovaForge Multi-Tier Ticketing Engine' })
        .setThumbnail('https://cdn-icons-png.flaticon.com/512/8214/8214227.png');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_create_ticket')
          .setLabel('Create Ticket 🎫')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
      return;
    }

    // --- /help ---
    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle(`⚡ ${this.currentProject?.name || 'NovaForge'} Commands & Features`)
        .setDescription('Here are all the live interactive slash commands enabled for this bot:')
        .addFields(
          { name: '🧠 Artificial Intelligence', value: '`/ask [prompt]` • `/ai [prompt]`' },
          { name: '⚔️ RPG & Adventure', value: '`/mine` • `/dungeon` • `/profile`' },
          { name: '💰 Economy & Casino', value: '`/daily` • `/balance` • `/blackjack` • `/coinflip` • `/shop`' },
          { name: '🎫 Tickets & Desk', value: '`/ticket-panel`' },
          { name: '🛡️ Moderation', value: '`/warn [target] [reason]` • `/clear [amount]`' },
          { name: '🔧 Utilities', value: '`/ping` • `/botinfo`' }
        )
        .setFooter({ text: 'Hosted 24/7 on NovaForge' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Fallback: Check custom command from BotProject
    const customMatch = this.currentProject?.commands.find(c => c.name.toLowerCase() === commandName);
    if (customMatch) {
      const embed = new EmbedBuilder()
        .setColor(customMatch.previewEmbed.color || 0x6366F1)
        .setTitle(customMatch.previewEmbed.title || `/${customMatch.name} Executed`)
        .setDescription(customMatch.previewEmbed.description || 'Command completed successfully.');

      if (customMatch.previewEmbed.fields) {
        for (const f of customMatch.previewEmbed.fields) {
          embed.addFields({ name: f.name, value: f.value, inline: !!f.inline });
        }
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Default reply
    await interaction.reply({ content: `✅ Command \`/${commandName}\` executed successfully!`, ephemeral: true });
  }

  // Handle Button Clicks
  private async handleButtonInteraction(interaction: any) {
    const customId = interaction.customId;
    const userId = interaction.user.id;
    const username = interaction.user.username;

    this.addLog('info', `[BUTTON] Clicked "${customId}" by @${interaction.user.tag}`);

    // Create Ticket Button
    if (customId === 'btn_create_ticket') {
      if (!interaction.guild) {
        await interaction.reply({ content: 'Tickets can only be opened inside a Discord server.', ephemeral: true });
        return;
      }

      const ticketChannelName = `ticket-${username.toLowerCase().slice(0, 10)}-${Math.floor(Math.random() * 900 + 100)}`;

      try {
        const channel = await interaction.guild.channels.create({
          name: ticketChannelName,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: userId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.ReadMessageHistory
              ]
            }
          ]
        });

        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`🎫 Ticket Opened for @${username}`)
          .setDescription(`Welcome <@${userId}>! Support staff have been notified. Please describe your issue in detail.`)
          .addFields(
            { name: '👤 Creator', value: `<@${userId}>`, inline: true },
            { name: '⏰ Created At', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
          );

        const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('btn_close_ticket').setLabel('Close Ticket 🔒').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `<@${userId}>`, embeds: [welcomeEmbed], components: [closeRow] });

        await interaction.reply({ content: `✅ Your ticket channel has been created: <#${channel.id}>`, ephemeral: true });
        this.addLog('success', `Created ticket channel #${ticketChannelName} for @${username}`);
      } catch (err: any) {
        await interaction.reply({ content: `❌ Failed to create ticket channel (Check bot permissions): ${err?.message}`, ephemeral: true });
      }
      return;
    }

    // Close Ticket Button
    if (customId === 'btn_close_ticket') {
      await interaction.reply('🔒 Closing this ticket in 5 seconds...');
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch {
          // ignore
        }
      }, 5000);
      return;
    }

    // Blackjack Hit
    if (customId === 'btn_bj_hit') {
      const game = this.activeBlackjackGames.get(userId);
      if (!game || game.isFinished) {
        await interaction.reply({ content: '⚠️ This game session has expired. Start a new one with `/blackjack`.', ephemeral: true });
        return;
      }

      const newCard = Math.floor(Math.random() * 10) + 2;
      game.playerHand.push(newCard);
      const total = game.playerHand.reduce((a, b) => a + b, 0);

      if (total > 21) {
        game.isFinished = true;
        this.activeBlackjackGames.delete(userId);

        const embed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('💥 BUST! You went over 21!')
          .setDescription(`You drew a **${newCard}**. Your hand total is **${total}**. You lost **${game.bet} Coins**.`)
          .setFooter({ text: 'Better luck next hand!' });

        await interaction.update({ embeds: [embed], components: [] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🃏 Blackjack - Card Drawn')
          .setDescription(`You drew a **${newCard}**! Hand total is **${total}**.`)
          .addFields(
            { name: `🧑 Your Hand (${total})`, value: `\`${game.playerHand.join(' + ')} = ${total}\``, inline: true }
          );

        await interaction.update({ embeds: [embed] });
      }
      return;
    }

    // Blackjack Stand
    if (customId === 'btn_bj_stand') {
      const game = this.activeBlackjackGames.get(userId);
      if (!game || game.isFinished) {
        await interaction.reply({ content: '⚠️ Game session expired.', ephemeral: true });
        return;
      }

      game.isFinished = true;
      const playerTotal = game.playerHand.reduce((a, b) => a + b, 0);

      let dealerTotal = game.dealerHand[0];
      while (dealerTotal < 17) {
        dealerTotal += Math.floor(Math.random() * 10) + 2;
      }

      const userData = this.getUserData(userId);

      let won = false;
      let tie = false;

      if (dealerTotal > 21 || playerTotal > dealerTotal) {
        won = true;
        userData.coins += game.bet * 2;
      } else if (playerTotal === dealerTotal) {
        tie = true;
        userData.coins += game.bet;
      }

      this.userBalances.set(userId, userData);
      this.activeBlackjackGames.delete(userId);

      const embed = new EmbedBuilder()
        .setColor(won ? 0x22C55E : tie ? 0xF59E0B : 0xEF4444)
        .setTitle(won ? '🎉 YOU WON THE HAND!' : tie ? '🤝 PUSH (TIE)!' : '💀 DEALER WINS!')
        .setDescription(
          won ? `Dealer had **${dealerTotal}**. You won **+${game.bet * 2} Coins**! 🏆`
            : tie ? `Both had **${playerTotal}**. Your **${game.bet} Coins** were returned.`
            : `Dealer had **${dealerTotal}** vs your **${playerTotal}**.`
        )
        .addFields(
          { name: '🧑 Your Total', value: `\`${playerTotal}\``, inline: true },
          { name: '🎰 Dealer Total', value: `\`${dealerTotal}\``, inline: true },
          { name: '🪙 New Balance', value: `\`${userData.coins} Coins\``, inline: true }
        );

      await interaction.update({ embeds: [embed], components: [] });
      return;
    }

    // Mine Again
    if (customId === 'btn_mine_again') {
      const userData = this.getUserData(userId);
      const minedVal = Math.floor(Math.random() * 120) + 40;
      userData.coins += minedVal;
      userData.xp += 30;
      this.checkLevelUp(userData);
      this.userBalances.set(userId, userData);

      const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('⛏️ Mined Again!')
        .setDescription(`You dug deeper and found **+${minedVal} Coins** & **+30 XP**!`)
        .setFooter({ text: `Total Balance: ${userData.coins} Coins` });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    await interaction.reply({ content: '✅ Action triggered!', ephemeral: true });
  }

  // Handle AI Mentions in Discord Chat
  private async handleAIMention(message: any) {
    const ai = this.getAI();
    if (!ai) return;

    // Clean mention string
    const cleanPrompt = message.content.replace(/<@!?\d+>/g, '').trim();
    if (!cleanPrompt) {
      await message.reply('👋 Hello! How can I assist you today? Try `/ask [prompt]` or `/help`!');
      return;
    }

    this.addLog('info', `[AI MENTION] @${message.author.tag} asked: "${cleanPrompt.slice(0, 60)}"`);

    try {
      await (message.channel as any).sendTyping();
      const persona = this.currentProject?.description || 'A witty, helpful Discord bot assistant.';
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: cleanPrompt,
        config: {
          systemInstruction: `You are "${this.currentProject?.name || 'NovaForge'}" running live in a Discord server. Persona: ${persona}. Respond directly in concise Discord format with markdown under 1600 characters.`,
          temperature: 0.7
        }
      });

      const replyText = response.text || 'I could not process that request.';
      await message.reply(replyText);
    } catch (err: any) {
      this.addLog('warn', `AI Mention error: ${err?.message}`);
    }
  }

  // Auto-Mod check
  private async handleAutoMod(message: any): Promise<boolean> {
    if (!this.currentProject?.moderation?.enabled) return false;
    const cfg = this.currentProject.moderation;
    const content = message.content.toLowerCase();

    // 1. Anti-Invite
    if (cfg.antiLink && (content.includes('discord.gg/') || content.includes('discord.com/invite/'))) {
      try {
        await message.delete();
        const warn = await message.channel.send(`⚠️ <@${message.author.id}>, Discord invite links are not permitted here.`);
        setTimeout(() => warn.delete().catch(() => {}), 5000);
        this.addLog('warn', `[AUTO-MOD] Deleted Discord invite link from @${message.author.tag}`);
        return true;
      } catch {
        return false;
      }
    }

    // 2. Banned Words
    if (cfg.bannedWords && Array.isArray(cfg.bannedWords) && cfg.bannedWords.length > 0) {
      for (const word of cfg.bannedWords) {
        if (word && content.includes(word.toLowerCase())) {
          try {
            await message.delete();
            const warn = await message.channel.send(`🛡️ <@${message.author.id}>, your message was removed by Auto-Mod.`);
            setTimeout(() => warn.delete().catch(() => {}), 5000);
            this.addLog('warn', `[AUTO-MOD] Filtered prohibited word from @${message.author.tag}`);
            return true;
          } catch {
            return false;
          }
        }
      }
    }

    return false;
  }

  // XP Gains
  private handleXPGain(userId: string, username: string) {
    if (this.currentProject?.leveling?.enabled === false) return;
    const userData = this.getUserData(userId);
    userData.xp += Math.floor(Math.random() * 10) + 15;
    this.checkLevelUp(userData);
    this.userBalances.set(userId, userData);
  }

  // Auto-Responders
  private handleAutoResponders(message: any) {
    if (!this.currentProject?.autoResponders) return;
    const content = message.content.toLowerCase();

    for (const rule of this.currentProject.autoResponders) {
      if (!rule.enabled || !rule.trigger) continue;
      const trig = rule.trigger.toLowerCase();

      let matched = false;
      if (rule.matchType === 'exact' && content === trig) matched = true;
      if (rule.matchType === 'contains' && content.includes(trig)) matched = true;
      if (rule.matchType === 'starts_with' && content.startsWith(trig)) matched = true;

      if (matched) {
        if (rule.embed) {
          const embed = new EmbedBuilder()
            .setColor(rule.embed.color || 0x6366F1)
            .setTitle(rule.embed.title || 'Auto Responder')
            .setDescription(rule.embed.description || rule.response);
          message.reply({ embeds: [embed] }).catch(() => {});
        } else if (rule.response) {
          message.reply(rule.response).catch(() => {});
        }
        break;
      }
    }
  }

  private getUserData(userId: string) {
    if (!this.userBalances.has(userId)) {
      this.userBalances.set(userId, {
        coins: 1000,
        xp: 0,
        level: 1,
        lastDaily: 0,
        inventory: ['Starter Wooden Sword 🗡️']
      });
    }
    return this.userBalances.get(userId)!;
  }

  private checkLevelUp(userData: { xp: number; level: number; coins: number }) {
    const requiredXp = userData.level * 150;
    if (userData.xp >= requiredXp) {
      userData.level += 1;
      userData.coins += 200;
      this.addLog('info', `Level Up! User reached Level ${userData.level}`);
    }
  }
}

export const discordBotRunner = new DiscordBotRunner();
