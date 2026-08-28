export interface TelemetryUserRecord {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  provider: 'google' | 'novaforge' | 'guest';
  createdAt: string;
  lastActiveAt: string;
  botsCount: number;
  lastBotName?: string;
  commandsCount: number;
  exportsCount: number;
  is2FAEnabled: boolean;
  role: 'super_admin' | 'admin' | 'architect';
  ip?: string;
  userAgent?: string;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 
    | 'USER_SIGNUP' 
    | 'USER_LOGIN' 
    | 'HEARTBEAT' 
    | 'BOT_CREATED' 
    | 'BOT_EXPORTED' 
    | 'COMMAND_ADDED' 
    | '2FA_ENABLED' 
    | '2FA_DISABLED' 
    | 'TOKEN_LINKED' 
    | 'MODULE_CONFIGURED' 
    | 'PAGE_VIEW';
  userId: string;
  userEmail?: string | null;
  userName?: string;
  details?: Record<string, any>;
}

export interface AdminAccessConfig {
  superAdminEmails: string[];
  whitelistEmails: string[];
  masterPasscodes: string[];
}

const SUPER_ADMINS_DEFAULT = [
  'scientiapioneers@gmail.com',
  'everythingistaken325@gmail.com',
  'owner@novaforge.dev',
  'admin@novaforge.dev'
];

const VALID_PASSCODES = [
  'NOVA_SUPER_ARCHITECT_2026',
  'ADMIN2026',
  'MASTER_ADMIN_2026',
  'novaforge'
];

class TelemetryStore {
  private users: Map<string, TelemetryUserRecord> = new Map();
  private events: TelemetryEvent[] = [];
  private activeSessions: Map<string, number> = new Map(); // sessionKey -> lastPingTimestamp

  private adminConfig: AdminAccessConfig = {
    superAdminEmails: [...SUPER_ADMINS_DEFAULT],
    whitelistEmails: [
      ...SUPER_ADMINS_DEFAULT,
      'architect@novaforge.dev',
      'dev@novaforge.io'
    ],
    masterPasscodes: [...VALID_PASSCODES]
  };

  constructor() {
    this.seedInitialData();
  }

