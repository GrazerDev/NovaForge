import React, { useState } from 'react';
import { X, CheckCircle, Shield, GitBranch, Play, Flame, ExternalLink, HelpCircle, Copy, RefreshCw, PlusCircle } from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  const [guideTab, setGuideTab] = useState<'existing' | 'new'>('existing');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const existingRepoCommands = `# Option A: If you downloaded the ZIP and want to overwrite your local folder
# 1. Unzip the project files into your existing repo directory
# 2. Open terminal in that directory and run:
git add .
git commit -m "refactor: rewrite project with latest NovaForge code"
git push origin main

# Option B: If starting fresh locally and want to FORCE OVERWRITE the remote repo
git init
git add .
git commit -m "refactor: rewrite project with latest NovaForge code"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_EXISTING_REPO.git
git push -u origin main --force`;

  const newRepoCommands = `git init
git add .
git commit -m "feat: initial scheduled bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git push -u origin main`;

  const stepsExisting = [
    {
      step: '1',
      title: 'Download Project ZIP from Settings/Export',
      description: 'Export this app as a ZIP file from the AI Studio top menu (or download the source bundle) and extract the files into your local computer.',
    },
    {
      step: '2',
      title: 'Overwrite Files & Force Push to Existing GitHub Repo',
      description: 'If you want to replace all old code in your existing repository with this new build, use the terminal commands below to overwrite the branch cleanly:',
      code: existingRepoCommands,
      codeId: 'existing_commands'
    },
    {
      step: '3',
      title: 'Configure Secrets (Optional / Actions)',
      description: 'If your bot or automation runs on GitHub Actions, update your environment secrets under Repository Settings > Secrets and variables > Actions.',
      notes: [
        'DISCORD_WEBHOOK_URL or DISCORD_BOT_TOKEN for scheduled jobs.',
        'Existing repository history will be updated with the fresh codebase.'
      ]
    }
  ];

  const stepsNew = [
    {
      step: '1',
      title: 'Create a Private GitHub Repository',
      description: 'Create a new repository on GitHub and select "Private". This keeps your source code confidential and gives you free GitHub Actions runner minutes.',
      code: newRepoCommands,
      codeId: 'new_commands'
    },
    {
      step: '2',
      title: 'Protect Your Work & Manage Access',
      description: 'Since your repository is Private, only you have access. Make sure not to invite unverified collaborators under Settings > Collaborators.',
      notes: [
        'Private repository: Nobody on GitHub can view, clone, or edit your code without your explicit invite.',
        'Encrypted Secrets: Your Discord Webhook URLs, Bot Tokens, and API Keys are encrypted by GitHub and never exposed in logs.'
      ]
    },
    {
      step: '3',
      title: 'Add Your Discord Secrets to GitHub',
      description: 'In your repository on GitHub, navigate to Settings > Secrets and variables > Actions > New repository secret.',
      notes: [
        'DISCORD_WEBHOOK_URL: Webhook link from Discord Server Settings > Integrations.',
        'DISCORD_BOT_TOKEN: Bot token from discord.com/developers/applications.',
        'DISCORD_CHANNEL_ID: Target Discord channel ID.'
      ]
    },
    {
      step: '4',
      title: 'Run First Test in the "Actions" Tab',
      description: 'Navigate to the Actions tab on GitHub. Select your workflow, click "Run workflow" to execute immediately.',
      notes: [
        'Runner initializes in ~5-10 seconds.',
        'View live execution logs directly on GitHub.',
        'Check Discord for incoming events!'
      ]
    }
  ];

  const currentSteps = guideTab === 'existing' ? stepsExisting : stepsNew;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="github-guide-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-left relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">GitHub Deployment & Push Guide</h3>
            <p className="text-xs text-slate-400">
              How to push to an existing repo to overwrite it, or setup a new repository.
            </p>
          </div>
        </div>

        {/* Tab Switcher: Existing vs New */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setGuideTab('existing')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              guideTab === 'existing'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Overwrite Existing Repo</span>
          </button>

          <button
            onClick={() => setGuideTab('new')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
              guideTab === 'new'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Repo</span>
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-4 pt-1">
          {currentSteps.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8.5">{item.description}</p>

              {item.code && (
                <div className="pl-8.5 relative group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Terminal Commands</span>
                    <button
                      onClick={() => item.codeId && handleCopy(item.code, item.codeId)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-600/10 px-2 py-1 rounded-md"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode === item.codeId ? 'Copied!' : 'Copy Commands'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] p-3 rounded-xl overflow-x-auto leading-relaxed">
                    {item.code}
                  </pre>
                </div>
              )}

              {item.notes && (
                <ul className="pl-8.5 space-y-1 text-xs text-slate-300">
                  {item.notes.map((n, nIdx) => (
                    <li key={nIdx} className="flex items-start gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Tip: Use <code className="text-indigo-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">git push origin main --force</code> to overwrite remote conflicts.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-indigo-600/20"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
