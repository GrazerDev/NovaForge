import React, { useState } from 'react';
import { CustomTaskState } from '../types';
import { Copy, Check, FileCode, Terminal, Package, Key, FileText, ShieldCheck } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface WorkflowInspectorProps {
  task: CustomTaskState;
  onUpdateCode?: (field: 'workflowYaml' | 'scriptCode' | 'manifestCode', newCode: string) => void;
}

export const WorkflowInspector: React.FC<WorkflowInspectorProps> = ({ task }) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'script' | 'manifest' | 'secrets' | 'readme'>('workflow');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <div id="workflow-inspector-card" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-left">
      {/* Top Action Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            id="tab-workflow-yaml"
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'workflow'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>.github/workflows/discord-bot.yml</span>
          </button>

          <button
            id="tab-script-code"
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'script'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{task.scriptFilename}</span>
          </button>

          <button
            id="tab-manifest-file"
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'manifest'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{task.manifestFilename}</span>
          </button>

          <button
            id="tab-secrets-guide"
            onClick={() => setActiveTab('secrets')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'secrets'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>GitHub Secrets ({task.requiredSecrets.length})</span>
          </button>

          <button
            id="tab-readme"
            onClick={() => setActiveTab('readme')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'readme'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Setup Steps</span>
          </button>
        </div>

        {/* Copy button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-copy-current-tab"
            onClick={() => {
              let content = '';
              if (activeTab === 'workflow') content = task.workflowYaml;
              else if (activeTab === 'script') content = task.scriptCode;
              else if (activeTab === 'manifest') content = task.manifestCode;
              else if (activeTab === 'secrets') content = task.requiredSecrets.join('\n');
              else if (activeTab === 'readme') content = task.workflowYaml;
              handleCopy(content, 'active-tab');
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            {copiedKey === 'active-tab' ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Current File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto min-h-[360px] max-h-[500px]">
        {activeTab === 'workflow' && (
          <pre className="leading-relaxed whitespace-pre font-mono select-all text-indigo-300">
            {task.workflowYaml}
          </pre>
        )}

        {activeTab === 'script' && (
          <pre className="leading-relaxed whitespace-pre font-mono select-all text-emerald-300">
            {task.scriptCode}
          </pre>
        )}

        {activeTab === 'manifest' && (
          <pre className="leading-relaxed whitespace-pre font-mono select-all text-amber-300">
            {task.manifestCode}
          </pre>
        )}

        {activeTab === 'secrets' && (
          <div className="space-y-4 font-sans text-slate-300 py-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Required GitHub Action Secrets</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add these variables to your GitHub repository under{' '}
              <strong className="text-slate-200">Settings &gt; Secrets and variables &gt; Actions</strong>.
              GitHub Actions encrypts them securely so nobody can view them.
            </p>

            <div className="space-y-2">
              {task.requiredSecrets.map((secret) => (
                <div
                  key={secret}
                  className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono text-indigo-300 font-bold text-xs">{secret}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {secret.includes('WEBHOOK') && 'Discord Channel Webhook URL (from Server Settings > Integrations)'}
                      {secret.includes('BOT_TOKEN') && 'Discord Bot Token (from Discord Developer Portal)'}
                      {secret.includes('CHANNEL_ID') && 'Target Discord Channel ID'}
                      {secret.includes('GEMINI') && 'Google Gemini API Key'}
                      {secret.includes('TARGET') && 'Comma-separated URLs to monitor'}
                      {secret.includes('GITHUB_TOKEN') && 'Automatically provided by GitHub (No manual secret required!)'}
                    </div>
                  </div>
                  <button
                    id={`btn-copy-secret-${secret}`}
                    onClick={() => handleCopy(secret, secret)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition flex items-center gap-1 shrink-0"
                  >
                    {copiedKey === secret ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy Name</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'readme' && (
          <div className="font-sans space-y-3 py-2 text-slate-300 text-xs leading-relaxed">
            <h4 className="text-base font-bold text-white mb-2">Setup in Your Private Repository</h4>
            <p>
              Your code and workflows run <strong>100% serverlessly</strong> in GitHub Actions runners.
            </p>
            <ol className="list-decimal list-inside space-y-2 pl-2 text-slate-400">
              <li>Create a new <strong>Private</strong> repository on GitHub.</li>
              <li>Create the workflow file at <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">.github/workflows/discord-bot.yml</code> and copy the code from the first tab.</li>
              <li>Create your script file (<code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">{task.scriptFilename}</code>) and copy the script code.</li>
              <li>Create <code className="text-indigo-400 bg-slate-900 px-1 py-0.5 rounded">{task.manifestFilename}</code> and copy the package/requirements manifest.</li>
              <li>Under repository <strong>Settings &gt; Secrets and variables &gt; Actions</strong>, add your secrets (e.g. <code className="text-emerald-400">DISCORD_WEBHOOK_URL</code>).</li>
              <li>Go to the <strong>Actions</strong> tab and click "Run workflow" to test anytime!</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
