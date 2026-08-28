import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database, CheckCircle2, UserCheck, EyeOff, FileText, ArrowRight } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'privacy' | 'rules'>('architecture');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /users/{userId}/bots/{botId} {
      allow read, write: if isOwner(userId);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;
    copyToClipboard(rules);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">NovaForge Trust & Security Architecture</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  VERIFIED SAFE
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero plain-text leaks • Cloud Firestore multi-tenant isolation • HTTPS / TLS 1.3</p>
            </div>
          </div>
          <button
            id="btn-close-security-modal"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security Guarantees</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Data Privacy & Ownership</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Enforced Database Rules</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>In-Memory Token Isolation</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Discord bot tokens are passed securely to memory runners and are never written to public logs, analytics, or shared with third parties.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Database className="w-4 h-4" />
                    <span>Cryptographic User Isolation</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Each user's bot configurations are stored in an isolated Firebase Firestore collection secured by Google Auth tokens (`request.auth.uid == userId`).
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                    <Server className="w-4 h-4" />
                    <span>SSRF & Webhook Protection</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Internal proxies strictly whitelist authorized Discord API endpoints (`discord.com/api/webhooks/`), preventing malicious server probing.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <EyeOff className="w-4 h-4" />
                    <span>Zero Admin Credential Exposure</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Root service keys and environment variables are strictly ignored from source control (`.gitignore`) and never exposed in client bundles.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3.5 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-emerald-300 text-xs">Certified Secure Environment</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    NovaForge meets modern cloud web application security standards. Your Discord bots run in sandboxed Docker containers isolated from other tenants.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  You Retain 100% Ownership of Your Bots
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  All custom code, flows, slash commands, embed templates, and casino games created inside NovaForge belong exclusively to you. You can export the entire source code or deploy it to your own GitHub at any time with zero lock-in.
                </p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Zero Third-Party Data Selling
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  We do not monetize your data, track Discord message content, or sell user information. Google Sign-In is used purely to authenticate your identity and link your saved bot projects.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Active Firestore Security Policy:</span>
                <button
                  onClick={handleCopyRules}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium flex items-center gap-1 transition"
                >
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                  <span>{copied ? 'Copied' : 'Copy Rules'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /users/{userId}/bots/{botId} {
      allow read, write: if isOwner(userId);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`}
              </pre>
              <p className="text-[10px] text-slate-500">
                Enforced on production database: <code className="text-slate-400">ai-studio-remixnovaforge-b094419c-3949-4927-b345-5d4debf42dc3</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            NovaForge Security • Cloud Platform
          </span>
          <button
            id="btn-understand-security"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition text-xs shadow-md shadow-emerald-600/20"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
