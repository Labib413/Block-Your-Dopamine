import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  ShieldAlert, 
  ShieldCheck,
  Plus, 
  Trash2, 
  Globe, 
  Clock, 
  Lock, 
  Unlock,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Radio,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./GlassCard";
import { useApp } from "../context/AppContext";
import { cn } from "../lib/utils";
import { 
  db, 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot,
  handleFirestoreError,
  OperationType 
} from "../firebase";
import { logDistractionEventInFirestore } from "../lib/firebase";

export interface BlockedTargetDoc {
  id: string;
  targetName: string;
  type: string;
  lockedUntil: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * Sanitize user domain input:
 * Strips "http://", "https://", "www.", paths, query strings, and trailing slashes to obtain the pure hostname.
 */
export function sanitizeDomain(input: string): string {
  if (!input) return "";
  let domain = input.trim().toLowerCase();
  // Strip protocol
  domain = domain.replace(/^https?:\/\//i, "");
  // Strip www. prefix
  domain = domain.replace(/^www\./i, "");
  // Strip paths, queries, fragments
  domain = domain.split("/")[0].split("?")[0].split("#")[0];
  // Strip trailing slashes or spaces
  domain = domain.replace(/\/+$/, "").trim();
  return domain;
}

// Preset duration options in minutes
const DURATION_OPTIONS = [
  { value: 15, label: "15 Minutes" },
  { value: 30, label: "30 Minutes" },
  { value: 60, label: "60 Minutes (1 hr)" },
  { value: 120, label: "120 Minutes (2 hrs)" },
  { value: 180, label: "180 Minutes (3 hrs)" },
  { value: 240, label: "240 Minutes (4 hrs)" },
  { value: 480, label: "480 Minutes (8 hrs)" },
  { value: 1440, label: "1440 Minutes (24 hrs)" },
];

export function DistractionGuard() {
  const { 
    user,
    depexMode, 
    toggleDepexMode, 
    addNotification 
  } = useApp();

  // Form State
  const [domainInput, setDomainInput] = useState("");
  const [durationInput, setDurationInput] = useState<string>("30");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Realtime Blocked Targets from Firestore "blocked_targets" collection
  const [blockedTargets, setBlockedTargets] = useState<BlockedTargetDoc[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [deniedTarget, setDeniedTarget] = useState<BlockedTargetDoc | null>(null);
  const [showConfirmDepex, setShowConfirmDepex] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Clean sanitized preview of current input
  const cleanPreview = useMemo(() => sanitizeDomain(domainInput), [domainInput]);

  // Keep countdowns refreshed every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Real-time synchronization with Firestore collection "blocked_targets"
  useEffect(() => {
    setIsLoadingTargets(true);
    const targetsCol = collection(db, "blocked_targets");

    const unsubscribe = onSnapshot(
      targetsCol,
      (snapshot) => {
        const items: BlockedTargetDoc[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            targetName: data.targetName || "",
            type: data.type || "website",
            lockedUntil: data.lockedUntil || "",
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
            createdAt: data.createdAt || new Date().toISOString()
          };
        });

        // Sort: active locks first, then newest
        items.sort((a, b) => {
          const aTime = new Date(a.lockedUntil).getTime();
          const bTime = new Date(b.lockedUntil).getTime();
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return bTime - aTime;
        });

        setBlockedTargets(items);
        setIsLoadingTargets(false);
      },
      (error) => {
        console.error("[DistractionGuard] Firestore snapshot error:", error);
        setErrorMessage("Failed to sync blocked targets from Firebase.");
        setIsLoadingTargets(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Clear notifications after timeout
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // Compute remaining time in minutes
  const getRemainingMinutes = (lockedUntilIso: string): number => {
    if (!lockedUntilIso) return 0;
    const expiry = new Date(lockedUntilIso).getTime();
    const diffMs = expiry - currentTime;
    return Math.max(0, Math.ceil(diffMs / (60 * 1000)));
  };

  // Form submission handler
  const handleBlockWebsite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanDomain = sanitizeDomain(domainInput);

    if (!cleanDomain) {
      setErrorMessage("Please enter a valid website domain.");
      return;
    }

    // Basic domain validation
    if (!cleanDomain.includes(".") || cleanDomain.length < 4) {
      setErrorMessage("Please enter a valid hostname (e.g. facebook.com, youtube.com).");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expiration time (lockedUntil) in ISO string format
      const parsedMinutes = parseInt(durationInput, 10);
      const minutes = !isNaN(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : selectedDuration;

      if (!minutes || minutes <= 0) {
        setErrorMessage("Please enter a valid duration in minutes (e.g. 15, 30, 45).");
        setIsSubmitting(false);
        return;
      }

      const lockedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();

      // Required payload structure for Chrome Extension & Backend
      const payload = {
        targetName: cleanDomain,
        type: "website",
        lockedUntil: lockedUntil,
        duration: minutes,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      // Write to Firestore collection "blocked_targets"
      await addDoc(collection(db, "blocked_targets"), payload);

      // Log event in user analytics if logged in
      if (user?.id) {
        logDistractionEventInFirestore(user.id, {
          websiteName: cleanDomain,
          websiteUrl: cleanDomain,
          action: 'lock_activated'
        });
      }

      addNotification?.(
        "Website Blocked",
        `${cleanDomain} is locked for ${minutes} minutes via Distraction Guard.`
      );

      setSuccessMessage(`Shield Active: ${cleanDomain} locked for ${minutes}m`);
      setDomainInput("");
    } catch (err: any) {
      console.error("[DistractionGuard] Write error:", err);
      setErrorMessage(
        err?.message || "Failed to block website. Check your Firebase database connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status or unlock target
  const handleToggleTargetStatus = async (target: BlockedTargetDoc) => {
    if (depexMode && target.isActive) {
      setErrorMessage("Cannot unlock targets while DEPEX Mode is active.");
      return;
    }

    try {
      const targetRef = doc(db, "blocked_targets", target.id);
      const newStatus = !target.isActive;
      await updateDoc(targetRef, {
        isActive: newStatus
      });

      if (user?.id && !newStatus) {
        logDistractionEventInFirestore(user.id, {
          websiteName: target.targetName,
          websiteUrl: target.targetName,
          action: 'site_unlocked'
        });
      }

      setSuccessMessage(`${target.targetName} ${newStatus ? 're-locked' : 'unlocked'}.`);
    } catch (err: any) {
      console.error("[DistractionGuard] Update error:", err);
      setErrorMessage("Failed to update target status.");
    }
  };

  // Delete target from Firestore
  const handleDeleteTarget = async (id: string, targetName: string) => {
    if (depexMode) {
      setErrorMessage("Deletion is forbidden while DEPEX Mode is engaged.");
      return;
    }

    try {
      await deleteDoc(doc(db, "blocked_targets", id));
      setSuccessMessage(`Removed ${targetName} from guarded list.`);
    } catch (err: any) {
      console.error("[DistractionGuard] Delete error:", err);
      setErrorMessage("Failed to remove blocked target.");
    }
  };

  // Inspect or attempt navigation to target
  const handleTargetActionClick = (target: BlockedTargetDoc) => {
    const remaining = getRemainingMinutes(target.lockedUntil);
    const isLocked = target.isActive && remaining > 0;

    if (isLocked) {
      setDeniedTarget(target);
      if (user?.id) {
        logDistractionEventInFirestore(user.id, {
          websiteName: target.targetName,
          websiteUrl: target.targetName,
          action: 'access_intercepted'
        });
      }
    } else {
      window.open(`https://${target.targetName}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <GlassCard 
      className={cn(
        "col-span-12 lg:col-span-4 border-gray-800 bg-[#121417]/80 backdrop-blur-xl rounded-2xl p-6 relative overflow-visible transition-all duration-500 h-full flex flex-col",
        depexMode && "ring-1 ring-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.25)] border-red-500/40"
      )}
      hoverEffect={false}
    >
      {/* Depex Mode Ambient Glow */}
      {depexMode && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(239,68,68,0.12)_100%)]" />
        </div>
      )}

      {/* Header Bar */}
      <div className="relative z-10 flex items-start justify-between mb-5">
        <div className="flex items-start gap-3.5">
          <div className={cn(
            "w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center relative overflow-visible shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all",
            depexMode && "bg-red-500/25 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          )}>
            <ShieldAlert className={cn("w-5 h-5 text-red-500", depexMode && "animate-pulse")} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold text-red-500/80 uppercase tracking-[0.2em]">
                CHROME EXTENSION SYNC
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Realtime Firestore Live" />
            </div>
            <h3 className="text-lg font-sans font-bold text-white tracking-tight">Distraction Guard</h3>
          </div>
        </div>

        {/* Depex Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-[0.15em] transition-colors",
            depexMode ? "text-red-500" : "text-white/25"
          )}>
            DEPEX
          </span>
          <button 
            type="button"
            onClick={() => depexMode ? toggleDepexMode() : setShowConfirmDepex(true)}
            className={cn(
              "w-9 h-5 rounded-full relative transition-all duration-300 border cursor-pointer",
              depexMode ? "bg-red-500 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "bg-white/5 border-white/10"
            )}
            title={depexMode ? "Deactivate Depex Mode" : "Activate Depex Mode"}
          >
            <motion.div 
              className={cn(
                "absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all",
                depexMode ? "bg-white" : "bg-white/30"
              )}
              animate={{ left: depexMode ? 18 : 2 }}
            />
          </button>
        </div>
      </div>

      {/* Status Alerts Feedback */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span className="font-medium truncate">{successMessage}</span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400/60 hover:text-emerald-400 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className="font-medium truncate">{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-red-400/60 hover:text-red-400 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Form: Input Domain + Duration Dropdown */}
      <form onSubmit={handleBlockWebsite} className="space-y-3 mb-5">
        <div className="space-y-2">
          {/* Target Domain Input */}
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="e.g. facebook.com, youtube.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/60 transition-all font-mono shadow-inner disabled:opacity-50"
            />
            {domainInput && (
              <button
                type="button"
                onClick={() => setDomainInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sanitized Domain Preview Hint */}
          {cleanPreview && cleanPreview !== domainInput && (
            <div className="text-[10px] text-white/40 px-1 font-mono flex items-center gap-1">
              <span>Sanitized target:</span>
              <span className="text-red-400 font-bold">{cleanPreview}</span>
            </div>
          )}
        </div>

        {/* Duration Input (Keyboard + Quick Presets) & Action Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <input
              type="number"
              min="1"
              max="10080"
              placeholder="Duration in mins"
              value={durationInput}
              onChange={(e) => {
                const val = e.target.value;
                setDurationInput(val);
                const num = parseInt(val, 10);
                if (!isNaN(num) && num > 0) {
                  setSelectedDuration(num);
                }
              }}
              disabled={isSubmitting}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-14 py-2.5 text-xs text-white font-mono placeholder:text-white/25 focus:outline-none focus:border-red-500/60 transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-red-400/80 uppercase pointer-events-none">
              MINS
            </span>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !cleanPreview}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-[0.18em] transition-all shadow-[0_2px_12px_rgba(220,38,38,0.3)] hover:shadow-[0_0_18px_rgba(220,38,38,0.5)] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locking...</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Engage Guard</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Duration Preset Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-wider mr-1">Quick:</span>
          {[15, 30, 45, 60, 120, 240].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setDurationInput(String(preset));
                setSelectedDuration(preset);
              }}
              className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-mono transition-all border cursor-pointer",
                (durationInput === String(preset) || selectedDuration === preset)
                  ? "bg-red-500/20 border-red-500/50 text-red-300 font-bold shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                  : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              {preset >= 60 ? `${preset / 60}h` : `${preset}m`}
            </button>
          ))}
        </div>
      </form>

      {/* Blocked Targets Realtime Feed */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">
              BLOCKED TARGETS ({blockedTargets.length})
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/30">
            collection: blocked_targets
          </span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-[160px] max-h-[300px] custom-scrollbar">
          {isLoadingTargets ? (
            <div className="h-full flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            </div>
          ) : blockedTargets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 border border-dashed border-white/5 rounded-xl opacity-40 text-center px-4">
              <ShieldCheck className="w-7 h-7 mb-2 text-white/40" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                No Websites Currently Blocked
              </p>
              <p className="text-[9px] text-white/30 mt-1">
                Targets added here sync immediately with your BYD Chrome Extension.
              </p>
            </div>
          ) : (
            blockedTargets.map((target) => {
              const remaining = getRemainingMinutes(target.lockedUntil);
              const isLocked = target.isActive && remaining > 0;

              return (
                <div 
                  key={target.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10 group/item transition-all duration-200",
                    isLocked 
                      ? "border-red-500/40 bg-red-500/[0.08] shadow-[inner_0_0_15px_rgba(239,68,68,0.08)]" 
                      : "opacity-60 hover:opacity-100 hover:border-white/10"
                  )}
                >
                  {/* Left info: Icon & Domain */}
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isLocked ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-white/5 text-white/40"
                    )}>
                      {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </div>
                    
                    <div className="overflow-hidden min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-white truncate">
                          {target.targetName}
                        </span>
                        {isLocked ? (
                          <span className="text-[9px] font-black text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0 animate-pulse">
                            {remaining}m LEFT
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono text-white/30 truncate flex items-center gap-1.5 mt-0.5">
                        <span>{target.type}</span>
                        <span>•</span>
                        <span>Locked until: {new Date(target.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions: Intercept / Unlock / Delete */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isLocked ? (
                      <button 
                        type="button"
                        onClick={() => handleTargetActionClick(target)}
                        className="px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        title="Simulate Interception"
                      >
                        TEST
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleToggleTargetStatus(target)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        title="Re-activate Lock"
                      >
                        RE-LOCK
                      </button>
                    )}

                    {!depexMode && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteTarget(target.id, target.targetName)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete from Blocked Targets"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Access Denied Overlay Alert */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {deniedTarget && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
              onClick={() => setDeniedTarget(null)}
            >
              <motion.div 
                initial={{ scale: 0.92, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 15 }}
                className="bg-black border border-red-500 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-[0_0_90px_rgba(239,68,68,0.35)] relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(239,68,68,0.4)]">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-sans font-black text-red-500 uppercase tracking-tighter mb-2 italic">
                  ACCESS INTERCEPTED
                </h2>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6 font-medium uppercase tracking-wider">
                  BYD CHROME GUARD ACTIVE.<br/>
                  <span className="text-red-500 font-bold">{deniedTarget.targetName}</span> IS RESTRICTED FOR ANOTHER <span className="text-white font-bold">{getRemainingMinutes(deniedTarget.lockedUntil)} MINUTES</span>.
                </p>
                <button 
                  onClick={() => setDeniedTarget(null)}
                  className="w-full py-3.5 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-red-500 transition-all cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  ACKNOWLEDGE
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Depex Confirmation Modal */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {showConfirmDepex && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md"
              onClick={() => setShowConfirmDepex(false)}
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-[#121417] border border-gray-700/80 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-5 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-sans font-bold text-white tracking-tight mb-2">Engage DEPEX Mode?</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mb-6 px-2">
                    Activating DEPEX Mode locks in strict security restraints across all guarded targets:
                  </p>
                  
                  <div className="w-full space-y-3 mb-6 text-left bg-black/40 p-4 sm:p-5 rounded-xl border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-300 leading-snug">All active blocked targets become unbreakable.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-300 leading-snug">Delete and early unlock controls are disabled.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-300 leading-snug">Synced across your Chrome Extension and Web Dashboard.</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end w-full gap-3">
                    <button 
                      onClick={() => setShowConfirmDepex(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 font-bold text-xs hover:bg-white/5 hover:text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        toggleDepexMode();
                        if (user?.id) {
                          logDistractionEventInFirestore(user.id, {
                            websiteName: 'Global Shield',
                            websiteUrl: 'all',
                            action: 'depex_activated'
                          });
                        }
                        setShowConfirmDepex(false);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 cursor-pointer"
                    >
                      Confirm Depex
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </GlassCard>
  );
}
