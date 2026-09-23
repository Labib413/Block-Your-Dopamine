import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    // If video is not found or fails, run simulated code animation calibrated to run for ~10 seconds
    if (videoError || !videoSrc) {
      // Timeline across 10 seconds:
      // 0.0s - 2.0s: Cinematic Logo & Icon Reveal (Expansion, Cyber flare, Neon Beam)
      // 2.0s - 5.0s: Dynamic Fullscreen Cyber Glitch (Background grid, Scanlines, Chromatic split across entire viewport)
      // 5.0s - 9.8s: Cyber Focus Loading Ring + 0% -> 100% Progress
      // 9.8s - 10.4s: Complete & Smooth Dashboard Fadeout
      const p1 = setTimeout(() => setPhase("glitch"), 2000);
      const p2 = setTimeout(() => setPhase("loading"), 5000);

      let interval: NodeJS.Timeout | null = null;
      const startLoadingTimeout = setTimeout(() => {
        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              if (interval) clearInterval(interval);
              setPhase("complete");
              setTimeout(() => {
                onComplete();
              }, 650);
              return 100;
            }
            // Smooth 2% increment every 96ms (~4.8s to reach 100%)
            return Math.min(100, prev + 2);
          });
        }, 96);
      }, 5000);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearTimeout(startLoadingTimeout);
        if (interval) clearInterval(interval);
      };
    }
  }, [videoError, videoSrc, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="byd-opening-splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[999999] bg-[#030303] flex flex-col items-center justify-center select-none overflow-hidden"
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
                console.log("[Opening] No external opening.mp4 found, switching to native high-fidelity opening animation.");
                setVideoError(true);
              }}
              className="w-full h-full object-contain max-w-full max-h-full"
            />
            {/* Fallback skip button in corner */}
            <button
              onClick={onComplete}
              className="absolute bottom-6 right-6 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-medium text-white/40 hover:text-white transition-all cursor-pointer z-50 backdrop-blur-md"
            >
              Skip Intro
            </button>
          </div>
        ) : (
          /* Native High-Fidelity Cinematic Opening Experience */
          <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden">
            
            {/* FULLSCREEN BACKGROUND GLITCH LAYERS (Active throughout the glitch phase) */}
            {phase === "glitch" && (
              <>
                {/* 1. Fullscreen Horizontal Slice Aberrations (Cyan Shift) */}
                <div 
                  aria-hidden="true" 
                  className="absolute inset-0 z-10 pointer-events-none mix-blend-screen animate-glitch-layer-1 opacity-25 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(0,255,255,0.15),transparent_70%)]"
                />

                {/* 2. Fullscreen Horizontal Slice Aberrations (Magenta Shift) */}
                <div 
                  aria-hidden="true" 
                  className="absolute inset-0 z-10 pointer-events-none mix-blend-screen animate-glitch-layer-2 opacity-25 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(255,0,85,0.15),transparent_70%)]"
                />
              </>
            )}

            {/* Ambient Deep Glows */}
            <motion.div 
              animate={phase === "glitch" ? { scale: [1, 1.2, 0.9, 1.1, 1], opacity: [0.08, 0.16, 0.05, 0.12, 0.08] } : {}}
              transition={{ duration: 0.4, repeat: phase === "glitch" ? Infinity : 0 }}
              className="absolute w-[680px] h-[680px] rounded-full bg-[#39FF14]/[0.05] blur-[140px] pointer-events-none" 
            />
            <div className="absolute w-[350px] h-[350px] rounded-full bg-emerald-500/[0.03] blur-[90px] pointer-events-none" />

            {/* Particle Atmosphere Matrix */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Main Stage Content */}
            <div className="relative z-20 flex flex-col items-center text-center">
              
              {/* Spinning Cyber Focus Orbit (visible during loading phase) */}
              <div className="relative flex items-center justify-center mb-6">
                {phase === "loading" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: 360 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      rotate: { duration: 6, ease: "linear", repeat: Infinity }
                    }}
                    className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border border-dashed border-[#39FF14]/30 pointer-events-none"
                  />
                )}

                {/* CINEMATIC REVEAL CONTAINER (Dramatic Glow, Scale, & Flare Entrance) */}
                <div className="relative flex items-center gap-3 sm:gap-3.5">
                  
                  {/* Neon Glow Burst Behind the Reveal */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.4, 1], opacity: [0, 0.7, 0.25] }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 rounded-full bg-[#39FF14]/15 blur-xl pointer-events-none"
                  />

                  {/* 1. App Icon Dramatic Reveal - Sleek & Balanced Size */}
                  <motion.div
                    initial={{ scale: 0.2, opacity: 0, rotate: -35, filter: "blur(16px)" }}
                    animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
                    transition={{ 
                      duration: 1.2, 
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    className="relative"
                  >
                    {/* Glowing outer aura for the icon */}
                    <motion.div 
                      animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.65, 0.3] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -inset-0.5 rounded-[18px] bg-gradient-to-r from-[#39FF14] to-emerald-400 opacity-50 blur-md pointer-events-none"
                    />

                    {/* Main Flame Icon Badge */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-gradient-to-br from-[#39FF14] via-[#2bf20b] to-[#1cb805] flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.45)] shrink-0 border border-white/25 overflow-hidden">
                      {/* Diagonal light sweep inside badge during reveal */}
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{ delay: 0.6, duration: 1.0, ease: "easeInOut" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
                      />
                      <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-black" fill="currentColor" />
                    </div>

                    {/* Chromatic Ghosting on Icon during Glitch */}
                    {phase === "glitch" && (
                      <>
                        <div className="absolute inset-0 rounded-[16px] bg-[#00ffff]/30 flex items-center justify-center pointer-events-none mix-blend-screen animate-glitch-layer-1">
                          <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300" fill="currentColor" />
                        </div>
                        <div className="absolute inset-0 rounded-[16px] bg-[#ff0055]/30 flex items-center justify-center pointer-events-none mix-blend-screen animate-glitch-layer-2">
                          <Flame className="w-7 h-7 sm:w-8 sm:h-8 text-rose-400" fill="currentColor" />
                        </div>
                      </>
                    )}
                  </motion.div>

                  {/* 2. BYD Logo Dramatic Kinetic Reveal - Sleek & Refined Typography */}
                  <motion.div
                    initial={{ x: -20, opacity: 0, filter: "blur(12px)" }}
                    animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ 
                      delay: 0.35, 
                      duration: 1.1, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    className="relative select-none"
                  >
                    {/* Primary BYD Text in Rubik Glitch font */}
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-white uppercase drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] flex items-center select-none"
                    >
                      BYD
                    </h1>

                    {/* Chromatic Slice Ghosts during Glitch phase */}
                    {phase === "glitch" && (
                      <>
                        <h1 
                          aria-hidden="true"
                          style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                          className="absolute inset-0 text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#00ffea] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-glitch-layer-1 opacity-75"
                        >
                          BYD
                        </h1>
                        <h1 
                          aria-hidden="true"
                          style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                          className="absolute inset-0 text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#ff0055] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-glitch-layer-2 opacity-75"
                        >
                          BYD
                        </h1>
                      </>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Subtitle Reveal: "Block Your Dopamine" in TT Bluescreens Bold Italic */}
              <motion.div
                initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-2"
              >
                <h2 
                  style={{ fontFamily: "'TT Bluescreens', 'TT Bluescreens Trl', 'Barlow Condensed', sans-serif" }}
                  className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-wider flex items-center justify-center gap-1.5 select-none uppercase"
                >
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Block Your</span>
                  <span className="text-[#39FF14] drop-shadow-[0_0_20px_rgba(57,255,20,0.6)]">Dopamine</span>
                </h2>
              </motion.div>

              {/* Creator Credit Reveal */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="text-xs sm:text-sm font-sans font-medium text-white/50 tracking-wider mb-8"
              >
                Created by <span className="text-white/85 font-semibold">Tasnem Hossen Labib</span>
              </motion.p>

              {/* Loading Indicator & Smooth 10s Timeline Progress Bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="w-56 sm:w-72 flex flex-col items-center gap-2"
              >
                {/* Counter Percentage */}
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-white/50 px-1">
                  <span className="uppercase tracking-widest text-[#39FF14]/80 font-semibold">Loading System</span>
                  <span className="font-bold text-white tabular-nums">{progress}%</span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-2 rounded-full bg-white/10 p-[1.5px] border border-white/15 overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#39FF14] to-emerald-300 shadow-[0_0_15px_rgba(57,255,20,0.6)]"
                    style={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
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
