import React, { useState } from 'react';
import { X, Dices, Sparkles, ArrowRight, Sword, Coins, Ticket, ShieldAlert, Award, UserCheck, Gamepad2, Radio } from 'lucide-react';
import { BOT_IDEA_LIBRARY } from '../utils/botGeneratorEngine';
import { IdeaPrompt } from '../types';

interface IdeasRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Sword: <Sword className="w-4 h-4 text-purple-400" />,
  Coins: <Coins className="w-4 h-4 text-amber-400" />,
  Ticket: <Ticket className="w-4 h-4 text-blue-400" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4 text-red-400" />,
  Award: <Award className="w-4 h-4 text-emerald-400" />,
  UserCheck: <UserCheck className="w-4 h-4 text-teal-400" />,
  Gamepad2: <Gamepad2 className="w-4 h-4 text-pink-400" />,
  Radio: <Radio className="w-4 h-4 text-indigo-400" />,
  Sparkles: <Sparkles className="w-4 h-4 text-yellow-400" />,
};

export const IdeasRouletteModal: React.FC<IdeasRouletteModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSpinning, setIsSpinning] = useState(false);

  if (!isOpen) return null;

  const categories = ['All', 'RPG', 'Economy', 'Tickets', 'Moderation', 'Leveling', 'Community', 'AI & Fun'];

  const filtered = selectedCategory === 'All'
    ? BOT_IDEA_LIBRARY
    : BOT_IDEA_LIBRARY.filter(i => i.category === selectedCategory);

  const handleRouletteSpin = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const random = BOT_IDEA_LIBRARY[Math.floor(Math.random() * BOT_IDEA_LIBRARY.length)];
      setIsSpinning(false);
      onSelectPrompt(random.prompt);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Dices className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Infinite Bot Ideas & Concept Roulette</h3>
              <p className="text-xs text-slate-400">Free blueprints and prompts. Pick any concept or spin the randomizer!</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter & Roulette Button */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            id="btn-spin-roulette"
            onClick={handleRouletteSpin}
            disabled={isSpinning}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition disabled:opacity-50"
          >
            <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Spinning Idea Roulette...' : 'Surprise Me (Random Idea)'}</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectPrompt(item.prompt);
                onClose();
              }}
              className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/80 transition cursor-pointer group flex flex-col justify-between space-y-2.5 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                      {iconMap[item.icon] || <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition">
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {item.prompt}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-indigo-400 font-semibold group-hover:translate-x-0.5 transition">
                <span>Use this Prompt Blueprint</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
