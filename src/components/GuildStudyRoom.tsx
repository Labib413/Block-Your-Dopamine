import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Shield, 
  Zap, 
  Users, 
  Trophy, 
  Flame, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Radio, 
  Clock, 
  Share2, 
  Heart, 
  Coffee, 
  CheckCircle2, 
  BookOpen, 
  X,
  Target,
  MessageSquare,
  Send,
  UserX,
  ShieldAlert,
  Crown,
  Award,
  Settings,
  Search,
  SlidersHorizontal,
  AlertTriangle,
  UserCheck,
  Check,
  UserPlus,
  ChevronRight,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp } from "../context/AppContext";
import { cn } from "@/src/lib/utils";
import { 
  subscribeToGuildCheers, 
  sendGuildCheerInFirebase, 
  GuildCheer,
  GuildMemberDesk,
  subscribeToGuildMembers,
  joinGuildInFirebase,
  updateGuildMemberFocusInFirebase,
  kickGuildMemberInFirebase,
  updateGuildMemberRoleInFirebase,
  updateGuildSettingsInFirebase
} from "../services/communityService";

export type { GuildMemberDesk };

export interface GuildData {
  id: string;
  name: string;
  tag: string;
  description: string;
  leader: string;
  membersCount: number;
  maxMembers: number;
  level: number;
  minLevel?: number;
  rank: number;
  totalXp: number;
  weeklyGoalHours: number;
  joined: boolean;
  memberUserIds?: string[];
  category: "Engineering" | "Medical" | "Varsity" | "General" | "HSC";
  perks: string;
}

interface GuildStudyRoomProps {
  guild: GuildData;
  initialTab?: "Room" | "Leaderboard" | "CheerWall" | "Management";
  onBack: () => void;
  onToggleJoin: (guildId: string) => void;
}

