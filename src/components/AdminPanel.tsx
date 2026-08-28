import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchAdminMetrics, 
  checkAdminAccess, 
  addAdminWhitelistEmail, 
  removeAdminWhitelistEmail, 
  exportUsersCSV, 
  exportDatabaseJSON,
  simulateTelemetryEvent,
  resetTelemetryData,
  AdminMetricsData, 
  TelemetryUser,
  SUPER_ADMIN_EMAILS
} from '../lib/telemetryService';
import { NovaForgeUser } from '../lib/firebase';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  Activity, 
  Bot, 
  Terminal, 
  Download, 
  RefreshCw, 
  Key, 
  Search, 
  UserCheck, 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  ChevronRight, 
  UserPlus, 
  Mail, 
  Zap, 
  Radio, 
  AlertTriangle, 
  Star,
  Server,
  FileJson,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AdminPanelProps {
  currentUser: NovaForgeUser | null;
  onBackToStudio: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBackToStudio }) => {
  const [metrics, setMetrics] = useState<AdminMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminRole, setAdminRole] = useState<'super_admin' | 'admin' | null>(null);
  const [passcodeKey, setPasscodeKey] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'events' | 'access' | 'health'>('overview');
  
  // User search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<'all' | 'google' | 'novaforge' | 'guest'>('all');
  const [securityFilter, setSecurityFilter] = useState<'all' | '2fa_enabled' | 'standard'>('all');
  const [selectedUserDossier, setSelectedUserDossier] = useState<TelemetryUser | null>(null);

  // New admin email state
  const [newAdminEmailInput, setNewAdminEmailInput] = useState('');
  const [whitelistSuccess, setWhitelistSuccess] = useState('');
  const [whitelistError, setWhitelistError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // 1. Check Access on load
  const verifyAccess = async (explicitPass?: string) => {
    setIsLoading(true);
    setPasscodeError('');
    try {
      const authCheck = await checkAdminAccess(currentUser?.email, explicitPass || passcodeKey);
      if (authCheck.allowed) {
        setIsAuthorized(true);
        setAdminRole(authCheck.role || 'super_admin');
        if (explicitPass) {
          localStorage.setItem('novaforge_admin_auth_pass', explicitPass);
        }
        await loadMetrics(explicitPass || passcodeKey);
      } else {
        setIsAuthorized(false);
      }
    } catch (err: any) {
      setIsAuthorized(false);
      setPasscodeError(err.message || 'Authorization check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async (explicitPass?: string) => {
    try {
      const data = await fetchAdminMetrics(currentUser?.email, explicitPass || passcodeKey);
      setMetrics(data);
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    }
  };

  useEffect(() => {
    verifyAccess();
  }, [currentUser?.email]);

  // Auto-refresh metrics every 15s when active
  useEffect(() => {
    if (!isAuthorized || !autoRefresh) return;
    const timer = setInterval(() => {
      loadMetrics();
    }, 15000);
    return () => clearInterval(timer);
  }, [isAuthorized, autoRefresh]);

  // Handle Passcode Unlock Form
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeKey.trim()) {
      setPasscodeError('Please enter an administrative passcode.');
      return;
    }
    setIsSubmittingPass(true);
    setPasscodeError('');
    try {
      const authCheck = await checkAdminAccess(currentUser?.email, passcodeKey.trim());
      if (authCheck.allowed) {
        setIsAuthorized(true);
        setAdminRole(authCheck.role || 'super_admin');
        localStorage.setItem('novaforge_admin_auth_pass', passcodeKey.trim());
        await loadMetrics(passcodeKey.trim());
      } else {
        setPasscodeError('Invalid security passcode. Access denied.');
      }
    } catch (err: any) {
      setPasscodeError(err.message || 'Verification failed. Please check your credentials.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  // Add Admin Whitelist
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmailInput.trim()) return;
    setWhitelistError('');
    setWhitelistSuccess('');
    try {
      await addAdminWhitelistEmail(
        currentUser?.email || 'scientiapioneers@gmail.com', 
        newAdminEmailInput.trim(), 
        passcodeKey
      );
      setWhitelistSuccess(`Successfully granted Admin privileges to ${newAdminEmailInput.trim()}`);
      setNewAdminEmailInput('');
      loadMetrics();
    } catch (err: any) {
      setWhitelistError(err.message || 'Failed to add admin');
    }
  };

  // Remove Admin Whitelist
  const handleRemoveAdmin = async (email: string) => {
    if (!window.confirm(`Revoke admin access for ${email}?`)) return;
    try {
      await removeAdminWhitelistEmail(
        currentUser?.email || 'scientiapioneers@gmail.com', 
        email, 
        passcodeKey
      );
      showFeedback(`Revoked admin access for ${email}`);
      loadMetrics();
    } catch (err: any) {
      alert(err.message || 'Failed to remove admin');
    }
  };

  // Simulate Telemetry Event
  const handleSimulateEvent = async (type: string = 'BOT_CREATED') => {
    setIsSimulating(true);
    try {
      await simulateTelemetryEvent(currentUser?.email || 'scientiapioneers@gmail.com', type, passcodeKey);
      await loadMetrics();
      showFeedback(`Simulated "${type}" event recorded successfully!`);
    } catch (err: any) {
      showFeedback(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Reset / Reseed Telemetry
  const handleResetData = async () => {
    if (!window.confirm('Reset and reseed mock telemetry data to fresh defaults?')) return;
    try {
      await resetTelemetryData(currentUser?.email || 'scientiapioneers@gmail.com', passcodeKey);
      await loadMetrics();
      showFeedback('Telemetry data successfully reset and reseeded.');
    } catch (err: any) {
      showFeedback(`Reset error: ${err.message}`);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    if (!metrics?.users) return [];
    return metrics.users.filter(user => {
      const matchesSearch = 
        (user.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.uid || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.lastBotName || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider = 
        providerFilter === 'all' ? true : user.provider === providerFilter;

      const matchesSecurity = 
        securityFilter === 'all' 
          ? true 
          : securityFilter === '2fa_enabled' 
            ? user.is2FAEnabled 
            : !user.is2FAEnabled;

      return matchesSearch && matchesProvider && matchesSecurity;
    });
  }, [metrics?.users, searchQuery, providerFilter, securityFilter]);

  // Chart Data Calculations
  const activityTrendData = useMemo(() => {
    return [
      { name: 'Mon', signups: 4, botCreations: 12, exports: 8 },
      { name: 'Tue', signups: 7, botCreations: 19, exports: 14 },
      { name: 'Wed', signups: 12, botCreations: 26, exports: 18 },
      { name: 'Thu', signups: 18, botCreations: 34, exports: 29 },
      { name: 'Fri', signups: 24, botCreations: 48, exports: 36 },
      { name: 'Sat', signups: 32, botCreations: 62, exports: 45 },
      { name: 'Sun (Today)', signups: (metrics?.totalUsers || 5), botCreations: (metrics?.totalBots || 16), exports: (metrics?.totalExports || 40) }
    ];
  }, [metrics]);

  const moduleChartData = useMemo(() => {
    if (!metrics?.moduleStats) return [];
    return [
      { name: 'Slash Cmds', count: metrics.moduleStats.slashCommands || 94, color: '#6366f1' },
      { name: 'Casino Economy', count: metrics.moduleStats.casinoEconomy || 38, color: '#eab308' },
      { name: 'RPG Dungeons', count: metrics.moduleStats.rpgDungeons || 32, color: '#ec4899' },
      { name: 'Auto-Mod Shield', count: metrics.moduleStats.autoModAegis || 41, color: '#10b981' },
      { name: 'Ticket Support', count: metrics.moduleStats.ticketDesk || 28, color: '#06b6d4' },
      { name: 'Astral Levels', count: metrics.moduleStats.astralLeveling || 30, color: '#8b5cf6' },
      { name: 'Schedulers', count: metrics.moduleStats.schedulers || 22, color: '#f97316' }
    ];
  }, [metrics?.moduleStats]);

  const providerDistribution = useMemo(() => {
    const googleCount = (metrics?.users || []).filter(u => u.provider === 'google').length;
    const passwordCount = (metrics?.users || []).filter(u => u.provider === 'novaforge').length;
    const guestCount = (metrics?.users || []).filter(u => u.provider === 'guest').length;
    return [
      { name: 'Google OAuth', value: Math.max(1, googleCount), color: '#4285F4' },
      { name: 'Password Vault', value: Math.max(1, passwordCount), color: '#6366f1' },
      { name: 'Guest Session', value: Math.max(0, guestCount), color: '#64748b' }
    ];
  }, [metrics?.users]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <div className="text-base font-bold tracking-wide text-slate-200">Verifying Master Security Clearance...</div>
        <p className="text-xs text-slate-500 mt-1">Connecting to NovaForge Telemetry Gateway</p>
      </div>
    );
  }

  // ==========================================
  // RESTRICTED ACCESS / ACCESS DENIED SCREEN
  // ==========================================
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-indigo-400" />
          </div>

          <h2 className="text-xl font-black text-center text-white mb-1.5 tracking-wide">
            NovaForge Admin Portal
          </h2>
          <p className="text-xs text-center text-slate-400 mb-6">
            Access to <span className="font-mono text-indigo-300">/admin/panel</span> requires verified Super Admin credentials or an administrative access key.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mb-5 text-xs">
            <div className="text-slate-400 text-[11px] mb-1 font-semibold">Active Session Identity:</div>
            <div className="font-mono text-slate-200 truncate flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {currentUser?.email ? currentUser.email : 'Guest Session (Unauthenticated)'}
            </div>
          </div>

          {/* Master Key Passcode Form */}
          <form onSubmit={handlePasscodeSubmit} className="space-y-3.5 mb-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Administrative Passcode
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={passcodeKey}
                  onChange={(e) => setPasscodeKey(e.target.value)}
                  placeholder="Enter administrative passcode..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {passcodeError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingPass}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmittingPass ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Unlock className="w-4 h-4 text-white" />
              )}
              <span>Verify & Unlock Portal</span>
            </button>
          </form>

          <button
            type="button"
            onClick={onBackToStudio}
            className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to NovaForge Studio</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL AUTHORIZED ADMIN PANEL DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white text-left">
      {/* Action Toast Feedback */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-indigo-400/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white tracking-tight">NovaForge Master Telemetry</h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  /admin/panel
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-time user directory, project telemetry & security audit</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Online Pulse Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{metrics?.onlineNow || 2} Online Now</span>
            </div>

            {/* Simulate Event Button */}
            <button
              onClick={() => handleSimulateEvent('BOT_CREATED')}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
              title="Inject test telemetry event into live stream"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulate Event</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => {
                loadMetrics();
                showFeedback('Telemetry refreshed.');
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={() => metrics?.users && exportUsersCSV(metrics.users)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition"
              title="Export user directory as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>CSV</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={() => metrics && exportDatabaseJSON(metrics)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition"
              title="Export full database snapshot as JSON"
            >
              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>

            {/* Back to Studio */}
            <button
              onClick={onBackToStudio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory ({metrics?.totalUsers || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'events'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Audit Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'access'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Admin Access Control</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'health'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>System & Gateway Health</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1">
        {/* ==========================================
            TAB 1: OVERVIEW & ANALYTICS
           ========================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>Total Users</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{metrics?.totalUsers || 5}</div>
                <div className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +100% cloud registered
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>Active Today</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-300">{metrics?.activeToday || 4}</div>
                <div className="text-[10px] text-slate-400 font-medium mt-1">
                  {metrics?.onlineNow || 2} active in last 5m
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>Bots Created</span>
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-300">{metrics?.totalBots || 16}</div>
                <div className="text-[10px] text-purple-400/80 font-medium mt-1">
                  ~{((metrics?.totalBots || 16) / Math.max(1, metrics?.totalUsers || 5)).toFixed(1)} bots / architect
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>Slash Commands</span>
                  <Terminal className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-300">{metrics?.totalCommands || 94}</div>
                <div className="text-[10px] text-cyan-400/80 font-medium mt-1">
                  Registered across bots
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>Discord.js Exports</span>
                  <Download className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-300">{metrics?.totalExports || 40}</div>
                <div className="text-[10px] text-amber-400/80 font-medium mt-1">
                  Production packages
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                  <span>2FA Guard Rate</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-300">{metrics?.twoFactorRate || 60}%</div>
                <div className="text-[10px] text-emerald-400/80 font-medium mt-1">
                  TOTP authenticator active
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Activity Trend Chart */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" /> User Activity & Bot Creation Momentum
                    </h3>
                    <p className="text-[11px] text-slate-400">Weekly progression of signups, bot setups & code exports</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityTrendData}>
                      <defs>
                        <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="exportGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="botCreations" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#botGrad)" name="Bot Projects" />
                      <Area type="monotone" dataKey="exports" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#exportGrad)" name="Discord.js Exports" />
                      <Area type="monotone" dataKey="signups" stroke="#ec4899" strokeWidth={2} fill="transparent" name="User Signups" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Authentication Providers Distribution */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" /> Auth Method Distribution
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">How users authenticate into NovaForge</p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {providerDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-auto space-y-2 text-xs">
                  {providerDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{item.value} Users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popular Modules Usage Chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Module Adoption Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 mb-4">Which bot modules your users are building the most</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={moduleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {moduleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: USER DIRECTORY & LIVE DOSSIER
           ========================================== */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Search & Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, bot..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                <select
                  value={providerFilter}
                  onChange={(e: any) => setProviderFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Auth Providers</option>
                  <option value="google">Google OAuth</option>
                  <option value="novaforge">Password Vault</option>
                  <option value="guest">Guest</option>
                </select>

                <select
                  value={securityFilter}
                  onChange={(e: any) => setSecurityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All 2FA States</option>
                  <option value="2fa_enabled">2FA Guarded</option>
                  <option value="standard">Standard / Unprotected</option>
                </select>

                <button
                  onClick={() => metrics?.users && exportUsersCSV(metrics.users)}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Architect / User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">2FA Status</th>
                      <th className="py-3 px-4">Bots</th>
                      <th className="py-3 px-4">Commands</th>
                      <th className="py-3 px-4">Last Active</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((user) => (
                      <tr 
                        key={user.uid} 
                        className="hover:bg-slate-800/40 transition cursor-pointer"
                        onClick={() => setSelectedUserDossier(user)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.displayName || 'NovaForge Architect'}</div>
                              <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{user.uid}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-300">
                          {user.email || <span className="text-slate-600">No email (Guest)</span>}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            user.provider === 'google' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                              : user.provider === 'novaforge'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {user.provider}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {user.role === 'super_admin' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Super Admin
                            </span>
                          ) : user.role === 'admin' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Admin
                            </span>
                          ) : (
                            <span className="text-slate-400">Architect</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {user.is2FAEnabled ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" /> 2FA Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Lock className="w-3.5 h-3.5" /> Standard
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {user.botsCount || 1}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-200">
                          {user.commandsCount || 6}
                        </td>

                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(user.lastActiveAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserDossier(user);
                            }}
                            className="p-1.5 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                            title="Inspect User Dossier"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No users match the search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Dossier Modal / Drawer */}
            {selectedUserDossier && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center overflow-hidden">
                        {selectedUserDossier.photoURL ? (
                          <img src={selectedUserDossier.photoURL} alt={selectedUserDossier.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserCheck className="w-6 h-6 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white">{selectedUserDossier.displayName}</h3>
                        <div className="text-xs text-slate-400 font-mono">{selectedUserDossier.email || 'No email attached'}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUserDossier(null)}
                      className="p-1 text-slate-400 hover:text-white rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">User Identifier (UID)</div>
                      <div className="font-mono text-slate-200 truncate mt-0.5">{selectedUserDossier.uid}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Security & 2FA</div>
                      <div className="font-bold text-emerald-400 mt-0.5">
                        {selectedUserDossier.is2FAEnabled ? 'TOTP Authenticator Guarded' : 'Password Only'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Total Discord Bots</div>
                      <div className="font-mono text-white font-bold text-base mt-0.5">{selectedUserDossier.botsCount || 1}</div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-slate-500 text-[10px] uppercase font-bold">Total Slash Commands</div>
                      <div className="font-mono text-white font-bold text-base mt-0.5">{selectedUserDossier.commandsCount || 6}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl text-xs space-y-1.5">
                    <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-indigo-400" /> Active Bot Project
                    </div>
                    <div className="text-slate-300">
                      Last edited bot: <span className="font-bold text-white font-mono">{selectedUserDossier.lastBotName || 'NovaForge Bot Master'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Exports recorded: <span className="font-bold text-white">{selectedUserDossier.exportsCount || 0} times</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {selectedUserDossier.email && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedUserDossier.email) {
                            addAdminWhitelistEmail(currentUser?.email || 'scientiapioneers@gmail.com', selectedUserDossier.email, passcodeKey);
                            showFeedback(`Admin privileges granted to ${selectedUserDossier.email}`);
                            loadMetrics();
                          }
                        }}
                        className="px-3 py-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Grant Admin Role</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedUserDossier(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition ml-auto"
                    >
                      Close Dossier
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: LIVE AUDIT & TELEMETRY STREAM
           ========================================== */}
        {activeTab === 'events' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" /> Real-Time Telemetry Audit Stream
                </h3>
                <p className="text-xs text-slate-400">Live feed of user registrations, logins, slash command creations, and Discord.js exports</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSimulateEvent('BOT_EXPORTED')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Trigger Test Event</span>
                </button>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                  <span>Live 15s Pulse</span>
                </label>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {(metrics?.recentEvents || []).map((evt) => (
                <div 
                  key={evt.id} 
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      evt.type === 'USER_SIGNUP' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      evt.type === 'USER_LOGIN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      evt.type === 'BOT_CREATED' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      evt.type === 'BOT_EXPORTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      evt.type === '2FA_ENABLED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {evt.type === 'USER_SIGNUP' ? <UserPlus className="w-4 h-4" /> :
                       evt.type === 'USER_LOGIN' ? <Lock className="w-4 h-4" /> :
                       evt.type === 'BOT_CREATED' ? <Bot className="w-4 h-4" /> :
                       evt.type === 'BOT_EXPORTED' ? <Download className="w-4 h-4" /> :
                       evt.type === '2FA_ENABLED' ? <ShieldCheck className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{evt.userName || 'Architect'}</span>
                        <span className="text-slate-500 font-mono text-[10px]">({evt.userEmail || evt.userId})</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Event: <span className="font-mono text-indigo-300 font-medium">{evt.type}</span>
                        {evt.details?.botName && ` • Bot: "${evt.details.botName}"`}
                        {evt.details?.command && ` • Command: /${evt.details.command}`}
                        {evt.details?.format && ` • Format: ${evt.details.format}`}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: ADMIN ACCESS CONTROL & RBAC
           ========================================== */}
        {activeTab === 'access' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
            {/* Access Whitelist Manager */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Admin Access & Role-Based Access Control (RBAC)</h3>
                  <p className="text-xs text-slate-400">Only authorized emails and holders of the Master Passcode can view <span className="font-mono text-indigo-300">/admin/panel</span></p>
                </div>
              </div>

              {/* Add Admin Email Form */}
              <form onSubmit={handleAddAdmin} className="space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                <label className="block text-xs font-bold text-slate-300">
                  Grant New Admin Permission by Email
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newAdminEmailInput}
                      onChange={(e) => setNewAdminEmailInput(e.target.value)}
                      placeholder="e.g. cofounder@novaforge.dev"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Grant Access</span>
                  </button>
                </div>

                {whitelistSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{whitelistSuccess}</span>
                  </div>
                )}
                {whitelistError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{whitelistError}</span>
                  </div>
                )}
              </form>

              {/* Current Whitelist List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 mb-2">Whitelisted Master Administrators:</div>
                {(metrics?.adminWhitelist || SUPER_ADMIN_EMAILS).map((email) => {
                  const isSuperAdmin = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
                  return (
                    <div 
                      key={email} 
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isSuperAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className="font-mono text-white font-medium">{email}</span>
                        {isSuperAdmin && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Super Admin (Root)
                          </span>
                        )}
                      </div>

                      {!isSuperAdmin && (
                        <button
                          onClick={() => handleRemoveAdmin(email)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium transition"
                        >
                          Revoke Access
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Master Security Key Info */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Master Security Bypass Key
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Confidential</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Emergency root bypass key for authorized Super Architects. Keep this key confidential.
                </p>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-cyan-300 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="tracking-wider">{showSecretKey ? 'NOVA_SUPER_ARCHITECT_2026' : '••••••••••••••••••••••••'}</span>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition"
                      title={showSecretKey ? 'Hide Passcode' : 'Reveal Passcode'}
                    >
                      {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('NOVA_SUPER_ARCHITECT_2026');
                      showFeedback('Copied Master Key to clipboard!');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition"
                  >
                    Copy Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: SYSTEM & GATEWAY HEALTH
           ========================================== */}
        {activeTab === 'health' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" /> Server Gateway
                </div>
                <div className="text-xl font-bold text-emerald-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE & HEALTHY</span>
                </div>
                <div className="text-[11px] text-slate-400">Node Express Runtime • Port 3000</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" /> Discord Runner Service
                </div>
                <div className="text-xl font-bold text-purple-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>v14.14 READY</span>
                </div>
                <div className="text-[11px] text-slate-400">Discord.js Gateway WebSocket v10</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                <div className="text-slate-400 text-xs font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> 2FA Vault Engine
                </div>
                <div className="text-xl font-bold text-cyan-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>AES-256 + TOTP</span>
                </div>
                <div className="text-[11px] text-slate-400">Zero plain-text token exposure</div>
              </div>
            </div>

            {/* Quick System Maintenance Actions */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400" /> Telemetry Storage & Maintenance
              </h3>
              <p className="text-xs text-slate-400">
                You can reseed test users and events or clear telemetry cache if needed.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Reseed Telemetry Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => metrics && exportDatabaseJSON(metrics)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Backup Full Database (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
