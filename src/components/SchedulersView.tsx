import React, { useState } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Send,
  Sparkles
} from 'lucide-react';
import { BotProject, ScheduledTask } from '../types';

interface SchedulersViewProps {
  botProject: BotProject;
  onUpdateBotProject: (updated: BotProject) => void;
}

export const SchedulersView: React.FC<SchedulersViewProps> = ({
  botProject,
  onUpdateBotProject
}) => {
  const schedulers = botProject.schedulers || [];
  const [testSentId, setTestSentId] = useState<string | null>(null);

  const handleToggleScheduler = (id: string) => {
    const updated = schedulers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    onUpdateBotProject({ ...botProject, schedulers: updated });
  };

  const handleDeleteScheduler = (id: string) => {
    const updated = schedulers.filter(s => s.id !== id);
    onUpdateBotProject({ ...botProject, schedulers: updated });
  };

  const handleAddScheduler = () => {
    const newTask: ScheduledTask = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Scheduled Announcement #${schedulers.length + 1}`,
      cron: '0 */6 * * *',
      cronHuman: 'Every 6 hours',
      targetChannel: 'announcements',
      messageText: '🌟 **Automated Server Pulse**: Check `/daily` and stay active for double rewards! ⚡ Built with NovaForge by Grazer',
      enabled: true
    };
    onUpdateBotProject({
      ...botProject,
      schedulers: [...schedulers, newTask]
    });
  };

  const handleTestTrigger = (id: string) => {
    setTestSentId(id);
    setTimeout(() => setTestSentId(null), 2500);
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Schedulers & Cron Tasks</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automate periodic announcements, server bump reminders, voice channel audits, and daily resets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddScheduler}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cron Task</span>
        </button>
      </div>

      {/* Schedulers List */}
      <div className="space-y-3">
        {schedulers.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
            <Clock className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No scheduled tasks yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the button above to add a cron task for daily tips, voting reminders, or automatic cleanups.
            </p>
            <button
              onClick={handleAddScheduler}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Create First Task
            </button>
          </div>
        ) : (
          schedulers.map((task) => (
            <div 
              key={task.id}
              className={`p-5 rounded-2xl border transition shadow-lg ${
                task.enabled 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700' 
                  : 'bg-slate-950/60 border-slate-900 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${task.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <h3 className="text-sm font-bold text-white">{task.name}</h3>
                  <code className="text-[11px] font-mono px-2 py-0.5 bg-slate-950 text-indigo-300 border border-indigo-500/30 rounded-lg">
                    {task.cron} ({task.cronHuman})
                  </code>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestTrigger(task.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Send test message to simulator"
                  >
                    {testSentId === task.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Dispatched</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Test Run</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleScheduler(task.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      task.enabled 
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {task.enabled ? 'Active' : 'Paused'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteScheduler(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-3 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-3 text-slate-400">
                  Target Channel: <strong className="text-slate-200">#{task.targetChannel}</strong>
                </div>
                <div className="sm:col-span-9 text-slate-300 font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-900 truncate">
                  {task.messageText}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
