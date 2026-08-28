import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { BotProject, BotTokenInfo, TwoFactorSecurityData } from '../types';

export interface UserProfileDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  savedBotToken?: string;
  savedTokenInfo?: BotTokenInfo;
  updatedAt?: any;
}

export interface UserBotDoc {
  id: string;
  userId: string;
  project: BotProject;
  token?: string;
  tokenInfo?: BotTokenInfo;
  updatedAt: any;
}

const LOCAL_STORAGE_KEY_PREFIX = 'novaforge_workspace_';
const GUEST_WORKSPACE_KEY = 'novaforge_workspace_guest';
const ACTIVE_PASS_KEY = 'novaforge_active_user_pass';
const TWO_FACTOR_KEY = 'novaforge_2fa_settings';

// Store user active password for seamless Export Credentials.txt
export function saveActivePassword(pass: string): void {
  try {
    if (pass) localStorage.setItem(ACTIVE_PASS_KEY, pass);
  } catch {}
}

export function getActivePassword(): string {
  try {
    return localStorage.getItem(ACTIVE_PASS_KEY) || 'NovaSecure_2026!';
  } catch {
    return 'NovaSecure_2026!';
  }
}

// 2FA Security Store
export function loadTwoFactorData(): TwoFactorSecurityData {
  try {
    const raw = localStorage.getItem(TWO_FACTOR_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    isEnabled: false,
    secretKey: 'JBSWY3DPEHPK3PXP',
    backupCodes: [
      'NF-8492-1094',
      'NF-4920-5812',
      'NF-7381-9923',
      'NF-1948-2849',
      'NF-6204-7182',
      'NF-5829-3310'
    ],
    method: 'authenticator_app'
  };
}

export function saveTwoFactorData(data: TwoFactorSecurityData): void {
  try {
    localStorage.setItem(TWO_FACTOR_KEY, JSON.stringify(data));
  } catch {}
}

// Save guest work when not logged in so progress is NEVER lost
export function saveGuestBotData(
  project: BotProject, 
  token: string, 
  tokenInfo: BotTokenInfo | null
): void {
  try {
    const payload = {
      project,
      token: token || '',
      tokenInfo: tokenInfo || null,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(GUEST_WORKSPACE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Guest storage write warning:", err);
  }
}

// Load guest work
export function loadGuestBotData(): { project: BotProject | null; token: string; tokenInfo: BotTokenInfo | null } | null {
  try {
    const raw = localStorage.getItem(GUEST_WORKSPACE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        project: parsed.project || null,
        token: parsed.token || '',
        tokenInfo: parsed.tokenInfo || null
      };
    }
  } catch (err) {
    console.warn("Guest storage read warning:", err);
  }
  return null;
}

// Export Credentials.txt strictly containing Username and Password
export function exportCredentialsTxt(
  user?: { displayName?: string | null; email?: string | null } | null,
  explicitPassword?: string | null
): void {
  const username = user?.displayName || user?.email?.split('@')[0] || 'NovaForge_Architect';
  const password = explicitPassword || getActivePassword();
  
  const textContent = `Username: ${username}
Password: ${password}
`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", "Credentials.txt");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

// Backward-compatible alias
export function exportWorkspaceTxtBackup(
  _project?: BotProject, 
  _token?: string, 
  _tokenInfo?: BotTokenInfo | null,
  user?: { displayName?: string | null; email?: string | null } | null
): void {
  exportCredentialsTxt(user);
}

// Export entire bot workspace to a JSON backup file
export function exportWorkspaceBackup(
  project: BotProject, 
  token: string, 
  tokenInfo: BotTokenInfo | null,
  user?: { displayName?: string | null; email?: string | null } | null
): void {
  const payload = {
    app: "NovaForge Bot Studio",
    version: "3.0.0",
    author: "Grazer",
    exportedAt: new Date().toISOString(),
    user: user?.displayName || 'Architect',
    project,
    token: token || '',
    tokenInfo
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", `${(project.name || 'NovaForge_Bot').replace(/\s+/g, '_')}_workspace.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

// Save user's active bot project & token to Firestore and Local Workspace Cache
export async function saveUserBotData(
  userId: string, 
  project: BotProject, 
  token: string, 
  tokenInfo: BotTokenInfo | null
): Promise<void> {
  if (!userId) {
    saveGuestBotData(project, token, tokenInfo);
    return;
  }

  // Always save locally first as reliable cache
  try {
    const payload = {
      project,
      token: token || '',
      tokenInfo: tokenInfo || null,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(payload));
  } catch (localErr) {
    console.warn("Local storage cache write warning:", localErr);
  }

  // Then attempt Firestore Cloud Sync
  try {
    const botDocRef = doc(db, 'users', userId, 'bots', 'default_bot');
    await setDoc(botDocRef, {
      id: 'default_bot',
      userId,
      project: JSON.parse(JSON.stringify(project)),
      token: token || '',
      tokenInfo: tokenInfo ? JSON.parse(JSON.stringify(tokenInfo)) : null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (cloudErr) {
    // Cloud sync might fail if offline or not authenticated via Firebase Auth
    // Local storage has already saved user's work
  }
}

// Load user's saved bot project & token from Firestore with Local Cache fallback
export async function loadUserBotData(
  userId: string
): Promise<{ project: BotProject | null; token: string; tokenInfo: BotTokenInfo | null } | null> {
  if (!userId) return null;

  // Try Firestore Cloud first
  try {
    const botDocRef = doc(db, 'users', userId, 'bots', 'default_bot');
    const snap = await getDoc(botDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        project: data.project || null,
        token: data.token || '',
        tokenInfo: data.tokenInfo || null
      };
    }
  } catch (err) {
    console.warn('Firestore load fallback to local cache:', err);
  }

  // Fallback to Local Storage Cache
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        project: parsed.project || null,
        token: parsed.token || '',
        tokenInfo: parsed.tokenInfo || null
      };
    }
  } catch (localErr) {
    console.warn('Local storage cache read error:', localErr);
  }

  return null;
}

// Delete saved token and reset cloud session
export async function clearUserBotData(userId: string): Promise<void> {
  if (!userId) return;
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    const botDocRef = doc(db, 'users', userId, 'bots', 'default_bot');
    await deleteDoc(botDocRef);
  } catch (err) {
    console.warn('Error clearing bot data:', err);
  }
}

