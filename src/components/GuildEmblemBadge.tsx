import React from "react";
import { cn } from "@/src/lib/utils";
import { GuildEmblem } from "../services/communityService";

interface GuildEmblemBadgeProps {
  emblem?: GuildEmblem;
  name?: string;
  tag?: string;
  category?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showGlow?: boolean;
}

export function GuildEmblemBadge({
  emblem,
  name = "Guild",
  tag,
  category,
  size = "md",
  className,
  showGlow = true
}: GuildEmblemBadgeProps) {
  // If emblem is not provided, dynamically derive deterministic style from name/tag
  const iconKey = emblem?.icon || (category === "Medical" ? "caduceus" : category === "Engineering" ? "atom" : "shield");
  const glowColor = emblem?.glowColor || "#00F0FF";
  const borderColor = emblem?.borderColor || "rgba(0, 240, 255, 0.4)";
  const gradient = emblem?.bgGradient || "from-[#00F0FF]/20 via-[#0a0a0a] to-[#041d24]";

  const sizeClasses = {
    xs: "w-5 h-5 text-[8px]",
    sm: "w-7 h-7 text-[9px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
    xl: "w-14 h-14 text-base",
    "2xl": "w-16 h-16 text-lg"
  }[size];

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-5.5 h-5.5",
    xl: "w-7 h-7",
    "2xl": "w-8 h-8"
  }[size];

  // Render High-Precision Vector Clan Crest Icon
  const renderCrestIcon = () => {
    switch (iconKey) {
      case "swords":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
            <line x1="13" y1="19" x2="19" y2="13" />
            <line x1="16" y1="16" x2="20" y2="20" />
            <line x1="19" y1="21" x2="21" y2="19" />
            <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
            <line x1="5" y1="14" x2="9" y2="18" />
            <line x1="7" y1="17" x2="4" y2="20" />
            <line x1="3" y1="19" x2="5" y2="21" />
          </svg>
        );
      case "dragon":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="currentColor">
            <path d="M12 2L14.5 8.5L21 9L16 13.5L17.5 20L12 16.5L6.5 20L8 13.5L3 9L9.5 8.5L12 2Z" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 6L13.5 10.5L18 11L14.5 14L15.5 18.5L12 16L8.5 18.5L9.5 14L6 11L10.5 10.5L12 6Z" fill="currentColor" />
          </svg>
        );
      case "crown":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        );
      case "phoenix":
      case "flame":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="currentColor">
            <path d="M12 2c-.5 2.5-3 5-3 8 0 3.3 2.7 6 6 6 1.7 0 3.2-.7 4.2-1.8C18.5 18.5 15.5 21 12 21c-5 0-9-4-9-9 0-4.4 3.1-8.1 7.2-8.9.6-.1 1.2-.1 1.8-.1z" fillOpacity="0.3" />
            <path d="M12 7c-1.5 2-2 3.5-2 5 0 2.2 1.8 4 4 4 1.1 0 2.1-.5 2.8-1.2C16.3 16.5 14.3 18 12 18c-3.3 0-6-2.7-6-6 0-3 2.1-5.6 4.9-6 .4 0 .8 0 1.1 1z" />
          </svg>
        );
      case "atom":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)" strokeOpacity="0.8" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" strokeOpacity="0.8" />
            <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)" strokeOpacity="0.8" />
          </svg>
        );
      case "caduceus":
      case "cross":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M8 6h8M6 10h12M8 14h8M10 18h4" strokeWidth="2.2" />
            <circle cx="12" cy="4" r="2" fill="currentColor" />
          </svg>
        );
      case "skull":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.5 2 4 6 4 11c0 3.3 1.7 6.2 4.3 7.8L9 22h6l.7-3.2C18.3 17.2 20 14.3 20 11c0-5-2.5-9-8-9z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="9" cy="11" r="1.5" fill="currentColor" />
            <circle cx="15" cy="11" r="1.5" fill="currentColor" />
            <path d="M12 14v2M10 19v3M14 19v3" />
          </svg>
        );
      case "wolf":
      case "lion":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15 8 21 9 17 14 18 20 12 17 6 20 7 14 3 9 9 8 12 2" fill="currentColor" fillOpacity="0.25" />
            <circle cx="9" cy="11" r="1" fill="currentColor" />
            <circle cx="15" cy="11" r="1" fill="currentColor" />
            <path d="M12 13v2M10 16h4" />
          </svg>
        );
      case "lightning":
      case "zap":
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case "shield":
      default:
        return (
          <svg viewBox="0 0 24 24" className={cn(iconSizes, "drop-shadow-[0_0_8px_currentColor]")} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" fillOpacity="0.2" />
            <polyline points="9 12 11 14 15 10" strokeWidth="2.5" />
          </svg>
        );
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 select-none transition-all duration-300 group/emblem",
        sizeClasses,
        className
      )}
      style={{ color: glowColor }}
    >
      {/* Outer Subtle CMYK Glow Halo */}
      {showGlow && (
        <div
          className="absolute inset-0 rounded-xl filter blur-sm opacity-35 group-hover/emblem:opacity-75 transition-opacity pointer-events-none"
          style={{ background: glowColor }}
        />
      )}

      {/* Uniform Sleek Crest Frame Container */}
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br border rounded-xl shadow-lg backdrop-blur-md transition-all duration-300",
          gradient
        )}
        style={{ borderColor: borderColor }}
      >
        {/* Inner Radial Light Core */}
        <div
          className="absolute inset-0 bg-radial from-white/10 via-transparent to-transparent opacity-50 pointer-events-none"
          style={{ mixBlendMode: "overlay" }}
        />

        {/* Ambient Top Rim Highlight */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-4 bg-white/15 rounded-full blur-xs pointer-events-none" />

        {/* Icon Component */}
        <div className="relative z-10 transition-transform duration-300 group-hover/emblem:scale-105">
          {renderCrestIcon()}
        </div>

        {/* Subtle Monogram Tag on Bottom Rim if size is large enough */}
        {(size === "xl" || size === "2xl") && tag && (
          <span
            className="absolute bottom-0.5 font-mono font-black tracking-widest text-[7px] uppercase z-10 px-1 rounded bg-black/70 border border-white/10 text-white/90 drop-shadow-sm"
          >
            {tag}
          </span>
        )}
      </div>
    </div>
  );
}
