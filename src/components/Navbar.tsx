import React from 'react';
import { 
  Sparkles, 
  Key, 
  Dices, 
  CheckCircle2, 
  User as UserIcon,
  LayoutDashboard,
  Layers,
  Wand2,
  Terminal,
  Settings,
  LogIn
} from 'lucide-react';
import { BotTokenInfo, MainAppViewMode } from '../types';
import { NovaForgeUser } from '../lib/firebase';

interface NavbarProps {
  currentView: MainAppViewMode;
  onSelectView: (view: MainAppViewMode) => void;
  tokenInfo: BotTokenInfo | null;
  onOpenTokenModal: () => void;
  onOpenIdeasModal: () => void;
  onOpenGuideModal: () => void;
  onOpenSecurityModal?: () => void;
  onOpenAuthModal: () => void;
  onToggleAIAssistant?: () => void;
  isAIAssistantOpen?: boolean;
  currentUser?: NovaForgeUser | null;
  onSignOut?: () => Promise<void>;
  isAuthLoading?: boolean;
  isCloudSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  tokenInfo,
  onOpenTokenModal,
  onOpenIdeasModal,
  onOpenAuthModal,
  currentUser = null,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2 text-left shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo with Grazer Credit */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => onSelectView('dash')}>
            {/* Glowing Backdrop Ring */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
            
            {/* Custom NovaForge High-Tech SVG Emblem */}
            <div className="relative w-9 h-9 rounded-2xl bg-slate-950 border border-indigo-400/40 flex items-center justify-center shadow-inner overflow-hidden">
              <svg 
                viewBox="0 0 40 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6 transform group-hover:scale-110 transition duration-300"
              >
                <circle cx="20" cy="20" r="17" stroke="url(#paint0_linear)" strokeWidth="1.5" strokeDasharray="3 2" />
                <path 
                  d="M11 13L20 8L29 13V21C29 26.5 25.2 31.6 20 33C14.8 31.6 11 26.5 11 21V13Z" 
                  fill="#0F172A" 
                  stroke="url(#paint1_linear)" 
                  strokeWidth="1.8"
                />
                <path 
                  d="M21 11L14 20H20L19 29L26 20H20L21 11Z" 
                  fill="#38BDF8" 
                  className="filter drop-shadow-[0_0_3px_#38BDF8]"
                />
                <circle cx="20" cy="8" r="1.2" fill="#FFFFFF" />
                <circle cx="35" cy="11" r="1.2" fill="#38BDF8" />
                <circle cx="5" cy="11" r="1.2" fill="#C084FC" />
                <defs>
                  <linearGradient id="paint0_linear" x1="3" y1="3" x2="37" y2="37" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38BDF8" />
                    <stop offset="0.5" stopColor="#818CF8" />
                    <stop offset="1" stopColor="#C084FC" />
                  </linearGradient>
                  <linearGradient id="paint1_linear" x1="11" y1="8" x2="29" y2="33" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1" />
                    <stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight bg-gradient-to-r from-white via-indigo-100 to-slate-300 bg-clip-text">
                NovaForge
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full shadow-sm">
                <span>by</span>
                <strong className="text-white font-extrabold">Grazer</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs (Dash, Modules, AI Building, Simulator, Account) */}
        <nav className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
          <button
            id="nav-tab-dash"
            type="button"
            onClick={() => onSelectView('dash')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'dash'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dash</span>
          </button>

          <button
            id="nav-tab-modules"
            type="button"
            onClick={() => onSelectView('modules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'modules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Modules</span>
          </button>

          <button
            id="nav-tab-ai-building"
            type="button"
            onClick={() => onSelectView('ai_building')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'ai_building'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Building</span>
            <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1 py-0.2 rounded font-mono">0-API</span>
          </button>

          <button
            id="nav-tab-simulator"
            type="button"
            onClick={() => onSelectView('simulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'simulator'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Simulator</span>
          </button>

          <button
            id="nav-tab-account-settings"
            type="button"
            onClick={() => onSelectView('account_settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentView === 'account_settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Templates Roulette */}
          <button
            id="btn-nav-ideas"
            onClick={onOpenIdeasModal}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5"
            title="Bot Idea Templates"
          >
            <Dices className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Bot Token pill */}
          <button
            id="btn-nav-token"
            onClick={onOpenTokenModal}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
              tokenInfo?.isValid
                ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-500/40'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tokenInfo?.isValid ? 'Bot Token' : 'Link Token'}</span>
            {tokenInfo?.isValid && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          {/* User Profile / Sign In button */}
          {currentUser ? (
            <button
              onClick={() => onSelectView('account_settings')}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                )}
              </div>
              <span className="text-xs font-bold text-slate-200 hidden md:inline max-w-[100px] truncate">
                {currentUser.displayName || 'Architect'}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onSelectView('welcome_auth')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
