import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LogIn, 
  CheckCircle2, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  Cpu, 
  Zap, 
  Bot, 
  Radio, 
  Layers, 
  Flame, 
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';
import { NovaForgeUser } from '../lib/firebase';
import { BotProject, BotTokenInfo } from '../types';
import { exportCredentialsTxt, saveActivePassword } from '../lib/userDataService';

interface WelcomeAuthScreenProps {
  currentUser: NovaForgeUser | null;
  onGoogleSignIn: () => Promise<void>;
  onEmailSignIn: (email: string, pass: string) => Promise<void>;
  onEmailSignUp: (email: string, pass: string, displayName: string, avatarUrl?: string) => Promise<void>;
  onContinueAsGuest: () => void;
  isAuthLoading: boolean;
  botProject: BotProject;
  token: string;
  tokenInfo: BotTokenInfo | null;
}

const PRESET_AVATARS = [
  { id: '1', label: 'Cyber Core', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Neon Hacker', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=120&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Quantum AI', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Forge Master', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=120&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Void Sentinel', url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=120&auto=format&fit=crop&q=80' },
];

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({
  currentUser,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onContinueAsGuest,
  isAuthLoading,
  botProject,
  token,
  tokenInfo,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      saveActivePassword(password);
      if (authMode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          return;
        }
        await onEmailSignUp(cleanEmail, password, displayName.trim() || 'NovaForge Architect', selectedAvatar);
        onContinueAsGuest();
      } else {
        await onEmailSignIn(cleanEmail, password);
        onContinueAsGuest();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        msg = 'Invalid email or password. If you are new here, click "Create Account".';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please switch to "Sign In".';
      }
      setErrorMessage(msg);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleError(null);
    try {
      const user = await onGoogleSignIn();
      if (user) {
        onContinueAsGuest();
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setGoogleError(
          `Custom domain "${currentHostname}" needs to be added to Firebase Authorized Domains, or you can use the instant Password Account above.`
        );
      } else if (err?.code === 'auth/popup-blocked') {
        setGoogleError('Sign-in popup was blocked by browser. Please allow popups for this site.');
      } else {
        setGoogleError(err?.message || 'Google sign-in encountered an issue.');
      }
    }
  };

  const handleInstantArchitectLogin = async () => {
    try {
      const fallbackEmail = `architect_${Date.now().toString().slice(-4)}@novaforge.dev`;
      const fallbackPass = 'novaforge123';
      saveActivePassword(fallbackPass);
      await onEmailSignUp(fallbackEmail, fallbackPass, displayName.trim() || 'NovaForge Architect', selectedAvatar);
      onContinueAsGuest();
    } catch (e) {
      onContinueAsGuest();
    }
  };

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleDirectExport = () => {
    exportCredentialsTxt(
      { displayName: displayName || email.split('@')[0] || 'NovaForge_Architect', email },
      password || undefined
    );
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 max-w-5xl mx-auto pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-600/30 via-indigo-600/30 to-purple-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Brand Hero & Value Prop & Credits */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Creator Credit Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Crafted by <strong className="text-white font-extrabold tracking-wide">Grazer</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-300 font-mono text-[11px]">NovaForge v3.0</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Create & Host Discord Bots <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">With Zero API Keys</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Design full-stack Discord bots visually in seconds. Built-in zero-cost AI architect, 24/7 start/stop live gateway hosting, anti-theft credential vault, RPG dungeons, and casino economy.
            </p>
          </div>

          {/* Core Highlights Bento */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-xs font-bold text-white">Zero-API AI Engine</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Instant prompt-to-bot generation without needing external keys.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2">
                <Radio className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xs font-bold text-white">Live 24/7 Hosting</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Start & stop your real Discord bot with live websocket telemetry.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-2">
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-xs font-bold text-white">Modular Visual IDE</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Drag-and-drop action pipelines, tickets, and economy rules.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-xs font-bold text-white">Anti-Theft Vault</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Password encrypted storage & 1-click .txt backup exporter.</p>
            </div>
          </div>

          {/* Quick guest launch shortcut */}
          <div className="pt-2">
            <button
              id="btn-welcome-guest-explore"
              onClick={onContinueAsGuest}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition group"
            >
              <span>Skip authentication & test immediately as Guest</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Sign In / Sign Up Form Card */}
        <div className="lg:col-span-6">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden text-left">
            {/* Header Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span>{authMode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {authMode === 'signin' 
                    ? 'Enter your credentials to load your saved bot projects.' 
                    : 'Get your secure vault to protect your bot from being stolen.'}
                </p>
              </div>

              {/* Mode Switcher Pills */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setErrorMessage(null); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    authMode === 'signin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setErrorMessage(null); }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    authMode === 'signup' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username / Architect Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. ShadowDeveloper"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Secret Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{authMode === 'signin' ? 'Sign In to Bot Studio' : 'Create Account & Encrypt Vault'}</span>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                <span className="bg-slate-900 px-3">or continue with</span>
              </div>
            </div>

            {/* Social & Guest Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isAuthLoading}
                className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                title="Sign in with your Google account"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Guest Mode</span>
              </button>
            </div>

            {/* Google Custom Domain / OAuth Notice */}
            {googleError && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-xs space-y-2.5 relative shadow-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Firebase Custom Domain Notice</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleError(null)}
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Google sign-in on custom domain <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono">{currentHostname}</code> requires adding this domain to Firebase Console under <strong>Authentication &rarr; Settings &rarr; Authorized Domains</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1.5 transition"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Domain Copied!' : `Copy Domain: ${currentHostname}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInstantArchitectLogin}
                    className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition"
                  >
                    <Zap className="w-3 h-3 text-purple-400" />
                    <span>Instant Architect Sign-In</span>
                  </button>
                </div>
              </div>
            )}

            {/* Plain text export backup badge */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Encrypted Vault • By Grazer</span>
              </span>
              <button
                type="button"
                onClick={handleDirectExport}
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
                title="Download Credentials.txt (Username & Password)"
              >
                <Download className="w-3 h-3" />
                <span>Export Credentials.txt</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
