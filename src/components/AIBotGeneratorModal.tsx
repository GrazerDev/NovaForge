import React, { useState } from 'react';
import { BotLanguage, CustomTaskState } from '../types';
import { Sparkles, X, Loader2, ArrowRight, Check, Bot } from 'lucide-react';

interface AIBotGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTask: (newTask: CustomTaskState) => void;
}

export const AIBotGeneratorModal: React.FC<AIBotGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyTask,
}) => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<BotLanguage>('javascript');
  const [schedule, setSchedule] = useState('0 9 * * *');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-bot-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language, schedule })
      });

      const data = await res.json();
      if (!data.success || !data.task) {
        throw new Error(data.error || 'Failed to generate task code');
      }

      const generated = data.task;
      const customTask: CustomTaskState = {
        title: generated.taskTitle || 'Custom AI Discord Bot',
        cron: generated.cron || schedule,
        language: language,
        workflowYaml: generated.workflowYaml || '',
        scriptFilename: language === 'python' ? 'main.py' : 'index.js',
        scriptCode: generated.scriptCode || '',
        manifestFilename: language === 'python' ? 'requirements.txt' : 'package.json',
        manifestCode: typeof generated.packageJson === 'object' 
          ? JSON.stringify(generated.packageJson, null, 2) 
          : generated.packageJson || generated.requirementsTxt || '{\n  "name": "custom-bot"\n}',
        requiredSecrets: generated.secretsRequired || ['DISCORD_WEBHOOK_URL'],
        payload: {
          username: generated.taskTitle || 'AI Automated Bot',
          avatar_url: 'https://cdn.discordapp.com/embed/avatars/4.png',
          embeds: generated.embedPreview ? [generated.embedPreview] : [
            {
              title: generated.taskTitle || 'Automated Report',
              description: generated.description || 'Task executed successfully via GitHub Actions.',
              color: 0x5865F2,
              timestamp: new Date().toISOString()
            }
          ]
        }
      };

      onApplyTask(customTask);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while generating your bot with Gemini AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Monitor top posts on Hacker News & Reddit every 2 hours and send top 3 to Discord',
    'Track Bitcoin and Ethereum price changes every 15 minutes and alert Discord on >3% shifts',
    'Summarize our team GitHub repo pull requests and issues every morning at 9am UTC',
    'Discord birthday reminder bot that checks a JSON config and sends wishes on member birthdays'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="ai-generator-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-left relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Custom Bot Task Architect</h3>
            <p className="text-xs text-slate-400">
              Powered by <strong className="text-indigo-300">Gemini 3.7 Flash</strong> — describe your automation in plain words.
            </p>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-200">
            What automated task should your GitHub-hosted bot perform?
          </label>
          <textarea
            id="input-ai-bot-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Scrape the latest NASA Astronomy Picture of the Day and send the image and explanation embed to Discord every day at 10am UTC..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
          />
        </div>

        {/* Sample Prompt Chips */}
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Ideas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(p)}
                className="text-[11px] bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Language & Schedule Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Programming Runtime:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as BotLanguage)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="javascript">Node.js (JavaScript / Fetch)</option>
              <option value="typescript">Node.js (TypeScript)</option>
              <option value="python">Python 3 (requests / discord.py)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Initial Schedule (Cron):
            </label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="0 9 * * *">Daily at 09:00 UTC</option>
              <option value="*/15 * * * *">Every 15 Minutes</option>
              <option value="0 * * * *">Hourly on the hour</option>
              <option value="0 17 * * 5">Weekly on Friday at 17:00 UTC</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            id="btn-generate-ai-task"
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing Workflow & Bot Script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Bot & Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
