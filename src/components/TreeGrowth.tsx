import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, VideoOff } from 'lucide-react';

interface TreeGrowthProps {
  totalDuration: number;
  isDistracted?: boolean;
  isSessionCompleted: boolean;
}

export const TreeGrowth = React.memo(({ totalDuration, isDistracted = false, isSessionCompleted }: TreeGrowthProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const progressRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Formula: Growth% = ((TotalSessionTime - RemainingTime) / TotalSessionTime) * 100
  const totalSessionSeconds = totalDuration * 60;

  useEffect(() => {
    const handleGrowthUpdate = (e: any) => {
      const newProgress = e.detail.progress / 100;
      
      // Update display progress only at these intervals
      setDisplayProgress(newProgress);
      progressRef.current = newProgress;

      // Smooth transition using requestAnimationFrame
      if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
        const targetTime = newProgress * videoRef.current.duration;
        const startTime = videoRef.current.currentTime;
        const duration = 2000; // 2 seconds smooth transition
        const startTimestamp = performance.now();

        if (animationRef.current) cancelAnimationFrame(animationRef.current);

        const animate = (now: number) => {
          const elapsed = now - startTimestamp;
          const p = Math.min(1, elapsed / duration);
          
          // Ease out quad
          const easedP = p * (2 - p);
          
          if (videoRef.current) {
            videoRef.current.currentTime = startTime + (targetTime - startTime) * easedP;
          }

          if (p < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('byd-growth-update', handleGrowthUpdate as EventListener);
    return () => {
      window.removeEventListener('byd-growth-update', handleGrowthUpdate as EventListener);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [totalSessionSeconds, isSessionCompleted]);

  // Initial sync on load
  const handleVideoLoaded = () => {
    if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
      videoRef.current.currentTime = progressRef.current * videoRef.current.duration;
    }
  };

  const handleError = () => {
    setVideoError(true);
  };

  return (
    <div 
      className="relative w-80 h-64 flex items-center justify-center overflow-hidden bg-[#050505]"
      style={{ 
        willChange: 'transform, opacity', 
        contain: 'strict',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        transform: 'translateZ(0)'
      }}
    >
      {/* Constant background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.1)_0%,transparent_70%)]" />

      {!videoError ? (
        <video 
          ref={videoRef}
          src="/tree_growth.mp4"
          muted
          playsInline
          onLoadedMetadata={handleVideoLoaded}
          onError={handleError}
          // Constant filters for stability with smooth CSS transitions
          className="w-full h-full object-cover invert hue-rotate-180 contrast-125 brightness-90 transition-all duration-1000 ease-in-out"
          style={{ 
            transform: 'translateZ(0)',
            willChange: 'filter, opacity'
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-white/40 p-4 text-center z-10">
          <VideoOff className="w-8 h-8 mb-2" />
          <p className="text-xs">Video not found.</p>
          <p className="text-[10px] mt-1">Please upload "tree_growth.mp4" to the public folder.</p>
        </div>
      )}
      
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-neon-green/20 z-10 shadow-[0_0_10px_rgba(57,255,20,0.2)]">
        <span className="text-neon-green font-mono font-bold text-[10px]">
          {Math.round(displayProgress * 100)}% GROWN
        </span>
      </div>
      
      {isDistracted && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center p-4 rounded-2xl bg-black/50 border border-neon-green/30 shadow-[0_0_30px_rgba(57,255,20,0.2)]">
            <AlertTriangle className="w-10 h-10 text-neon-green mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-neon-green font-bold uppercase tracking-widest">Focus Paused</p>
            <p className="text-xs text-white/50 mt-2 max-w-[200px]">Return to your task to resume growth.</p>
          </div>
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // React.memo Implementation: Wrap the FocusTree component in React.memo to prevent it from re-rendering every time the parent timer state updates. 
  // It should only update when distraction state changes OR session completes OR totalDuration changes.
  return prev.isDistracted === next.isDistracted &&
         prev.isSessionCompleted === next.isSessionCompleted &&
         prev.totalDuration === next.totalDuration;
});
