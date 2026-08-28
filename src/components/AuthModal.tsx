import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Cloud, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  User, 
  Key, 
  X, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  ShieldAlert, 
  RefreshCw,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { NovaForgeUser } from '../lib/firebase';
import { BotProject, BotTokenInfo } from '../types';
import { exportWorkspaceBackup, loadTwoFactorData } from '../lib/userDataService';
import { verifyTOTPCode } from '../lib/totp';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: NovaForgeUser | null;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  onEmailSignUp: (email: string, pass: string, displayName: string, avatarUrl?: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  isAuthLoading: boolean;
  isCloudSyncing: boolean;
  botProject: BotProject;
  token: string;
  tokenInfo: BotTokenInfo | null;
  onRestoreWorkspace?: (project: BotProject, token: string, tokenInfo: BotTokenInfo | null) => void;
}

const PRESET_AVATARS = [
  { id: '1', label: 'Cyber Core', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Neon Hacker', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Quantum AI', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Forge Master', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=120&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Void Sentinel', url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=120&auto=format&fit=crop&q=80' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onSignOut,
  isAuthLoading,
  isCloudSyncing,
  botProject,
  token,
  tokenInfo,
  onRestoreWorkspace
}) => {
  const [activeTab, setActiveTab] = useState<'novaforge' | 'google' | 'backup'>('novaforge');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [is2FAChallengeStep, setIs2FAChallengeStep] = useState(false);
  const [twoFACodeInput, setTwoFACodeInput] = useState('');
  
  // Form fields
  const [developerName, setDeveloperName] = useState('NovaForge Architect');
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  
  // Status & errors
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setAuthError('Passwords do not match. Please re-enter your password.');
        return;
      }

      try {
        await onEmailSignUp(cleanEmail, password, developerName, selectedAvatar);
        onClose();
      } catch (err: any) {
        setAuthError(err?.message || 'Failed to create secure account. Please check your credentials.');
      }
    } else {
      // Check if 2FA is active on this client / account
      const twoFactorSettings = loadTwoFactorData();
      if (twoFactorSettings.isEnabled && !is2FAChallengeStep) {
        setIs2FAChallengeStep(true);
        return;
      }

      // If in 2FA step, verify the code first
      if (twoFactorSettings.isEnabled && is2FAChallengeStep) {
        const verification = await verifyTOTPCode(
          twoFACodeInput,
          twoFactorSettings.secretKey,
          twoFactorSettings.backupCodes || []
        );
        if (!verification.valid) {
          setAuthError('Invalid 2FA code. Please enter the 6-digit code from your authenticator or your emergency recovery code.');
          return;
        }
      }

      try {
        await onEmailSignIn(cleanEmail, password);
        setIs2FAChallengeStep(false);
        setTwoFACodeInput('');
        onClose();
      } catch (err: any) {
        setAuthError(err?.message || 'Invalid email or password. Access to bot vault denied.');
      }
    }
  };

  const handleGoogleClick = async () => {
    setGoogleError(null);
    try {
      await onGoogleSignIn();
      onClose();
    } catch (err: any) {
      console.warn("Google sign in popup error:", err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setGoogleError(
          `Domain ${currentHostname} is not authorized for Google OAuth in your Firebase project. You can use the Secure Password account below without any domain restrictions!`
        );
      } else {
        setGoogleError(
          err?.message || "Google sign in was blocked. Please use the secure password-protected account."
        );
      }
    }
  };

  const copyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.project && onRestoreWorkspace) {
          onRestoreWorkspace(parsed.project, parsed.token || '', parsed.tokenInfo || null);
          setRestoreSuccess(true);
          setTimeout(() => setRestoreSuccess(false), 3000);
        }
      } catch (err) {
        setAuthError('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[92vh]">
        {/* Glowing Top Gradient Edge */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  NovaForge Secure Vault
                </h3>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  Password Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Encrypted bot storage, isolated actions & progress protection
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-4">
                <img
                  src={currentUser.photoURL || selectedAvatar}
                  alt={currentUser.displayName}
                  className="w-14 h-14 rounded-2xl border-2 border-indigo-500/50 object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-base truncate">
                      {currentUser.displayName}
                    </h4>
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                      Vault Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email || 'Private Vault'}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-mono">
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Cloud className="w-3 h-3" />
                      {isCloudSyncing ? 'Syncing...' : 'Auto-Saved'}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>Provider: {currentUser.provider === 'google' ? 'Google Auth' : 'Password Vault'}</span>
                  </div>
                </div>
              </div>

              {/* Bot Protection Status */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Bot Workspace Encrypted & Protected</span>
                </div>
                <p className="text-emerald-300/80 text-[11px]">
                  Current active bot <strong>{botProject?.name || 'NovaForge Bot'}</strong> ({botProject?.actions?.length || 0} action nodes, {botProject?.commands?.length || 0} commands) is locked to your private UID: <code className="bg-emerald-950 px-1 rounded text-emerald-300 font-mono">{currentUser.uid.slice(0, 16)}...</code>. No other user can modify or overwrite your bot.
                </p>
              </div>

              {/* Backup & Export Controls */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Offline Backup Vault
                  </span>
                  <span className="text-[10px] text-slate-400">JSON Archive</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Export a standalone snapshot of your entire bot configuration and tokens.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="btn-export-backup"
                    onClick={() => exportWorkspaceBackup(botProject, token, tokenInfo)}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Download Backup JSON
                  </button>

                  <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer text-center">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Restore Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {restoreSuccess && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Workspace restored successfully!
                  </div>
                )}
              </div>

              {/* Sign Out Button */}
              <div className="pt-2">
                <button
                  id="btn-modal-sign-out"
                  onClick={async () => {
                    await onSignOut();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 bg-red-950/40 hover:bg-red-900/50 text-red-300 text-xs font-bold rounded-xl border border-red-500/30 transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            /* Logged Out / Auth Forms */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  id="tab-novaforge-login"
                  type="button"
                  onClick={() => {
                    setActiveTab('novaforge');
                    setAuthError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'novaforge'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Password Account
                </button>

                <button
                  id="tab-google-login"
                  type="button"
                  onClick={() => {
                    setActiveTab('google');
                    setAuthError(null);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === 'google'
                      ? 'bg-slate-800 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google Auth
                </button>
              </div>

              {/* Tab 1: Password-Protected NovaForge Account */}
              {activeTab === 'novaforge' && (
                <div className="space-y-4">
                  {/* Mode Switcher: Sign Up vs Sign In */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                        authMode === 'signup'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Create Account (New)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError(null);
                      }}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                        authMode === 'login'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Sign In (Existing)
                    </button>
                  </div>

                  {/* Error Notification */}
                  {authError && (
                    <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left text-xs text-red-200 flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed">
                        {authError}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* 2FA Challenge UI if Active */}
                    {is2FAChallengeStep ? (
                      <div className="space-y-3 p-4 bg-slate-950 border border-indigo-500/40 rounded-2xl animate-in fade-in">
                        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                          <Fingerprint className="w-4 h-4 text-indigo-400" />
                          <span>Two-Factor Authentication Required</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          This vault is guarded with 2FA. Enter the 6-digit code from your authenticator app or an emergency recovery code.
                        </p>
                        <div>
                          <input
                            id="input-login-2fa-code"
                            type="text"
                            autoFocus
                            required
                            value={twoFACodeInput}
                            onChange={(e) => setTwoFACodeInput(e.target.value)}
                            placeholder="e.g. 123456 or NF-XXXX-XXXX"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-3 py-2.5 text-center font-mono text-base font-bold text-cyan-300 tracking-widest outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-start text-[11px] text-slate-400">
                          <button
                            type="button"
                            onClick={() => setIs2FAChallengeStep(false)}
                            className="text-slate-400 hover:text-slate-200 underline"
                          >
                            ← Back to Password
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {authMode === 'signup' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Architect Name / Handle
                            </label>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                              <input
                                id="input-signup-name"
                                type="text"
                                required
                                value={developerName}
                                onChange={(e) => setDeveloperName(e.target.value)}
                                placeholder="e.g. NovaArchitect"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Email Address
                          </label>
                          <input
                            id="input-auth-email"
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-300">
                              Secret Password
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                            >
                              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {showPassword ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                              id="input-auth-password"
                              type={showPassword ? 'text' : 'password'}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••••••"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>

                        {authMode === 'signup' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">
                              Confirm Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                              <input
                                id="input-auth-confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        )}

                        {authMode === 'signup' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-2">
                              Choose Avatar
                            </label>
                            <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                              {PRESET_AVATARS.map((av) => (
                                <button
                                  key={av.id}
                                  type="button"
                                  onClick={() => setSelectedAvatar(av.url)}
                                  className={`relative rounded-xl overflow-hidden border-2 transition shrink-0 ${
                                    selectedAvatar === av.url
                                      ? 'border-indigo-400 ring-2 ring-indigo-500/50 scale-105'
                                      : 'border-slate-800 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img src={av.url} alt={av.label} className="w-10 h-10 object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progress Safety Guarantee Notice */}
                        <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300/90 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>
                            Your current bot project & tokens will be safely imported into your account.
                          </span>
                        </div>
                      </>
                    )}

                    <button
                      id="btn-submit-password-auth"
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition flex items-center justify-center gap-2"
                    >
                      {isAuthLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-amber-300" />
                      )}
                      <span>
                        {is2FAChallengeStep 
                          ? 'Verify 2FA & Unlock Vault'
                          : authMode === 'signup' 
                            ? 'Create Protected Account & Save Bot' 
                            : 'Unlock Vault & Load My Bots'}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 2: Google Authentication with Domain Resolver */}
              {activeTab === 'google' && (
                <div className="space-y-4 text-center py-1">
                  <p className="text-xs text-slate-300">
                    Authenticate via your Google Account with Firestore Cloud synchronization.
                  </p>

                  {googleError && (
                    <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-left text-xs text-amber-200 space-y-2 relative">
                      <div className="flex items-center justify-between font-bold text-amber-300">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-amber-400" />
                          <span>Domain Authorization Notice</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setGoogleError(null)}
                          className="text-amber-400 hover:text-amber-200 p-0.5"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-200/90">
                        {googleError}
                      </p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={copyDomain}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 font-mono flex items-center gap-1.5"
                        >
                          {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedDomain ? 'Domain Copied!' : 'Copy Current Domain'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('novaforge');
                            setGoogleError(null);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold"
                        >
                          → Use Password Account
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    id="btn-google-popup-login"
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isAuthLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center justify-center gap-2.5 shadow-md"
                  >
                    {isAuthLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    )}
                    <span>Continue with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Isolated Vault • Crafted by Grazer
          </span>
          <button
            type="button"
            onClick={() => exportWorkspaceBackup(botProject, token, tokenInfo, currentUser)}
            className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium transition"
            title="Download credentials & bot configuration in plain text .txt format"
          >
            <Download className="w-3.5 h-3.5" />
            Quick Backup (.txt)
          </button>
        </div>
      </div>
    </div>
  );
};
