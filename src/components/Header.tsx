import { useState, useRef, useEffect } from "react";
import { Bell, ShieldCheck, Flame, Trophy, X, Trash2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useIsFetching } from "@tanstack/react-query";
import { cn, isValidUrl } from "@/src/lib/utils";
import { BADGES } from "../constants";

export function Header({ onNavigate, onShowBadges }: { onNavigate?: (view: string) => void, onShowBadges?: () => void }) {
  const { 
    user,
    level, 
    xp, 
    streak, 
    consecutiveMissedDays,
    gender, 
    notificationsEnabled, 
    notifications, 
    deleteNotification, 
    clearAllNotifications,
    equippedBadges,
    badgeHealth,
    isSyncing
  } = useApp();
  
  const isFetching = useIsFetching();
  const honorific = user ? (gender === "Female" ? "Ma'am." : "Sir.") : "Guest.";
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center mb-8 relative z-50">
      <div className="flex-1">
        <h1 className="text-3xl font-sans font-bold tracking-tight flex items-center gap-3">
          {user ? "Welcome back, " : "Welcome, "} <span className="text-neon-green italic">{honorific}</span>
          {(isSyncing || isFetching > 0) && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/20 animate-in fade-in duration-500">
              <div className="w-1 h-1 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-neon-green/60">Syncing</span>
            </div>
          )}
        </h1>
        <p className="text-white/40 text-sm mt-1">Your productivity is up 12% today.</p>
      </div>

      <div className="flex items-center gap-6 mr-6">
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border backdrop-blur-md transition-all duration-500",
          consecutiveMissedDays >= 2 ? "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/5" : "border-white/10"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300",
              consecutiveMissedDays >= 2 
                ? "bg-orange-500/30 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse" 
                : "bg-orange-500/20 border-orange-500/30"
            )}>
              <Flame className={cn(
                "w-4 h-4",
                consecutiveMissedDays >= 2 ? "text-orange-400" : "text-orange-500"
              )} fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest leading-none",
                consecutiveMissedDays >= 2 ? "text-orange-400" : "text-white/40"
              )}>
                {consecutiveMissedDays >= 2 ? "CRITICAL STREAK" : "Streak"}
              </span>
              <span className="text-sm font-sans font-bold text-white">{streak} DAYS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center border border-neon-green/30">
              <ShieldCheck className="w-4 h-4 text-neon-green" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Level</span>
              <span className="text-sm font-sans font-bold text-neon-green neon-glow">Level {level}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 mx-4" />
          <button 
            onClick={() => onShowBadges?.()}
            className="flex items-center gap-2 group/badge"
          >
            <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center border border-neon-green/40 shadow-[0_0_15px_rgba(0,230,118,0.2)] group-hover/badge:shadow-[0_0_20px_rgba(0,230,118,0.4)] group-hover/badge:border-neon-green/60 transition-all">
              <Trophy className="w-4 h-4 text-neon-green" />
            </div>
            <div className="flex flex-col justify-center text-left h-full">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1.5 group-hover/badge:text-white/50 transition-colors">Badges</span>
              <div className="flex gap-2 items-center">
                {equippedBadges.map((badgeId, i) => {
                  const badge = BADGES.find(b => b.id === badgeId);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "w-7 h-7 rounded-lg border transition-all relative overflow-hidden flex items-center justify-center",
                        badge && typeof badge.icon === 'string' ? "bg-transparent border-white/20" : "bg-white/5 border-white/5"
                      )}
                      style={badge ? { 
                        boxShadow: `0 0 10px ${badge.color}22`,
                        borderColor: `${badge.color}44`
                      } : {}}
                    >
                      {badge ? (
                        <>
                          {typeof badge.icon !== 'string' && (
                            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: badge.color }} />
                          )}
                          {typeof badge.icon === 'string' && isValidUrl(badge.icon) ? (
                            <img 
                              src={badge.icon} 
                              alt={badge.title}
                              className="w-4 h-4 relative z-10 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <badge.icon 
                              className="w-4 h-4 relative z-10 drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" 
                              style={{ color: badge.color }} 
                            />
                          )}
                          {badge.category !== 'Special' && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-20">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  (badgeHealth[badge.id] ?? 100) > 60 ? "bg-neon-green" : 
                                  (badgeHealth[badge.id] ?? 100) > 30 ? "bg-yellow-400" : "bg-red-500"
                                )}
                                style={{ width: `${badgeHealth[badge.id] ?? 100}%` }}
                              />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full blur-[4px]" style={{ backgroundColor: badge.color }} />
                        </>
                      ) : (
                        <div className="w-1 h-1 rounded-full bg-white/10 group-hover/badge:bg-neon-green/20 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={cn(
            "relative p-2 rounded-xl border transition-all duration-300",
            notificationsEnabled 
              ? "bg-neon-green/10 border-neon-green/30 hover:bg-neon-green/20" 
              : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
            showNotifications && "ring-2 ring-neon-green/50 border-neon-green/50"
          )}
        >
          <Bell className={cn(
            "w-5 h-5",
            notificationsEnabled ? "text-neon-green" : "text-red-500"
          )} />
          {notifications?.length > 0 && notificationsEnabled && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-neon-green rounded-full border-2 border-[#050505] shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
          )}
          {notifications?.length > 0 && !notificationsEnabled && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute top-full right-0 mt-3 w-80 bg-[#0A0A0A]/95 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-neon-green" />
                Notifications
              </h3>
              <div className="flex gap-2">
                {notifications?.length > 0 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-md hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {(!notifications || notifications.length === 0) ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-white/20" />
                  </div>
                  <p className="text-sm text-white/40">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {(notifications || []).slice(0, 5).map((notif) => (
                    <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors group relative">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-xs font-bold text-white pr-6">{notif.title}</h4>
                        <span className="text-[9px] font-mono text-white/30">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{notif.message}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                setShowNotifications(false);
                onNavigate?.("Notifications");
              }}
              className="w-full p-3 text-center text-xs font-bold text-neon-green bg-neon-green/5 hover:bg-neon-green/10 transition-colors border-t border-white/5"
            >
              View All Alerts
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
