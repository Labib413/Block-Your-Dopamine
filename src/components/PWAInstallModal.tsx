import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Laptop, Apple, CheckCircle2, Copy, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasNativePrompt: boolean;
  onNativeInstall: () => void;
}

export function PWAInstallModal({ isOpen, onClose, hasNativePrompt, onNativeInstall }: PWAInstallModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard && appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDirectDownload = () => {
    // If native prompt is ready in current browser, trigger it directly
    if (hasNativePrompt) {
      onNativeInstall();
    }

    // Immediately generate and trigger direct download of the standalone offline launcher
    try {
      const launcherHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#050505">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>BYD - Block Your Dopamine</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2339FF14'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #050505; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
    .loader { width: 44px; height: 44px; border: 3px solid rgba(57,255,20,0.2); border-top-color: #39FF14; border-radius: 50%; animation: spin 0.8s infinite linear; margin-bottom: 20px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; color: #fff; }
    p { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 24px; max-width: 320px; line-height: 1.5; }
    a.btn { display: inline-block; background: #39FF14; color: #000; font-weight: 800; font-size: 13px; padding: 14px 32px; border-radius: 14px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 0 25px rgba(57,255,20,0.4); }
  </style>
</head>
<body>
  <div class="loader"></div>
  <h1>Launching BYD App...</h1>
  <p>Connecting to your personal dopamine detox workspace</p>
  <a class="btn" href="${appUrl}">Open App</a>
  <script>
    window.location.replace("${appUrl}");
  </script>
</body>
</html>`;

      const blob = new Blob([launcherHtml], { type: 'text/html;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'BYD-BlockYourDopamine.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Direct download error:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Neon Glow accent background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Download BYD App</h3>
                <p className="text-xs text-white/40">Standalone, offline-ready dopamine detox app</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {/* Direct 1-Click Download / Install Hero Section */}
            <div className="p-5 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/40 text-center space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#39FF14]">
                এক ক্লিকেই সরাসরি ডাউনলোড ও ইনস্টল
              </p>
              <button
                onClick={handleDirectDownload}
                className="w-full py-4 px-5 rounded-xl bg-[#39FF14] text-black font-extrabold text-sm tracking-wider uppercase hover:bg-[#32e010] transition-transform active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(57,255,20,0.45)] cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-black" />
                    <span>App Downloaded Successfully!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-black" />
                    <span>Download App Directly (1-Click)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center pt-1">
                <button
                  onClick={handleCopyLink}
                  className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Link Copied to Clipboard!" : "Copy App URL"}</span>
                </button>
              </div>
            </div>

            {/* Platform Quick Install Instructions */}
            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-[#39FF14] shrink-0 mt-0.5" />
                <div className="text-xs text-white/60 leading-relaxed">
                  <strong className="text-white">Android / Chrome:</strong> Click Download above, or tap <strong className="text-white">⋮ (Menu)</strong> → <strong className="text-white">Install App / Add to Home screen</strong>.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
                <Apple className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />
                <div className="text-xs text-white/60 leading-relaxed">
                  <strong className="text-white">iPhone / Safari:</strong> Tap the <strong className="text-white">Share icon</strong> at bottom → Select <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-2.5">
                <Laptop className="w-4 h-4 text-white/80 shrink-0 mt-0.5" />
                <div className="text-xs text-white/60 leading-relaxed">
                  <strong className="text-white">PC / Mac:</strong> Launch the downloaded file anytime, or click the <strong className="text-white">Install (⊕)</strong> icon in your browser URL bar.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Offline Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Instant Launch</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
