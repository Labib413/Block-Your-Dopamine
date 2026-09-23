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
    // If video is not found or fails, run simulated code animation
    if (videoError || !videoSrc) {
      // Adjusted timeline: gentle emergence -> subtle fullscreen glitch -> loading
      const p1 = setTimeout(() => setPhase("glitch"), 1000);
      const p2 = setTimeout(() => setPhase("loading"), 2400);

      // Progress bar simulation (0% -> 100% in ~2.8s)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setPhase("complete");
            setTimeout(() => {
              onComplete();
            }, 600);
            return 100;
          }
          const increment = prev < 30 ? 2 : prev < 75 ? 3 : 4;
          return Math.min(100, prev + increment);
        });
      }, 50);

      return () => {
        clearTimeout(p1);
        clearTimeout(p2);
        clearInterval(interval);
      };
    }
  }, [videoError, videoSrc, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="byd-opening-splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[999999] bg-[#050505] flex flex-col items-center justify-center select-none overflow-hidden"
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
          /* Native High-Fidelity Fullscreen Cyber Glitch Experience */
          <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden">
            {/* Subtle Screen Scanline Ambient Texture */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] z-30" />

            {/* Background Ambient Radial Glow */}
            <div className="absolute w-[650px] h-[650px] rounded-full bg-[#39FF14]/[0.035] blur-[140px] pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] rounded-full bg-emerald-500/[0.025] blur-[90px] pointer-events-none" />

            {/* Particle Matrix / Star Canvas Simulation */}
            <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* FULLSCREEN GLITCH OVERLAYS (Controlled, Subtle, Full-Viewport Coverage) */}
            {phase === "glitch" && (
              <>
                {/* Full-Screen Chromatic Slices - Cyan Ghost Layer */}
                <div 
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none z-20 mix-blend-screen animate-screen-glitch-cyan opacity-40 select-none overflow-hidden flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 mb-5 text-[#00ffff]">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] border border-[#00ffff]/30 flex items-center justify-center">
                      <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-[#00ffff]" fill="currentColor" />
                    </div>
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#00ffff] uppercase"
                    >
                      BYD
                    </h1>
                  </div>
                  <h2 
                    style={{ fontFamily: "'TT Bluescreens', 'TT Bluescreens Trl', 'Barlow Condensed', sans-serif" }}
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold italic tracking-wider uppercase text-[#00ffff]/60"
                  >
                    Block Your Dopamine
                  </h2>
                </div>

                {/* Full-Screen Chromatic Slices - Magenta Ghost Layer */}
                <div 
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none z-20 mix-blend-screen animate-screen-glitch-magenta opacity-40 select-none overflow-hidden flex flex-col items-center justify-center"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 mb-5 text-[#ff0055]">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] border border-[#ff0055]/30 flex items-center justify-center">
                      <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-[#ff0055]" fill="currentColor" />
                    </div>
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#ff0055] uppercase"
                    >
                      BYD
                    </h1>
                  </div>
                  <h2 
                    style={{ fontFamily: "'TT Bluescreens', 'TT Bluescreens Trl', 'Barlow Condensed', sans-serif" }}
                    className="text-2xl sm:text-3xl md:text-4xl font-extrabold italic tracking-wider uppercase text-[#ff0055]/60"
                  >
                    Block Your Dopamine
                  </h2>
                </div>

                {/* Subtle horizontal screen flicker beam */}
                <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-transparent via-[#39FF14]/[0.04] to-transparent h-12 w-full animate-screen-glitch-cyan" />
              </>
            )}

            {/* Main Crisp Screen Elements */}
            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Spinning Cyber Focus Orbit (visible during loading phase) */}
              <div className="relative flex items-center justify-center mb-5">
                {phase === "loading" && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: 360 }}
                    transition={{
                      opacity: { duration: 0.5 },
                      rotate: { duration: 6, ease: "linear", repeat: Infinity }
                    }}
                    className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-dashed border-[#39FF14]/25 pointer-events-none"
                  />
                )}

                {/* Logo Badge & BYD typography */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, filter: "blur(8px)" }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    filter: "blur(0px)",
                  }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3.5 sm:gap-4"
                >
                  {/* Green Rounded App Icon with Flame */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-gradient-to-br from-[#39FF14] to-[#26c90d] flex items-center justify-center shadow-[0_0_35px_rgba(57,255,20,0.4)] shrink-0 border border-white/20">
                    <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-black" fill="currentColor" />
                  </div>

                  {/* BYD Title in Rubik Glitch font */}
                  <div className="relative select-none">
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-white uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] flex items-center select-none"
                    >
                      BYD
                    </h1>
                  </div>
                </motion.div>
              </div>

              {/* Subtitle: "Block Your Dopamine" in TT Bluescreens Bold Italic */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="mb-2"
              >
                <h2 
                  style={{ fontFamily: "'TT Bluescreens', 'TT Bluescreens Trl', 'Barlow Condensed', sans-serif" }}
                  className="text-2xl sm:text-3xl md:text-4xl font-extrabold italic tracking-wider flex items-center justify-center gap-2 select-none uppercase"
                >
                  <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Block Your</span>
                  <span className="text-[#39FF14] drop-shadow-[0_0_20px_rgba(57,255,20,0.6)]">Dopamine</span>
                </h2>
              </motion.div>

              {/* Creator Credit: "Created by Tasnem Hossen Labib" */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="text-xs sm:text-sm font-sans font-medium text-white/50 tracking-wider mb-8"
              >
                Created by <span className="text-white/80 font-semibold">Tasnem Hossen Labib</span>
              </motion.p>

              {/* High-Precision Progress Bar + Percentage Counter */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="w-56 sm:w-72 flex flex-col items-center gap-2"
              >
                {/* Counter Percentage */}
                <div className="flex items-center justify-between w-full text-[10px] font-mono text-white/50 px-1">
                  <span className="uppercase tracking-widest text-[#39FF14]/80">Loading</span>
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
