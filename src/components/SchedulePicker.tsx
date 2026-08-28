import React, { useState } from 'react';
import { CRON_PRESETS, explainCron, getSimulatedNextRuns } from '../utils/cronHelper';
import { Clock, Sparkles, Calendar, AlertCircle, Info, ChevronRight, Check } from 'lucide-react';

interface SchedulePickerProps {
  currentCron: string;
  onChangeCron: (newCron: string) => void;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({ currentCron, onChangeCron }) => {
  const [customInput, setCustomInput] = useState(currentCron);
  const [activeCategory, setActiveCategory] = useState<'all' | 'frequent' | 'hourly' | 'daily' | 'weekly'>('all');

  const filteredPresets = activeCategory === 'all'
    ? CRON_PRESETS
    : CRON_PRESETS.filter(p => p.category === activeCategory);

  const humanExplanation = explainCron(currentCron);
  const nextRuns = getSimulatedNextRuns(currentCron);

  const handleCustomApply = () => {
    if (customInput.trim().split(/\s+/).length === 5) {
      onChangeCron(customInput.trim());
    }
  };

  return (
    <div id="schedule-picker-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Workflow Cron & Interval Scheduler</h3>
            <p className="text-xs text-slate-400">Configures when GitHub Actions triggers your automated bot runner.</p>
          </div>
        </div>

        {/* Current Active Badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-lg">
          <span className="text-xs font-mono text-indigo-400 font-bold">{currentCron}</span>
          <span className="text-[11px] text-slate-400">UTC</span>
        </div>
      </div>

      {/* Preset Category Filter */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {(['all', 'frequent', 'hourly', 'daily', 'weekly'] as const).map((cat) => (
          <button
            key={cat}
            id={`filter-cron-${cat}`}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-md capitalize transition font-medium ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {filteredPresets.map((preset) => {
          const isSelected = currentCron === preset.expression;
          return (
            <button
              key={preset.expression}
              id={`preset-${preset.expression.replace(/[^a-zA-Z0-9]/g, '_')}`}
              onClick={() => {
                setCustomInput(preset.expression);
                onChangeCron(preset.expression);
              }}
              className={`text-left p-3 rounded-lg border transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40'
                  : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200">{preset.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">{preset.description}</p>
              <div className="mt-2 text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded self-start">
                cron: '{preset.expression}'
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Cron Input & Helper */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span>Custom Cron Expression (UTC):</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              id="input-custom-cron"
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. 0 9 * * *"
              className="bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500 w-44"
            />
            <button
              id="btn-apply-cron"
              onClick={handleCustomApply}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition shrink-0"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Human Readable Explanation */}
        <div className="flex items-start gap-2 bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded text-xs text-indigo-200">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-indigo-300">Schedule Translation: </span>
            <span>{humanExplanation}</span>
          </div>
        </div>

        {/* Next Run Forecast */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Simulated Upcoming Executions:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {nextRuns.slice(0, 4).map((run, i) => (
              <div
                key={i}
                className="text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1.5"
              >
                <span className="text-slate-500">#{i + 1}</span>
                <span>{run}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Actions Cron Nuance Notice */}
        <div className="flex items-center gap-2 text-[11px] text-amber-300/80 bg-amber-950/20 border border-amber-500/20 p-2 rounded">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>GitHub Actions note:</strong> Cron execution runs on GitHub shared runners. Scheduled jobs may occasionally queue 1–3 minutes after the exact minute mark during peak traffic.
          </span>
        </div>
      </div>
    </div>
  );
};
