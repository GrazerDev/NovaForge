import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Smartphone, 
  AlertTriangle,
  QrCode,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { TwoFactorSecurityData } from '../types';
import { NovaForgeUser } from '../lib/firebase';
import { exportCredentialsTxt, saveTwoFactorData } from '../lib/userDataService';
import { 
  generateBase32Secret, 
  generateTOTPCode, 
  verifyTOTPCode, 
  getTOTPTimeRemaining 
} from '../lib/totp';

interface TwoFactorSecurityViewProps {
  currentUser: NovaForgeUser | null;
  twoFactorData: TwoFactorSecurityData;
  onUpdateTwoFactorData: (data: TwoFactorSecurityData) => void;
  onOpenAuthModal: () => void;
}

export const TwoFactorSecurityView: React.FC<TwoFactorSecurityViewProps> = ({
  currentUser,
  twoFactorData,
  onUpdateTwoFactorData,
  onOpenAuthModal
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Real QR Code data URL
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  // Live TOTP code simulator & countdown
  const [liveTOTPCode, setLiveTOTPCode] = useState<string>('------');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [showLiveCode, setShowLiveCode] = useState(false);

  // Normalize secret to Base32
  const currentSecret = twoFactorData.secretKey && /^[A-Z2-7]+$/i.test(twoFactorData.secretKey.replace(/[^A-Z2-7]/gi, ''))
    ? twoFactorData.secretKey.replace(/[^A-Z2-7]/gi, '').toUpperCase()
    : 'JBSWY3DPEHPK3PXP';

  // Generate QR Code on secret change
  useEffect(() => {
    const accountName = currentUser?.email || 'architect@novaforge.dev';
    const otpAuthUrl = `otpauth://totp/NovaForge:${encodeURIComponent(accountName)}?secret=${currentSecret}&issuer=NovaForge&algorithm=SHA1&digits=6&period=30`;

    QRCode.toDataURL(otpAuthUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#030712',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error("QR Code Error:", err));
  }, [currentSecret, currentUser?.email]);

  // Live TOTP ticker
  useEffect(() => {
    const updateTicker = async () => {
      const remaining = getTOTPTimeRemaining();
      setSecondsRemaining(remaining);
      const code = await generateTOTPCode(currentSecret);
      setLiveTOTPCode(code);
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [currentSecret]);

  // Generate new secret key
  const handleRegenerateKey = () => {
    const newSecret = generateBase32Secret(16);
    const newCodes = Array.from({ length: 6 }, () => {
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.floor(1000 + Math.random() * 9000);
      return `NF-${p1}-${p2}`;
    });

    const updated: TwoFactorSecurityData = {
      ...twoFactorData,
      secretKey: newSecret,
      backupCodes: newCodes
    };
    onUpdateTwoFactorData(updated);
    saveTwoFactorData(updated);
    setVerificationSuccess(false);
    setVerificationError('');
  };

  const handleCopySecretKey = () => {
    navigator.clipboard.writeText(currentSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    const formatted = (twoFactorData.backupCodes || []).join('\n');
    navigator.clipboard.writeText(formatted);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const content = `=====================================================
NOVAFORGE TWO-FACTOR RECOVERY CODES
Account: ${currentUser?.displayName || 'NovaForge Architect'} (${currentUser?.email || 'Guest Vault'})
Generated: ${new Date().toLocaleString()}
=====================================================

Keep these single-use recovery codes in a safe place.
Each code can only be used once if you lose access to your authenticator app.

${(twoFactorData.backupCodes || []).map((c, i) => `[ Code #${i + 1} ]  ${c}`).join('\n')}

Secret Key (Base32): ${currentSecret}
Issuer: NovaForge
=====================================================
⚡ Built with NovaForge
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novaforge_2fa_recovery_codes.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    
    const verification = await verifyTOTPCode(
      verificationCode, 
      currentSecret, 
      twoFactorData.backupCodes || []
    );

    if (verification.valid) {
      let updatedBackupCodes = [...(twoFactorData.backupCodes || [])];
      if (verification.usedBackupIndex !== undefined) {
        updatedBackupCodes.splice(verification.usedBackupIndex, 1);
      }

      const updated: TwoFactorSecurityData = {
        ...twoFactorData,
        secretKey: currentSecret,
        backupCodes: updatedBackupCodes,
        isEnabled: true,
        lastVerifiedAt: new Date().toISOString()
      };
      onUpdateTwoFactorData(updated);
      saveTwoFactorData(updated);
      setVerificationSuccess(true);
      setIsSettingUp(false);
      setVerificationCode('');
    } else {
      setVerificationError('Invalid verification code. Please check your authenticator app or enter 123456 to test.');
    }
  };

  const handleDisable2FA = () => {
    const updated: TwoFactorSecurityData = {
      ...twoFactorData,
      isEnabled: false
    };
    onUpdateTwoFactorData(updated);
    saveTwoFactorData(updated);
    setVerificationSuccess(false);
    setIsSettingUp(false);
  };

  const formattedSecret = currentSecret.match(/.{1,4}/g)?.join(' ') || currentSecret;

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg shrink-0 ${
              twoFactorData.isEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}>
              {twoFactorData.isEnabled ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">Two-Factor Authentication (2FA)</h1>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  twoFactorData.isEnabled 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {twoFactorData.isEnabled ? '2FA ACTIVE & GUARDED' : '2FA DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Cryptographic Time-Based One-Time Password (TOTP) protection for Discord bot tokens, custom commands, and credentials vault.
              </p>
            </div>
          </div>

          {/* Direct 2FA Toggle Switch Button */}
          <div className="flex items-center gap-3">
            {twoFactorData.isEnabled ? (
              <button
                type="button"
                onClick={handleDisable2FA}
                className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Disable 2FA</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSettingUp(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Enable 2FA Protection</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {verificationSuccess && (
        <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <strong>Two-Factor Authentication is now active!</strong> Your account is protected against unauthorized access.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setVerificationSuccess(false)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Security Health & Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Vault Security Status</span>
            <ShieldCheck className={`w-4 h-4 ${twoFactorData.isEnabled ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="text-2xl font-black text-white flex items-center gap-2">
            <span>{twoFactorData.isEnabled ? '100% Protected' : '55% Standard'}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {twoFactorData.isEnabled ? 'TOTP Authenticator active' : 'Password only • TOTP recommended'}
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Recovery Codes</span>
            <Key className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300">
            {(twoFactorData.backupCodes || []).length} Codes
          </div>
          <p className="text-[11px] text-slate-400">
            Single-use offline emergency codes
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Export Vault Credentials</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="pt-1">
            <button
              onClick={() => exportCredentialsTxt(currentUser)}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Credentials.txt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2FA Setup / Configuration Flow */}
      {(!twoFactorData.isEnabled || isSettingUp) && (
        <div className="bg-slate-900/90 border border-indigo-500/30 p-6 rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span>Step 1: Scan QR Code with Authenticator App</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords, or 1Password.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRegenerateKey}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              title="Generate new secret key"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate New Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Real Scannable QR Code Box */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-3 shadow-inner">
              <div className="p-3 bg-white rounded-2xl shadow-xl inline-block">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="2FA TOTP QR Code" 
                    className="w-44 h-44 rounded-lg block"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400 font-mono text-xs">
                    Generating QR Code...
                  </div>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Scan with any mobile Authenticator app
              </span>
            </div>

            {/* Secret Key & Verification Form */}
            <div className="md:col-span-7 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Manual Entry Secret Key (Base32):
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-cyan-300 font-black tracking-widest shadow-inner select-all">
                    {formattedSecret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopySecretKey}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
              </div>

              {/* Live TOTP Verification Preview / Helper */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Live 30s TOTP Cycle:</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[11px] text-cyan-400 font-bold">{secondsRemaining}s remaining</span>
                    <button
                      type="button"
                      onClick={() => setShowLiveCode(!showLiveCode)}
                      className="text-slate-400 hover:text-slate-200 text-[10px] flex items-center gap-1"
                    >
                      {showLiveCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showLiveCode ? 'Hide' : 'Reveal Current Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-1000"
                    style={{ width: `${(secondsRemaining / 30) * 100}%` }}
                  />
                </div>

                {showLiveCode && (
                  <div className="pt-1 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-400">Current Valid Code:</span>
                    <span className="text-emerald-400 font-extrabold text-sm tracking-widest bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                      {liveTOTPCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: 6-Digit Code Verification */}
              <form onSubmit={handleVerifyAndEnable} className="space-y-3">
                <label className="text-xs font-bold text-slate-200 block">
                  Step 2: Enter 6-Digit Code from your Authenticator:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-48 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl font-mono text-center text-lg font-black tracking-widest text-white outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Activate 2FA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVerificationCode(liveTOTPCode);
                    }}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                    title="Auto-fill current simulated code"
                  >
                    Auto-Fill Code
                  </button>
                </div>

                {verificationError && (
                  <p className="text-xs text-rose-400 font-semibold">{verificationError}</p>
                )}

                <p className="text-[11px] text-slate-400">
                  Tip: You can use your authenticator app, or click <strong>Auto-Fill Code</strong> / enter <strong>123456</strong> for instant activation.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Backup Recovery Codes Section */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>One-Time Emergency Backup Recovery Codes</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Save these recovery codes. If you lose your phone or authenticator app, each code can bypass 2FA once.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBackupCodes}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadBackupCodes}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>

        {/* 6 Code Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(twoFactorData.backupCodes || []).map((code, idx) => (
            <div 
              key={idx}
              className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between font-mono text-xs font-bold text-slate-200 shadow-inner group"
            >
              <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
              <span className="text-cyan-300 font-bold tracking-wider">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
