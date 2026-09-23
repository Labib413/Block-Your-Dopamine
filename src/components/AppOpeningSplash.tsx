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

  // If there's an actual video file (e.g. /opening.mp4 placed by user), use the HTML5 video element.
  // Otherwise, render the ultra-precise, high-fidelity replica matching the video animation:
  // - Dark particle atmosphere & ambient neon green radial glow
  // - Glitch BYD logo with flame icon
  // - "Block Your Dopamine" with green highlight
  // - "Created by Tasnem Hossen Labib"
  // - High-precision cyber loader ring + progress bar (0% -> 100%)
  // - Smooth fade-out exit to reveal the dashboard

  useEffect(() => {
    // If video is not found or fails, run simulated code animation calibrated to run for ~10 seconds
    if (videoError || !videoSrc) {
      // Timeline across 10 seconds:
      // 0.0s - 1.8s: Emerge & crisp typography entrance
      // 1.8s - 4.8s: Cinematic subtle fullscreen cyber glitch phase
      // 4.8s - 9.8s: Cyber focus loading ring + smooth 0% -> 100% progress
      // 9.8s - 10.4s: Complete flourish and smooth fade exit to dashboard
      const p1 = setTimeout(() => setPhase("glitch"), 1800);
      const p2 = setTimeout(() => setPhase("loading"), 4800);

      // Start progress loading at 4.8s, reaching 100% at ~9.8s (total ~5 seconds of smooth filling)
      let interval: NodeJS.Timeout | null = null;
      const startLoadingTimeout = setTimeout(() => {
        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              if (interval) clearInterval(interval);
              setPhase("complete");
              setTimeout(() => {
                onComplete();
              }, 700);
              return 100;
            }
            // 50 updates of 2% each over 5000ms = 100ms per 2%
            return Math.min(100, prev + 2);
          });
        }, 100);
      }, 4800);

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
          /* Native High-Fidelity BYD Opening Experience (Replica of the user's MP4) */
          <div className="relative w-full h-full flex flex-col items-center justify-center px-4 overflow-hidden">
            {/* Background Ambient Radial Glow */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-[#39FF14]/[0.04] blur-[120px] pointer-events-none" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-emerald-500/[0.03] blur-[80px] pointer-events-none" />

            {/* Particle Canvas Effect Simulation */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

            {/* Main Content */}
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

                {/* Logo Badge & Glitch BYD */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(12px)" }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    filter: "blur(0px)",
                  }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3.5 sm:gap-4"
                >
                  {/* Green Rounded App Icon with Cyber Glitch Effect */}
                  <div className="relative">
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-gradient-to-br from-[#39FF14] to-[#26c90d] flex items-center justify-center shadow-[0_0_35px_rgba(57,255,20,0.45)] shrink-0 border border-white/20 transition-all ${
                        phase === "glitch" ? "opacity-90" : ""
                      }`}
                    >
                      <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-black" fill="currentColor" />
                    </div>

                    {/* Glitch RGB chromatic ghost overlays during glitch phase */}
                    {phase === "glitch" && (
                      <>
                        <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-[#00ffff]/30 flex items-center justify-center pointer-events-none mix-blend-screen animate-glitch-layer-1">
                          <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-300" fill="currentColor" />
                        </div>
                        <div className="absolute inset-0 w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-[#ff0055]/30 flex items-center justify-center pointer-events-none mix-blend-screen animate-glitch-layer-2">
                          <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-rose-400" fill="currentColor" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* BYD Glitch Bold Typography with RGB Chromatic Split & Slice Artifacts */}
                  <div className="relative select-none">
                    {/* Main Base Text */}
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-white uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] flex items-center select-none"
                    >
                      BYD
                    </h1>

                    {/* Glitch RGB Chromatic Slices */}
                    {phase === "glitch" && (
                      <>
                        {/* Cyan Sliced Layer */}
                        <h1 
                          aria-hidden="true"
                          style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                          className="absolute inset-0 text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#00ffea] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-glitch-layer-1 opacity-80"
                        >
                          BYD
                        </h1>
                        {/* Magenta Sliced Layer */}
                        <h1 
                          aria-hidden="true"
                          style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                          className="absolute inset-0 text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#ff0055] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-glitch-layer-2 opacity-80"
                        >
                          BYD
                        </h1>
                        {/* Neon Green Slice Flash */}
                        <h1 
                          aria-hidden="true"
                          style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                          className="absolute inset-0 text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#39FF14] uppercase flex items-center select-none pointer-events-none mix-blend-screen animate-glitch-layer-1 opacity-70 translate-x-1"
                        >
                          BYD
                        </h1>
                      </>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Subtitle: "Block Your Dopamine" in TT Bluescreens Bold Italic */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
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
                transition={{ delay: 1.0, duration: 0.8 }}
                className="text-xs sm:text-sm font-sans font-medium text-white/50 tracking-wider mb-8"
              >
                Created by <span className="text-white/80 font-semibold">Tasnem Hossen Labib</span>
              </motion.p>

              {/* High-Precision Progress Bar + Percentage Counter */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
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
