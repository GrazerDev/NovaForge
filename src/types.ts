export interface DiscordAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordFooter {
  text: string;
  icon_url?: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number; // decimal integer (e.g. 0x5865F2 = 5793266)
  author?: DiscordAuthor;
  fields?: DiscordField[];
  image?: { url: string };
  thumbnail?: { url: string };
  footer?: DiscordFooter;
  timestamp?: string;
}

export interface DiscordButtonComponent {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  emoji?: string;
  url?: string;
  actionType: 'reply_embed' | 'add_role' | 'create_ticket' | 'claim_daily' | 'mine_rpg' | 'dungeon_battle' | 'blackjack_hit' | 'blackjack_stand' | 'verify_user' | 'custom_action';
  actionPayload?: string;
  disabled?: boolean;
}

export interface DiscordSelectMenuOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
}

export interface DiscordSelectMenuComponent {
  id: string;
  customId: string;
  placeholder: string;
  minValues?: number;
  maxValues?: number;
  options: DiscordSelectMenuOption[];
  actionType: 'assign_role' | 'open_ticket_category' | 'view_shop_item' | 'select_dungeon_floor';
}

export interface DiscordModalField {
  id: string;
  customId: string;
  label: string;
  style: 'short' | 'paragraph';
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface DiscordModalComponent {
  id: string;
  customId: string;
  title: string;
  fields: DiscordModalField[];
}

export interface DiscordMessagePayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: DiscordEmbed[];
  components?: DiscordButtonComponent[];
  selectMenus?: DiscordSelectMenuComponent[];
}

export interface CommandOption {
  name: string;
  description: string;
  type: 'STRING' | 'USER' | 'INTEGER' | 'BOOLEAN' | 'CHANNEL' | 'ROLE';
  required?: boolean;
  choices?: { name: string; value: string | number }[];
}

export interface ActionBlock {
  id: string;
  type: 
    | 'reply_embed' 
    | 'reply_text' 
    | 'give_currency' 
    | 'add_role' 
    | 'remove_role' 
    | 'timeout_member' 
    | 'create_ticket_channel' 
    | 'send_dm' 
    | 'roll_random'
    | 'open_modal'
    | 'spawn_buttons'
    | 'trigger_webhook'
    | 'give_xp'
    | 'rpg_battle';
  config: {
    message?: string;
    embedTitle?: string;
    embedDescription?: string;
    embedColor?: number;
    amount?: number;
    roleName?: string;
    ephemeral?: boolean;
    buttonLabel?: string;
    chancePercent?: number;
    webhookUrl?: string;
  };
}

export interface SlashCommandConfig {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'economy' | 'moderation' | 'rpg' | 'tickets' | 'utility' | 'fun' | 'leveling' | 'music';
  options: CommandOption[];
  enabled: boolean;
  cooldownSeconds?: number;
  requiredPermissions?: string[];
  actions: ActionBlock[];
  previewEmbed: DiscordEmbed;
  buttonComponents?: DiscordButtonComponent[];
  selectMenus?: DiscordSelectMenuComponent[];
}

export interface AutoResponderRule {
  id: string;
  trigger: string;
  matchType: 'exact' | 'contains' | 'starts_with' | 'regex';
  response: string;
  embed?: DiscordEmbed;
  enabled: boolean;
}

export interface WelcomeConfig {
  enabled: boolean;
  channelName: string;
  sendDm: boolean;
  autoRoleId?: string;
  autoRoleName?: string;
  embed: DiscordEmbed;
  messageText: string;
  goodbyeEnabled?: boolean;
  goodbyeEmbed?: DiscordEmbed;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  type: 'consumable' | 'role_reward' | 'badge' | 'weapon' | 'armor';
  roleRewardId?: string;
}

export interface EconomyConfig {
  enabled: boolean;
  currencyName: string;
  currencySymbol: string;
  dailyAmount: number;
  workMin: number;
  workMax: number;
  crimeReward: number;
  crimeFailRate: number;
  robSuccessRate: number;
  blackjackEnabled: boolean;
  rouletteEnabled: boolean;
  shopItems: ShopItem[];
}

export interface DungeonFloor {
  floor: number;
  name: string;
  bossName: string;
  bossHp: number;
  bossEmoji: string;
  minLevel: number;
  rewardXp: number;
  rewardCoins: number;
  lootDrop: string;
}

export interface RPGConfig {
  enabled: boolean;
  baseHp: number;
  baseMana: number;
  dungeonFloors: DungeonFloor[];
  petCompanions: { id: string; name: string; boost: string; emoji: string }[];
  weapons: { id: string; name: string; attackBonus: number; cost: number; emoji: string }[];
}

export interface TicketCategory {
  id: string;
  label: string;
  emoji: string;
  roleToPing: string;
  welcomeMessage: string;
}

