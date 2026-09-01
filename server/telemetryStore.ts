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
  superAdminEmail: string;
  whitelistEmails: string[];
  masterPasscode: string;
}

class TelemetryStore {
  private users: Map<string, TelemetryUserRecord> = new Map();
  private events: TelemetryEvent[] = [];
  private activeSessions: Map<string, number> = new Map(); // sessionKey -> lastPingTimestamp

  private adminConfig: AdminAccessConfig = {
    superAdminEmail: 'everythingistaken325@gmail.com',
    whitelistEmails: [
      'everythingistaken325@gmail.com',
      'owner@novaforge.dev',
      'admin@novaforge.dev'
    ],
    masterPasscode: 'NOVA_SUPER_ARCHITECT_2026'
  };

  constructor() {
    // Seed initial demo/founder stats for rich visualization
    this.seedInitialData();
  }

  private seedInitialData() {
    const founder: TelemetryUserRecord = {
      uid: 'founder_owner_01',
      email: 'everythingistaken325@gmail.com',
      displayName: 'EverythingIsTaken (Owner)',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      provider: 'google',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      lastActiveAt: new Date().toISOString(),
      botsCount: 5,
      lastBotName: 'NovaMaster All-In-One',
      commandsCount: 28,
      exportsCount: 14,
      is2FAEnabled: true,
      role: 'super_admin',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    };
    this.users.set(founder.uid, founder);

    // Initial event
    this.recordEvent({
      type: 'USER_LOGIN',
      userId: founder.uid,
      userEmail: founder.email,
      userName: founder.displayName,
      details: { role: 'super_admin', provider: 'google' }
    });
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
        role: (event.userEmail && this.isEmailAdmin(event.userEmail)) 
          ? (event.userEmail.toLowerCase() === this.adminConfig.superAdminEmail.toLowerCase() ? 'super_admin' : 'admin')
          : 'architect'
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

      if (existing.email && this.isEmailAdmin(existing.email)) {
        existing.role = existing.email.toLowerCase() === this.adminConfig.superAdminEmail.toLowerCase() ? 'super_admin' : 'admin';
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

  public isEmailAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    if (clean === this.adminConfig.superAdminEmail.toLowerCase()) return true;
    return this.adminConfig.whitelistEmails.some(e => e.toLowerCase() === clean);
  }

  public checkAdminAccess(email?: string | null, passcode?: string | null): { allowed: boolean; role?: 'super_admin' | 'admin'; reason?: string } {
    if (passcode && passcode.trim() === this.adminConfig.masterPasscode) {
      return { allowed: true, role: 'super_admin' };
    }
    if (email) {
      const clean = email.trim().toLowerCase();
      if (clean === this.adminConfig.superAdminEmail.toLowerCase()) {
        return { allowed: true, role: 'super_admin' };
      }
      if (this.adminConfig.whitelistEmails.some(e => e.toLowerCase() === clean)) {
        return { allowed: true, role: 'admin' };
      }
    }
    return { allowed: false, reason: 'Unauthorized. Your email is not on the Master Architect access list.' };
  }

  public addAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    if (!this.adminConfig.whitelistEmails.includes(clean)) {
      this.adminConfig.whitelistEmails.push(clean);
      return true;
    }
    return false;
  }

  public removeAdminEmail(email: string): boolean {
    const clean = email.trim().toLowerCase();
    if (clean === this.adminConfig.superAdminEmail.toLowerCase()) return false;
    this.adminConfig.whitelistEmails = this.adminConfig.whitelistEmails.filter(e => e.toLowerCase() !== clean);
    return true;
  }

  public getAdminConfig(): AdminAccessConfig {
    return {
      superAdminEmail: this.adminConfig.superAdminEmail,
      whitelistEmails: [...this.adminConfig.whitelistEmails],
      masterPasscode: '••••••••'
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
      rpgDungeons: Math.round(totalBots * 0.75),
      casinoEconomy: Math.round(totalBots * 0.85),
      ticketDesk: Math.round(totalBots * 0.65),
      autoModAegis: Math.round(totalBots * 0.90),
      astralLeveling: Math.round(totalBots * 0.70),
      schedulers: Math.round(totalBots * 0.50)
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
      recentEvents: this.events.slice(0, 50),
      adminWhitelist: this.adminConfig.whitelistEmails
    };
  }
}

export const telemetryStore = new TelemetryStore();
