import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Laptop, Apple, ExternalLink, CheckCircle2, Copy, Check } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasNativePrompt: boolean;
  onNativeInstall: () => void;
}

export function PWAInstallModal({ isOpen, onClose, hasNativePrompt, onNativeInstall }: PWAInstallModalProps) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    if (navigator.clipboard && appUrl) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
                <h3 className="text-lg font-bold text-white tracking-tight">Install BYD App</h3>
                <p className="text-xs text-white/40">Fast, offline-ready standalone application</p>
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
            {hasNativePrompt ? (
              <div className="p-5 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/40 text-center space-y-3">
                <p className="text-sm font-semibold text-white">Browser prompt is ready!</p>
                <button
                  onClick={() => {
                    onNativeInstall();
                    onClose();
                  }}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#39FF14] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#32e010] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(57,255,20,0.4)]"
                >
                  <Download className="w-4 h-4 text-black" />
                  Install App Directly
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Step 1: Open in a real browser tab */}
                <div className="p-4 rounded-2xl bg-[#39FF14]/5 border border-[#39FF14]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#39FF14]">Step 1: Open in Real Browser Tab</p>
                      <p className="text-[11px] text-white/60 mt-0.5">Google AI Studio preview iframe blocks direct install popups.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-[#39FF14] text-black font-bold text-xs uppercase tracking-wider hover:bg-[#32e010] transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                    >
                      <span>Open in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={handleCopyLink}
                      className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                      title="Copy App URL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#39FF14]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied!" : "Copy Link"}</span>
                    </button>
                  </div>
                </div>

                {/* Step 2 Guides for Each Platform */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-[#39FF14] text-xs font-bold uppercase tracking-wider">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android / Chrome</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Open the link in Chrome → Click <strong className="text-white">Three dots (⋮)</strong> → Tap <strong className="text-white">&quot;Install App&quot;</strong> or <strong className="text-white">&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                    <Apple className="w-3.5 h-3.5" />
                    <span>iPhone / Safari</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Open in Safari → Tap <strong className="text-white">Share (bottom icon)</strong> → Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>PC / Mac Chrome</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    In the new tab, click the <strong className="text-white">Install icon (⊕)</strong> on the right side of the browser URL bar.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-white/40">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Offline Ready</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Realtime Cloud Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
              <span>Fast Standalone</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

