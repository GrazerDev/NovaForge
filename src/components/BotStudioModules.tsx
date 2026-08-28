import React, { useState } from 'react';
import { 
  Bot, 
  Terminal, 
  Coins, 
  Ticket, 
  ShieldAlert, 
  Sparkles, 
  UserCheck, 
  Award, 
  FileCode, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink,
  Code2,
  Play,
  Layers,
  ChevronRight,
  Palette,
  MousePointerClick,
  Sliders,
  Sword,
  Clock,
  Music,
  Radio,
  Gamepad2,
  HelpCircle,
  FolderTree,
  Eye,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  BotProject, 
  SlashCommandConfig, 
  AutoResponderRule, 
  ActionBlock, 
  CommandOption, 
  ShopItem, 
  DungeonFloor,
  TicketCategory,
  DiscordButtonComponent
} from '../types';
import { uid } from '../utils/botGeneratorEngine';
import { copyToClipboard } from '../utils/clipboard';

interface BotStudioModulesProps {
  botProject: BotProject;
  onUpdateBotProject: (updated: BotProject) => void;
  onOpenAIAssistant?: () => void;
}

export const BotStudioModules: React.FC<BotStudioModulesProps> = ({
  botProject,
  onUpdateBotProject,
  onOpenAIAssistant
}) => {
  type StudioTab = 
    | 'commands' 
    | 'flow_pipeline' 
    | 'embed_studio' 
    | 'components' 
    | 'economy' 
    | 'rpg' 
    | 'tickets' 
    | 'moderation' 
    | 'leveling' 
    | 'welcome' 
    | 'music' 
    | 'schedulers' 
    | 'code';

  const [activeTab, setActiveTab] = useState<StudioTab>('commands');
  const commandsList = botProject?.commands || [];
  const [selectedCommandId, setSelectedCommandId] = useState<string>(commandsList[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedCodeFile, setSelectedCodeFile] = useState<'index.js' | 'package.json' | '.env' | 'workflow.yml'>('index.js');

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const selectedCommand = commandsList.find(c => c.id === selectedCommandId) || commandsList[0];

  const handleToggleCommand = (cmdId: string) => {
    const updated = {
      ...botProject,
      commands: commandsList.map(c => c.id === cmdId ? { ...c, enabled: !c.enabled } : c)
    };
    onUpdateBotProject(updated);
  };

  const handleAddCommand = () => {
    const newId = uid();
    const newCmd: SlashCommandConfig = {
      id: newId,
      name: 'custom' + (commandsList.length + 1),
      description: 'Custom interactive slash command',
      category: 'general',
      options: [],
      enabled: true,
      actions: [
        {
          id: uid(),
          type: 'reply_embed',
          config: {
            embedTitle: '⚡ Custom Action Executed',
            embedDescription: 'This command response was configured in the NovaForge Visual Studio.',
            embedColor: 0x6366F1
          }
        }
      ],
      previewEmbed: {
        title: '⚡ Custom Action Executed',
        description: 'This command response was configured in the NovaForge Visual Studio.',
        color: 0x6366F1,
        fields: [{ name: 'Status', value: '🟢 Operational', inline: true }]
      },
      buttonComponents: [
        { id: uid(), label: 'Action Button', style: 'primary', emoji: '✨', actionType: 'reply_embed' }
      ]
    };

    const updated = {
      ...botProject,
      commands: [...commandsList, newCmd]
    };
    onUpdateBotProject(updated);
    setSelectedCommandId(newId);
  };

  const handleDeleteCommand = (cmdId: string) => {
    if (commandsList.length <= 1) return;
    const remaining = commandsList.filter(c => c.id !== cmdId);
    onUpdateBotProject({ ...botProject, commands: remaining });
    if (selectedCommandId === cmdId) {
      setSelectedCommandId(remaining[0]?.id || '');
    }
  };

  const handleAddActionBlock = () => {
    if (!selectedCommand) return;
    const newBlock: ActionBlock = {
      id: uid(),
      type: 'reply_embed',
      config: {
        embedTitle: 'New Action Step',
        embedDescription: 'Configured step in pipeline sequence.'
      }
    };
    const updatedCommands = commandsList.map(c => {
      if (c.id === selectedCommand.id) {
        return { ...c, actions: [...(c.actions || []), newBlock] };
      }
      return c;
    });
    onUpdateBotProject({ ...botProject, commands: updatedCommands });
  };

  const handleAddOptionToCommand = () => {
    if (!selectedCommand) return;
    const newOpt: CommandOption = {
      name: 'option' + ((selectedCommand.options?.length || 0) + 1),
      description: 'Parameter description',
      type: 'STRING',
      required: false
    };
    const updatedCommands = commandsList.map(c => {
      if (c.id === selectedCommand.id) {
        return { ...c, options: [...(c.options || []), newOpt] };
      }
      return c;
    });
    onUpdateBotProject({ ...botProject, commands: updatedCommands });
  };

  const handleAddShopItem = () => {
    const newItem: ShopItem = {
      id: uid(),
      name: 'Enchanted Crystal Crown',
      price: 1500,
      description: 'Grants +25% bonus stats in server events.',
      emoji: '👑',
      type: 'badge'
    };
    onUpdateBotProject({
      ...botProject,
      economy: {
        ...botProject.economy,
        shopItems: [...(botProject.economy.shopItems || []), newItem]
      }
    });
  };

  const handleAddDungeonFloor = () => {
    const nextFloor = (botProject.rpg?.dungeonFloors?.length || 0) + 1;
    const newFloor: DungeonFloor = {
      floor: nextFloor,
      name: `Floor ${nextFloor}: Abyssal Rift`,
      bossName: `Abyssal Titan Leviathan`,
      bossHp: nextFloor * 500,
      bossEmoji: '👾',
      minLevel: nextFloor * 5,
      rewardXp: nextFloor * 300,
      rewardCoins: nextFloor * 750,
      lootDrop: 'Abyssal Trident [Relic]'
    };
    onUpdateBotProject({
      ...botProject,
      rpg: {
        ...botProject.rpg,
        dungeonFloors: [...(botProject.rpg?.dungeonFloors || []), newFloor]
      }
    });
  };

  const tabsConfig = [
    { id: 'commands' as StudioTab, label: 'Slash Commands', icon: Terminal, count: commandsList.length },
    { id: 'flow_pipeline' as StudioTab, label: 'Action Flows', icon: Layers, badge: 'Nodes' },
    { id: 'embed_studio' as StudioTab, label: 'Embed Studio', icon: Palette, badge: 'Live' },
    { id: 'components' as StudioTab, label: 'Buttons & Modals', icon: MousePointerClick },
    { id: 'economy' as StudioTab, label: 'Economy & Casino', icon: Coins, enabled: botProject?.economy?.enabled },
    { id: 'rpg' as StudioTab, label: 'RPG Dungeons', icon: Sword, enabled: botProject?.rpg?.enabled },
    { id: 'tickets' as StudioTab, label: 'Ticket Desk', icon: Ticket, enabled: botProject?.tickets?.enabled },
    { id: 'moderation' as StudioTab, label: 'Aegis Auto-Mod', icon: ShieldAlert, enabled: botProject?.moderation?.enabled },
    { id: 'leveling' as StudioTab, label: 'Astral Leveling', icon: Award, enabled: botProject?.leveling?.enabled },
    { id: 'welcome' as StudioTab, label: 'Welcome & Gate', icon: UserCheck, enabled: botProject?.welcome?.enabled },
    { id: 'music' as StudioTab, label: 'Music Streamer', icon: Radio, enabled: botProject?.music?.enabled },
    { id: 'schedulers' as StudioTab, label: 'Cron Tasks', icon: Clock, count: botProject?.schedulers?.length },
    { id: 'code' as StudioTab, label: 'VS Code Inspector', icon: FileCode, badge: 'd.js v14' },
  ];

  return (
    <div id="bot-studio-ide" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left">
      {/* IDE Top Toolbar */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            novaforge://project/{botProject.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAIAssistant && (
            <button
              onClick={onOpenAIAssistant}
              className="px-2.5 py-1 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ask ForgeAI to Modify</span>
            </button>
          )}

          <button
            onClick={() => handleCopy(botProject.scriptCode, 'all_code')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
          >
            {copiedKey === 'all_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'all_code' ? 'Copied All Code' : 'Copy Discord.js Code'}</span>
          </button>
        </div>
      </div>

      {/* Visual Studio Module Tabs Navigation */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-3 flex items-center gap-1 overflow-x-auto no-scrollbar py-1.5">
        {tabsConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels Content */}
      <div className="p-4 sm:p-6 min-h-[480px]">
        {/* ================= TAB 1: SLASH COMMANDS STUDIO ================= */}
        {activeTab === 'commands' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Command List Sidebar */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Configured Commands ({commandsList.length})</span>
                </span>
                <button
                  onClick={handleAddCommand}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Command</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
                {commandsList.map((cmd) => {
                  const isSelected = cmd.id === selectedCommandId;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => setSelectedCommandId(cmd.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/50 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-indigo-400 font-bold text-xs">/{cmd.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded capitalize">
                          {cmd.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleCommand(cmd.id)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            cmd.enabled ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {cmd.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        {commandsList.length > 1 && (
                          <button
                            onClick={() => handleDeleteCommand(cmd.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Command Inspector & Configuration */}
            {selectedCommand && (
              <div className="lg:col-span-8 space-y-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-white font-mono bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-xl text-indigo-300">
                      /{selectedCommand.name}
                    </span>
                    <span className="text-xs text-slate-400">{selectedCommand.description}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">ID: {selectedCommand.id}</span>
                </div>

                {/* Option Parameters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Command Options & Parameters ({selectedCommand.options?.length || 0})
                    </label>
                    <button
                      onClick={handleAddOptionToCommand}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Parameter</span>
                    </button>
                  </div>

                  {(!selectedCommand.options || selectedCommand.options.length === 0) ? (
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-500 text-center">
                      No parameters required (Runs directly on <code>/{selectedCommand.name}</code>)
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCommand.options.map((opt, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-indigo-300 font-semibold">{opt.name}</span>
                            <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono">
                              {opt.type}
                            </span>
                            {opt.required && (
                              <span className="text-red-400 text-[10px] font-bold">Required</span>
                            )}
                          </div>
                          <span className="text-slate-400 text-[11px] truncate max-w-[200px]">{opt.description}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Embed Preview Card */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Command Embed Response</span>
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 bottom-0 w-1.5"
                      style={{ backgroundColor: '#' + (selectedCommand.previewEmbed.color?.toString(16).padStart(6, '0') || '5865f2') }}
                    />
                    <div className="pl-2 space-y-1.5">
                      <h4 className="text-sm font-bold text-white">{selectedCommand.previewEmbed.title}</h4>
                      <p className="text-xs text-slate-300 whitespace-pre-line">{selectedCommand.previewEmbed.description}</p>
                      
                      {selectedCommand.previewEmbed.fields && selectedCommand.previewEmbed.fields.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {selectedCommand.previewEmbed.fields.map((f, fIdx) => (
                            <div key={fIdx} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                              <div className="text-[11px] font-bold text-slate-400">{f.name}</div>
                              <div className="text-xs text-slate-200 whitespace-pre-line">{f.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedCommand.previewEmbed.footer && (
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                          {selectedCommand.previewEmbed.footer.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: VISUAL ACTION PIPELINE ================= */}
        {activeTab === 'flow_pipeline' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Visual Action Pipeline: /{selectedCommand?.name || 'help'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Node sequence that executes whenever a member triggers this command in Discord.
                </p>
              </div>

              <button
                onClick={handleAddActionBlock}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Action Node</span>
              </button>
            </div>

            {/* Pipeline Flowchart Nodes */}
            <div className="space-y-3">
              {/* Trigger Node */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  <Zap className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Trigger Event</span>
                  <h4 className="text-xs font-bold text-white">Slash Command Input: /{selectedCommand?.name}</h4>
                </div>
              </div>

              <div className="flex justify-center my-1 text-slate-600">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>

              {/* Action Blocks */}
              {selectedCommand?.actions?.map((action, aIdx) => (
                <React.Fragment key={action.id || aIdx}>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                        #{aIdx + 1}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-purple-400 font-bold">
                          Action: {action.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">
                          {action.config?.embedTitle || action.config?.message || `Execute ${action.type}`}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-md font-mono">
                      Sequential Block
                    </span>
                  </div>

                  {aIdx < selectedCommand.actions.length - 1 && (
                    <div className="flex justify-center my-1 text-slate-600">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: RICH EMBED STUDIO ================= */}
        {activeTab === 'embed_studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Embed Color & Aesthetics</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure your server bot's global embed sidebar hex color and branding preset.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[
                  { name: 'Discord Blurple', hex: '#5865F2' },
                  { name: 'Cyber Neon Cyan', hex: '#06B6D4' },
                  { name: 'Emerald Forge', hex: '#10B981' },
                  { name: 'Imperial Purple', hex: '#8B5CF6' },
                  { name: 'Solar Gold', hex: '#F59E0B' },
                  { name: 'Ruby Sentinel', hex: '#EF4444' },
                  { name: 'Obsidian Slate', hex: '#64748B' },
                  { name: 'Rose Quartz', hex: '#EC4899' },
                ].map((colorPreset, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => {
                      const decimal = parseInt(colorPreset.hex.replace('#', ''), 16);
                      const updatedCommands = commandsList.map(cmd => ({
                        ...cmd,
                        previewEmbed: { ...cmd.previewEmbed, color: decimal }
                      }));
                      onUpdateBotProject({
                        ...botProject,
                        themeColor: colorPreset.hex,
                        commands: updatedCommands
                      });
                    }}
                    className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 flex items-center gap-2 transition"
                  >
                    <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: colorPreset.hex }} />
                    <span className="text-xs font-medium text-slate-300 truncate">{colorPreset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Live Embed Preview</span>
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: botProject.themeColor || '#5865f2' }}
                />
                <div className="pl-3 space-y-2">
                  <h4 className="text-sm font-bold text-white">{botProject.name} Live Card</h4>
                  <p className="text-xs text-slate-300">
                    This demonstrates how embeds posted by your bot appear to players on Discord Desktop, Mobile, and Web clients.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 font-medium">Theme HEX</span>
                      <div className="font-mono text-indigo-300">{botProject.themeColor || '#5865F2'}</div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 font-medium">Auto-Formatting</span>
                      <div className="text-emerald-400 font-semibold">Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: COMPONENTS (BUTTONS & MODALS) ================= */}
        {activeTab === 'components' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-purple-400" />
              <span>Interactive Discord Components</span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive Discord Action Rows with clickable buttons, dropdown select menus, and modal dialog forms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {[
                { label: 'Claim Daily 🪙', style: 'bg-emerald-600 hover:bg-emerald-500 text-white', type: 'Success Button' },
                { label: 'Mine Ores ⛏️', style: 'bg-indigo-600 hover:bg-indigo-500 text-white', type: 'Primary Button' },
                { label: 'Support Ticket 📩', style: 'bg-slate-800 hover:bg-slate-700 text-slate-200', type: 'Secondary Button' },
                { label: 'Close Ticket 🔒', style: 'bg-red-600 hover:bg-red-500 text-white', type: 'Danger Button' },
              ].map((btn, bIdx) => (
                <div key={bIdx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-mono text-slate-500">{btn.type}</span>
                  <button className={`w-full py-2 px-3 rounded-lg text-xs font-bold shadow-md transition ${btn.style}`}>
                    {btn.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: ECONOMY & CASINO ================= */}
        {activeTab === 'economy' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Virtual Economy & High-Roller Casino</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage currency, daily payouts, work shifts, gambling games, and virtual marketplace items.
                </p>
              </div>

              <button
                onClick={handleAddShopItem}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Shop Item</span>
              </button>
            </div>

            {/* Shop Catalog */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {botProject.economy.shopItems?.map((item) => (
                <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">{item.price} 🪙</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <p className="text-[11px] text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: RPG DUNGEONS ================= */}
        {activeTab === 'rpg' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sword className="w-4 h-4 text-purple-400" />
                  <span>RPG Dungeon Floors & Raid Bosses</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Progression floors, boss HP pools, legendary weapon drops, and combat EXP multipliers.
                </p>
              </div>

              <button
                onClick={handleAddDungeonFloor}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dungeon Floor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {botProject.rpg?.dungeonFloors?.map((floor) => (
                <div key={floor.floor} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400">Floor {floor.floor}</span>
                    <span className="text-lg">{floor.bossEmoji}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{floor.bossName}</h4>
                  <div className="space-y-1 text-[11px] text-slate-400 font-mono">
                    <div>❤️ Boss HP: <span className="text-red-400">{floor.bossHp} HP</span></div>
                    <div>🎁 Loot: <span className="text-amber-300">{floor.lootDrop}</span></div>
                    <div>⭐ Rewards: <span className="text-purple-300">+{floor.rewardXp} XP</span> / <span className="text-amber-400">+{floor.rewardCoins} 🪙</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: TICKETS ================= */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-400" />
              <span>Multi-Category Support Ticket Desk</span>
            </h3>
            <p className="text-xs text-slate-400">
              Department ticket routing, private channel creation, auto-transcripts, and staff claim roles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {botProject.tickets.categories?.map((cat) => (
                <div key={cat.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.emoji}</span>
                    <h4 className="text-xs font-bold text-white">{cat.label}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">{cat.welcomeMessage}</p>
                  <div className="text-[10px] text-blue-300 font-mono">Pings: @{cat.roleToPing}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 8: MODERATION ================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Aegis Auto-Mod & Security Sentinel</span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated anti-spam, anti-invite, raid defense, warning strikes, and moderation logs.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {[
                { title: 'Anti-Raid Shield', status: botProject.moderation.antiRaid ? 'Active' : 'Off', desc: 'Auto-lockdowns on join raids' },
                { title: 'Anti-Invite Filter', status: botProject.moderation.antiLink ? 'Active' : 'Off', desc: 'Blocks discord.gg links' },
                { title: 'Anti-Spam & Caps', status: botProject.moderation.antiSpam ? 'Active' : 'Off', desc: 'Mutes repetitive messages' },
                { title: 'Warning Strikes', status: `${botProject.moderation.maxWarnings} Max Strikes`, desc: 'Auto-timeouts on strike 3' },
              ].map((rule, rIdx) => (
                <div key={rIdx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 9: LEVELING ================= */}
        {activeTab === 'leveling' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Astral Leveling & XP Progression</span>
            </h3>
            <p className="text-xs text-slate-400">
              Chat and voice XP rates, rank card themes, and automated level unlock roles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {botProject.leveling.rolesRewards?.map((reward, rewIdx) => (
                <div key={rewIdx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">Level {reward.level}</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white">@{reward.roleName}</h4>
                  <p className="text-[11px] text-slate-400">Automatically awarded on level up.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 10: WELCOME & GATE ================= */}
        {activeTab === 'welcome' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Welcome & Verification Gate</span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated greeting cards, captcha button gates, and auto-roles for newly joined members.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">#welcome-desk Announcement Card</h4>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">Auto-Role: @Member</span>
              </div>
              <p className="text-xs text-slate-300">{botProject.welcome.messageText}</p>
            </div>
          </div>
        )}

        {/* ================= TAB 11: MUSIC ================= */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-pink-400" />
              <span>Hi-Fi Audio & Music Streamer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Voice channel streaming, queue manager, volume limits, and interactive player controls.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">VibeStation Music Engine</h4>
                  <p className="text-[11px] text-slate-400">Default Volume: 80% • Bass Boost: Enabled</p>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400">Ready</span>
            </div>
          </div>
        )}

        {/* ================= TAB 12: CRON SCHEDULERS ================= */}
        {activeTab === 'schedulers' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Automated Cron Schedulers ({botProject.schedulers?.length || 0})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Recurring automated announcements, bump reminders, and server stats updates.
            </p>

            <div className="space-y-2.5">
              {botProject.schedulers?.map((task) => (
                <div key={task.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white">{task.name}</h4>
                    <p className="text-[11px] text-slate-400">{task.messageText}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {task.cron}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{task.cronHuman}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 13: VS CODE INSPECTOR ================= */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                {(['index.js', 'package.json', '.env', 'workflow.yml'] as const).map((file) => (
                  <button
                    key={file}
                    onClick={() => setSelectedCodeFile(file)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                      selectedCodeFile === file
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {file}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  let text = botProject.scriptCode;
                  if (selectedCodeFile === 'package.json') text = botProject.packageJson;
                  if (selectedCodeFile === '.env') text = `DISCORD_BOT_TOKEN=${botProject.token || 'your_bot_token_here'}\nDISCORD_CLIENT_ID=${botProject.clientId || '123456789012345678'}`;
                  if (selectedCodeFile === 'workflow.yml') text = botProject.workflowYaml;
                  handleCopy(text, selectedCodeFile);
                }}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
              >
                {copiedKey === selectedCodeFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === selectedCodeFile ? 'Copied' : `Copy ${selectedCodeFile}`}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] no-scrollbar">
              <pre>
                {selectedCodeFile === 'index.js' && botProject.scriptCode}
                {selectedCodeFile === 'package.json' && botProject.packageJson}
                {selectedCodeFile === '.env' && `DISCORD_BOT_TOKEN=${botProject.token || 'your_discord_bot_token_here'}\nDISCORD_CLIENT_ID=${botProject.clientId || '123456789012345678'}`}
                {selectedCodeFile === 'workflow.yml' && botProject.workflowYaml}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
