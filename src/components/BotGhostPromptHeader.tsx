import React from 'react';
import { Bot, Sparkles, Key, ExternalLink, Dices, Layers, Shield, Plus } from 'lucide-react';
import { BotProject, BotTokenInfo } from '../types';

interface BotGhostPromptHeaderProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenTokenModal: () => void;
  onOpenIdeasModal: () => void;
  tokenInfo: BotTokenInfo | null;
  botProject: BotProject;
  onAddChip: (chip: string) => void;
}

export const BotGhostPromptHeader: React.FC<BotGhostPromptHeaderProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  onOpenTokenModal,
  onOpenIdeasModal,
  tokenInfo,
  botProject,
  onAddChip
}) => {
  const quickChips = [
    { label: '+ RPG & Dungeons', value: 'with RPG dungeon fights, /mine, weapons, and leveling' },
    { label: '+ Economy & Shop', value: 'with server economy, /daily coins, /work, and virtual shop items' },
    { label: '+ Support Tickets', value: 'with interactive [Create Ticket] buttons, private channels, and staff logs' },
    { label: '+ Auto-Moderation', value: 'with anti-spam, anti-invite filters, warning strikes, and /warn' },
    { label: '+ Leveling & XP', value: 'with /rank card, XP per message, and automatic role rewards' },
    { label: '+ Captcha Verification', value: 'with welcome embeds and [✅ Verify Member] button' },
  ];

  return (
    <div id="bot-prompt-header-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden text-left">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Bot Identity & Token Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={tokenInfo?.avatarUrl || botProject.avatarUrl}
              alt={botProject.name}
              className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/30 object-cover shadow-inner"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {tokenInfo?.username || botProject.name}
              </h2>
              <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <Bot className="w-2.5 h-2.5" />
                BOT
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {tokenInfo?.discriminator && tokenInfo.discriminator !== '0' ? `#${tokenInfo.discriminator}` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">
              {botProject.tagline}
            </p>
          </div>
        </div>

        {/* Action Badges */}
        <div className="flex items-center gap-2">
          {tokenInfo?.isValid ? (
            <button
              id="btn-connected-token"
              onClick={onOpenTokenModal}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Token Connected</span>
            </button>
          ) : (
            <button
              id="btn-connect-token"
              onClick={onOpenTokenModal}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Enter Bot Token (Free)</span>
            </button>
          )}

          {tokenInfo?.inviteUrl && (
            <a
              id="link-invite-bot"
              href={tokenInfo.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-medium flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Invite to Discord</span>
            </a>
          )}
        </div>
      </div>

      {/* Main AI Prompt Box */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Bot Creator & Feature Prompt</span>
          </label>
          <button
            id="btn-infinite-ideas-roulette"
            onClick={onOpenIdeasModal}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Infinite Ideas & Roulette</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            id="input-ai-bot-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe any bot you want... (e.g. 'Build an RPG bot with /mine, /dungeon bosses, loot inventory, economy shop, ticket support desk, and level up badges')"
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 outline-none resize-none transition"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />

          <div className="absolute right-2 bottom-2.5 flex items-center gap-2">
            <button
              id="btn-generate-ai-bot"
              onClick={onGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Bot (Free)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feature Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-500 font-medium whitespace-nowrap text-[11px] mr-1">Quick Add:</span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => onAddChip(chip.value)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-950 hover:text-indigo-300 hover:border-indigo-500/40 text-slate-300 border border-slate-700/60 text-[11px] font-medium transition flex items-center gap-1"
            >
              <Plus className="w-2.5 h-2.5 text-indigo-400" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
