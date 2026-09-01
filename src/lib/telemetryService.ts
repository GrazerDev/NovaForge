import { db, auth } from './firebase';
import { collection, addDoc, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { NovaForgeUser } from './firebase';

export interface TelemetryUser {
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
  userAgent?: string;
}

export interface TelemetryEventPayload {
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
  userId?: string;
  userEmail?: string | null;
  userName?: string;
  details?: Record<string, any>;
}

export interface AdminMetricsData {
  totalUsers: number;
  activeToday: number;
  onlineNow: number;
  totalBots: number;
  totalCommands: number;
  totalExports: number;
  twoFactorRate: number;
  moduleStats: {
    slashCommands: number;
    rpgDungeons: number;
    casinoEconomy: number;
    ticketDesk: number;
    autoModAegis: number;
    astralLeveling: number;
    schedulers: number;
  };
  users: TelemetryUser[];
  recentEvents: Array<{
    id: string;
    timestamp: string;
    type: string;
    userId: string;
    userEmail?: string | null;
    userName?: string;
    details?: Record<string, any>;
  }>;
  adminWhitelist: string[];
  role?: 'super_admin' | 'admin';
}

const SESSION_KEY = 'nf_session_' + Math.random().toString(36).substring(2, 12);
const SUPER_ADMIN_EMAIL = 'everythingistaken325@gmail.com';
const ADMIN_CACHE_KEY = 'novaforge_admin_auth_pass';

// Track event in server store and optionally Firestore
export async function trackTelemetryEvent(event: TelemetryEventPayload): Promise<void> {
  const payload = {
    ...event,
    userId: event.userId || 'guest_user',
    userEmail: event.userEmail || null,
    userName: event.userName || 'Guest Architect',
    details: {
      ...event.details,
      url: window.location.pathname,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    }
  };

  // 1. Post to Server Telemetry Store
  try {
    fetch('/api/telemetry/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {}

  // 2. Mirror into Firestore if authenticated
  try {
    if (auth.currentUser && db) {
      const logsCol = collection(db, 'activity_logs');
      addDoc(logsCol, {
        ...payload,
        createdAt: serverTimestamp()
      }).catch(() => {});
    }
  } catch {}
}

// Start client heartbeat to monitor live online visitors
let heartbeatInterval: any = null;
export function startTelemetryHeartbeat(currentUser?: NovaForgeUser | null): void {
  if (heartbeatInterval) return;

  const sendPulse = () => {
    try {
      fetch('/api/telemetry/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey: SESSION_KEY,
          userId: currentUser?.uid || 'guest_architect',
          email: currentUser?.email || null,
          name: currentUser?.displayName || 'Guest'
        })
      }).catch(() => {});
    } catch {}
  };

  sendPulse();
  heartbeatInterval = setInterval(sendPulse, 45000);
}

// Check if a user has admin access
export async function checkAdminAccess(
  email?: string | null,
  passcode?: string | null
): Promise<{ allowed: boolean; role?: 'super_admin' | 'admin'; reason?: string }> {
  const storedPass = passcode || localStorage.getItem(ADMIN_CACHE_KEY) || '';

  // 1. Local Instant Super Admin Verification
  if (email && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase()) {
    return { allowed: true, role: 'super_admin' };
  }
  if (storedPass === 'NOVA_SUPER_ARCHITECT_2026') {
    return { allowed: true, role: 'super_admin' };
  }

  // 2. Server Verification
  try {
    const res = await fetch('/api/admin/auth/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email || undefined,
        passcode: storedPass || undefined
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn("Server admin check failed:", err);
  }

  return { allowed: false, reason: 'You are not authorized to view the NovaForge Admin Portal.' };
}

// Fetch complete Admin Metrics from backend
export async function fetchAdminMetrics(
  email?: string | null,
  passcode?: string | null
): Promise<AdminMetricsData> {
  const storedPass = passcode || localStorage.getItem(ADMIN_CACHE_KEY) || '';

  const res = await fetch('/api/admin/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email || undefined,
      passcode: storedPass || undefined
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Access Denied to Admin Metrics.');
  }

  return await res.json();
}

// Add user to admin whitelist
export async function addAdminWhitelistEmail(
  callerEmail: string,
  newAdminEmail: string,
  passcode?: string | null
): Promise<void> {
  const storedPass = passcode || localStorage.getItem(ADMIN_CACHE_KEY) || '';
  const res = await fetch('/api/admin/whitelist/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerEmail,
      passcode: storedPass,
      newAdminEmail
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add admin');
  }
}

// Remove user from admin whitelist
export async function removeAdminWhitelistEmail(
  callerEmail: string,
  targetEmail: string,
  passcode?: string | null
): Promise<void> {
  const storedPass = passcode || localStorage.getItem(ADMIN_CACHE_KEY) || '';
  const res = await fetch('/api/admin/whitelist/remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerEmail,
      passcode: storedPass,
      targetEmail
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to remove admin');
  }
}

// Export User Analytics to CSV
export function exportUsersCSV(users: TelemetryUser[]): void {
  const headers = ['UID', 'Architect Name', 'Email', 'Provider', 'Role', '2FA Status', 'Bots Count', 'Commands Count', 'Exports Count', 'Date Joined', 'Last Active'];
  const rows = users.map(u => [
    `"${u.uid}"`,
    `"${(u.displayName || '').replace(/"/g, '""')}"`,
    `"${u.email || 'N/A'}"`,
    `"${u.provider}"`,
    `"${u.role}"`,
    `"${u.is2FAEnabled ? 'Protected' : 'Standard'}"`,
    u.botsCount || 0,
    u.commandsCount || 0,
    u.exportsCount || 0,
    `"${new Date(u.createdAt).toLocaleDateString()}"`,
    `"${new Date(u.lastActiveAt).toLocaleString()}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NovaForge_User_Analytics_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
