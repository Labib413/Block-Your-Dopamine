import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame } from "lucide-react";

interface AppOpeningSplashProps {
  onComplete: () => void;
  videoSrc?: string;
}

export const AppOpeningSplash: React.FC<AppOpeningSplashProps> = ({
  onComplete,
  videoSrc = "/opening.mp4"
}) => {
  const [videoError, setVideoError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"emerge" | "glitch" | "loading" | "complete">("emerge");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (videoError || !videoSrc) {
      // 10s Timeline:
      // 0.0s - 2.0s: Reveal
      // 2.0s - 4.8s: Glitch
      // 4.8s - 9.6s: Loading progress (0% -> 100%)
      // 9.6s - 10.0s: Complete & exit
      const tGlitch = setTimeout(() => setPhase("glitch"), 2000);
      const tLoading = setTimeout(() => setPhase("loading"), 4800);

      const startTime = Date.now() + 4800;
      const duration = 4800; // 4.8s loading duration

      const interval = setInterval(() => {
        const now = Date.now();
        if (now < startTime) return;

        const elapsed = now - startTime;
        const rawPct = Math.min(100, Math.floor((elapsed / duration) * 100));
        setProgress(rawPct);

        if (rawPct >= 100) {
          clearInterval(interval);
          setPhase("complete");
          setTimeout(() => {
            onCompleteRef.current();
          }, 500);
        }
      }, 80);

      return () => {
        clearTimeout(tGlitch);
        clearTimeout(tLoading);
        clearInterval(interval);
      };
    }
  }, [videoError, videoSrc]);

  return (
    <AnimatePresence>
      <motion.div
        key="byd-opening-splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed inset-0 z-[999999] bg-[#050505] flex flex-col items-center justify-center select-none overflow-hidden transform-gpu"
      >
        {/* If video source exists and hasn't errored, play the actual MP4 */}
        {!videoError && videoSrc ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="auto"
              onEnded={() => onComplete()}
              onError={() => {
                setVideoError(true);
              }}
              className="w-full h-full object-contain max-w-full max-h-full"
            />
            <button
              onClick={onComplete}
              className="absolute bottom-6 right-6 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-medium text-white/40 hover:text-white transition-all cursor-pointer z-50 backdrop-blur-md"
            >
              Skip Intro
            </button>
          </div>
        ) : (
          /* Native 60FPS Hardware-Accelerated Opening Experience */
          <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden bg-[#040404]">
            
            {/* 1. Deep Core Neon Green Radial Glows (Rich Atmospheric Aura) */}
            <div className="absolute w-[650px] h-[650px] rounded-full bg-[#39FF14]/[0.06] blur-[120px] pointer-events-none transform-gpu" />
            <div className="absolute w-[350px] h-[350px] rounded-full bg-emerald-500/[0.045] blur-[80px] pointer-events-none transform-gpu" />

            {/* 2. Cyber Matrix Dot Matrix Atmosphere (High-Precision Constellation Grid) */}
            <div className="absolute inset-0 pointer-events-none opacity-35 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* 3. Subtle Cyber Vignette Frame */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />

            {/* FULLSCREEN GLITCH OVERLAY (Lightweight transform-only hardware accelerated) */}
            {phase === "glitch" && (
              <>
                <div 
                  aria-hidden="true" 
                  className="absolute inset-0 z-10 pointer-events-none mix-blend-screen animate-screen-glitch-cyan opacity-25 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(0,255,255,0.12),transparent_70%)]"
                />
                <div 
                  aria-hidden="true" 
                  className="absolute inset-0 z-10 pointer-events-none mix-blend-screen animate-screen-glitch-magenta opacity-25 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(255,0,85,0.12),transparent_70%)]"
                />
              </>
            )}

            {/* Main Center Stage */}
            <div className="relative z-20 flex flex-col items-center text-center">
              
              {/* Spinning Cyber Focus Orbit */}
              <div className="relative flex items-center justify-center mb-6">
                {phase === "loading" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    transition={{
                      opacity: { duration: 0.4 },
                      rotate: { duration: 8, ease: "linear", repeat: Infinity }
                    }}
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-dashed border-[#39FF14]/25 pointer-events-none transform-gpu"
                  />
                )}

                {/* Logo & Icon Reveal Block */}
                <div className="relative flex items-center gap-3 sm:gap-3.5">
                  {/* Icon Badge */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="relative transform-gpu"
                  >
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-gradient-to-br from-[#39FF14] to-[#1cb805] flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.4)] shrink-0 border border-white/20">
                      <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-black" fill="currentColor" />
                    </div>

                    {/* Glitch Aberration */}
                    {phase === "glitch" && (
                      <div className="absolute inset-0 rounded-[16px] bg-[#00ffff]/30 flex items-center justify-center pointer-events-none mix-blend-screen animate-screen-glitch-cyan">
                        <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" fill="currentColor" />
                      </div>
                    )}
                  </motion.div>

                  {/* BYD Text in Rubik Glitch */}
                  <motion.div
                    initial={{ x: -15, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative select-none transform-gpu"
                  >
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-white uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.35)] flex items-center select-none"
                    >
                      BYD
                    </h1>

                    {phase === "glitch" && (
                      <h1 
                        aria-hidden="true"
                        style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                        className="absolute inset-0 text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#00ffea] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-screen-glitch-cyan opacity-70"
                      >
                        BYD
                      </h1>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Subtitle Reveal: "Block Your Dopamine" in TT Bluescreens Bold Italic */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                className="mb-2 transform-gpu"
              >
                <h2 
                  style={{ fontFamily: "'TT Bluescreens', 'TT Bluescreens Trl', 'Barlow Condensed', sans-serif" }}
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-wider flex items-center justify-center gap-1.5 select-none uppercase"
                >
                  <span className="text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Block Your</span>
                  <span className="text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.6)]">Dopamine</span>
                </h2>
              </motion.div>

              {/* Creator Credit Reveal */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="text-xs sm:text-sm font-sans font-medium text-white/50 tracking-wider mb-8"
              >
                Created by <span className="text-white/85 font-semibold">Tasnem Hossen Labib</span>
              </motion.p>

              {/* Progress Bar with GPU Composited Transform */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="w-56 sm:w-72 flex flex-col items-center gap-2 transform-gpu"
              >
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-white/50 px-1">
                  <span className="uppercase tracking-widest text-[#39FF14]/80 font-semibold">Loading System</span>
                  <span className="font-bold text-white tabular-nums">{progress}%</span>
                </div>

                <div className="w-full h-2 rounded-full bg-white/10 p-[1.5px] border border-white/15 overflow-hidden shadow-inner relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#39FF14] to-emerald-300 shadow-[0_0_12px_rgba(57,255,20,0.5)] transition-[transform] duration-75 ease-linear origin-left"
                    style={{ transform: `scaleX(${progress / 100})` }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Quick Skip Button in Corner */}
            <button
              onClick={onComplete}
              className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-medium text-white/40 hover:text-white transition-all cursor-pointer z-50 backdrop-blur-md"
            >
              Skip
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
