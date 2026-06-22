import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Globe, 
  Link as LinkIcon, 
  Clock, 
  Lock, 
  Unlock,
  AlertTriangle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { useApp, GuardedWebsite } from "../context/AppContext";
import { cn, isValidUrl, safeOpen } from "@/src/lib/utils";

export function DistractionGuard() {
  const { 
    guardedWebsites = [], 
    depexMode, 
    addGuardedWebsite, 
    removeGuardedWebsite, 
    toggleDepexMode, 
    updateGuardedWebsite,
    addNotification 
  } = useApp();

  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");
  const [newDurationHours, setNewDurationHours] = useState("00");
  const [newDurationMinutes, setNewDurationMinutes] = useState("30");
  const [showConfirmDepex, setShowConfirmDepex] = useState(false);
  const [deniedSite, setDeniedSite] = useState<GuardedWebsite | null>(null);

  // Timer logic: check for expired locks every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      guardedWebsites.forEach(site => {
        if (site.is_active && site.start_time) {
          const start = new Date(site.start_time).getTime();
          const durationMs = site.duration * 60 * 1000;
          if (now >= start + durationMs) {
            updateGuardedWebsite(site.id, { is_active: false, start_time: null });
            addNotification("Access Restored", `${site.name} is now unlocked.`);
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [guardedWebsites, updateGuardedWebsite, addNotification]);

  const handleAddWebsite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName || !newSiteUrl) return;

    // Security: Validate URL to prevent dangerous protocols
    if (!isValidUrl(newSiteUrl)) {
      addNotification("Invalid URL", "Please enter a valid website address.");
      return;
    }

    const totalMinutes = (parseInt(newDurationHours) || 0) * 60 + (parseInt(newDurationMinutes) || 0);
    if (totalMinutes <= 0) return;

    addGuardedWebsite({
      name: newSiteName,
      url: newSiteUrl,
      duration: totalMinutes
    });

    setNewSiteName("");
    setNewSiteUrl("");
    setNewDurationHours("00");
    setNewDurationMinutes("30");
  };

  const startGuard = (site: GuardedWebsite) => {
    updateGuardedWebsite(site.id, {
      is_active: true,
      start_time: new Date().toISOString()
    });
    addNotification("Lock Activated", `${site.name} is now guarded for ${site.duration} minutes.`);
  };

  const getRemainingTime = (site: GuardedWebsite) => {
    if (!site.is_active || !site.start_time) return 0;
    const now = Date.now();
    const start = new Date(site.start_time).getTime();
    const durationMs = site.duration * 60 * 1000;
    const remaining = Math.max(0, (start + durationMs) - now);
    return Math.ceil(remaining / (60 * 1000));
  };

  const handleLinkClick = (site: GuardedWebsite) => {
    if (site.is_active) {
      setDeniedSite(site);
    } else {
      let url = site.url;
      if (!url.startsWith('http') && !url.startsWith('/')) url = 'https://' + url;

      // Security: Use safeOpen to prevent reverse tabnabbing and validate URL
      safeOpen(url, '_blank');
    }
  };

  return (
    <GlassCard 
      className={cn(
        "col-span-4 border-gray-800 bg-[#1a1d21]/60 backdrop-blur-xl rounded-xl p-6 relative overflow-visible transition-all duration-700 h-full",
        depexMode && "ring-2 ring-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] border-red-500/50"
      )}
      hoverEffect={false}
    >
      {/* Depex Mode Vignette Effect */}
      {depexMode && (
        <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(239,68,68,0.15)_100%)]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center relative overflow-visible shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all",
              depexMode && "bg-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.6)]"
            )}>
              <div className="absolute inset-0 bg-red-500/20 blur-lg opacity-50" />
              <ShieldAlert className={cn("w-6 h-6 text-red-500 relative z-10", depexMode && "animate-pulse")} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-red-500/60 uppercase tracking-[0.2em] mb-0.5">SECURITY PROTOCOL</div>
              <h3 className="text-xl font-sans font-bold text-white tracking-tight">Distraction Guard</h3>
            </div>
          </div>

          {/* Depex Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.15em] transition-colors",
              depexMode ? "text-red-500" : "text-white/20"
            )}>DEPEX</span>
            <button 
              onClick={() => depexMode ? toggleDepexMode() : setShowConfirmDepex(true)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-all duration-300 border",
                depexMode ? "bg-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/5 border-white/10"
              )}
            >
              <motion.div 
                className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all",
                  depexMode ? "bg-white" : "bg-white/20"
                )}
                animate={{ left: depexMode ? 22 : 2 }}
              />
            </button>
          </div>
        </div>
        
        <div className="space-y-5 flex-1 flex flex-col">
          <form onSubmit={handleAddWebsite} className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Website Name (e.g. Facebook)"
                  value={newSiteName}
                  onChange={(e) => setNewSiteName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
                />
              </div>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Website Link (e.g. facebook.com)"
                  value={newSiteUrl}
                  onChange={(e) => setNewSiteUrl(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/50 transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                <Clock className="w-4 h-4 text-white/20" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration</span>
                <div className="flex items-center gap-1 ml-auto">
                  <input 
                    type="text" 
                    value={newDurationHours}
                    onChange={(e) => setNewDurationHours(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                  />
                  <span className="text-white/20">:</span>
                  <input 
                    type="text" 
                    value={newDurationMinutes}
                    onChange={(e) => setNewDurationMinutes(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-8 bg-transparent text-center text-xs font-bold text-white focus:outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={!newSiteName || !newSiteUrl}
                className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 transition-all shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 group active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                Add to Guard
              </button>
            </div>
          </form>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar">
            {guardedWebsites.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-8 border border-dashed border-white/5 rounded-2xl opacity-40">
                <Globe className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Zero Threats Detected</p>
              </div>
            ) : (
              guardedWebsites.map((site) => {
                const remaining = getRemainingTime(site);
                const isActive = site.is_active && remaining > 0;

                return (
                  <div 
                    key={site.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 group/item transition-all",
                      isActive ? "border-red-500/50 bg-red-500/10 shadow-[inner_0_0_20px_rgba(239,68,68,0.1)]" : "hover:border-red-500/30"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                        isActive ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]" : "bg-red-500/10"
                      )}>
                        {isActive ? <Lock className="w-5 h-5 text-white" /> : <LinkIcon className={cn("w-5 h-5 text-red-500", !isActive && "group-hover/item:scale-110 transition-transform")} />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">{site.name}</span>
                          {isActive && (
                            <span className="text-[10px] font-black text-red-500 bg-red-500/20 px-2 py-0.5 rounded-full animate-pulse">
                              {remaining}m LEFT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-red-500/60 truncate">{site.url}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isActive ? (
                        <>
                          <button 
                            onClick={() => startGuard(site)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_10px_transparent] hover:shadow-red-500/40"
                          >
                            LOCK
                          </button>
                          {(!depexMode) && (
                            <button 
                              onClick={() => removeGuardedWebsite(site.id)}
                              className="p-2 rounded-lg hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button 
                          onClick={() => handleLinkClick(site)}
                          className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest"
                        >
                          OPEN LINK
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Access Denied Overlay */}
      <AnimatePresence>
        {deniedSite && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setDeniedSite(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-black border border-red-500 rounded-[32px] p-8 max-w-sm w-full text-center shadow-[0_0_100px_rgba(239,68,68,0.3)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <Lock className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-sans font-black text-red-500 uppercase tracking-tighter mb-2 italic">ACCESS DENIED</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-6 font-medium uppercase tracking-wider">
                BYD PROTOCOL ACTIVE.<br/>
                <span className="text-red-500">{deniedSite.name}</span> IS LOCKED FOR ANOTHER <span className="text-white font-bold">{getRemainingTime(deniedSite)} MINUTES</span>.
              </p>
              <button 
                onClick={() => setDeniedSite(null)}
                className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-red-500 transition-all"
              >
                ACKNOWLEDGE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Depex Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDepex && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#1a1d21] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                
                <h2 className="text-2xl font-sans font-bold text-white tracking-tight mb-2">Activate Depex Mode?</h2>
                <p className="text-gray-400 text-sm mb-6 px-4">
                  This action will apply strict, global focus restraints:
                </p>
                
                <div className="w-full space-y-3 mb-8 text-left bg-black/20 p-5 rounded-xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-tight">All active website locks become permanent.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-tight">Edit and delete functions are disabled.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-1 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-300 leading-tight">Global UI restraints are applied.</p>
                  </div>
                </div>

                <div className="flex items-center justify-end w-full gap-3">
                  <button 
                    onClick={() => setShowConfirmDepex(false)}
                    className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-400 font-bold text-xs hover:bg-white/5 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      toggleDepexMode();
                      setShowConfirmDepex(false);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95"
                  >
                    Confirm Depex
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
