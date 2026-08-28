import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  Lightbulb, 
  ShieldCheck, 
  Coins, 
  Gamepad2, 
  Ticket, 
  Palette, 
  Wand2, 
  X,
  Plus
} from 'lucide-react';
import { BotProject, AIAssistantMessage } from '../types';
import { applyAIAssistantCommand } from '../utils/botGeneratorEngine';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  botProject: BotProject;
  onUpdateBotProject: (project: BotProject) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  botProject,
  onUpdateBotProject
}) => {
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `👋 Greetings! I am **ForgeAI**, your dedicated Discord Bot Architect.\n\nI can help you build custom slash commands, design rich embeds, add interactive casino and RPG minigames, configure ticket desks, and harden your auto-moderation. What would you like to build or customize for **${botProject.name}**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Add Blackjack Casino 🃏', promptToApply: 'Add a /blackjack casino command with interactive hit and stand buttons and betting', actionType: 'add_command' },
        { label: 'Add Anti-Raid Shield 🛡️', promptToApply: 'Enable anti-raid lockdown defense and anti-spam filters', actionType: 'add_system' },
        { label: 'Build 4-Tier Ticket Desk 📩', promptToApply: 'Create a multi-category ticket desk with transcripts and staff claim buttons', actionType: 'add_system' },
        { label: 'Host Server Giveaway 🎉', promptToApply: 'Add a /giveaway command with reaction buttons and timer', actionType: 'add_command' }
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isThinking) return;

    const userMsg: AIAssistantMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    // Check if we have Gemini API or use our intelligent heuristic engine
    setTimeout(() => {
      try {
        const { updatedProject, responseText, actionSummary } = applyAIAssistantCommand(botProject, text);
        
        // Update the live studio project
        onUpdateBotProject(updatedProject);

        const aiMsg: AIAssistantMessage = {
          id: Math.random().toString(36).substring(2, 9),
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          appliedChangeSummary: actionSummary,
          suggestedActions: [
            { label: '🎨 Change Theme to Cyber Neon', promptToApply: 'Change embed color and rank card theme to cyber neon cyan', actionType: 'tweak_embed' },
            { label: '⚔️ Add Dungeon Floor 4 Boss', promptToApply: 'Add RPG dungeon floor 4 with ancient dragon raid boss', actionType: 'add_system' },
            { label: '🪙 Add /work & /crime minigames', promptToApply: 'Add /work and /crime economy commands', actionType: 'add_command' }
          ]
        };

        setMessages(prev => [...prev, aiMsg]);
      } catch (err: any) {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            sender: 'assistant',
            text: `I ran into an issue applying that change: ${err.message || 'Unknown error'}. Please try phrasing differently!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } finally {
        setIsThinking(false);
      }
    }, 600);
  };

  const handleApplySuggestion = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset-1',
        sender: 'assistant',
        text: `Conversation cleared. How can I assist you with **${botProject.name}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Add Blackjack Casino 🃏', promptToApply: 'Add a /blackjack casino command with interactive hit and stand buttons and betting', actionType: 'add_command' },
          { label: 'Add Anti-Raid Shield 🛡️', promptToApply: 'Enable anti-raid lockdown defense and anti-spam filters', actionType: 'add_system' }
        ]
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl flex flex-col text-left transition-all duration-300 animate-in slide-in-from-right">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">ForgeAI Architect</h3>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono">
                Co-Pilot
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Bot Creator & Modification Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-clear-ai-history"
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            id="btn-close-ai-panel"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Bot Badge */}
      <div className="px-4 py-2 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-500">Target Bot:</span>
          <span className="font-semibold text-white truncate max-w-[160px]">{botProject?.name || 'NovaForge Bot'}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {botProject?.commands?.length || 0} cmds
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Sync Active
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-indigo-300">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed font-normal">
                {msg.text}
              </div>

              {/* Action summary badge if modification was made */}
              {msg.appliedChangeSummary && (
                <div className="p-2 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-300 text-[11px] font-medium mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>{msg.appliedChangeSummary}</span>
                </div>
              )}

              {/* Quick Actions Suggestions */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50 space-y-1.5 mt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    <span>Instant Modifications:</span>
                  </span>
                  <div className="flex flex-col gap-1">
                    {msg.suggestedActions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleApplySuggestion(sug.promptToApply)}
                        className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-indigo-950 hover:text-indigo-200 text-slate-300 border border-slate-700/60 text-[11px] font-medium transition flex items-center justify-between group"
                      >
                        <span>{sug.label}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`text-[9px] text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'}`}>
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex-shrink-0 flex items-center justify-center text-indigo-300">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl rounded-tl-none p-3 text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-[11px] font-medium text-indigo-300">ForgeAI is architecting bot changes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2">
        {/* Quick Prompt Ideas Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          <button
            onClick={() => handleSendMessage('Add a /blackjack casino game with cards and betting')}
            className="whitespace-nowrap px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 rounded-md transition"
          >
            + /blackjack
          </button>
          <button
            onClick={() => handleSendMessage('Add /giveaway command with timer and prize')}
            className="whitespace-nowrap px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 rounded-md transition"
          >
            + /giveaway
          </button>
          <button
            onClick={() => handleSendMessage('Harden auto-moderation with anti-raid shield')}
            className="whitespace-nowrap px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 rounded-md transition"
          >
            + Anti-Raid
          </button>
          <button
            onClick={() => handleSendMessage('Change embed color to cyber neon cyan')}
            className="whitespace-nowrap px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 rounded-md transition"
          >
            + Neon Theme
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            id="input-ai-chat"
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask ForgeAI to build or tweak anything..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl pl-3.5 pr-10 py-2.5 text-xs placeholder:text-slate-500 outline-none transition"
          />
          <button
            id="btn-send-ai-chat"
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || isThinking}
            className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
