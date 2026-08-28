import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Download, 
  Key, 
  Lock, 
  Sparkles, 
  Cloud, 
  LogOut,
  Tag,
  Check,
  ShieldAlert,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { NovaForgeUser } from '../lib/firebase';
import { BotProject, BotTokenInfo } from '../types';
import { exportCredentialsTxt, getActivePassword } from '../lib/userDataService';

interface AccountSettingsViewProps {
  currentUser: NovaForgeUser | null;
  botProject: BotProject;
  token: string;
  tokenInfo: BotTokenInfo | null;
  onUpdateBotProject: (project: BotProject) => void;
  onOpenAuthModal: () => void;
  onOpenTokenModal: () => void;
  onSignOut: () => Promise<void>;
  isCloudSyncing: boolean;
  is2FAEnabled?: boolean;
  onNavigateTo2FA?: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({
  currentUser,
  botProject,
  token,
  tokenInfo,
  onUpdateBotProject,
  onOpenAuthModal,
  onOpenTokenModal,
  onSignOut,
  isCloudSyncing,
  is2FAEnabled = false,
  onNavigateTo2FA
}) => {
  const [customWatermark, setCustomWatermark] = useState(botProject.watermark || '⚡ Built with NovaForge by Grazer');
  const [isSavedWatermark, setIsSavedWatermark] = useState(false);

  const handleSaveWatermark = () => {
    onUpdateBotProject({
      ...botProject,
      watermark: customWatermark.trim() || '⚡ Built with NovaForge by Grazer'
    });
    setIsSavedWatermark(true);
    setTimeout(() => setIsSavedWatermark(false), 2000);
  };

  const handleDownloadCredentialsTxt = () => {
    exportCredentialsTxt(currentUser);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 border-2 border-indigo-500/40 flex items-center justify-center shadow-lg overflow-hidden">
                {currentUser?.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'User'} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-8 h-8 text-indigo-400" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {currentUser?.displayName || 'NovaForge Architect'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentUser?.provider === 'google' ? 'Google Account' : currentUser?.provider === 'novaforge' ? 'Secure Vault' : 'Guest Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser?.email || 'Temporary guest session (Not saved to Cloud vault)'}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Vault Encrypted
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1 ${is2FAEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {is2FAEnabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {is2FAEnabled ? '2FA Protected' : '2FA Disabled'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Cloud className="w-3.5 h-3.5" />
                  {isCloudSyncing ? 'Syncing...' : 'Auto-Sync Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <button
                type="button"
                onClick={onSignOut}
                className="px-4 py-2 bg-slate-950 hover:bg-red-950/40 text-red-300 border border-slate-800 hover:border-red-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Create / Sign In Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Credentials Export (Username & Password strictly) */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Credentials (.txt)</h3>
              <p className="text-xs text-slate-400">Exports your Username and Password file.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Download your clean <code className="text-cyan-300 font-mono">Credentials.txt</code> file containing strictly your account Username and Password for safe offline keeping.
          </p>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-cyan-400 font-semibold">[Credentials.txt Preview]</div>
            <div>Username: {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'NovaForge_Architect'}</div>
            <div>Password: ••••••••••••</div>
          </div>

          <button
            type="button"
            onClick={handleDownloadCredentialsTxt}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Credentials.txt</span>
          </button>
        </div>

        {/* Card 2: 2FA Authentication & Vault Security */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              is2FAEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-slate-400">TOTP Authenticator & Emergency Recovery Codes.</p>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Status: {is2FAEnabled ? 'Protected with 2FA' : 'Not Configured'}</div>
              <p className="text-[10px] text-slate-400">Google Authenticator, Authy, 1Password</p>
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
              is2FAEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {is2FAEnabled ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <button
            type="button"
            onClick={onNavigateTo2FA}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{is2FAEnabled ? 'Manage 2FA & Recovery Codes' : 'Setup Two-Factor Authentication (2FA)'}</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </button>
        </div>

        {/* Card 3: Custom Bot Watermark by Grazer */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Bot Watermark & Embed Credits</h3>
              <p className="text-xs text-slate-400">Displayed in Discord embeds, status messages & code.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Active Watermark Text
            </label>
            <input
              type="text"
              value={customWatermark}
              onChange={(e) => setCustomWatermark(e.target.value)}
              placeholder="⚡ Built with NovaForge by Grazer"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveWatermark}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 transition cursor-pointer"
          >
            {isSavedWatermark ? <Check className="w-4 h-4 text-emerald-300" /> : <Sparkles className="w-4 h-4" />}
            <span>{isSavedWatermark ? 'Watermark Saved!' : 'Apply Watermark to All Embeds'}</span>
          </button>
        </div>

        {/* Card 4: Discord Bot Token & Credentials */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Discord Application Token</h3>
              <p className="text-xs text-slate-400">Manage your connected Discord bot identity.</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tokenInfo?.isValid ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-mono text-slate-300 truncate">
                {token ? `${token.substring(0, 16)}••••••••••••` : 'No token linked'}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
              {tokenInfo?.isValid ? 'VALID' : 'UNVERIFIED'}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenTokenModal}
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Change / Validate Bot Token</span>
          </button>
        </div>

      </div>
    </div>
  );
};