function formatTimer(seconds: number, showHoursAlways = false): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0 || showHoursAlways) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GuildStudyRoom({ guild, initialTab, onBack, onToggleJoin }: GuildStudyRoomProps) {
  const { 
    user, 
    profile, 
    isFocusing, 
    startFocusSession, 
    stopFocusSession,
    totalNetFocusTime,
    level,
    streak
  } = useApp();

  const currentUsername = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const currentFullName = profile?.fullName || user?.user_metadata?.full_name || currentUsername;
  
  // Real-time guild desks loaded from Firestore
  const leaderKey = (guild.leader || "Leader").trim();
  const isMeLeader = Boolean(
    (currentUsername && leaderKey.toLowerCase() === currentUsername.toLowerCase()) || 
    (currentFullName && leaderKey.toLowerCase() === currentFullName.toLowerCase())
  );

  const [desks, setDesks] = useState<GuildMemberDesk[]>([
    {
      id: `desk_leader_${leaderKey.replace(/\s+/g, '_').toLowerCase()}`,
      username: leaderKey,
      fullName: leaderKey,
      role: 'leader',
      isFocusing: isMeLeader ? isFocusing : false,
      focusSecondsToday: isMeLeader ? (totalNetFocusTime || 0) : 21600,
      currentSessionSeconds: 0,
      currentSubject: "Guild Mission",
      streak: isMeLeader ? (streak || 5) : 5,
      level: isMeLeader ? (level || 1) : 1,
      cheersCount: 15,
      isCurrentUser: isMeLeader
    }
  ]);

  const [activeTab, setActiveTab] = useState<"Room" | "Leaderboard" | "CheerWall" | "Management">(initialTab || "Room");
  const [selectedDesk, setSelectedDesk] = useState<GuildMemberDesk | null>(null);
  const [isConfirmingKick, setIsConfirmingKick] = useState(false);
  const [floatingCheers, setFloatingCheers] = useState<{ id: number; deskId: string; emoji: string }[]>([]);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [ambientSoundType, setAmbientSoundType] = useState<"Rain" | "Library" | "WhiteNoise" | "Cafe">("Rain");
  const [cheerMsg, setCheerMsg] = useState("");
  const [guildCheers, setGuildCheers] = useState<GuildCheer[]>([
    { id: "c1", sender: leaderKey, text: `Welcome to [${guild.tag}] ${guild.name}! Push for focus and zero distractions.`, time: "Just now", emoji: "🔥" }
  ]);

  // Management Sub-view State
  const [managementFilter, setManagementFilter] = useState<"All" | "Underperforming" | "Active" | "Officers">("All");
  const [managementSearch, setManagementSearch] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editMinLevel, setEditMinLevel] = useState<number>(guild.minLevel || 1);
  const [editGoalHours, setEditGoalHours] = useState<number>(guild.weeklyGoalHours || 200);
  const [editDesc, setEditDesc] = useState<string>(guild.description || "");
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState("");
  const [memberToKick, setMemberToKick] = useState<GuildMemberDesk | null>(null);
  const [kickReason, setKickReason] = useState("Underperforming / Inactive");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Real-time guild desks subscription from Firestore
  useEffect(() => {
    if (!guild?.id) return;

    const unsub = subscribeToGuildMembers(guild.id, guild.leader, (firestoreDesks) => {
      const mapped: GuildMemberDesk[] = firestoreDesks.map(d => {
        const isMe = 
          (currentUsername && d.username?.toLowerCase() === currentUsername.toLowerCase()) ||
          (currentFullName && d.fullName?.toLowerCase() === currentFullName.toLowerCase()) ||
          (user?.id && d.userId === user.id);

        if (isMe) {
          return {
            ...d,
            isCurrentUser: true,
            isFocusing: isFocusing || d.isFocusing,
            focusSecondsToday: totalNetFocusTime || d.focusSecondsToday
          };
        }
        return {
          ...d,
          isCurrentUser: false
        };
      });

      // If user is joined to this guild, ensure their desk is included
      const hasMyDesk = mapped.some(d => d.isCurrentUser);
      if (guild.joined && !hasMyDesk && currentUsername && currentUsername !== "you") {
        const isThisUserLeader = (guild.leader && (guild.leader.toLowerCase() === currentUsername.toLowerCase() || guild.leader.toLowerCase() === currentFullName.toLowerCase()));
        const myDesk: GuildMemberDesk = {
          id: `desk_${currentUsername.replace(/\s+/g, '_').toLowerCase()}`,
          userId: user?.id,
          username: currentUsername,
          fullName: currentFullName,
          avatarUrl: profile?.avatarUrl || "",
          role: isThisUserLeader ? 'leader' : 'member',
          isFocusing,
          focusSecondsToday: totalNetFocusTime || 0,
          currentSessionSeconds: 0,
          currentSubject: "Deep Focus Session",
          streak: streak || 3,
          level: level || 1,
          cheersCount: 0,
          isCurrentUser: true
        };
        mapped.push(myDesk);
        joinGuildInFirebase(guild.id, {
          id: user?.id || `user_${currentUsername}`,
          username: currentUsername,
          fullName: currentFullName,
          avatarUrl: profile?.avatarUrl || "",
          level: level || 1,
          streak: streak || 3,
          totalNetFocusTime,
          isFocusing
        }).catch(() => {});
      }

      setDesks(mapped);
    });

    return () => unsub();
  }, [guild?.id, guild.leader, guild.joined, currentUsername, currentFullName, user?.id, isFocusing, totalNetFocusTime, streak, level, profile?.avatarUrl]);

  // Sync current user's live focus status to Firestore so other members see it live
  useEffect(() => {
    if (!guild?.id || !currentUsername || currentUsername === "you") return;
    updateGuildMemberFocusInFirebase(guild.id, currentUsername, isFocusing, totalNetFocusTime);
  }, [guild?.id, currentUsername, isFocusing, totalNetFocusTime]);

  // Real-time cheer wall subscription from Firestore
  useEffect(() => {
    if (!guild?.id) return;
    const unsub = subscribeToGuildCheers(guild.id, (freshCheers) => {
      if (freshCheers && freshCheers.length > 0) {
        setGuildCheers(freshCheers);
      }
    });
    return () => unsub();
  }, [guild?.id]);

  // Sync user focusing status to desk
  useEffect(() => {
    setDesks(prev => prev.map(d => {
      if (d.isCurrentUser) {
        return {
          ...d,
          isFocusing: isFocusing,
          focusSecondsToday: totalNetFocusTime || d.focusSecondsToday
        };
      }
      return d;
    }));
  }, [isFocusing, totalNetFocusTime]);

  // Real-time ticking timer for active focusing members
  useEffect(() => {
    const timer = setInterval(() => {
      setDesks(prev => prev.map(d => {
        if (d.isFocusing) {
          return {
            ...d,
            currentSessionSeconds: d.currentSessionSeconds + 1,
            focusSecondsToday: d.focusSecondsToday + 1
          };
        }
        return d;
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeFocusCount = useMemo(() => {
    return desks.filter(d => d.isFocusing).length;
  }, [desks]);

  const activeTodayMembersCount = useMemo(() => {
    return desks.filter(d => d.isFocusing || d.focusSecondsToday > 0).length;
  }, [desks]);

  const underperformingCount = useMemo(() => {
    return desks.filter(d => d.focusSecondsToday === 0 && !d.isFocusing).length;
  }, [desks]);

  const officerMembersCount = useMemo(() => {
    return desks.filter(d => d.role === 'leader' || d.role === 'officer').length;
  }, [desks]);

  const filteredManagementDesks = useMemo(() => {
    return desks.filter(d => {
      // 1. Search Query filter
      const searchMatch = !managementSearch.trim() || 
        d.fullName.toLowerCase().includes(managementSearch.toLowerCase()) ||
        d.username.toLowerCase().includes(managementSearch.toLowerCase()) ||
        (d.currentSubject && d.currentSubject.toLowerCase().includes(managementSearch.toLowerCase()));

      if (!searchMatch) return false;

      // 2. Tab Filter
      if (managementFilter === "Active") {
        return d.isFocusing || d.focusSecondsToday > 0;
      }
      if (managementFilter === "Underperforming") {
        return d.focusSecondsToday === 0 && !d.isFocusing;
      }
      if (managementFilter === "Officers") {
        return d.role === 'leader' || d.role === 'officer';
      }
      return true;
    });
  }, [desks, managementSearch, managementFilter]);

  const totalGuildFocusTodayFormatted = useMemo(() => {
    const totalSec = desks.reduce((acc, d) => acc + d.focusSecondsToday, 0);
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    return `${hours}h ${mins}m`;
  }, [desks]);

  const handleSendCheer = (deskId: string, emoji: string) => {
    const newCheer = { id: Date.now(), deskId, emoji };
    setFloatingCheers(prev => [...prev, newCheer]);
    setTimeout(() => {
      setFloatingCheers(prev => prev.filter(c => c.id !== newCheer.id));
    }, 2000);

    setDesks(prev => prev.map(d => {
      if (d.id === deskId) {
        return { ...d, cheersCount: d.cheersCount + 1 };
      }
      return d;
    }));
  };

  const handlePostCheerMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheerMsg.trim()) return;

    const cheerPayload = {
      sender: currentUsername,
      text: cheerMsg.trim(),
      time: "Just now",
      emoji: "🔥"
    };

    // Optimistic update
    setGuildCheers(prev => [
      {
        id: `c_${Date.now()}`,
        ...cheerPayload
      },
      ...prev
    ]);
    setCheerMsg("");

    try {
      await sendGuildCheerInFirebase(guild.id, cheerPayload);
    } catch (err) {
      console.warn("[GuildStudyRoom] Failed to sync cheer to Firebase:", err);
    }
  };

  const handleKickMember = async (targetDesk: GuildMemberDesk) => {
    if (!isMeLeader) return;
    try {
      // Optimistically remove desk locally
      setDesks(prev => prev.filter(d => d.id !== targetDesk.id));
      setSelectedDesk(null);
      setIsConfirmingKick(false);
      setMemberToKick(null);

      await kickGuildMemberInFirebase(
        guild.id, 
        targetDesk.id, 
        targetDesk.username, 
        targetDesk.userId
      );

      setActionNotice(`@${targetDesk.username} was removed from the guild.`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error("[GuildStudyRoom] Failed to kick member:", err);
    }
  };

  const handleAssignRole = async (memberDeskId: string, targetRole: 'leader' | 'officer' | 'member') => {
    if (!isMeLeader) return;
    try {
      setDesks(prev => prev.map(d => d.id === memberDeskId ? { ...d, role: targetRole } : d));
      await updateGuildMemberRoleInFirebase(guild.id, memberDeskId, targetRole);
      
      const targetDesk = desks.find(d => d.id === memberDeskId);
      const roleName = targetRole === 'officer' ? 'Officer / Co-Leader ⚔️' : 'Member 🛡️';
      setActionNotice(`Rank updated: @${targetDesk?.username || 'Warrior'} is now ${roleName}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error("[GuildStudyRoom] Failed to update member role:", err);
    }
  };

  const handleSaveGuildSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMeLeader) return;
    try {
      await updateGuildSettingsInFirebase(guild.id, {
        minLevel: Number(editMinLevel) || 1,
        weeklyGoalHours: Number(editGoalHours) || 200,
        description: editDesc.trim() || guild.description
      });
      setSettingsSuccessMsg("Guild policy & settings updated successfully!");
      setTimeout(() => setSettingsSuccessMsg(""), 3500);
    } catch (err) {
      console.error("[GuildStudyRoom] Failed to save guild settings:", err);
    }
  };

  const handleNudgeUnderperforming = async (idleCount: number) => {
    if (!isMeLeader) return;
    const nudgeMsg = {
      sender: currentUsername,
      text: `⚔️ [COMMANDER NOTICE] Attention ${idleCount} idle warriors with 0 focus today: Begin a focus sprint now or report your status! Let's hit our weekly ${guild.weeklyGoalHours}h target! 🔥`,
      time: "Just now",
      emoji: "⚡"
    };
    setGuildCheers(prev => [{ id: `c_${Date.now()}`, ...nudgeMsg }, ...prev]);
    setActionNotice(`Broadcast alert sent to ${idleCount} inactive warriors on Cheer Wall! ⚡`);
    setTimeout(() => setActionNotice(null), 3500);
    sendGuildCheerInFirebase(guild.id, nudgeMsg).catch(() => {});
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Top Navigation Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#39FF14]/15 border border-[#39FF14]/40 text-[#39FF14] text-xs font-mono font-bold">
                [{guild.tag}]
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                {guild.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/60 text-xs font-semibold">
                Lv.{guild.level}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/50">
              <span className="text-[#39FF14] font-medium flex items-center gap-1 font-mono">
                <Zap className="w-3.5 h-3.5" /> {guild.perks}
              </span>
              <span>•</span>
              <span>Leader: <span className="text-white/80 font-medium">{guild.leader}</span></span>
              <span>•</span>
              <span className="text-[#FFD700] font-mono">Rank #{guild.rank} Global</span>
            </div>
          </div>
        </div>

        {/* Live Guild Room Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Focus Button */}
          <button
            onClick={() => {
              if (isFocusing) {
                stopFocusSession?.();
              } else {
                startFocusSession?.();
              }
            }}
            className={cn(
              "px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg",
              isFocusing
                ? "bg-[#FF8C00] text-black shadow-[0_0_20px_rgba(255,140,0,0.3)] animate-pulse"
                : "bg-[#39FF14] hover:bg-[#32e012] text-black shadow-[0_0_20px_rgba(57,255,20,0.25)]"
            )}
          >
            {isFocusing ? (
              <>
                <Pause className="w-4 h-4" />
                <span>You're Focusing ({formatTimer(desks.find(d => d.isCurrentUser)?.currentSessionSeconds || 0)})</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Join Desk & Focus</span>
              </>
            )}
          </button>

          {/* Join / Leave Guild Toggle */}
          <button
            onClick={() => onToggleJoin(guild.id)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-colors",
              guild.joined
                ? "bg-white/5 border-white/10 text-white/60 hover:text-red-400 hover:border-red-500/30"
                : "bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]"
            )}
          >
            {guild.joined ? "Guild Member ✓" : "Join Guild"}
          </button>
        </div>
      </div>

      {/* Guild Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex items-center gap-3.5 border-[#FF8C00]/20 bg-[#FF8C00]/[0.03]">
          <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 border border-[#FF8C00]/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#FF8C00] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">Currently Studying</span>
            <span className="text-lg font-bold text-[#FF8C00] font-mono">{activeFocusCount} Warriors Active</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">Guild Members</span>
            <span className="text-lg font-bold text-white font-mono">{desks.length}/{guild.maxMembers}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-[#39FF14]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">Total Focus Today</span>
            <span className="text-lg font-bold text-[#39FF14] font-mono">{totalGuildFocusTodayFormatted}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-white/40 block">Weekly Target</span>
            <span className="text-lg font-bold text-[#FFD700] font-mono">{guild.weeklyGoalHours} Hours</span>
          </div>
        </GlassCard>
      </div>

      {/* Tabs Switcher: Virtual Desks Room / Today's Ranking / Cheer Wall */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 p-1.5 bg-[#0e0e0e] border border-white/[0.06] rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("Room")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "Room"
                ? "bg-[#FF8C00] text-black shadow-[0_0_20px_rgba(255,140,0,0.3)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Virtual Study Desks</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold",
              activeTab === "Room" ? "bg-black/20 text-black" : "bg-[#FF8C00]/20 text-[#FF8C00]"
            )}>
              {activeFocusCount} Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab("Leaderboard")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "Leaderboard"
                ? "bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Guild Today Rank</span>
          </button>

          <button
            onClick={() => setActiveTab("CheerWall")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "CheerWall"
                ? "bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cheer Wall</span>
          </button>

          {/* Guild Management Tab (Available for all to view squad stats; Leader gets full authority) */}
          <button
            onClick={() => setActiveTab("Management")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeTab === "Management"
                ? "bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] font-bold"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Crown className="w-3.5 h-3.5 text-current" />
            <span>Guild Management</span>
            {isMeLeader && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold",
                activeTab === "Management" ? "bg-black/20 text-black" : "bg-[#FFD700]/20 text-[#FFD700]"
              )}>
                Leader HQ
              </span>
            )}
          </button>
        </div>

        {/* Ambient Study Room Soundscape Toggle */}
        <div className="flex items-center gap-2 bg-[#0e0e0e] border border-white/[0.06] p-1.5 rounded-2xl">
          <button
            onClick={() => setAmbientAudio(!ambientAudio)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
              ambientAudio
                ? "bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14]"
                : "text-white/40 hover:text-white"
            )}
          >
            {ambientAudio ? <Volume2 className="w-3.5 h-3.5 animate-bounce" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{ambientAudio ? "Room Sound: On" : "Room Ambience"}</span>
          </button>

          {ambientAudio && (
            <div className="flex items-center gap-1">
              {(["Rain", "Library", "WhiteNoise"] as const).map((sound) => (
                <button
                  key={sound}
                  onClick={() => setAmbientSoundType(sound)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors",
                    ambientSoundType === sound
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {sound}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Virtual Study Desks Room (Replicating exact user-provided visual reference) */}
      {activeTab === "Room" && (
        <div className="space-y-6">
          {/* Virtual Desks Grid (Compact 4-6 columns matching user reference) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3.5 bg-[#0a0a0a]/90 border border-white/[0.06] p-3.5 sm:p-5 rounded-2xl backdrop-blur-xl relative overflow-hidden">
            {desks.map((desk) => {
              const isDeskActive = desk.isFocusing;
              const deskCheers = floatingCheers.filter(c => c.deskId === desk.id);

              return (
                <motion.div
                  key={desk.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDesk(desk)}
                  className={cn(
                    "p-2.5 sm:p-3 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative group border min-h-[110px]",
                    isDeskActive 
                      ? "bg-[#FF8C00]/[0.08] border-[#FF8C00]/40 shadow-[0_0_20px_rgba(255,140,0,0.15)] ring-1 ring-[#FF8C00]/20" 
                      : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/10"
                  )}
                >
                  {/* Floating Cheer Particles */}
                  <AnimatePresence>
                    {deskCheers.map(c => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 1, y: 0, scale: 0.8 }}
                        animate={{ opacity: 0, y: -35, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute top-1 text-xl pointer-events-none z-20"
                      >
                        {c.emoji}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Desk Visual Icon */}
                  <div className="relative mb-1">
                    {isDeskActive ? (
                      /* Active: Orange stickman studying at desk */
                      <div className="relative">
                        <svg viewBox="0 0 100 80" className="w-12 h-10 sm:w-14 sm:h-12 text-[#FF8C00] drop-shadow-[0_0_6px_rgba(255,140,0,0.6)]">
                          {/* Desk surface */}
                          <rect x="15" y="46" width="70" height="3.5" rx="1.5" fill="currentColor" />
                          {/* Legs */}
                          <line x1="22" y1="49.5" x2="20" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          <line x1="78" y1="49.5" x2="80" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          {/* Sitting Stickman Head */}
                          <circle cx="58" cy="18" r="8" stroke="currentColor" strokeWidth="3" fill="none" />
                          {/* Torso leaning forward */}
                          <path d="M54 26 L42 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                          {/* Arms writing/studying */}
                          <path d="M48 34 L32 46 L50 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          {/* Legs in chair */}
                          <path d="M42 46 L35 58 L46 74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          {/* Open Study Book */}
                          <path d="M28 46 L36 42 L44 46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          {/* Desk glowing lamp */}
                          <path d="M74 46 L74 34 M68 34 L80 34 L76 26 L72 26 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                      </div>
                    ) : (
                      /* Inactive: Clean monochrome empty desk with lamp and clock */
                      <svg viewBox="0 0 100 80" className="w-12 h-10 sm:w-14 sm:h-12 text-white/35 group-hover:text-white/60 transition-colors">
                        {/* Desk surface */}
                        <rect x="15" y="46" width="70" height="3.5" rx="1.5" fill="currentColor" />
                        {/* Desk Legs */}
                        <line x1="22" y1="49.5" x2="20" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        <line x1="78" y1="49.5" x2="80" y2="76" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        {/* Lamp on desk */}
                        <path d="M26 46 L26 30 M20 30 L32 30 L28 22 L24 22 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        {/* Clock on desk */}
                        <circle cx="50" cy="34" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                        <polyline points="50,30 50,34 54,34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>

                  {/* Username */}
                  <span className={cn(
                    "text-[11px] font-semibold max-w-[100px] truncate block leading-tight",
                    isDeskActive ? "text-[#FF8C00] font-mono drop-shadow-[0_0_5px_rgba(255,140,0,0.5)] font-bold" : "text-white/70"
                  )}>
                    {desk.username}{desk.isCurrentUser ? " (You)" : ""}
                  </span>

                  {/* Timer */}
                  <span className={cn(
                    "text-[10px] sm:text-[11px] font-mono font-bold mt-0.5 tracking-wider block leading-none",
                    isDeskActive ? "text-[#FF8C00]" : "text-white/40"
                  )}>
                    {isDeskActive 
                      ? formatTimer(desk.currentSessionSeconds)
                      : formatTimer(desk.focusSecondsToday, true)
                    }
                  </span>

                  {/* Quick Cheer Button on hover */}
                  <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendCheer(desk.id, "🔥");
                      }}
                      className="p-1 rounded-md bg-white/10 hover:bg-[#FF8C00]/20 text-[9px] transition-colors"
                      title="Send Fire"
                    >
                      🔥
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendCheer(desk.id, "⚡");
                      }}
                      className="p-1 rounded-md bg-white/10 hover:bg-[#39FF14]/20 text-[9px] transition-colors"
                      title="Send Energy"
                    >
                      ⚡
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Guild Today Leaderboard */}
      {activeTab === "Leaderboard" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Today's Focus Champions</h3>
            <span className="text-xs font-mono text-white/40">Resets daily at 00:00</span>
          </div>

          <div className="space-y-2.5">
            {[...desks].sort((a, b) => b.focusSecondsToday - a.focusSecondsToday).map((member, idx) => (
              <GlassCard 
                key={member.id}
                className={cn(
                  "p-4 flex items-center justify-between gap-4 transition-all",
                  member.isFocusing ? "border-[#FF8C00]/30 bg-[#FF8C00]/[0.02]" : "hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs",
                    idx === 0 ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40" :
                    idx === 1 ? "bg-slate-300/20 text-slate-200 border border-slate-300/40" :
                    idx === 2 ? "bg-amber-600/20 text-amber-500 border border-amber-600/40" :
                    "bg-white/5 text-white/40 border border-white/5"
                  )}>
                    #{idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{member.fullName}</span>
                      <span className="text-xs text-white/40 font-mono">@{member.username}</span>
                      {member.isFocusing && (
                        <span className="px-2 py-0.5 rounded-md bg-[#FF8C00]/20 text-[#FF8C00] text-[9px] font-bold uppercase tracking-wider">
                          Studying
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">Subject: <span className="text-white/70 font-medium">{member.currentSubject}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/40 block">Today's Time</span>
                    <span className={cn(
                      "text-base font-bold font-mono",
                      member.isFocusing ? "text-[#FF8C00]" : "text-white"
                    )}>
                      {formatTimer(member.focusSecondsToday, true)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSendCheer(member.id, "🔥")}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10 text-xs flex items-center gap-1"
                      title="Send Fire"
                    >
                      <span>🔥</span>
                      <span className="font-mono text-[11px]">{member.cheersCount}</span>
                    </button>

                    {isMeLeader && !member.isCurrentUser && member.role !== 'leader' && (
                      <button
                        onClick={() => {
                          setSelectedDesk(member);
                          setIsConfirmingKick(true);
                        }}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs transition-colors flex items-center gap-1"
                        title="Guild Leader: Kick Member"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold">Kick</span>
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Cheer Wall & Live Guild Chat */}
      {activeTab === "CheerWall" && (
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF8C00]" />
              <span>Send Guild Cheer & Motivation</span>
            </h3>

            <form onSubmit={handlePostCheerMsg} className="flex gap-3">
              <input
                type="text"
                value={cheerMsg}
                onChange={(e) => setCheerMsg(e.target.value)}
                placeholder="Cheer your comrades, share your today's study target..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(57,255,20,0.2)] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </GlassCard>

          <div className="space-y-3">
            {guildCheers.map((cheer) => (
              <GlassCard key={cheer.id} className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF8C00]/10 border border-[#FF8C00]/30 flex items-center justify-center text-lg shrink-0">
                  {cheer.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">@{cheer.sender}</span>
                    <span className="text-[10px] text-white/40">{cheer.time}</span>
                  </div>
                  <p className="text-xs text-white/70 mt-1 font-sans leading-relaxed">{cheer.text}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Guild Management Sub-View */}
      {activeTab === "Management" && (
        <div className="space-y-6">
          {/* Action Notice Toast */}
          <AnimatePresence>
            {actionNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-xs font-semibold flex items-center gap-2.5 shadow-[0_0_20px_rgba(57,255,20,0.15)]"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header & Quick Management Stats */}
          <GlassCard className="p-6 space-y-6 border-[#FFD700]/20 bg-[#FFD700]/[0.02]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                  <Crown className="w-6 h-6 text-[#FFD700]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">Guild Leader Command Center</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[10px] font-bold font-mono">
                      HQ
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5 font-medium">
                    Manage squad ranks, enforce minimum qualification requirements, and monitor warrior focus stats.
                  </p>
                </div>
              </div>

              {isMeLeader && (
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
                    isSettingsOpen
                      ? "bg-white/15 text-white border border-white/20"
                      : "bg-[#FFD700]/10 hover:bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  <span>{isSettingsOpen ? "Hide Governance Rules" : "Guild Rules & Settings"}</span>
                  {isSettingsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40 block font-sans">Squad Capacity</span>
                <span className="text-base font-bold text-white block mt-0.5">{desks.length} / {guild.maxMembers} Warriors</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40 block font-sans">Active Warriors Today</span>
                <span className="text-base font-bold text-[#39FF14] block mt-0.5">{activeTodayMembersCount} Online / Studied</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40 block font-sans">Underperforming (0h)</span>
                <span className={cn(
                  "text-base font-bold block mt-0.5",
                  underperformingCount > 0 ? "text-amber-400" : "text-white/60"
                )}>
                  {underperformingCount} Inactive
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] uppercase font-bold text-white/40 block font-sans">Min Join Requirement</span>
                <span className="text-base font-bold text-[#FFD700] block mt-0.5">Lv. {editMinLevel} Required</span>
              </div>
            </div>

            {/* Expandable Governance & Settings Panel */}
            <AnimatePresence>
              {isSettingsOpen && isMeLeader && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-4 border-t border-white/10"
                >
                  <form onSubmit={handleSaveGuildSettings} className="space-y-4 p-4 rounded-2xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#FFD700]" />
                        <span>Guild Governance & Joining Policies</span>
                      </h4>
                      {settingsSuccessMsg && (
                        <span className="text-xs font-semibold text-[#39FF14] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> {settingsSuccessMsg}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">
                          Minimum Required User Level to Join
                        </label>
                        <select
                          value={editMinLevel}
                          onChange={(e) => setEditMinLevel(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                        >
                          <option value={1}>Level 1+ (Open for All Warriors)</option>
                          <option value={2}>Level 2+ (Apprentice Rank)</option>
                          <option value={3}>Level 3+ (Disciplined Warriors)</option>
                          <option value={5}>Level 5+ (Detox Elite Warriors)</option>
                          <option value={10}>Level 10+ (Monk Grandmasters Only)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">
                          Weekly Squad Focus Goal (Hours)
                        </label>
                        <input
                          type="number"
                          min={50}
                          max={1000}
                          value={editGoalHours}
                          onChange={(e) => setEditGoalHours(Number(e.target.value))}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 font-mono focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">
                        Guild Mission Statement & Rules
                      </label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50 transition-colors resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#FFD700] hover:bg-[#ffdf33] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,215,0,0.25)] flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Governance Policies</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Underperforming Alert Banner */}
          {underperformingCount > 0 && isMeLeader && (
            <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {underperformingCount} warrior(s) have logged 0 focus minutes today.
                  </span>
                  <span className="text-[11px] text-white/50 block mt-0.5">
                    Send an instant broadcast nudge or review their participation below.
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleNudgeUnderperforming(underperformingCount)}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Nudge Inactive Warriors</span>
              </button>
            </div>
          )}

          {/* Member Roster Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {(["All", "Active", "Underperforming", "Officers"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setManagementFilter(filter)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors",
                    managementFilter === filter
                      ? "bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.25)]"
                      : "bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10"
                  )}
                >
                  {filter === "All" && `All Warriors (${desks.length})`}
                  {filter === "Active" && `Active Today (${activeTodayMembersCount})`}
                  {filter === "Underperforming" && `Idle (0h) (${underperformingCount})`}
                  {filter === "Officers" && `Leadership (${officerMembersCount})`}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search warrior or task..."
                value={managementSearch}
                onChange={(e) => setManagementSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
              />
            </div>
          </div>

          {/* Member Contribution Roster Cards */}
          <div className="space-y-3">
            {filteredManagementDesks.map((member) => {
              const isLeader = member.role === 'leader';
              const isOfficer = member.role === 'officer';
              const isIdle = member.focusSecondsToday === 0 && !member.isFocusing;

              return (
                <GlassCard
                  key={member.id}
                  className={cn(
                    "p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all",
                    isLeader ? "border-[#FFD700]/30 bg-[#FFD700]/[0.02]" :
                    isOfficer ? "border-cyan-500/30 bg-cyan-500/[0.02]" :
                    isIdle ? "border-amber-500/10 hover:border-amber-500/30" : "hover:border-white/20"
                  )}
                >
                  {/* Member Identity & Status */}
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border",
                      isLeader ? "bg-[#FFD700]/10 border-[#FFD700]/40 text-[#FFD700]" :
                      isOfficer ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" :
                      "bg-white/5 border-white/10 text-white/70"
                    )}>
                      {isLeader ? "👑" : isOfficer ? "⚔️" : member.username.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{member.fullName}</span>
                        <span className="text-xs text-white/40 font-mono">@{member.username}</span>
                        
                        {/* Role Badge */}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono",
                          isLeader ? "bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/30" :
                          isOfficer ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" :
                          "bg-white/5 text-white/50 border border-white/5"
                        )}>
                          {isLeader ? "Leader" : isOfficer ? "Officer" : "Member"}
                        </span>

                        {member.isFocusing && (
                          <span className="px-2 py-0.5 rounded-full bg-[#FF8C00]/20 text-[#FF8C00] text-[9px] font-bold uppercase font-mono animate-pulse">
                            Studying Now
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-white/40 mt-1 flex items-center gap-2 font-mono">
                        <span className="text-white/70 font-sans">Task: {member.currentSubject}</span>
                        <span>•</span>
                        <span className="text-orange-400">{member.streak}d Streak</span>
                        <span>•</span>
                        <span className="text-[#39FF14]">Lv.{member.level}</span>
                      </p>
                    </div>
                  </div>

                  {/* Contribution Stats & Management Power Tools */}
                  <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5 flex-wrap">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Today's Focus</span>
                      <span className={cn(
                        "text-base font-bold font-mono block",
                        member.isFocusing ? "text-[#FF8C00]" :
                        member.focusSecondsToday > 0 ? "text-[#39FF14]" : "text-white/40"
                      )}>
                        {formatTimer(member.focusSecondsToday, true)}
                      </span>
                    </div>

                    {/* Leader Power Tools */}
                    {isMeLeader && !member.isCurrentUser && (
                      <div className="flex items-center gap-2">
                        {/* Assign Rank Button */}
                        <button
                          onClick={() => handleAssignRole(member.id, isOfficer ? 'member' : 'officer')}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors border",
                            isOfficer 
                              ? "bg-white/5 hover:bg-white/10 text-white/60 border-white/10" 
                              : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                          )}
                          title={isOfficer ? "Demote to Member" : "Promote to Officer"}
                        >
                          {isOfficer ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Demote</span>
                            </>
                          ) : (
                            <>
                              <Award className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Make Officer</span>
                            </>
                          )}
                        </button>

                        {/* Kick Member Button */}
                        <button
                          onClick={() => setMemberToKick(member)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                          title="Kick from Guild"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Kick</span>
                        </button>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Expel / Kick Member Confirmation Modal */}
      <AnimatePresence>
        {memberToKick && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-red-500/30 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden"
            >
              <button
                onClick={() => setMemberToKick(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)] shrink-0">
                  <UserX className="w-6 h-6 text-red-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Expel Warrior from Guild?</h3>
                  <span className="text-[11px] text-red-400/80 font-mono uppercase tracking-wider font-semibold">
                    Commander Disciplinary Action
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/70 leading-relaxed font-sans">
                You are about to kick <span className="text-white font-bold">{memberToKick.fullName}</span> (<span className="text-red-400 font-mono">@{memberToKick.username}</span>) from <span className="text-white font-semibold">[{guild.tag}] {guild.name}</span>. Their study desk will be removed from the virtual room.
              </p>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">
                  Reason for Removal
                </label>
                <select
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-red-500/50 transition-colors"
                >
                  <option value="Underperforming / 0 Focus Today">Underperforming / 0 Net Focus Logged</option>
                  <option value="Inactive for Multiple Days">Inactive / Missing Focus Sprints</option>
                  <option value="Squad Quota Rebalancing">Squad Capacity Rebalancing</option>
                  <option value="Violated Study Room Code">Disruptive on Cheer Wall</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMemberToKick(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleKickMember(memberToKick)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] flex items-center justify-center gap-1.5"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Confirm Kick</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Desk Modal on click */}
      <AnimatePresence>
        {selectedDesk && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedDesk(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center border",
                  selectedDesk.isFocusing 
                    ? "bg-[#FF8C00]/10 border-[#FF8C00]/40 text-[#FF8C00]" 
                    : "bg-white/5 border-white/10 text-white/60"
                )}>
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedDesk.fullName}</h3>
                    {selectedDesk.isFocusing && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF8C00]/20 text-[#FF8C00] text-[9px] font-bold uppercase font-mono animate-pulse">
                        Studying
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-mono">@{selectedDesk.username}</p>
                  <p className="text-[11px] text-[#39FF14] font-medium mt-0.5">Studying: {selectedDesk.currentSubject}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Today's Focus</span>
                  <span className="text-base font-bold text-white font-mono">
                    {formatTimer(selectedDesk.focusSecondsToday, true)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Current Session</span>
                  <span className="text-base font-bold text-[#FF8C00] font-mono">
                    {selectedDesk.isFocusing ? formatTimer(selectedDesk.currentSessionSeconds) : "Resting"}
                  </span>
                </div>
              </div>

              {/* Cheering Actions */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/40 block">Send Instant Cheer</span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { emoji: "🔥", label: "Fire" },
                    { emoji: "⚡", label: "Energy" },
                    { emoji: "🧠", label: "Brain" },
                    { emoji: "☕", label: "Coffee" }
                  ].map((cheer) => (
                    <button
                      key={cheer.label}
                      onClick={() => {
                        handleSendCheer(selectedDesk.id, cheer.emoji);
                        setSelectedDesk(null);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center transition-all hover:scale-105"
                    >
                      <span className="text-xl block">{cheer.emoji}</span>
                      <span className="text-[9px] font-bold text-white/50 block mt-1">{cheer.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guild Leader Kick Controls */}
              {isMeLeader && !selectedDesk.isCurrentUser && selectedDesk.role !== 'leader' && (
                <div className="p-3.5 rounded-2xl bg-red-500/[0.06] border border-red-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Guild Leader Authority</span>
                  </div>

                  {!isConfirmingKick ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingKick(true)}
                      className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Kick Warrior from Guild</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-white/70">
                        Are you sure you want to kick <span className="text-white font-bold">@{selectedDesk.username}</span>? Their desk will be immediately removed from the study room.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingKick(false)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold uppercase transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleKickMember(selectedDesk)}
                          className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors flex items-center justify-center gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Confirm Kick</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedDesk(null);
                    setIsConfirmingKick(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                >
                  Close Desk
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
