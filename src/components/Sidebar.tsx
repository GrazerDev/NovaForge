import React from 'react';
import { 
  LayoutDashboard, 
  Wand2, 
  Terminal, 
  Layers, 
  Radio, 
  Clock, 
  ShieldCheck, 
  Settings, 
  Key, 
  Download, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  LogIn, 
  User as UserIcon, 
  CheckCircle2, 
  X,
  Lock,
  Activity
} from 'lucide-react';
import { MainAppViewMode, BotTokenInfo, BotProject } from '../types';
import { NovaForgeUser } from '../lib/firebase';
import { exportCredentialsTxt } from '../lib/userDataService';

interface SidebarProps {
  currentView: MainAppViewMode;
  onSelectView: (view: MainAppViewMode) => void;
  tokenInfo: BotTokenInfo | null;
  botProject?: BotProject | null;
  currentUser: NovaForgeUser | null;
  onOpenTokenModal: () => void;
  onOpenAuthModal: () => void;
  onToggleAIAssistant?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  is2FAEnabled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  tokenInfo,
  botProject,
  currentUser,
  onOpenTokenModal,
  onOpenAuthModal,
  onToggleAIAssistant,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  is2FAEnabled = false
}) => {
  const navSections = [
    {
      group: 'Core Suite',
      items: [
        {
          id: 'dash' as MainAppViewMode,
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        },
        {
          id: 'ai_building' as MainAppViewMode,
          label: 'AI Bot Builder',
          icon: Wand2,
          badge: '0-API',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        {
          id: 'simulator' as MainAppViewMode,
          label: 'Discord Simulator',
          icon: Terminal,
          badge: 'Sandbox',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        }
      ]
    },
    {
      group: 'Studio & Workflows',
      items: [
        {
          id: 'modules' as MainAppViewMode,
          label: 'Visual Modules',
          icon: Layers,
          count: botProject?.commands?.length || 0
        },
        {
          id: 'live_gateway' as MainAppViewMode,
          label: 'Live Gateway & Logs',
          icon: Radio,
          badge: tokenInfo?.isValid ? 'Online' : 'Standby',
          badgeColor: tokenInfo?.isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700/50 text-slate-400'
        },
        {
          id: 'schedulers' as MainAppViewMode,
          label: 'Schedulers & Cron',
          icon: Clock,
          count: botProject?.schedulers?.length || 0
        }
      ]
    },
    {
      group: 'Security & Access',
      items: [
        {
          id: 'security_2fa' as MainAppViewMode,
          label: '2FA & Vault Security',
          icon: ShieldCheck,
          badge: is2FAEnabled ? '2FA Active' : 'Setup 2FA',
          badgeColor: is2FAEnabled 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        },
        {
          id: 'account_settings' as MainAppViewMode,
          label: 'Account & Settings',
          icon: Settings
        },
        {
          id: 'admin_panel' as MainAppViewMode,
          label: 'Admin & User Tracking',
          icon: Activity,
          badge: '/admin/panel',
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30'
        }
      ]
    }
  ];

  const handleNavClick = (view: MainAppViewMode) => {
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-950/95 border-r border-slate-800/90 flex flex-col justify-between transition-all duration-300 ease-in-out backdrop-blur-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div 
            onClick={() => handleNavClick('dash')}
            className="flex items-center gap-3 cursor-pointer group overflow-hidden"
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
                  <circle cx="20" cy="20" r="17" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path d="M11 13L20 8L29 13V21C29 26.5 25.2 31.6 20 33C14.8 31.6 11 26.5 11 21V13Z" fill="#0F172A" stroke="#818CF8" strokeWidth="1.8" />
                  <path d="M21 11L14 20H20L19 29L26 20H20L21 11Z" fill="#38BDF8" />
                </svg>
              </div>
            </div>

            {!isCollapsed && (
              <div className="flex flex-col text-left truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-tight">NovaForge</span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                    by Grazer
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 truncate">{botProject.name}</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-left custom-scrollbar">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.group}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor || 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {typeof item.count === 'number' && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Bottom Action Vault & User Profile */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/70">
          
          {/* Quick Export Credentials.txt Button */}
          <button
            id="btn-sidebar-export-credentials"
            onClick={() => exportCredentialsTxt(currentUser)}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 hover:border-emerald-500/40 text-emerald-300 border border-slate-800 rounded-xl text-xs font-bold transition shadow-sm group"
            title="Download Credentials.txt (Username & Password)"
          >
            <Download className="w-4 h-4 text-emerald-400 group-hover:translate-y-0.5 transition shrink-0" />
            {!isCollapsed && (
              <span className="truncate">Export Credentials.txt</span>
            )}
          </button>

          {/* Discord Bot Token Status Pill */}
          <button
            id="btn-sidebar-token"
            onClick={onOpenTokenModal}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              tokenInfo?.isValid
                ? 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-500/30'
            }`}
            title="Manage Discord Bot Token"
          >
            <Key className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="truncate">{tokenInfo?.isValid ? 'Token Linked' : 'Link Token'}</span>
                {tokenInfo?.isValid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </div>
            )}
          </button>

          {/* User Account / Sign In Pill */}
          {currentUser ? (
            <div 
              onClick={() => handleNavClick('account_settings')}
              className="flex items-center gap-2.5 p-2 bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-slate-800/80 cursor-pointer transition"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center overflow-hidden shrink-0">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left truncate min-w-0">
                  <span className="text-xs font-bold text-slate-200 truncate">{currentUser.displayName}</span>
                  <span className="text-[10px] text-slate-400 truncate">{currentUser.email || 'Master Architect'}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleNavClick('welcome_auth')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Sign In / Vault</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
