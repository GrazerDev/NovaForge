import React, { useState } from 'react';
import { DiscordMessagePayload, LiveTestResult } from '../types';
import { Send, CheckCircle2, AlertTriangle, Zap, Lock, Terminal, Shield, RefreshCw } from 'lucide-react';

interface LiveDiscordTesterProps {
  payload: DiscordMessagePayload;
}

export const LiveDiscordTester: React.FC<LiveDiscordTesterProps> = ({ payload }) => {
  const [mode, setMode] = useState<'webhook' | 'bot_rest'>('webhook');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [botToken, setBotToken] = useState('');
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LiveTestResult | null>(null);

  const handleSendTest = async () => {
    setIsLoading(true);
    const start = Date.now();

    try {
      if (mode === 'webhook') {
        if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
          setLastResult({
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'webhook',
            success: false,
            message: 'Please provide a valid Discord Webhook URL starting with https://discord.com/api/webhooks/',
            durationMs: 0
          });
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/discord/test-webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl, payload })
        });

        const data = await res.json();
        const durationMs = Date.now() - start;

        setLastResult({
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'webhook',
          success: data.success,
          status: data.status,
          message: data.message || data.error || 'Failed to deliver webhook',
          details: data.details || data.response,
          durationMs
        });
      } else {
        // Bot REST API
        if (!botToken || !channelId) {
          setLastResult({
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            type: 'bot_rest',
            success: false,
            message: 'Both Bot Token and Channel ID are required for Discord REST testing.',
            durationMs: 0
          });
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/discord/test-bot-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken, channelId, payload })
        });

        const data = await res.json();
        const durationMs = Date.now() - start;

        setLastResult({
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          type: 'bot_rest',
          success: data.success,
          status: data.status,
          message: data.message || data.error || 'Failed to deliver message via Discord REST',
          details: data.details || data.data,
          durationMs
        });
      }
    } catch (err: any) {
      setLastResult({
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        type: mode,
        success: false,
        message: err.message || 'Network error communicating with Discord API',
        durationMs: Date.now() - start
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="live-tester-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Live Discord API Test Bench</h3>
            <p className="text-xs text-slate-400">Dispatch live test payloads straight to your Discord channel to verify formatting.</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="test-mode-webhook"
            onClick={() => setMode('webhook')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              mode === 'webhook'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Discord Webhook (Instant)
          </button>
          <button
            id="test-mode-bot-rest"
            onClick={() => setMode('bot_rest')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              mode === 'bot_rest'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bot Token + REST API
          </button>
        </div>
      </div>

      {/* Input Fields */}
      {mode === 'webhook' ? (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Discord Webhook URL:
          </label>
          <div className="flex gap-2">
            <input
              id="input-discord-webhook-url"
              type="password"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/123456789/abcdefgh..."
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3.5 py-2.5 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              id="btn-dispatch-test-webhook"
              onClick={handleSendTest}
              disabled={isLoading || !webhookUrl}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Webhook</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            🔒 Tested securely via server proxy. Your credentials are never stored or logged.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Discord Bot Token:
              </label>
              <input
                id="input-discord-bot-token"
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="MTAxMjM0... (from Discord Dev Portal)"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Target Channel ID:
              </label>
              <input
                id="input-discord-channel-id"
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="112233445566778899"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <button
            id="btn-dispatch-test-bot"
            onClick={handleSendTest}
            disabled={isLoading || !botToken || !channelId}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Sending via Discord REST...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send via Bot Client REST</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Response Panel */}
      {lastResult && (
        <div
          id="live-test-result-box"
          className={`p-3.5 rounded-lg border text-xs space-y-2 ${
            lastResult.success
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between font-semibold">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {lastResult.success ? 'Delivered to Discord Successfully' : 'Delivery Failed'}
              </span>
            </div>
            <div className="text-[11px] opacity-75 font-mono">
              {lastResult.status ? `HTTP ${lastResult.status}` : ''} • {lastResult.durationMs}ms
            </div>
          </div>

          <p className="text-slate-300">{lastResult.message}</p>

          {lastResult.details && (
            <pre className="bg-slate-950/80 p-2 rounded text-[11px] font-mono text-slate-400 overflow-x-auto max-h-32">
              {typeof lastResult.details === 'string'
                ? lastResult.details
                : JSON.stringify(lastResult.details, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