export interface TicketConfig {
  enabled: boolean;
  panelChannel: string;
  categoryName: string;
  ticketRole: string;
  categories: TicketCategory[];
  panelEmbed: DiscordEmbed;
  ticketWelcomeEmbed: DiscordEmbed;
  autoTranscripts: boolean;
  claimButtonEnabled: boolean;
}

export interface ModerationConfig {
  enabled: boolean;
  antiLink: boolean;
  antiSpam: boolean;
  antiCaps: boolean;
  antiRaid: boolean;
  maxWarnings: number;
  warningAction: 'mute_1hr' | 'kick' | 'ban';
  bannedWords: string[];
  logChannel: string;
}

export interface LevelingConfig {
  enabled: boolean;
  xpPerMessage: number;
  voiceXpPerMinute: number;
  rankCardTheme: 'cyber_neon' | 'dark_slate' | 'royal_purple' | 'emerald_forge';
  rankCardColor: string;
  rolesRewards: { level: number; roleName: string }[];
}

export interface MusicConfig {
  enabled: boolean;
  defaultVolume: number;
  djRole: string;
  bassBoostDefault: boolean;
  autoplayRelated: boolean;
}

export interface ScheduledTask {
  id: string;
  name: string;
  cron: string;
  cronHuman: string;
  targetChannel: string;
  messageText?: string;
  embed?: DiscordEmbed;
  enabled: boolean;
}

export type MainAppViewMode = 
  | 'welcome_auth' 
  | 'dash' 
  | 'ai_building' 
  | 'code_studio'
  | 'simulator' 
  | 'modules' 
  | 'live_gateway' 
  | 'schedulers' 
  | 'security_2fa' 
  | 'account_settings';

export interface TwoFactorSecurityData {
  isEnabled: boolean;
  secretKey: string;
  backupCodes: string[];
  lastVerifiedAt?: string;
  method: 'authenticator_app' | 'security_key';
}

export interface BotProject {
  id: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  prefix: string;
  activityType: 'PLAYING' | 'WATCHING' | 'LISTENING' | 'COMPETING';
  activityText: string;
  themeColor: string;
  token?: string;
  clientId?: string;
  watermark?: string;
  commands: SlashCommandConfig[];
  autoResponders: AutoResponderRule[];
  welcome: WelcomeConfig;
  economy: EconomyConfig;
  rpg: RPGConfig;
  tickets: TicketConfig;
  moderation: ModerationConfig;
  leveling: LevelingConfig;
  music: MusicConfig;
  schedulers: ScheduledTask[];
  generatedAt: string;
  scriptCode: string;
  packageJson: string;
  workflowYaml: string;
}

export interface BotTokenInfo {
  isValid: boolean;
  id?: string;
  username?: string;
  discriminator?: string;
  avatar?: string;
  avatarUrl?: string;
  bot?: boolean;
  verified?: boolean;
  flags?: number;
  inviteUrl?: string;
  guildCount?: number;
  error?: string;
}

export interface SimulatedChannelMessage {
  id: string;
  author: {
    username: string;
    avatarUrl: string;
    isBot?: boolean;
    botTag?: string;
    color?: string;
  };
  content?: string;
  embeds?: DiscordEmbed[];
  components?: DiscordButtonComponent[];
  selectMenus?: DiscordSelectMenuComponent[];
  timestamp: string;
  interactionUser?: string;
  commandExecuted?: string;
}

export interface IdeaPrompt {
  id: string;
  title: string;
  category: 'Economy' | 'RPG' | 'Moderation' | 'Tickets' | 'Leveling' | 'AI & Fun' | 'Music' | 'Community' | 'Full-Suite';
  prompt: string;
  icon: string;
  badge: string;
}

// AI Architect Chat Types
export interface AIAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: {
    label: string;
    promptToApply: string;
    actionType: 'add_command' | 'add_system' | 'tweak_embed' | 'full_rebuild';
  }[];
  appliedChangeSummary?: string;
}

// Compatibility Types for Legacy Task Importers
export type BotLanguage = 'typescript' | 'javascript' | 'python' | 'curl';

export interface BotTaskTemplate {
  id: string;
  title: string;
  tagline: string;
  category: 'announcements' | 'monitoring' | 'ai' | 'automation' | 'developer' | 'utility';
  icon: string;
  defaultCron: string;
  cronDescription: string;
  language: BotLanguage;
  requiredSecrets: string[];
  workflowYaml: string;
  scriptCode: string;
  scriptFilename: string;
  manifestCode: string;
  manifestFilename: string;
  samplePayload: DiscordMessagePayload;
  readme: string;
  highlights: string[];
}

export interface CustomTaskState {
  title: string;
  cron: string;
  language: BotLanguage;
  workflowYaml: string;
  scriptCode: string;
  scriptFilename: string;
  manifestCode: string;
  manifestFilename: string;
  requiredSecrets: string[];
  payload: DiscordMessagePayload;
}

export interface LiveTestResult {
  id: string;
  timestamp: string;
  type: 'webhook' | 'bot_rest';
  success: boolean;
  status?: number;
  message: string;
  details?: any;
  durationMs: number;
}