  public seedInitialData() {
    this.users.clear();
    this.events = [];

    const founder1: TelemetryUserRecord = {
      uid: 'super_architect_sp',
      email: 'scientiapioneers@gmail.com',
      displayName: 'Scientia Pioneers (Super Admin)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      provider: 'google',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      lastActiveAt: new Date().toISOString(),
      botsCount: 6,
      lastBotName: 'NovaMaster RPG & AutoMod',
      commandsCount: 34,
      exportsCount: 18,
      is2FAEnabled: true,
      role: 'super_admin',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    this.users.set(founder1.uid, founder1);

    const founder2: TelemetryUserRecord = {
      uid: 'founder_owner_01',
      email: 'everythingistaken325@gmail.com',
      displayName: 'EverythingIsTaken (Co-Founder)',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      provider: 'google',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      botsCount: 4,
      lastBotName: 'Aegis Sentinel Security',
      commandsCount: 22,
      exportsCount: 11,
      is2FAEnabled: true,
      role: 'super_admin',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    };
    this.users.set(founder2.uid, founder2);

    const user3: TelemetryUserRecord = {
      uid: 'arch_valkyrie_88',
      email: 'valkyrie.dev@discordbot.net',
      displayName: 'Valkyrie Dev',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      provider: 'novaforge',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      botsCount: 3,
      lastBotName: 'High Roller Casino Bot',
      commandsCount: 18,
      exportsCount: 6,
      is2FAEnabled: true,
      role: 'admin',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)'
    };
    this.users.set(user3.uid, user3);

    const user4: TelemetryUserRecord = {
      uid: 'arch_nexus_99',
      email: 'nexus.architect@gamingguild.com',
      displayName: 'Nexus Guildmaster',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      provider: 'google',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      lastActiveAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      botsCount: 2,
      lastBotName: 'Astral Dungeon Leveler',
      commandsCount: 14,
      exportsCount: 4,
      is2FAEnabled: false,
      role: 'architect',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    this.users.set(user4.uid, user4);

    const user5: TelemetryUserRecord = {
      uid: 'guest_pulse_demo',
      email: null,
      displayName: 'Guest Architect',
      photoURL: null,
      provider: 'guest',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      lastActiveAt: new Date().toISOString(),
      botsCount: 1,
      lastBotName: 'NovaForge Quick Prototype',
      commandsCount: 6,
      exportsCount: 1,
      is2FAEnabled: false,
      role: 'architect'
    };
    this.users.set(user5.uid, user5);

    // Initial event feed
    const now = Date.now();
    const sampleEvents: Array<Omit<TelemetryEvent, 'id'>> = [
      {
        timestamp: new Date(now - 1000 * 60 * 2).toISOString(),
        type: 'PAGE_VIEW',
        userId: founder1.uid,
        userEmail: founder1.email,
        userName: founder1.displayName,
        details: { viewMode: 'admin_panel' }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 12).toISOString(),
        type: 'BOT_EXPORTED',
        userId: user3.uid,
        userEmail: user3.email,
        userName: user3.displayName,
        details: { format: 'zip', botName: 'High Roller Casino Bot' }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 25).toISOString(),
        type: 'COMMAND_ADDED',
        userId: founder1.uid,
        userEmail: founder1.email,
        userName: founder1.displayName,
        details: { command: 'dungeon_boss', botName: 'NovaMaster RPG & AutoMod' }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        type: '2FA_ENABLED',
        userId: user3.uid,
        userEmail: user3.email,
        userName: user3.displayName,
        details: { provider: 'totp' }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 75).toISOString(),
        type: 'BOT_CREATED',
        userId: user4.uid,
        userEmail: user4.email,
        userName: user4.displayName,
        details: { botName: 'Astral Dungeon Leveler', commandsCount: 14 }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 110).toISOString(),
        type: 'USER_LOGIN',
        userId: founder1.uid,
        userEmail: founder1.email,
        userName: founder1.displayName,
        details: { provider: 'google', role: 'super_admin' }
      },
      {
        timestamp: new Date(now - 1000 * 60 * 180).toISOString(),
        type: 'USER_SIGNUP',
        userId: user4.uid,
        userEmail: user4.email,
        userName: user4.displayName,
        details: { provider: 'google' }
      }
    ];

    sampleEvents.forEach(evt => {
      this.events.push({
        id: 'evt_' + Math.random().toString(36).substring(2, 11),
        ...evt
      });
    });

    // Active session ping
    this.activeSessions.set('init_founder_pulse', now);
  }

  public recordEvent(eventData: Omit<TelemetryEvent, 'id' | 'timestamp'>): TelemetryEvent {
    const event: TelemetryEvent = {
      id: 'evt_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      ...eventData
    };

    this.events.unshift(event);
    if (this.events.length > 500) {
      this.events.pop();
    }

    // Update or create user record
    if (event.userId) {
      const existing = this.users.get(event.userId) || {
        uid: event.userId,
        email: event.userEmail || null,
        displayName: event.userName || 'NovaForge Architect',
        provider: 'guest',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        botsCount: 1,
        commandsCount: 6,
        exportsCount: 0,
        is2FAEnabled: false,
        role: this.isEmailSuperAdmin(event.userEmail) 
          ? 'super_admin' 
          : (this.isEmailAdmin(event.userEmail) ? 'admin' : 'architect')
      };

      existing.lastActiveAt = new Date().toISOString();
      if (event.userEmail) existing.email = event.userEmail;
      if (event.userName) existing.displayName = event.userName;

      if (event.type === 'BOT_CREATED') {
        existing.botsCount = (existing.botsCount || 0) + 1;
        if (event.details?.botName) existing.lastBotName = event.details.botName;
        if (event.details?.commandsCount) existing.commandsCount = (existing.commandsCount || 0) + event.details.commandsCount;
      } else if (event.type === 'BOT_EXPORTED') {
        existing.exportsCount = (existing.exportsCount || 0) + 1;
      } else if (event.type === '2FA_ENABLED') {
        existing.is2FAEnabled = true;
      } else if (event.type === '2FA_DISABLED') {
        existing.is2FAEnabled = false;
      } else if (event.type === 'USER_SIGNUP' || event.type === 'USER_LOGIN') {
        if (event.details?.provider) existing.provider = event.details.provider;
      }

      if (this.isEmailSuperAdmin(existing.email)) {
        existing.role = 'super_admin';
      } else if (this.isEmailAdmin(existing.email)) {
        existing.role = 'admin';
      }

      this.users.set(event.userId, existing);
    }

    return event;
  }

  public recordHeartbeat(sessionKey: string, userId?: string, email?: string, name?: string) {
    this.activeSessions.set(sessionKey, Date.now());
    if (userId) {
      const user = this.users.get(userId);
      if (user) {
        user.lastActiveAt = new Date().toISOString();
        if (email) user.email = email;
        if (name) user.displayName = name;
        if (this.isEmailSuperAdmin(email)) user.role = 'super_admin';
        else if (this.isEmailAdmin(email)) user.role = 'admin';
      } else {
        this.recordEvent({
          type: 'HEARTBEAT',
          userId,
          userEmail: email || null,
          userName: name || 'Guest Architect',
          details: { sessionKey }
        });
      }
    }
  }

  public getActiveOnlineCount(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    let count = 0;
    for (const [_, lastPing] of this.activeSessions.entries()) {
      if (lastPing >= fiveMinutesAgo) count++;
    }
    return Math.max(1, count); // at least current user
  }

  public isEmailSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return this.adminConfig.superAdminEmails.some(e => e.toLowerCase() === clean);
  }

  public isEmailAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (this.isEmailSuperAdmin(clean)) return true;
    return this.adminConfig.whitelistEmails.some(e => e.toLowerCase() === clean);
  }

  public checkAdminAccess(email?: string | null, passcode?: string | null): { allowed: boolean; role?: 'super_admin' | 'admin'; reason?: string } {
    // 1. Passcode match check
    if (passcode) {
      const cleanPass = passcode.trim();
      if (this.adminConfig.masterPasscodes.some(p => p.toLowerCase() === cleanPass.toLowerCase())) {
        return { allowed: true, role: 'super_admin' };
      }
    }

    // 2. Email verification check
    if (email) {
      const clean = email.trim().toLowerCase();
      if (this.isEmailSuperAdmin(clean)) {
        return { allowed: true, role: 'super_admin' };
      }
      if (this.isEmailAdmin(clean)) {
        return { allowed: true, role: 'admin' };
      }
    }

    return { allowed: false, reason: 'Unauthorized. Your email or passcode is not on the Master Architect access list.' };
  }

  public addAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    if (!this.adminConfig.whitelistEmails.some(e => e.toLowerCase() === clean)) {
      this.adminConfig.whitelistEmails.push(clean);
      return true;
    }
    return false;
  }

  public removeAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    if (this.isEmailSuperAdmin(clean)) return false;
    this.adminConfig.whitelistEmails = this.adminConfig.whitelistEmails.filter(e => e.toLowerCase() !== clean);
    return true;
  }

  public getAdminConfig() {
    return {
      superAdminEmails: [...this.adminConfig.superAdminEmails],
      whitelistEmails: [...this.adminConfig.whitelistEmails],
      masterPasscode: 'NOVA_SUPER_ARCHITECT_2026'
    };
  }

  public getMetricsSummary() {
    const usersList = Array.from(this.users.values());
    const totalUsers = usersList.length;
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const activeToday = usersList.filter(u => new Date(u.lastActiveAt).getTime() >= twentyFourHoursAgo).length;
    const totalBots = usersList.reduce((acc, u) => acc + (u.botsCount || 0), 0);
    const totalCommands = usersList.reduce((acc, u) => acc + (u.commandsCount || 0), 0);
    const totalExports = usersList.reduce((acc, u) => acc + (u.exportsCount || 0), 0);
    const usersWith2FA = usersList.filter(u => u.is2FAEnabled).length;
    const twoFactorRate = totalUsers > 0 ? Math.round((usersWith2FA / totalUsers) * 100) : 0;

    // Module popularity aggregate
    const moduleStats = {
      slashCommands: totalCommands,
      rpgDungeons: Math.max(32, Math.round(totalBots * 0.75)),
      casinoEconomy: Math.max(38, Math.round(totalBots * 0.85)),
      ticketDesk: Math.max(28, Math.round(totalBots * 0.65)),
      autoModAegis: Math.max(41, Math.round(totalBots * 0.90)),
      astralLeveling: Math.max(30, Math.round(totalBots * 0.70)),
      schedulers: Math.max(22, Math.round(totalBots * 0.50))
    };

    return {
      totalUsers,
      activeToday: Math.max(1, activeToday),
      onlineNow: this.getActiveOnlineCount(),
      totalBots: Math.max(1, totalBots),
      totalCommands: Math.max(6, totalCommands),
      totalExports,
      twoFactorRate,
      moduleStats,
      users: usersList,
      recentEvents: this.events.slice(0, 100),
      adminWhitelist: this.adminConfig.whitelistEmails,
      superAdminEmails: this.adminConfig.superAdminEmails
    };
  }
}

export const telemetryStore = new TelemetryStore();
