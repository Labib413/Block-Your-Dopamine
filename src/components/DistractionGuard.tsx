import React, { useState, useEffect, useMemo, useRef } from "react";
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
  auth,
  db, 
  collection, 
  deleteDoc, 
  doc, 
  onSnapshot,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType 
} from "../firebase";
import { writeBatch } from "firebase/firestore";
import { logDistractionEventInFirestore } from "../lib/firebase";

export interface BlockedTargetDoc {
  id: string;
  docIds: string[];
  userId: string;
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

function parseDomainsFromInput(rawInput: string): string[] {
  if (!rawInput.trim()) return [];
  const parts = rawInput.split(/[\s,;]+/).map(sanitizeDomain).filter(Boolean);
  return Array.from(new Set(parts));
}

function getTargetDocId(domain: string): string {
  return `target_${domain.replace(/[^a-z0-9_\-]/gi, "_")}`.slice(0, 120);
}

function getExtensionSyncDocId(uid: string, domain: string): string {
  const safeUid = uid.replace(/[^a-zA-Z0-9_\-]/g, "_").slice(0, 48);
  const safeDomain = domain.replace(/[^a-zA-Z0-9_\-]/gi, "_").slice(0, 64);
  return `sync_${safeUid}_${safeDomain}`;
}

function getUserTargetsCacheKey(uid: string): string {
  return `byd_user_blocked_targets_${uid}`;
}

export function DistractionGuard() {
  const { 
    user,
    depexMode, 
    toggleDepexMode, 
    addNotification,
    setIsAuthModalOpen
  } = useApp();

  // Track verified Firebase Auth UID so Firestore queries strictly match request.auth.uid
  const [firebaseUid, setFirebaseUid] = useState<string | null>(() => auth.currentUser?.uid || null);
  const [authChecked, setAuthChecked] = useState<boolean>(() => Boolean(auth.currentUser));

  // Form State
  const [domainInput, setDomainInput] = useState("");
  const [durationInput, setDurationInput] = useState<string>("30");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Realtime Per-User Saved & Blocked Targets from "/users/{uid}/blocked_targets"
  const [blockedTargets, setBlockedTargets] = useState<BlockedTargetDoc[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [deniedTarget, setDeniedTarget] = useState<BlockedTargetDoc | null>(null);
  const [showConfirmDepex, setShowConfirmDepex] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const syncedExtFingerprintsRef = useRef<Map<string, string>>(new Map());

  // Clean sanitized preview of current input (supports single or comma-separated domains)
  const parsedInputDomains = useMemo(() => parseDomainsFromInput(domainInput), [domainInput]);
  const cleanPreview = parsedInputDomains[0] || "";

  // Sync Firebase Auth UID directly from Firebase SDK
  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        if (mounted) {
          setFirebaseUid(fbUser.uid);
          setAuthChecked(true);
        }
        return;
      }
      try {
        if (typeof (auth as any).authStateReady === "function") {
          await (auth as any).authStateReady();
        }
      } catch {}
      if (!mounted) return;
      setFirebaseUid(auth.currentUser?.uid || null);
      setAuthChecked(true);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  // Effective authenticated owner UID (must match both AppContext user and Firebase Auth session)
  const ownerUid = user?.id && firebaseUid && user.id === firebaseUid ? firebaseUid : null;

  // Keep countdowns refreshed every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Real-time synchronization strictly scoped to "/users/{ownerUid}/blocked_targets"
  useEffect(() => {
    // Reset transient UI whenever user account changes or logs out
    setDomainInput("");
    setDeniedTarget(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    syncedExtFingerprintsRef.current.clear();

    if (!user || !ownerUid) {
      setBlockedTargets([]);
      setIsLoadingTargets(!authChecked && Boolean(user));
      return;
    }

    // Hydrate current user's own cached targets immediately while realtime snapshot connects
    try {
      const rawCache = localStorage.getItem(getUserTargetsCacheKey(ownerUid));
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (Array.isArray(parsed)) {
          setBlockedTargets(parsed.filter((item) => item && item.userId === ownerUid));
        }
      } else {
        setBlockedTargets([]);
      }
    } catch {
      setBlockedTargets([]);
    }

    setIsLoadingTargets(true);
    const userTargetsPath = `users/${ownerUid}/blocked_targets`;
    const targetsCol = collection(db, "users", ownerUid, "blocked_targets");

    const unsubscribe = onSnapshot(
      targetsCol,
      (snapshot) => {
        const domainMap = new Map<string, BlockedTargetDoc>();
        const now = Date.now();

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          // Strict ownership guard: ignore any document that belongs to a different userId
          if (data.userId && data.userId !== ownerUid) return;

          const normalizedName = sanitizeDomain(data.targetName || "");
          if (!normalizedName) return;

          const candidateLockedUntil = data.lockedUntil || "";
          const candidateActive = data.isActive !== undefined ? Boolean(data.isActive) : false;
          const candidateExpiry = candidateLockedUntil ? new Date(candidateLockedUntil).getTime() : 0;
          const candidateIsLocked = candidateActive && candidateExpiry > now;
          const candidateCreatedAt = data.createdAt || new Date().toISOString();

          const existing = domainMap.get(normalizedName);
          if (!existing) {
            domainMap.set(normalizedName, {
              id: docSnap.id,
              docIds: [docSnap.id],
              userId: ownerUid,
              targetName: normalizedName,
              type: data.type || "website",
              lockedUntil: candidateLockedUntil,
              isActive: candidateActive,
              createdAt: candidateCreatedAt
            });
          } else {
            existing.docIds.push(docSnap.id);
            const existingExpiry = existing.lockedUntil ? new Date(existing.lockedUntil).getTime() : 0;
            const existingIsLocked = existing.isActive && existingExpiry > now;

            if (
              (candidateIsLocked && !existingIsLocked) ||
              (candidateIsLocked && existingIsLocked && candidateExpiry > existingExpiry) ||
              (!candidateIsLocked && !existingIsLocked && candidateCreatedAt > existing.createdAt)
            ) {
              existing.id = docSnap.id;
              existing.lockedUntil = candidateLockedUntil;
              existing.isActive = candidateActive;
              existing.createdAt = candidateCreatedAt;
            }
          }
        });

        const items = Array.from(domainMap.values());

        // Sort: active locks first, then creation order
        items.sort((a, b) => {
          const aLocked = a.isActive && (a.lockedUntil ? new Date(a.lockedUntil).getTime() > now : false);
          const bLocked = b.isActive && (b.lockedUntil ? new Date(b.lockedUntil).getTime() > now : false);
          if (aLocked && !bLocked) return -1;
          if (!aLocked && bLocked) return 1;
          return a.createdAt.localeCompare(b.createdAt);
        });

        setBlockedTargets(items);
        setIsLoadingTargets(false);
        try {
          localStorage.setItem(getUserTargetsCacheKey(ownerUid), JSON.stringify(items));
        } catch {}

        // Auto-reconcile active & expired locks with top-level "/blocked_targets" so Chrome Extension stays connected
        if (auth.currentUser?.uid === ownerUid) {
          const reconBatch = writeBatch(db);
          let hasReconOps = false;

          items.forEach((item) => {
            const expiry = item.lockedUntil ? new Date(item.lockedUntil).getTime() : 0;
            const isCurrentlyLocked = item.isActive && expiry > now;
            const fingerprint = `${isCurrentlyLocked ? "1" : "0"}:${item.lockedUntil}`;
            const prevFingerprint = syncedExtFingerprintsRef.current.get(item.targetName);

            if (prevFingerprint === fingerprint) return;
            syncedExtFingerprintsRef.current.set(item.targetName, fingerprint);

            const extRef = doc(db, "blocked_targets", getExtensionSyncDocId(ownerUid, item.targetName));
            const legacyUnownedRef = doc(db, "blocked_targets", getTargetDocId(item.targetName));

            if (isCurrentlyLocked) {
              reconBatch.set(extRef, {
                userId: ownerUid,
                targetName: item.targetName,
                type: item.type || "website",
                lockedUntil: item.lockedUntil,
                duration: Math.max(1, Math.ceil((expiry - now) / (60 * 1000))),
                isActive: true,
                createdAt: item.createdAt || new Date().toISOString()
              });
              reconBatch.delete(legacyUnownedRef);
              hasReconOps = true;
            } else if (item.isActive && expiry > 0 && expiry <= now) {
              // Clean up naturally expired lock in both private subcollection and Chrome Extension mirror
              const userDocRef = doc(db, "users", ownerUid, "blocked_targets", item.id);
              reconBatch.set(userDocRef, {
                userId: ownerUid,
                targetName: item.targetName,
                type: item.type || "website",
                lockedUntil: "",
                duration: 0,
                isActive: false,
                createdAt: item.createdAt || new Date().toISOString()
              });
              reconBatch.delete(extRef);
              reconBatch.delete(legacyUnownedRef);
              hasReconOps = true;
            }
          });

          if (hasReconOps) {
            reconBatch.commit().catch((err) => {
              console.warn("[DistractionGuard] Extension sync reconciliation warning:", err);
            });
          }
        }
      },
      (error) => {
        if (!auth.currentUser || auth.currentUser.uid !== ownerUid) {
          setBlockedTargets([]);
          setIsLoadingTargets(false);
          return;
        }
        try {
          handleFirestoreError(error, OperationType.LIST, userTargetsPath);
        } catch {
          setErrorMessage("Failed to sync your private targets from Firebase.");
          setIsLoadingTargets(false);
        }
      }
    );

    return () => unsubscribe();
  }, [user, ownerUid, authChecked]);

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
    if (isNaN(expiry)) return 0;
    const diffMs = expiry - currentTime;
    return Math.max(0, Math.ceil(diffMs / (60 * 1000)));
  };

  const activeLockedCount = useMemo(
    () => blockedTargets.filter((t) => t.isActive && getRemainingMinutes(t.lockedUntil) > 0).length,
    [blockedTargets, currentTime]
  );

  // Broadcast live lock state to any installed BYD Chrome Extension content script
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (ownerUid) {
        document.documentElement.dataset.bydUid = ownerUid;
      } else {
        delete document.documentElement.dataset.bydUid;
      }
      const activeDomains = blockedTargets
        .filter((t) => t.isActive && getRemainingMinutes(t.lockedUntil) > 0)
        .map((t) => ({
          userId: ownerUid,
          targetName: t.targetName,
          type: t.type,
          lockedUntil: t.lockedUntil,
          isActive: true
        }));
      window.postMessage(
        {
          source: "BYD_WEB_APP",
          type: "BYD_EXTENSION_SYNC",
          userId: ownerUid,
          depexMode,
          blockedTargets: activeDomains
        },
        "*"
      );
    } catch {}
  }, [ownerUid, depexMode, blockedTargets, currentTime]);

  // Require an authenticated Firebase account before modifying personal targets
  const requireAuthenticatedOwner = (): string | null => {
    const currentAuthUid = auth.currentUser?.uid || null;
    if (!user?.id || !currentAuthUid || user.id !== currentAuthUid) {
      setErrorMessage("Please sign in to your account to save or lock personal targets.");
      setIsAuthModalOpen?.(true);
      return null;
    }
    return currentAuthUid;
  };

  // Save one or more domains into the current user's private Blocked Targets list
  const handleSaveTarget = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeOwnerUid = requireAuthenticatedOwner();
    if (!activeOwnerUid) return;

    if (parsedInputDomains.length === 0) {
      setErrorMessage("Enter a link to save (e.g. facebook.com, instagram.com).");
      return;
    }

    const invalidDomain = parsedInputDomains.find((d) => !d.includes(".") || d.length < 4);
    if (invalidDomain) {
      setErrorMessage(`Invalid domain "${invalidDomain}". Use format like facebook.com.`);
      return;
    }

    const existingSet = new Set(blockedTargets.map((t) => t.targetName));
    const newDomains = parsedInputDomains.filter((d) => !existingSet.has(d));

    if (newDomains.length === 0) {
      setDomainInput("");
      setSuccessMessage("Already saved in your Blocked Targets.");
      return;
    }

    setIsSavingLink(true);
    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      newDomains.forEach((domain) => {
        const docRef = doc(db, "users", activeOwnerUid, "blocked_targets", getTargetDocId(domain));
        batch.set(docRef, {
          userId: activeOwnerUid,
          targetName: domain,
          type: "website",
          lockedUntil: "",
          duration: 0,
          isActive: false,
          createdAt: nowIso
        });
      });

      await batch.commit();
      setDomainInput("");
      setSuccessMessage(
        newDomains.length === 1
          ? `Saved ${newDomains[0]} to your Blocked Targets`
          : `Saved ${newDomains.length} links to your Blocked Targets`
      );
    } catch (err: any) {
      console.error("[DistractionGuard] Save link error:", err);
      setErrorMessage(err?.message || "Failed to save link to your account.");
    } finally {
      setIsSavingLink(false);
    }
  };

  // Engage Guard: Locks ALL saved links in the current user's Blocked Targets at once
  const handleEngageGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeOwnerUid = requireAuthenticatedOwner();
    if (!activeOwnerUid) return;

    if (parsedInputDomains.length > 0) {
      const invalidDomain = parsedInputDomains.find((d) => !d.includes(".") || d.length < 4);
      if (invalidDomain) {
        setErrorMessage(`Invalid domain "${invalidDomain}". Use format like facebook.com.`);
        return;
      }
    }

    const allTargetDomains = Array.from(
      new Set([
        ...blockedTargets.filter((t) => t.userId === activeOwnerUid).map((t) => t.targetName),
        ...parsedInputDomains
      ])
    );

    if (allTargetDomains.length === 0) {
      setErrorMessage("Save at least one website link first, then click Engage Guard.");
      return;
    }

    const parsedMinutes = parseInt(durationInput, 10);
    const minutes = !isNaN(parsedMinutes) && parsedMinutes > 0 ? parsedMinutes : selectedDuration;

    if (!minutes || minutes <= 0) {
      setErrorMessage("Please enter a valid duration in minutes (e.g. 15, 30, 60).");
      return;
    }

    setIsSubmitting(true);

    try {
      const nowIso = new Date().toISOString();
      const lockedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      const batch = writeBatch(db);
      const existingByDomain = new Map<string, BlockedTargetDoc>(
        blockedTargets
          .filter((t) => t.userId === activeOwnerUid)
          .map((t): [string, BlockedTargetDoc] => [t.targetName, t])
      );

      allTargetDomains.forEach((domain) => {
        const existing = existingByDomain.get(domain);
        const primaryId = existing ? existing.id : getTargetDocId(domain);
        const targetRef = doc(db, "users", activeOwnerUid, "blocked_targets", primaryId);
        const extSyncRef = doc(db, "blocked_targets", getExtensionSyncDocId(activeOwnerUid, domain));

        const lockPayload = {
          userId: activeOwnerUid,
          targetName: domain,
          type: "website",
          lockedUntil,
          duration: minutes,
          isActive: true,
          createdAt: existing?.createdAt || nowIso
        };

        // 1. Update private per-user target document (for Web Dashboard)
        batch.set(targetRef, lockPayload);
        // 2. Mirror active lock to top-level "/blocked_targets" (for real-time Chrome Extension blocking)
        batch.set(extSyncRef, lockPayload);
        // Remove any legacy unowned doc for the same domain so it cannot shadow active lock state
        batch.delete(doc(db, "blocked_targets", getTargetDocId(domain)));
        syncedExtFingerprintsRef.current.set(domain, `1:${lockedUntil}`);

        // Clean up any duplicate documents owned by this user for the same domain
        if (existing && existing.docIds.length > 1) {
          existing.docIds.forEach((dupId) => {
            if (dupId !== primaryId) {
              batch.delete(doc(db, "users", activeOwnerUid, "blocked_targets", dupId));
            }
          });
        }
      });

      await batch.commit();

      allTargetDomains.forEach((domain) => {
        logDistractionEventInFirestore(activeOwnerUid, {
          websiteName: domain,
          websiteUrl: domain,
          action: "lock_activated"
        });
      });

      addNotification?.(
        "Distraction Guard Engaged",
        `Locked ${allTargetDomains.length} saved ${allTargetDomains.length === 1 ? "target" : "targets"} for ${minutes} minutes.`
      );

      setSuccessMessage(
        `Shield Active: ${allTargetDomains.length} ${allTargetDomains.length === 1 ? "target" : "targets"} locked for ${minutes}m`
      );
      if (domainInput) setDomainInput("");
    } catch (err: any) {
      console.error("[DistractionGuard] Batch lock error:", err);
      setErrorMessage(
        err?.message || "Failed to engage guard. Check your Firebase database connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete saved target strictly from the signed-in owner's subcollection
  const handleDeleteTarget = async (target: BlockedTargetDoc) => {
    if (depexMode) {
      setErrorMessage("Deletion is forbidden while DEPEX Mode is engaged.");
      return;
    }

    const activeOwnerUid = requireAuthenticatedOwner();
    if (!activeOwnerUid) return;

    if (target.userId && target.userId !== activeOwnerUid) {
      setErrorMessage("Unauthorized: You can only modify your own targets.");
      return;
    }

    try {
      const batch = writeBatch(db);
      const idsToDelete = target.docIds?.length ? target.docIds : [target.id];
      idsToDelete.forEach((docId) => {
        batch.delete(doc(db, "users", activeOwnerUid, "blocked_targets", docId));
      });
      // Also remove from Chrome Extension sync mirror immediately
      batch.delete(doc(db, "blocked_targets", getExtensionSyncDocId(activeOwnerUid, target.targetName)));
      batch.delete(doc(db, "blocked_targets", getTargetDocId(target.targetName)));
      syncedExtFingerprintsRef.current.delete(target.targetName);

      await batch.commit();
      setSuccessMessage(`Removed ${target.targetName} from your saved targets.`);
    } catch (err: any) {
      console.error("[DistractionGuard] Delete error:", err);
      setErrorMessage("Failed to remove saved target.");
    }
  };

  // Cancel active lock on a target while keeping the link saved in Blocked Targets
  const handleCancelTargetLock = async (target: BlockedTargetDoc) => {
    if (depexMode) {
      setErrorMessage("Cancelling lock is forbidden while DEPEX Mode is engaged.");
      return;
    }

    const activeOwnerUid = requireAuthenticatedOwner();
    if (!activeOwnerUid) return;

    if (target.userId && target.userId !== activeOwnerUid) {
      setErrorMessage("Unauthorized: You can only modify your own targets.");
      return;
    }

    // Optimistic UI update for instant feel
    const previousTargets = blockedTargets;
    setBlockedTargets((prev) =>
      prev.map((item) =>
        item.targetName === target.targetName
          ? { ...item, isActive: false, lockedUntil: "" }
          : item
      )
    );

    try {
      const batch = writeBatch(db);
      const primaryId = target.id || getTargetDocId(target.targetName);
      const targetRef = doc(db, "users", activeOwnerUid, "blocked_targets", primaryId);
      const extSyncRef = doc(db, "blocked_targets", getExtensionSyncDocId(activeOwnerUid, target.targetName));

      batch.set(targetRef, {
        userId: activeOwnerUid,
        targetName: target.targetName,
        type: target.type || "website",
        lockedUntil: "",
        duration: 0,
        isActive: false,
        createdAt: target.createdAt || new Date().toISOString()
      });
      // Immediately remove active lock from Chrome Extension sync collection so site unblocks right away
      batch.delete(extSyncRef);
      batch.delete(doc(db, "blocked_targets", getTargetDocId(target.targetName)));
      syncedExtFingerprintsRef.current.set(target.targetName, "0:");

      if (target.docIds && target.docIds.length > 1) {
        target.docIds.forEach((dupId) => {
          if (dupId !== primaryId) {
            batch.delete(doc(db, "users", activeOwnerUid, "blocked_targets", dupId));
          }
        });
      }

      await batch.commit();

      logDistractionEventInFirestore(activeOwnerUid, {
        websiteName: target.targetName,
        websiteUrl: target.targetName,
        action: "site_unlocked"
      });

      setSuccessMessage(`Guard cancelled for ${target.targetName}`);
    } catch (err: any) {
      console.error("[DistractionGuard] Cancel lock error:", err);
      setBlockedTargets(previousTargets);
      setErrorMessage("Failed to cancel lock. Please try again.");
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

      {/* Save Target Links + Global Timer Engage Guard Form */}
      <form onSubmit={handleEngageGuard} className="space-y-3 mb-5">
        <div className="space-y-2">
          {/* Save Domain Input + Save Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Save link (e.g. facebook.com)"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && domainInput.trim()) {
                    e.preventDefault();
                    handleSaveTarget();
                  }
                }}
                disabled={isSavingLink || isSubmitting}
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/60 transition-all font-mono shadow-inner disabled:opacity-50"
              />
              {domainInput && (
                <button
                  type="button"
                  onClick={() => setDomainInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveTarget}
              disabled={isSavingLink || isSubmitting || !cleanPreview}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-white font-bold text-[10px] uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]"
              title="Save link to your personal Blocked Targets"
            >
              {isSavingLink ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-red-400" />
              )}
              <span>Save</span>
            </button>
          </div>

          {/* Sanitized Domain Preview Hint */}
          {cleanPreview && cleanPreview !== domainInput.trim().toLowerCase() && (
            <div className="text-[10px] text-white/40 px-1 font-mono flex items-center gap-1">
              <span>Sanitized target:</span>
              <span className="text-red-400 font-bold">{parsedInputDomains.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Duration Input (Keyboard + Quick Presets) & Bulk Engage Guard Button */}
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
            disabled={isSubmitting || (blockedTargets.length === 0 && !cleanPreview)}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-[0.18em] transition-all shadow-[0_2px_12px_rgba(220,38,38,0.3)] hover:shadow-[0_0_18px_rgba(220,38,38,0.5)] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            title="Lock all saved targets in your Blocked Targets for the selected duration"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Locking All...</span>
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

      {/* Blocked Targets Saved Links List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Radio className={cn("w-3 h-3", activeLockedCount > 0 ? "text-red-500 animate-pulse" : "text-white/30")} />
            <span className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider">
              BLOCKED TARGETS ({blockedTargets.length})
            </span>
          </div>
          {activeLockedCount > 0 ? (
            <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
              {activeLockedCount} LOCKED
            </span>
          ) : (
            <span className="text-[9px] font-mono text-white/30">
              {!user ? "Sign in required" : blockedTargets.length > 0 ? "Ready to lock" : "Private targets"}
            </span>
          )}
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-[160px] max-h-[300px] custom-scrollbar">
          {isLoadingTargets ? (
            <div className="h-full flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            </div>
          ) : !user ? (
            <div className="h-full flex flex-col items-center justify-center py-8 border border-dashed border-white/5 rounded-xl opacity-60 text-center px-4">
              <Lock className="w-6 h-6 mb-2 text-white/40" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Sign In For Personal Targets
              </p>
              <p className="text-[9px] text-white/35 mt-1">
                Your saved websites and locks are private to your account only.
              </p>
            </div>
          ) : blockedTargets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 border border-dashed border-white/5 rounded-xl opacity-50 text-center px-4">
              <ShieldCheck className="w-7 h-7 mb-2 text-white/40" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                No Saved Targets Yet
              </p>
              <p className="text-[9px] text-white/35 mt-1">
                Save links like facebook.com or instagram.com once, then click Engage Guard anytime to lock all together.
              </p>
            </div>
          ) : (
            blockedTargets.map((target) => {
              const remaining = getRemainingMinutes(target.lockedUntil);
              const isLocked = target.isActive && remaining > 0;

              return (
                <div 
                  key={target.targetName}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl border group/item transition-all duration-200",
                    isLocked 
                      ? "border-red-500/40 bg-red-500/[0.08] shadow-[inner_0_0_15px_rgba(239,68,68,0.08)]" 
                      : "bg-white/[0.03] border-white/[0.08] hover:border-white/15 hover:bg-white/[0.05]"
                  )}
                >
                  {/* Left info: Icon & Saved Domain */}
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                      isLocked
                        ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        : "bg-white/5 border border-white/10 text-white/50"
                    )}>
                      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
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
                          <span className="text-[8px] font-mono uppercase tracking-wider text-white/35 bg-white/5 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Saved
                          </span>
                        )}
                      </div>
                      {isLocked && (
                        <div className="text-[9px] font-mono text-red-300/60 truncate flex items-center gap-1.5 mt-0.5">
                          <span>Locked until {new Date(target.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions: Cancel active lock + Delete saved link */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isLocked && !depexMode && (
                      <button 
                        type="button"
                        onClick={() => handleCancelTargetLock(target)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        title="Cancel active lock"
                      >
                        CANCEL
                      </button>
                    )}

                    {!depexMode && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteTarget(target)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                        title="Remove saved link"
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
