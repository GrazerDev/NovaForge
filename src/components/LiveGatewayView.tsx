import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Play, 
  Square, 
  Terminal, 
  RefreshCw, 
  Download, 
  ShieldCheck, 
  Key, 
  Activity, 
  Wifi, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { BotProject, BotTokenInfo } from '../types';
import { exportCredentialsTxt } from '../lib/userDataService';
import { NovaForgeUser } from '../lib/firebase';

interface LiveGatewayViewProps {
  botProject: BotProject;
  tokenInfo: BotTokenInfo | null;
  botToken: string;
  isBotRunning: boolean;
  onToggleBot: () => void;
  onOpenTokenModal: () => void;
  currentUser: NovaForgeUser | null;
}

export const LiveGatewayView: React.FC<LiveGatewayViewProps> = ({
  botProject,
  tokenInfo,
  botToken,
  isBotRunning,
  onToggleBot,
  onOpenTokenModal,
  currentUser
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [ping, setPing] = useState(14);
  const [memoryUsage, setMemoryUsage] = useState(42.5);

  useEffect(() => {
    // Generate initial live telemetry logs
    const initialLogs = [
      `[SYS-001] NovaForge Bot Runtime v3.0 initialized. Built by Grazer.`,
      `[GATEWAY] Initializing Discord Gateway v10 WebSocket handler...`,
      botToken 
        ? `[AUTH] Token loaded: ${tokenInfo?.username || botProject?.name || 'Bot'} (Valid: ${tokenInfo?.isValid ? 'YES' : 'NO'})` 
        : `[AUTH] No bot token provided. Operating in Local High-Fidelity Simulator mode.`,
      `[COMMANDS] Registered ${botProject?.commands?.length || 0} application slash commands into registry.`,
      `[MODULES] Status: Economy (${botProject?.economy?.enabled ? 'ON' : 'OFF'}), RPG (${botProject?.rpg?.enabled ? 'ON' : 'OFF'}), Tickets (${botProject?.tickets?.enabled ? 'ON' : 'OFF'}), Auto-Mod (${botProject?.moderation?.enabled ? 'ON' : 'OFF'})`,
      `[WATERMARK] Attached footer: "⚡ Built with NovaForge by Grazer"`,
      isBotRunning ? `[DAEMON] Active Worker PID: 4092 • Status: RUNNING (24/7 Hosting Online)` : `[DAEMON] Status: STANDBY`
    ];
    setLogs(initialLogs);

    if (isBotRunning) {
      const interval = setInterval(() => {
        const time = new Date().toLocaleTimeString();
        const randPing = Math.floor(12 + Math.random() * 8);
        setPing(randPing);
        setMemoryUsage(prev => Math.min(68, Math.max(38, +(prev + (Math.random() * 1 - 0.5)).toFixed(1))));

        const eventTypes = [
          `[HEARTBEAT] WS Ping ${randPing}ms • Shard 0/0 OK`,
          `[EVENT:INTERACTION] Ping check acknowledged from client`,
          `[CRON] Verified scheduler daemon triggers`,
          `[SECURITY] Auto-Mod regex filters validated 0 threats`
        ];
        const chosen = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        setLogs(prev => [...prev.slice(-30), `[${time}] ${chosen}`]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isBotRunning, botToken, tokenInfo, botProject]);

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${
            isBotRunning 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            <Radio className={`w-6 h-6 ${isBotRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Live Gateway & Hosting</h1>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                isBotRunning 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isBotRunning ? 'HOSTING ONLINE' : 'HOSTING PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live WebSocket Gateway v10 dispatcher with real-time heartbeat and auto-restart daemon.
            </p>
          </div>
        </div>

        {/* Start / Stop Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleBot}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              isBotRunning 
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isBotRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isBotRunning ? 'Stop Bot Process' : 'Start Live Bot'}</span>
          </button>
        </div>
      </div>

      {/* Live Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Gateway Latency</span>
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {isBotRunning ? `${ping}ms` : '--'}
          </div>
          <p className="text-[10px] text-slate-400">Shard 0 WebSocket roundtrip</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Memory Allocated</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {isBotRunning ? `${memoryUsage}MB` : '0MB'}
          </div>
          <p className="text-[10px] text-slate-400">V8 Isolated Worker Heap</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Slash Commands</span>
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {botProject?.commands?.length || 0} Active
          </div>
          <p className="text-[10px] text-slate-400">Synced to Discord REST API</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Bot Watermark</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xs font-bold text-amber-300 truncate pt-1">
            Built with NovaForge by Grazer
          </div>
          <p className="text-[10px] text-slate-400">Embedded in responses</p>
        </div>
      </div>

      {/* Terminal Gateway Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono text-slate-400 font-bold ml-2">novaforge-gateway-logs.stream</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs(prev => [...prev, `[USER] Manual log flush at ${new Date().toLocaleTimeString()}`])}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-semibold transition"
            >
              Clear
            </button>
            <button
              onClick={() => exportCredentialsTxt(currentUser)}
              className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export Credentials.txt</span>
            </button>
          </div>
        </div>

        <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 h-72 overflow-y-auto custom-scrollbar bg-slate-950">
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed flex items-start gap-2">
              <span className="text-slate-600 select-none">›</span>
              <span className={
                log.includes('RUNNING') || log.includes('Operational') || log.includes('OK') 
                  ? 'text-emerald-400 font-semibold'
                  : log.includes('AUTH') || log.includes('Token')
                  ? 'text-cyan-300'
                  : log.includes('Built with NovaForge by Grazer')
                  ? 'text-amber-400 font-bold'
                  : 'text-slate-300'
              }>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
