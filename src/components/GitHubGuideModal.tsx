import React from 'react';
import { X, CheckCircle, Shield, GitBranch, Play, Flame, ExternalLink, HelpCircle } from 'lucide-react';

interface GitHubGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubGuideModal: React.FC<GitHubGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: '1',
      title: 'Create a Private GitHub Repository',
      description: 'Create a new repository on GitHub and select "Private". This keeps your source code confidential and prevents unauthorized users from viewing or modifying your work. (GitHub includes 2,000 free runner minutes per month for private repositories).',
      code: 'git init\ngit add .\ngit commit -m "feat: initial scheduled bot"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USER/YOUR_REPO.git\ngit push -u origin main'
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
        'DISCORD_WEBHOOK_URL: Paste the webhook link created in Discord Server Settings > Integrations.',
        'DISCORD_BOT_TOKEN: If using a Bot token client (from discord.com/developers/applications).',
        'DISCORD_CHANNEL_ID: The numeric ID of your target Discord text channel.'
      ]
    },
    {
      step: '4',
      title: 'Run First Test in the "Actions" Tab',
      description: 'Navigate to the Actions tab in your repository. Click your workflow on the left sidebar, click "Run workflow" dropdown, and click "Run workflow" to execute immediately.',
      notes: [
        'Watch the runner start in ~5-10 seconds.',
        'View live execution logs directly on GitHub.',
        'Check your Discord channel for the incoming automated message!'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="github-guide-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-left relative max-h-[90vh] overflow-y-auto"
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
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">GitHub Actions Discord Hosting Guide</h3>
            <p className="text-xs text-slate-400">
              Step-by-step instructions for hosting and running your scheduled bot serverlessly.
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4 pt-2">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
                <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pl-8.5">{item.description}</p>

              {item.code && (
                <div className="pl-8.5">
                  <pre className="bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] p-2.5 rounded-lg overflow-x-auto">
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
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition"
          >
            Got It, Let's Build!
          </button>
        </div>
      </div>
    </div>
  );
};
