import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Smartphone, Laptop, Apple, ExternalLink, CheckCircle2 } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasNativePrompt: boolean;
  onNativeInstall: () => void;
}

export function PWAInstallModal({ isOpen, onClose, hasNativePrompt, onNativeInstall }: PWAInstallModalProps) {
  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    window.open(window.location.origin, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
        >
          {/* Neon Glow accent background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#39FF14]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <Download className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Install BYD App</h3>
                <p className="text-xs text-white/40">Run as a fast, standalone desktop & mobile application</p>
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
              <div className="p-4 rounded-2xl bg-[#39FF14]/5 border border-[#39FF14]/30 text-center space-y-3">
                <p className="text-sm text-white/80">Your browser is ready to install the application directly.</p>
                <button
                  onClick={() => {
                    onNativeInstall();
                    onClose();
                  }}
                  className="w-full py-3 px-5 rounded-xl bg-[#39FF14] text-black font-bold text-sm tracking-wide uppercase hover:bg-[#32e010] transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                >
                  <Download className="w-4 h-4" />
                  Install Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Option: Open in full tab if inside iframe */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-white">Full Browser Tab</p>
                    <p className="text-xs text-white/40">Open without iframe to trigger 1-click install</p>
                  </div>
                  <button
                    onClick={handleOpenInNewTab}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Android / Chrome */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-[#39FF14] text-xs font-bold uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>Android / Chrome & Edge</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Click the <strong className="text-white">Three Dots (⋮)</strong> menu in browser URL bar → Tap <strong className="text-white">&quot;Install App&quot;</strong> or <strong className="text-white">&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>

                {/* iOS Safari */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                    <Apple className="w-4 h-4" />
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Tap the <strong className="text-white">Share button</strong> (square with arrow up) at the bottom → Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>.
                  </p>
                </div>

                {/* PC / Mac Desktop */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                    <Laptop className="w-4 h-4" />
                    <span>PC / Mac Desktop</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Look for the <strong className="text-white">Install icon (⊕ or ⬇)</strong> on the right side of the address/URL bar in Chrome, Edge, or Brave.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
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
