import React, { useState } from 'react';
import { 
  Sparkles, 
  Dices, 
  Wand2, 
  Code2, 
  Terminal, 
  Check, 
  Copy, 
  Zap, 
  Bot, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  ArrowRight,
  RefreshCw,
  Coins,
  Sword,
  Ticket,
  ShieldAlert,
  Award,
  Gamepad2,
  Radio,
  Download
} from 'lucide-react';
import { BotProject, IdeaPrompt } from '../types';
import { BOT_IDEA_LIBRARY, generateBotFromPrompt } from '../utils/botGeneratorEngine';

interface AIBuildingViewProps {
  botProject: BotProject;
  token?: string;
  onApplyBotProject: (generated: BotProject) => void;
  onNavigateToDash: () => void;
}

const CATEGORIES = ['All', 'RPG', 'Economy', 'Tickets', 'Moderation', 'Leveling', 'AI & Fun', 'Music', 'Full-Suite'];

const QUICK_TAGS = [
  '+ Blackjack & Casino',
  '+ Mine Caverns & Bosses',
  '+ Support Ticket Desk',
  '+ Anti-Spam Sentinel',
  '+ Leveling Rank Cards',
  '+ Welcome Captcha Gate',
  '+ Hi-Fi Music Streamer',
  '+ Custom Embed Theme'
];

export const AIBuildingView: React.FC<AIBuildingViewProps> = ({
  botProject,
  token,
  onApplyBotProject,
  onNavigateToDash,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'discordjs' | 'python'>('discordjs');
  const [previewProject, setPreviewProject] = useState<BotProject>(botProject);

  const handleGenerate = () => {
    const text = promptInput.trim() || 'Create a full server bot with /daily, /mine RPG, /ticket support, and /warn moderation';
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateBotFromPrompt(text, token);
      setPreviewProject(generated);
      setIsGenerating(false);
    }, 400);
  };

  const handleSelectTemplate = (template: IdeaPrompt) => {
    setPromptInput(template.prompt);
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateBotFromPrompt(template.prompt, token);
      setPreviewProject(generated);
      setIsGenerating(false);
    }, 350);
  };

  const handleApplyToActiveBot = () => {
    onApplyBotProject(previewProject);
    onNavigateToDash();
  };

  const handleCopyCode = () => {
    const code = activeCodeTab === 'discordjs' ? previewProject.scriptCode : generatePythonCode(previewProject);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const generatePythonCode = (p: BotProject) => {
    return `# ====================================================================
# ${p.name} — Discord Bot (discord.py v2.0)
# ${p.tagline}
# ⚡ Built with NovaForge by Grazer
# ====================================================================

import os
import discord
from discord import app_commands
from discord.ext import commands

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix="/", intents=intents)

@bot.event
async def on_ready():
    print(f"🤖 Logged in as {bot.user}!")
    await bot.change_presence(activity=discord.Game(name="/help | Built with NovaForge by Grazer"))
    try:
        synced = await bot.tree.sync()
        print(f"✅ Synced {len(synced)} slash commands")
    except Exception as e:
        print(f"Error syncing commands: {e}")

${(p.commands || []).map(cmd => `
@bot.tree.command(name="${cmd.name}", description="${cmd.description.replace(/"/g, '\\"')}")
async def ${cmd.name}_command(interaction: discord.Interaction):
    embed = discord.Embed(
        title="${cmd.previewEmbed?.title || `⚡ /${cmd.name}`}",
        description="${cmd.previewEmbed?.description?.replace(/\n/g, '\\n') || 'Command executed successfully!'}",
        color=${cmd.previewEmbed?.color || 0x5865F2}
    )
    embed.set_footer(text="⚡ Built with NovaForge by Grazer")
    await interaction.response.send_message(embed=embed)
`).join('')}

if __name__ == "__main__":
    bot.run(os.getenv("DISCORD_BOT_TOKEN", "${token || 'YOUR_DISCORD_BOT_TOKEN'}"))
`;
  };

  const filteredTemplates = selectedCategory === 'All'
    ? BOT_IDEA_LIBRARY
    : BOT_IDEA_LIBRARY.filter(t => t.category === selectedCategory);

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto">
      {/* Top Prompt Builder Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Creator Attribution */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>ForgeAI Engine • Zero API Required • by Grazer</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">100% Free & Unlimited</span>
        </div>

        <div className="space-y-2 mb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Describe Your Dream Bot in Natural Language
          </h2>
          <p className="text-xs text-slate-400">
            Type any theme, system, RPG features, casino games, ticket rules, or auto-mod requirements. Our engine compiles the full bot architecture instantly.
          </p>
        </div>

        {/* Prompt Input Box */}
        <div className="relative">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. Build an anime RPG bot with /summon gacha heroes, /dungeon raid bosses, /mine ores, /daily coins, high-roller blackjack casino, and a support ticket desk..."
            rows={3}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_TAGS.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptInput(prev => prev ? `${prev} ${tag}` : tag)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Synthesize Button */}
            <button
              id="btn-ai-synthesize"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-amber-300" />}
              <span>{isGenerating ? 'Synthesizing Bot...' : 'Synthesize Bot Now (Zero API)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates / Idea Presets Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Dices className="w-4 h-4 text-purple-400" />
            <span>Instant Idea Archetypes & Templates</span>
          </h3>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer space-y-2 group shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                  {template.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  {template.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {template.prompt}
              </p>
              <div className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 pt-1">
                <span>Load Template</span>
                <ArrowRight className="w-3 h-3 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Bot Blueprint & Code Sandbox */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{previewProject.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  READY TO DEPLOY
                </span>
              </div>
              <p className="text-xs text-slate-400">{previewProject.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-deploy-active-bot"
              type="button"
              onClick={handleApplyToActiveBot}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Deploy to Active Bot (Go to Dash)</span>
            </button>
          </div>
        </div>

        {/* Slash Commands Pill Catalog */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Synthesized Slash Commands ({previewProject?.commands?.length || 0})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {(previewProject?.commands || []).map(cmd => (
              <div key={cmd.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-left">
                <div className="text-xs font-mono font-bold text-cyan-400">/{cmd.name}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{cmd.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Code Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Full Production Source Code</span>
              <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800 ml-2">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('discordjs')}
                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition ${
                    activeCodeTab === 'discordjs' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Discord.js v14
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition ${
                    activeCodeTab === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                  }`}
                >
                  discord.py
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72 overflow-y-auto">
            <pre>{activeCodeTab === 'discordjs' ? previewProject.scriptCode : generatePythonCode(previewProject)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
