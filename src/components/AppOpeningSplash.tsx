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
    // If video is not found or fails, run simulated code animation
    if (videoError || !videoSrc) {
      const p1 = setTimeout(() => setPhase("glitch"), 1100);
      const p2 = setTimeout(() => setPhase("loading"), 2200);

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
                  {/* Green Rounded App Icon with Flame */}
                  <motion.div
                    animate={
                      phase === "glitch"
                        ? { x: [-2, 2, -1, 1, 0], filter: ["hue-rotate(0deg)", "hue-rotate(20deg)", "hue-rotate(0deg)"] }
                        : {}
                    }
                    transition={{ duration: 0.2, repeat: phase === "glitch" ? 3 : 0 }}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-[18px] bg-gradient-to-br from-[#39FF14] to-[#26c90d] flex items-center justify-center shadow-[0_0_35px_rgba(57,255,20,0.45)] shrink-0 border border-white/20"
                  >
                    <Flame className="w-8 h-8 sm:w-9 sm:h-9 text-black" fill="currentColor" />
                  </motion.div>

                  {/* BYD Glitch Bold Typography with authentic Rubik Glitch font */}
                  <motion.div 
                    className="relative"
                    animate={
                      phase === "glitch"
                        ? { x: [3, -3, 2, -2, 0], filter: ["blur(0px)", "blur(1px)", "blur(0px)"] }
                        : {}
                    }
                    transition={{ duration: 0.18, repeat: phase === "glitch" ? 4 : 0 }}
                  >
                    <h1 
                      style={{ fontFamily: "'Rubik Glitch', monospace, sans-serif" }}
                      className="text-5xl sm:text-6xl md:text-7xl font-normal tracking-wide text-white uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.35)] flex items-center select-none"
                    >
                      BYD
                    </h1>
                  </motion.div>
                </motion.div>
              </div>

              {/* Subtitle: "Block Your Dopamine" */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mb-2"
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-normal italic flex items-center justify-center gap-1.5">
                  <span className="text-white">Block Your</span>
                  <span className="text-[#39FF14] drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">Dopamine</span>
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
