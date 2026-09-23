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

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isPlaying) {
      ambientSound.pause();
    } else {
      ambientSound.play(activeType);
    }
  };

  const handleSelectSound = (type: AmbientSoundType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveType(type);
    ambientSound.play(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = Number(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    ambientSound.setVolume(val / 100);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      title: 'Rainfall & Thunder',
      subtitle: 'Organic white noise & gentle storm',
      tag: 'Soothing Focus',
      icon: CloudRain,
      themeColor: '#00F0FF',
      accentText: 'text-[#00F0FF]',
      borderActive: 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_25px_rgba(0,240,255,0.25)]',
      dotActive: 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]',
    },
    {
      id: 'white_noise' as AmbientSoundType,
      title: 'Deep White Noise',
      subtitle: 'Binaural cognitive masking frequencies',
      tag: 'Deep Detox',
      icon: Waves,
      themeColor: '#39FF14',
      accentText: 'text-[#39FF14]',
      borderActive: 'border-[#39FF14] bg-[#39FF14]/10 shadow-[0_0_25px_rgba(57,255,20,0.25)]',
      dotActive: 'bg-[#39FF14] shadow-[0_0_8px_#39FF14]',
    },
    {
      id: 'lofi' as AmbientSoundType,
      title: 'Analog Lo-Fi Beats',
      subtitle: 'Chill 74 BPM tape warmth & jazz Rhodes',
      tag: 'Flow State',
      icon: Music,
      themeColor: '#D946EF',
      accentText: 'text-[#D946EF]',
      borderActive: 'border-[#D946EF] bg-[#D946EF]/10 shadow-[0_0_25px_rgba(217,70,239,0.25)]',
      dotActive: 'bg-[#D946EF] shadow-[0_0_8px_#D946EF]',
    },
  ];

  const activeOption = soundOptions.find(o => o.id === activeType) || soundOptions[0];

  return (
    <>
      {/* Click-outside backdrop with light dimming for extra focus */}
      <div 
        className="fixed inset-0 z-[240] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Dropdown Container */}
      <div
        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-13 w-[340px] sm:w-[370px] z-[250] bg-[#09090b]/98 backdrop-blur-3xl border border-white/20 rounded-2xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(57,255,20,0.1)] flex flex-col gap-4.5 animate-in fade-in zoom-in-95 duration-200 ${className}`}
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.15), 0 0 35px -5px rgba(57,255,20,0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent Line */}
        <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5 pt-0.5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${
              isPlaying 
                ? 'border-[#39FF14] bg-[#39FF14]/15 text-[#39FF14] shadow-[0_0_18px_rgba(57,255,20,0.4)]' 
                : 'border-white/15 bg-white/5 text-white/50'
            }`}>
              <Headphones className="w-4.5 h-4.5 animate-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                  Sound Environment
                </h4>
                {isPlaying && (
                  <span className="flex items-center gap-0.5 h-2 px-1.5 py-0.5 rounded-full bg-[#39FF14]/20 border border-[#39FF14]/40">
                    <span className="w-0.5 h-2 bg-[#39FF14] rounded-full animate-pulse" />
                    <span className="w-0.5 h-3 bg-[#39FF14] rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse delay-150" />
                  </span>
                )}
              </div>
              <p className="text-[10px] font-mono font-medium text-white/45 uppercase tracking-widest mt-0.5">
                {isPlaying ? `Playing: ${activeOption.title}` : 'Select a track to start audio'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/10 hover:border-white/20 active:scale-95 cursor-pointer"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sound Selection Cards - Highly Interactive & Distinct */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
              Acoustic Channels
            </span>
            <span className="text-[9px] font-mono text-[#39FF14] tracking-wider">
              {isPlaying ? 'ACTIVE FREQUENCY' : 'STANDBY'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {soundOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = activeType === opt.id;
              const isSoundPlaying = isSelected && isPlaying;

              return (
                <div
                  key={opt.id}
                  onClick={(e) => handleSelectSound(opt.id, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectSound(opt.id);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between cursor-pointer group relative overflow-hidden select-none active:scale-[0.98] ${
                    isSelected
                      ? `${opt.borderActive}`
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/25 shadow-sm'
                  }`}
                >
                  {/* Subtle active track highlight glow in background */}
                  {isSelected && (
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{ backgroundColor: opt.themeColor }}
                    />
                  )}

                  <div className="flex items-center gap-3.5 z-10">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      isSelected 
                        ? `border-white/30 bg-white/15 ${opt.accentText} shadow-md` 
                        : 'border-white/10 bg-white/5 text-white/40 group-hover:text-white/80 group-hover:bg-white/10'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold tracking-tight transition-colors ${
                          isSelected ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}>
                          {opt.title}
                        </span>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded font-bold border transition-colors ${
                          isSelected 
                            ? 'bg-white/15 text-white border-white/30' 
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {opt.tag}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 block font-normal leading-tight mt-0.5">
                        {opt.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Play Action Badge / Active Indicator */}
                  <div className="flex items-center gap-2 z-10 pl-2">
                    {isSoundPlaying ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14] text-[10px] font-mono font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-ping" />
                        LIVE
                      </span>
                    ) : (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'border-white/30 bg-white/15 text-white' 
                          : 'border-white/10 bg-white/5 text-white/30 group-hover:border-white/30 group-hover:text-white/80'
                      }`}>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Play/Pause Action Bar */}
        <div className="pt-2 border-t border-white/10 flex flex-col gap-3.5">
          <button
            onClick={(e) => handleTogglePlay(e)}
            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              isPlaying
                ? 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20 hover:border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.06)]'
                : 'bg-[#39FF14] text-black font-extrabold hover:bg-[#2eff0a] border-2 border-[#39FF14] shadow-[0_0_25px_rgba(57,255,20,0.4)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Audio Engine</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play {activeOption.title}</span>
              </>
            )}
          </button>

          {/* Volume Slider with Quick Presets */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-white/50" /> Volume Master
              </span>
              <span className="text-[11px] font-mono font-bold text-white tabular-nums">
                {isMuted ? 'MUTED' : `${volume}%`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleToggleMute(e)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isMuted || volume === 0 
                    ? 'border-red-500/40 bg-red-500/10 text-red-400' 
                    : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-white/20'
                }`}
                title={isMuted ? "Unmute sound" : "Mute sound"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#39FF14] transition-all hover:bg-white/25 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #39FF14 0%, #39FF14 ${isMuted ? 0 : volume}%, rgba(255,255,255,0.15) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.15) 100%)`
                  }}
                />
              </div>

              {/* Quick volume shortcuts */}
              <div className="flex items-center gap-1">
                {[30, 70, 100].map((v) => (
                  <button
                    key={v}
                    onClick={(e) => {
                      e.stopPropagation();
                      setVolume(v);
                      setIsMuted(false);
                      ambientSound.setVolume(v / 100);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all border cursor-pointer ${
                      !isMuted && volume === v
                        ? 'border-[#39FF14]/50 bg-[#39FF14]/20 text-[#39FF14] font-bold'
                        : 'border-white/5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
