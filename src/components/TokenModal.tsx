import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Copy, Check, Sparkles, Cloud, Lock } from 'lucide-react';
import { BotTokenInfo } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { NovaForgeUser } from '../lib/firebase';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  setToken: (t: string) => void;
  tokenInfo: BotTokenInfo | null;
  onValidateToken: (t: string) => Promise<void>;
  isValidating: boolean;
  currentUser?: NovaForgeUser | null;
  onOpenAuthModal?: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  token,
  setToken,
  tokenInfo,
  onValidateToken,
  isValidating,
  currentUser = null,
  onOpenAuthModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputToken, setInputToken] = useState(token);

  if (!isOpen) return null;

  const handleCopyInvite = async (url: string) => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setToken(inputToken.trim());
    await onValidateToken(inputToken.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-left flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Connect Your Discord Bot Token</h3>
              <p className="text-xs text-slate-400">Encrypted in-memory • Zero Leaks • Cloud Persistence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Cloud Auto-Save Status Banner */}
          {currentUser ? (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Signed in as <strong className="text-white">{currentUser.displayName || currentUser.email}</strong>. Your bot configuration & token are automatically saved to your private NovaForge vault.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Sign in to NovaForge to auto-save your bot token and projects forever so you never lose them.</span>
              </div>
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3 py-1.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition shrink-0 flex items-center gap-1.5 justify-center shadow-sm"
                >
                  <span>Sign In</span>
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Discord Bot Token
              </label>
              <div className="relative">
                <input
                  id="input-bot-token"
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="Paste your Discord Bot Token (e.g. MTIzNDU2Nzg5...)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 rounded-xl px-4 py-2.5 text-xs font-mono placeholder:text-slate-600 outline-none transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Protected with zero plain-text leaks
              </span>

              <button
                id="btn-verify-token-modal"
                type="submit"
                disabled={isValidating || !inputToken.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                {isValidating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Token...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Save</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Validation Result Box */}
          {tokenInfo && (
            <div className={`p-4 rounded-xl border text-xs ${
              tokenInfo.isValid 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-950/30 border-red-500/30 text-red-300'
            }`}>
              {tokenInfo.isValid ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={tokenInfo.avatarUrl}
                      alt={tokenInfo.username}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/40"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-sm">{tokenInfo.username}</span>
                        <span className="text-slate-400">#{tokenInfo.discriminator || '0'}</span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          ONLINE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">ID: {tokenInfo.id}</p>
                    </div>
                  </div>

                  {tokenInfo.inviteUrl && (
                    <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-300">Invite bot to your server:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyInvite(tokenInfo.inviteUrl!)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                        <a
                          href={tokenInfo.inviteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Authorize</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-red-200">Token Verification Failed</strong>
                    <p className="text-red-300/80">{tokenInfo.error || 'Please double check your token.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick 30-Second Guide */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>How to get your free Discord Bot Token (30 seconds):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed text-[11px]">
              <li>
                Open the official{' '}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                >
                  Discord Developer Portal <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Click <strong>New Application</strong> and give your bot a name.</li>
              <li>Click <strong>Bot</strong> on the left sidebar &gt; <strong>Reset Token</strong>.</li>
              <li>Enable <strong>Message Content Intent</strong> under Privileged Gateway Intents.</li>
              <li>Copy and paste your token above!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
