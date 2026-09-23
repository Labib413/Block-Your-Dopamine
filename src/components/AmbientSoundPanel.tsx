import React, { useState, useEffect, useRef } from "react";
import { 
  Headphones, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  CloudRain, 
  Waves, 
  Music, 
  X
} from "lucide-react";
import { ambientSound, AmbientSoundType } from "../lib/ambientSound";

interface AmbientSoundPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  align?: 'left' | 'right';
}

export const AmbientSoundPanel: React.FC<AmbientSoundPanelProps> = ({ isOpen, onClose, className = "", align = 'left' }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => ambientSound.isPlaying());
  const [activeType, setActiveType] = useState<AmbientSoundType>(() => ambientSound.getActiveType() || 'rain');
  const [volume, setVolume] = useState<number>(() => Math.round(ambientSound.getVolume() * 100));
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef<number>(volume);

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe(() => {
      setIsPlaying(ambientSound.isPlaying());
      if (ambientSound.getActiveType()) {
        setActiveType(ambientSound.getActiveType()!);
      }
      setVolume(Math.round(ambientSound.getVolume() * 100));
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleTogglePlay = () => {
    if (isPlaying) {
      ambientSound.pause();
    } else {
      ambientSound.play(activeType);
    }
  };

  const handleSelectSound = (type: AmbientSoundType) => {
    setActiveType(type);
    ambientSound.play(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    ambientSound.setVolume(val / 100);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      const restored = prevVolumeRef.current || 50;
      setVolume(restored);
      setIsMuted(false);
      ambientSound.setVolume(restored / 100);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      ambientSound.setVolume(0);
    }
  };

  const soundOptions = [
    {
      id: 'rain' as AmbientSoundType,
      title: 'Rainfall',
      subtitle: 'Gentle storm & raindrops',
      icon: CloudRain,
      accent: 'text-cyan-400',
      activeBorder: 'border-cyan-400/50 bg-cyan-400/5',
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.25)]',
    },
    {
      id: 'white_noise' as AmbientSoundType,
      title: 'White Noise',
      subtitle: 'Cognitive acoustic mask',
      icon: Waves,
      accent: 'text-neon-green',
      activeBorder: 'border-neon-green/50 bg-neon-green/5',
      glow: 'shadow-[0_0_15px_rgba(57,255,20,0.25)]',
    },
    {
      id: 'lofi' as AmbientSoundType,
      title: 'Lo-Fi Beats',
      subtitle: 'Chill 74 BPM chords & tape warmth',
      icon: Music,
      accent: 'text-purple-400',
      activeBorder: 'border-purple-400/50 bg-purple-400/5',
      glow: 'shadow-[0_0_15px_rgba(192,132,252,0.25)]',
    },
  ];

  return (
    <>
      {/* Click-outside backdrop */}
      <div 
        className="fixed inset-0 z-[240]" 
        onClick={onClose} 
      />

      <div
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-14 w-84 z-[250] bg-[#070707]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
              isPlaying 
                ? 'border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_10px_rgba(57,255,20,0.3)]' 
                : 'border-white/10 bg-white/5 text-white/50'
            }`}>
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold tracking-wider text-white uppercase flex items-center gap-2">
                Ambient Audio
                {isPlaying && (
                  <span className="flex items-center gap-0.5 h-2">
                    <span className="w-0.5 h-2 bg-neon-green rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-neon-green rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-neon-green rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </h4>
              <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                {isPlaying ? 'Audio Active' : 'Sound Generator Muted'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/5"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sound Selector Cards */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 px-1">
            Select Soundscape
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {soundOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = activeType === opt.id;
              const isSoundActive = isSelected && isPlaying;

              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectSound(opt.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                    isSelected
                      ? `${opt.activeBorder} ${isSoundActive ? opt.glow : ''}`
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected 
                        ? `border-white/20 bg-white/10 ${opt.accent}` 
                        : 'border-white/5 bg-white/5 text-white/40 group-hover:text-white/70'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold transition-colors ${
                          isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'
                        }`}>
                          {opt.title}
                        </span>
                        {isSoundActive && (
                          <span className="text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-neon-green/20 text-neon-green border border-neon-green/30">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 block leading-tight">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'border-neon-green bg-neon-green/20'
                      : 'border-white/20 group-hover:border-white/40'
                  }`}>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Play/Pause Action & Volume */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
              isPlaying
                ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                : 'bg-neon-green text-black hover:bg-[#2eff0a] shadow-[0_0_20px_rgba(57,255,20,0.3)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play {soundOptions.find(o => o.id === activeType)?.title}</span>
              </>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-3 px-1">
            <button
              onClick={handleToggleMute}
              className="text-white/40 hover:text-white transition-colors p-1"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/70" />
              )}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#39ff14] transition-all hover:bg-white/20"
              />
            </div>

            <span className="text-[10px] font-mono text-white/50 w-8 text-right tabular-nums">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
