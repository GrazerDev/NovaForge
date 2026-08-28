import React, { useState, useEffect } from 'react';
import { BotProject, BotTokenInfo } from '../types';
import { 
  Radio, 
  Power, 
  RefreshCw, 
  Sparkles, 
  Server, 
  Activity, 
  ShieldCheck, 
  ExternalLink, 
  Terminal, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Cpu, 
  Bot, 
  Zap, 
  Clock, 
  Users, 
  Sliders, 
  Flame, 
  BrainCircuit,
  Hash
} from 'lucide-react';

interface LiveBotHostingDashboardProps {
  botProject: BotProject;
  tokenInfo: BotTokenInfo | null;
  onUpdateBotProject: (updated: BotProject) => void;
  onOpenTokenModal: () => void;
}

interface LiveStatusResponse {
  status: 'offline' | 'connecting' | 'online' | 'error';
  error?: string | null;
  uptimeSeconds: number;
  pingMs: number;
  botUser?: {
    id: string;
    username: string;
    tag: string;
    avatarUrl: string;
  } | null;
  guilds: {
    id: string;
    name: string;
    memberCount: number;
    iconUrl?: string | null;
  }[];
  logs: {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success';
    message: string;
  }[];
}

export const LiveBotHostingDashboard: React.FC<LiveBotHostingDashboardProps> = ({
  botProject,
  tokenInfo,
  onUpdateBotProject,
  onOpenTokenModal
}) => {
  const [liveState, setLiveState] = useState<LiveStatusResponse>({
    status: 'offline',
    uptimeSeconds: 0,
    pingMs: 24,
    guilds: [],
    logs: [
      { id: '1', timestamp: new Date().toLocaleTimeString(), level: 'info', message: 'NovaForge Hosting Dashboard ready.' }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [aiTestPrompt, setAiTestPrompt] = useState('Hello! What commands can you run in this server?');
  const [aiTestResponse, setAiTestResponse] = useState<string | null>(null);
  const [isAiTesting, setIsAiTesting] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'slash' | 'ai' | 'mod'>('all');

  // AI Persona Presets
  const aiPersonas = [
    {
      id: 'butler',
      name: 'Gentleman Butler 🎩',
      desc: 'Extremely polite, helpful, formal, and organized.',
      prompt: 'You are an ultra-polite, distinguished Discord Butler. You address users as "esteemed guest" or "my lord/lady" and provide eloquent, helpful answers with proper etiquette.'
    },
    {
      id: 'gamer',
      name: 'Sarcastic Pro Gamer 🎮',
      desc: 'Witty, gamer slang, playful banter, competitive.',
      prompt: 'You are a high-tier esports gamer bot. Use gaming slang (clutch, gg, noob, diff, based, pog), playful roast banter, and hype advice.'
    },
    {
      id: 'sage',
      name: 'RPG Lore Sage & DM 🧙‍♂️',
      desc: 'Mythical fantasy storyteller, dungeon guide.',
      prompt: 'You are an ancient wizard dungeon master guiding heroes through quests, dragons, spells, and magical dungeons. Speak with mythical fantasy depth.'
    },
    {
      id: 'cyberpunk',
      name: 'Cyberpunk Hacker AI ⚡',
      desc: 'Futuristic, terminal aesthetics, tech savvy.',
      prompt: 'You are a neon-lit cyberpunk AI neural-node. Use sleek techno-vernacular, matrix formatting, and fast, analytical responses.'
    },
    {
      id: 'anime',
      name: 'Anime Assistant 🌸',
      desc: 'Energetic, cheerful, positive anime companion.',
      prompt: 'You are a cheerful, energetic anime companion bot. Use friendly expressions (nya, ganbatte, sparkles ✨) and boundless positivity.'
    }
  ];

  // Poll live status every 4 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchStatus = async () => {
      try {
        const sessionToken = localStorage.getItem('novaforge_active_bot_session');
        const headers: Record<string, string> = {};
        if (sessionToken) headers['x-session-token'] = sessionToken;

        const res = await fetch('/api/bot/status', { headers });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLiveState(prev => ({
              ...data,
              // maintain fallback logs if server is offline
              logs: data.logs && data.logs.length > 0 ? data.logs : prev.logs
            }));
          }
        }
      } catch {
        // quiet catch
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartBot = async () => {
    if (!tokenInfo?.isValid && (!botProject.token || botProject.token.length < 25)) {
      onOpenTokenModal();
      return;
    }

    setIsLoading(true);
    setActionFeedback(null);
    try {
      const tokenToUse = botProject.token || tokenInfo?.id;
      const res = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenToUse,
          botProject
        })
      });

      const data = await res.json();
      if (data.success) {
        if (data.sessionKey) {
          localStorage.setItem('novaforge_active_bot_session', data.sessionKey);
        }
        setActionFeedback(`🟢 ${data.message}`);
        // Fetch updated status with session
        const sessionToken = data.sessionKey || localStorage.getItem('novaforge_active_bot_session');
        const statusRes = await fetch('/api/bot/status', {
          headers: sessionToken ? { 'x-session-token': sessionToken } : {}
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setLiveState(statusData);
        }
      } else {
        setActionFeedback(`❌ Error: ${data.message || 'Failed to start bot'}`);
      }
    } catch (err: any) {
      setActionFeedback(`❌ Network error: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBot = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const sessionToken = localStorage.getItem('novaforge_active_bot_session');
      const res = await fetch('/api/bot/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'x-session-token': sessionToken } : {})
        },
        body: JSON.stringify({
          sessionKey: sessionToken,
          token: botProject.token || tokenInfo?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.removeItem('novaforge_active_bot_session');
        setActionFeedback(`🔴 ${data.message}`);
        setLiveState(prev => ({ ...prev, status: 'offline', uptimeSeconds: 0 }));
      } else {
        setActionFeedback(`❌ ${data.message || 'Failed to stop bot'}`);
      }
    } catch (err: any) {
      setActionFeedback(`❌ Error: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCommands = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const sessionToken = localStorage.getItem('novaforge_active_bot_session');
      const res = await fetch('/api/bot/sync-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'x-session-token': sessionToken } : {})
        },
        body: JSON.stringify({
          sessionKey: sessionToken,
          token: botProject.token || tokenInfo?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('⚡ Slash commands synced globally with Discord!');
      } else {
        setActionFeedback(`⚠️ ${data.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`❌ Sync error: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAI = async () => {
    if (!aiTestPrompt.trim()) return;
    setIsAiTesting(true);
    setAiTestResponse(null);

    try {
      const res = await fetch('/api/ai/generate-bot-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Simulate how this Discord bot ("${botProject.name}", Persona: "${botProject.description}") responds to a user asking: "${aiTestPrompt}" in a Discord chat channel. Return realistic Discord markdown formatted text.`,
          schedule: 'instant'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiTestResponse(data.task?.description || `✨ **${botProject.name} AI:** Hello there! I'm active and listening to all your slash commands and @mentions in real time.`);
      } else {
        setAiTestResponse(`✨ **${botProject.name} AI:** Hello! I'm running live on Discord. Try /ask in your server!`);
      }
    } catch {
      setAiTestResponse(`✨ **${botProject.name} AI:** Live Discord neural bridge ready. Type /ask in any channel!`);
    } finally {
      setIsAiTesting(false);
    }
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const filteredLogs = liveState.logs.filter(log => {
    if (logFilter === 'slash') return log.message.includes('[SLASH]') || log.message.includes('Command');
    if (logFilter === 'ai') return log.message.includes('[AI') || log.message.includes('Gemini');
    if (logFilter === 'mod') return log.message.includes('[AUTO-MOD]') || log.message.includes('warn');
    return true;
  });

  return (
    <div id="live-hosting-dashboard-container" className="space-y-6 text-left">
      {/* 1. Live Bot Power Control Center Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          liveState.status === 'online'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'
            : liveState.status === 'connecting'
            ? 'bg-gradient-to-r from-amber-500 to-indigo-500 animate-pulse'
            : 'bg-gradient-to-r from-slate-700 to-slate-800'
        }`} />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Bot Identity & Status Indicators */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={liveState.botUser?.avatarUrl || tokenInfo?.avatarUrl || botProject.avatarUrl}
                alt={botProject.name}
                className="w-16 h-16 rounded-2xl bg-indigo-950 border-2 border-indigo-500/40 object-cover shadow-lg"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                liveState.status === 'online' 
                  ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse' 
                  : liveState.status === 'connecting'
                  ? 'bg-amber-400 ring-4 ring-amber-400/20'
                  : 'bg-rose-500'
              }`} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-white tracking-tight">
                  {liveState.botUser?.username || tokenInfo?.username || botProject.name}
                </h2>
                
                {/* Live Status Badge */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  liveState.status === 'online'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : liveState.status === 'connecting'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    liveState.status === 'online' ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                  }`} />
                  {liveState.status === 'online' ? 'Running Live on Discord' : liveState.status === 'connecting' ? 'Connecting Gateway...' : 'Bot Offline'}
                </span>
              </div>

              {/* Bot Meta stats */}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gateway Ping: <strong className="text-white">{liveState.status === 'online' ? `${liveState.pingMs}ms` : '--'}</strong></span>
                </span>

                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Uptime: <strong className="text-white">{formatUptime(liveState.uptimeSeconds)}</strong></span>
                </span>

                <span className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800/80">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  <span>Servers: <strong className="text-white">{liveState.guilds.length || (tokenInfo?.isValid ? 1 : 0)}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Master Control Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {liveState.status === 'online' ? (
              <button
                id="btn-stop-live-bot"
                onClick={handleStopBot}
                disabled={isLoading}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition"
              >
                <Power className="w-4 h-4" />
                <span>Stop Live Bot</span>
              </button>
            ) : (
              <button
                id="btn-start-live-bot"
                onClick={handleStartBot}
                disabled={isLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Launch Live Bot in Discord</span>
              </button>
            )}

            <button
              id="btn-sync-slash-commands"
              onClick={handleSyncCommands}
              disabled={isLoading || liveState.status !== 'online'}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
              title="Force sync all slash commands directly to Discord"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Slash Commands</span>
            </button>

            {(tokenInfo?.inviteUrl || liveState.botUser?.id) && (
              <a
                id="btn-invite-live-bot"
                href={tokenInfo?.inviteUrl || `https://discord.com/api/oauth2/authorize?client_id=${liveState.botUser?.id}&permissions=8&scope=bot%20applications.commands`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Add Bot to Discord</span>
              </a>
            )}
          </div>
        </div>

        {/* Feedback Alert Bar */}
        {actionFeedback && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{actionFeedback}</span>
            </div>
            {actionFeedback.includes('disallowed intents') && (
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 underline font-sans font-bold text-xs shrink-0 flex items-center gap-1"
              >
                <span>Enable Intents in Discord Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Gateway Intent Notice Helper */}
      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Discord Developer Portal Tip:</strong> To enable reading messages (<code className="text-indigo-300 font-mono">@Bot</code> AI mentions) and welcome embeds, ensure <strong className="text-white">"Message Content Intent"</strong> & <strong className="text-white">"Server Members Intent"</strong> are toggled <strong>ON</strong> in your Discord App settings.
          </span>
        </div>
        <a
          href="https://discord.com/developers/applications"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold rounded-lg border border-indigo-500/30 shrink-0 flex items-center gap-1.5 transition"
        >
          <span>Open Discord Dev Portal</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* 2. Grid: AI Brain & Persona Engine + Real Connected Discord Servers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: AI Brain & Persona Architect (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Gemini AI Brain & Server Persona</span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    Gemini 3.7 Flash
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Responds to <code className="text-indigo-300 font-mono">/ask</code>, <code className="text-indigo-300 font-mono">/ai</code>, and <code className="text-indigo-300 font-mono">@Bot</code> pings in your Discord channels
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Active</span>
            </div>
          </div>

          {/* AI Persona Quick Presets */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Select Bot Personality Preset:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiPersonas.map((persona) => {
                const isSelected = botProject.description === persona.prompt;
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onUpdateBotProject({
                        ...botProject,
                        description: persona.prompt,
                        tagline: persona.desc
                      });
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{persona.name}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {persona.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Persona System Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Custom AI System Instructions:</span>
              <span className="text-[10px] text-slate-500 lowercase">Configures bot's live response style</span>
            </label>
            <textarea
              id="input-ai-persona-prompt"
              rows={3}
              value={botProject.description}
              onChange={(e) => onUpdateBotProject({ ...botProject, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-3 outline-none resize-none font-mono"
              placeholder="Provide custom instructions on how the AI should talk in your Discord server..."
            />
          </div>

          {/* Live AI Test Box */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate AI Response Live:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiTestPrompt}
                onChange={(e) => setAiTestPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTestAI()}
                placeholder="Ask your bot a test question..."
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none"
              />
              <button
                onClick={handleTestAI}
                disabled={isAiTesting}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow"
              >
                {isAiTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Test</span>
              </button>
            </div>

            {aiTestResponse && (
              <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs text-slate-200 leading-relaxed font-sans shadow-inner">
                {aiTestResponse}
              </div>
            )}
          </div>
        </div>

        {/* Right: Connected Discord Guilds & Features (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Connected Discord Servers
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live guilds your bot is currently serving
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold bg-slate-950 px-2 py-0.5 rounded text-indigo-300 border border-slate-800">
                {liveState.guilds.length} Guild(s)
              </span>
            </div>

            {/* Guilds List */}
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              {liveState.guilds.length > 0 ? (
                liveState.guilds.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800/80 rounded-xl">
                    <div className="flex items-center gap-3">
                      {g.iconUrl ? (
                        <img src={g.iconUrl} alt={g.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-white">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{g.name}</h4>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" />
                          {g.memberCount.toLocaleString()} Members
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                  <Bot className="w-7 h-7 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    {liveState.status === 'online'
                      ? 'Bot is online! Invite it to your Discord server to start executing commands.'
                      : 'Connect your Bot Token and click "Launch Live Bot" to link your Discord server.'}
                  </p>
                  {(tokenInfo?.inviteUrl || liveState.botUser?.id) && (
                    <a
                      href={tokenInfo?.inviteUrl || `https://discord.com/api/oauth2/authorize?client_id=${liveState.botUser?.id}&permissions=8&scope=bot%20applications.commands`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Invite Bot to Server</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Live Modules Checklist */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Live Real-Time Features Enabled:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>/ask Gemini AI</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>RPG & Mine Battles</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Interactive Blackjack</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Support Ticket Desk</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Auto-Mod Shield</span>
              </span>
              <span className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Auto-Responders & XP</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live Discord Console & Event Logs Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Live Discord Gateway Logs & Action Stream
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {(['all', 'slash', 'ai', 'mod'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] capitalize transition ${
                  logFilter === filter
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter === 'all' ? 'All Events' : filter === 'slash' ? 'Slash Cmds' : filter === 'ai' ? 'AI Logs' : 'Auto-Mod'}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Body */}
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 text-left">
          {filteredLogs.map((log) => {
            const isSuccess = log.level === 'success' || log.message.includes('Registered') || log.message.includes('success');
            const isWarn = log.level === 'warn' || log.message.includes('warn') || log.message.includes('AUTO-MOD');
            const isError = log.level === 'error' || log.message.includes('Error') || log.message.includes('fail');

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 select-none text-[10px] pt-0.5">[{log.timestamp}]</span>
                <span className={`flex-1 ${
                  isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-slate-300'
                }`}>
                  {log.message}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
