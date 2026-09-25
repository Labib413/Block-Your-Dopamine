import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Users, 
  Trophy, 
  Crown, 
  Sparkles, 
  Zap, 
  Search, 
  Plus, 
  X, 
  CheckCircle2, 
  Radio, 
  Clock, 
  Flame, 
  ArrowRight, 
  Target, 
  LogOut, 
  ExternalLink,
  BookOpen,
  Filter,
  Layers,
  Award
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { GlassCard } from "./GlassCard";
import { cn } from "@/src/lib/utils";
import { 
  FirestoreGuild, 
  FirestoreGuildMember, 
  fetchGuildsFromFirestore, 
  subscribeToGuilds, 
  createGuildInFirestore, 
  joinGuildInFirestore, 
  leaveGuildInFirestore 
} from "../lib/firebase";

export interface GuildMember {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: 'leader' | 'officer' | 'member';
  level: number;
  xp: number;
  streak: number;
  detoxScore: number;
  joinedAt: string;
  status?: 'focusing' | 'idle' | 'break';
  currentTask?: string;
}

export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  category: "Engineering" | "Medical" | "Varsity" | "General" | "HSC";
  leaderId: string;
  leaderName: string;
  membersCount: number;
  maxMembers: number;
  level: number;
  rank?: number;
  totalXp: number;
  weeklyGoalHours: number;
  perks: string;
  members?: GuildMember[];
  joined?: boolean;
}

const DEFAULT_GUILDS: Guild[] = [
  {
    id: "g_buet_01",
    name: "BUET Pioneers Syndicate",
    tag: "BUET",
    description: "Elite engineering study group focused on higher math, calculus sprints, and BUET question banks.",
    category: "Engineering",
    leaderId: "leader_01",
    leaderName: "Tanvir Hasan",
    membersCount: 48,
    maxMembers: 50,
    level: 12,
    rank: 1,
    totalXp: 184500,
    weeklyGoalHours: 350,
    perks: "+10% Focus XP Buff & BUET Test Series Access",
    members: [
      {
        userId: "leader_01",
        username: "tanvir_math",
        fullName: "Tanvir Hasan",
        role: "leader",
        level: 21,
        xp: 12400,
        streak: 45,
        detoxScore: 99,
        joinedAt: "2026-01-10",
        status: "focusing",
        currentTask: "Calculus III & BUET Question Bank"
      },
      {
        userId: "user_top_1",
        username: "arif_focus",
        fullName: "Arif Rahman",
        role: "officer",
        level: 19,
        xp: 9450,
        streak: 42,
        detoxScore: 98,
        joinedAt: "2026-01-15",
        status: "focusing",
        currentTask: "Thermodynamics Marathon"
      }
    ]
  },
  {
    id: "g_dmc_02",
    name: "DMC Medicos Vanguard",
    tag: "DMC",
    description: "Daily biology memorization, medical question bank mastery, and zero-distraction dopamine detox.",
    category: "Medical",
    leaderId: "leader_02",
    leaderName: "Nabila Tabassum",
    membersCount: 42,
    maxMembers: 50,
    level: 10,
    rank: 2,
    totalXp: 162000,
    weeklyGoalHours: 320,
    perks: "+8% Bio Mastery Buff & Med Flashcards",
    members: [
      {
        userId: "leader_02",
        username: "nabila_med",
        fullName: "Nabila Tabassum",
        role: "leader",
        level: 18,
        xp: 8900,
        streak: 38,
        detoxScore: 96,
        joinedAt: "2026-01-12",
        status: "idle"
      }
    ]
  },
  {
    id: "g_du_03",
    name: "Apex Scholars (DU Ka)",
    tag: "APEX",
    description: "Pure science champions competing for top national varsity ranks with disciplined daily routines.",
    category: "Varsity",
    leaderId: "leader_03",
    leaderName: "Farhan Ahmed",
    membersCount: 36,
    maxMembers: 50,
    level: 8,
    rank: 3,
    totalXp: 139200,
    weeklyGoalHours: 280,
    perks: "+5% Daily Streak Shield",
    members: []
  },
  {
    id: "g_monk_04",
    name: "Monk Mode Elite",
    tag: "MONK",
    description: "Strict dopamine detox, 6+ hours daily net focus, and extreme discipline for HSC 2026.",
    category: "HSC",
    leaderId: "leader_04",
    leaderName: "Sabbir Hossain",
    membersCount: 29,
    maxMembers: 30,
    level: 7,
    rank: 4,
    totalXp: 118400,
    weeklyGoalHours: 250,
    perks: "Exclusive Monk Mode Audio & Emblems",
    members: []
  }
];

export function Guilds({ 
  onStartFocus, 
  onNavigate 
}: { 
  onStartFocus?: (durationMinutes: number, subjectId?: string) => void;
  onNavigate?: (view: string) => void;
}) {
  const { 
    user, 
    profile, 
    updateProfile, 
    streak, 
    level, 
    xp, 
    detoxPercent, 
    isFocusing 
  } = useApp();

  const [guildsList, setGuildsList] = useState<Guild[]>(() => {
    const saved = localStorage.getItem("byd_community_guilds");
    return saved ? JSON.parse(saved) : DEFAULT_GUILDS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState<"Rank" | "XP" | "Members">("Rank");
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  
  // Modals & UI states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for creating a guild
  const [formName, setFormName] = useState("");
  const [formTag, setFormTag] = useState("");
  const [formCategory, setFormCategory] = useState<Guild["category"]>("Engineering");
  const [formDescription, setFormDescription] = useState("");
  const [formWeeklyGoal, setFormWeeklyGoal] = useState("200");

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const currentUserId = user?.id || "local-user-001";
  const currentUsername = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "warrior";
  const currentFullName = profile?.fullName || user?.user_metadata?.full_name || "Tasnem Hossen";

  // Realtime Firestore Subscription with fallback
  useEffect(() => {
    const unsubscribe = subscribeToGuilds((firestoreGuilds) => {
      if (firestoreGuilds && firestoreGuilds.length > 0) {
        setGuildsList(prev => {
          // Merge remote firestore guilds with local defaults
          const merged = [...firestoreGuilds];
          DEFAULT_GUILDS.forEach(dg => {
            if (!merged.some(g => g.id === dg.id || g.tag === dg.tag)) {
              merged.push(dg as any);
            }
          });
          // Sort by XP
          merged.sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
          return merged.map((g, idx) => ({ ...g, rank: idx + 1 }));
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("byd_community_guilds", JSON.stringify(guildsList));
  }, [guildsList]);

  // Current User's Guild Member object
  const currentMemberObj: GuildMember = useMemo(() => ({
    userId: currentUserId,
    username: currentUsername,
    fullName: currentFullName,
    avatarUrl: profile?.avatarUrl,
    role: "member",
    level: level || 1,
    xp: xp || 0,
    streak: streak || 3,
    detoxScore: detoxPercent || 90,
    joinedAt: new Date().toISOString().split("T")[0],
    status: isFocusing ? "focusing" : "idle"
  }), [currentUserId, currentUsername, currentFullName, profile?.avatarUrl, level, xp, streak, detoxPercent, isFocusing]);

  // Determine user's active guild from profile, member lists, or local joined flag
  const userActiveGuild = useMemo(() => {
    const fromProfile = (profile as any)?.guildId;
    if (fromProfile) {
      const found = guildsList.find(g => g.id === fromProfile);
      if (found) return found;
    }
    return guildsList.find(g => 
      g.joined || 
      (g.members && g.members.some(m => m.userId === currentUserId)) ||
      g.leaderId === currentUserId
    ) || null;
  }, [guildsList, (profile as any)?.guildId, currentUserId]);

  // Filtered and sorted guilds
  const displayedGuilds = useMemo(() => {
    let list = guildsList.map(g => {
      const isUserInGuild = userActiveGuild?.id === g.id;
      return { ...g, joined: isUserInGuild };
    });

    if (selectedCategory !== "All") {
      list = list.filter(g => g.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.tag.toLowerCase().includes(q) || 
        g.description.toLowerCase().includes(q) ||
        g.leaderName.toLowerCase().includes(q)
      );
    }

    if (activeSort === "XP") {
      list.sort((a, b) => b.totalXp - a.totalXp);
    } else if (activeSort === "Members") {
      list.sort((a, b) => b.membersCount - a.membersCount);
    } else {
      list.sort((a, b) => (a.rank || 99) - (b.rank || 99));
    }

    return list;
  }, [guildsList, userActiveGuild, selectedCategory, searchQuery, activeSort]);

  // Join Guild Handler (Associates user with Guild ID in Firestore & Profile)
  const handleJoinGuild = async (targetGuild: Guild) => {
    setIsSubmitting(true);
    try {
      // 1. If user is already in another guild, leave it first
      if (userActiveGuild && userActiveGuild.id !== targetGuild.id) {
        await leaveGuildInFirestore(userActiveGuild.id, currentUserId);
      }

      // 2. Associate with target guild in Firestore
      await joinGuildInFirestore(targetGuild.id, currentMemberObj);

      // 3. Update Profile state and sync queue
      await updateProfile({
        guildId: targetGuild.id,
        guildName: targetGuild.name,
        guildTag: targetGuild.tag
      } as any);

      // 4. Update local state
      setGuildsList(prev => prev.map(g => {
        if (g.id === targetGuild.id) {
          const members = g.members ? [...g.members.filter(m => m.userId !== currentUserId), currentMemberObj] : [currentMemberObj];
          return {
            ...g,
            joined: true,
            members,
            membersCount: members.length,
            totalXp: g.totalXp + (xp || 500)
          };
        } else {
          return {
            ...g,
            joined: false,
            members: (g.members || []).filter(m => m.userId !== currentUserId),
            membersCount: Math.max(0, g.membersCount - (g.id === userActiveGuild?.id ? 1 : 0))
          };
        }
      }));

      showToast(`Joined [${targetGuild.tag}] ${targetGuild.name}! Synergy Buff activated.`);
    } catch (err) {
      console.error("Error joining guild:", err);
      showToast("Joined guild successfully in local state.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Leave Guild Handler
  const handleLeaveGuild = async (guildId: string) => {
    setIsSubmitting(true);
    try {
      await leaveGuildInFirestore(guildId, currentUserId);

      await updateProfile({
        guildId: null,
        guildName: null,
        guildTag: null
      } as any);

      setGuildsList(prev => prev.map(g => {
        if (g.id === guildId) {
          const members = (g.members || []).filter(m => m.userId !== currentUserId);
          return {
            ...g,
            joined: false,
            members,
            membersCount: Math.max(0, members.length)
          };
        }
        return g;
      }));

      if (selectedGuild?.id === guildId) {
        setSelectedGuild(null);
      }

      showToast("You left the study guild.");
    } catch (err) {
      console.error("Error leaving guild:", err);
      showToast("Left guild.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Guild Handler
  const handleCreateGuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTag.trim()) return;

    setIsSubmitting(true);
    try {
      const cleanTag = formTag.trim().toUpperCase().slice(0, 5);
      const newGuildPayload = {
        name: formName.trim(),
        tag: cleanTag,
        description: formDescription.trim() || "A committed syndicate focused on uninterrupted study sessions and top percentiles.",
        category: formCategory,
        leaderId: currentUserId,
        leaderName: currentFullName,
        membersCount: 1,
        maxMembers: 50,
        level: 1,
        totalXp: 2500 + (xp || 500),
        weeklyGoalHours: parseInt(formWeeklyGoal, 10) || 200,
        perks: `+5% ${formCategory} Synergy Focus Buff`
      };

      const creatorMember: FirestoreGuildMember = {
        ...currentMemberObj,
        role: "leader"
      };

      const createdGuild = await createGuildInFirestore(newGuildPayload, creatorMember);

      await updateProfile({
        guildId: createdGuild.id,
        guildName: createdGuild.name,
        guildTag: createdGuild.tag
      } as any);

      setGuildsList(prev => [
        {
          ...createdGuild,
          joined: true,
          rank: 1,
          members: [creatorMember]
        },
        ...prev.map(g => ({ ...g, joined: false }))
      ]);

      setIsCreateModalOpen(false);
      setFormName("");
      setFormTag("");
      setFormDescription("");
      setFormWeeklyGoal("200");
      showToast(`Guild [${cleanTag}] founded! You are now the Guild Leader.`);
    } catch (err) {
      console.error("Error creating guild:", err);
      showToast("Created guild successfully.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[120] px-5 py-3 rounded-2xl bg-[#0a0a0a] border border-[#39FF14]/50 shadow-[0_0_25px_rgba(57,255,20,0.3)] flex items-center gap-3 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#39FF14]" />
            <span className="text-xs font-bold text-white tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Guild Banner if User is Joined */}
      {userActiveGuild ? (
        <GlassCard className="p-6 border-[#39FF14]/40 bg-gradient-to-r from-[#39FF14]/10 via-black to-black/80 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#39FF14]/15 border border-[#39FF14]/50 flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.25)] shrink-0">
                <Shield className="w-8 h-8 text-[#39FF14]" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14] text-xs font-mono font-bold">
                    [{userActiveGuild.tag}]
                  </span>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{userActiveGuild.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[11px] font-semibold">
                    Rank #{userActiveGuild.rank || 1} Global
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#39FF14]/10 text-[#39FF14] text-[10px] font-mono font-bold uppercase">
                    Your Active Guild
                  </span>
                </div>
                <p className="text-xs text-white/50 font-sans max-w-2xl leading-relaxed">{userActiveGuild.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                  <span className="text-[#39FF14] flex items-center gap-1.5 font-bold">
                    <Zap className="w-3.5 h-3.5" /> {userActiveGuild.perks}
                  </span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">Leader: {userActiveGuild.leaderName}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">{userActiveGuild.membersCount} Warriors Enlisted</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
              <button
                onClick={() => setSelectedGuild(userActiveGuild)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/15 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#39FF14]" />
                <span>Roster & Chat</span>
              </button>

              {onStartFocus && (
                <button
                  onClick={() => onStartFocus(60)}
                  className="px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] flex items-center gap-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Study Sprint (+XP)</span>
                </button>
              )}

              <button
                onClick={() => handleLeaveGuild(userActiveGuild.id)}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider transition-colors"
                title="Leave Guild"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Join a Study Guild Syndicate</h3>
              <p className="text-xs text-white/40 mt-0.5 font-sans">
                Compete with classmates, earn weekly focus synergy multipliers, and stay locked in together.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.25)] transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Found a Guild</span>
          </button>
        </GlassCard>
      )}

      {/* Search, Categories, Sort & Action Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guilds by name or [TAG]..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-hide">
            {(["All", "Engineering", "Medical", "Varsity", "HSC"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
                  selectedCategory === cat
                    ? "bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.15)]"
                    : "bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-[#0e0e0e] border border-white/10 rounded-xl p-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-white/30 px-2">Sort:</span>
            {(["Rank", "XP", "Members"] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => setActiveSort(sort)}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors",
                  activeSort === sort
                    ? "bg-white/10 text-white font-bold"
                    : "text-white/40 hover:text-white"
                )}
              >
                {sort}
              </button>
            ))}
          </div>

          {/* Found Guild button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-[#39FF14]" />
            <span>New Guild</span>
          </button>
        </div>
      </div>

      {/* Guilds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedGuilds.map((guild) => {
          const isJoined = guild.joined;

          return (
            <GlassCard 
              key={guild.id} 
              className={cn(
                "p-6 flex flex-col justify-between space-y-6 transition-all duration-300 relative group",
                isJoined 
                  ? "border-[#39FF14]/40 bg-[#39FF14]/[0.03] shadow-[0_0_30px_rgba(57,255,20,0.1)]" 
                  : "hover:border-white/20"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-base transition-colors",
                      isJoined 
                        ? "bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.2)]" 
                        : "bg-white/5 text-white/80 border border-white/10 group-hover:border-white/20"
                    )}>
                      [{guild.tag}]
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white leading-tight group-hover:text-[#39FF14] transition-colors">
                          {guild.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                          Lv.{guild.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 font-sans">
                        Leader: <span className="text-white/70 font-medium">{guild.leaderName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-[#FFD700] flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> #{guild.rank || 1}
                    </span>
                    <span className="text-[10px] text-white/30 uppercase font-semibold mt-0.5">{guild.category}</span>
                  </div>
                </div>

                <p className="text-xs text-white/50 leading-relaxed font-sans">{guild.description}</p>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 text-xs text-[#39FF14]">
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-medium">{guild.perks}</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] uppercase text-white/40 block font-sans font-bold leading-none mb-1">Guild Pool XP</span>
                    <span className="text-white font-bold">{guild.totalXp.toLocaleString()} XP</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] uppercase text-white/40 block font-sans font-bold leading-none mb-1">Warriors</span>
                    <span className="text-white font-bold">{guild.membersCount}/{guild.maxMembers}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={() => setSelectedGuild(guild)}
                    className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Users className="w-3.5 h-3.5 text-white/40" />
                    <span>View Roster ({guild.members?.length || guild.membersCount})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <button
                        onClick={() => handleLeaveGuild(guild.id)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all"
                      >
                        Joined ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGuild(guild)}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#39FF14] hover:bg-[#32e012] text-black shadow-[0_0_15px_rgba(57,255,20,0.25)] transition-all font-mono"
                      >
                        Join Guild
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Guild Details & Member Roster Modal */}
      <AnimatePresence>
        {selectedGuild && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <button
                onClick={() => setSelectedGuild(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center font-mono font-bold text-lg text-[#39FF14]">
                  [{selectedGuild.tag}]
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{selectedGuild.name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                      Rank #{selectedGuild.rank || 1}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1 font-sans">{selectedGuild.description}</p>
                </div>
              </div>

              {/* Guild Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Level</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedGuild.level}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Synergy XP</span>
                  <span className="text-lg font-bold text-[#FFD700] font-mono">{selectedGuild.totalXp.toLocaleString()}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Warriors</span>
                  <span className="text-lg font-bold text-[#39FF14] font-mono">{selectedGuild.membersCount}/{selectedGuild.maxMembers}</span>
                </div>
              </div>

              {/* Active Members Roster */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40">Guild Warriors Roster</span>
                  <span className="text-[11px] font-mono text-white/40">{selectedGuild.members?.length || 1} active members</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedGuild.members && selectedGuild.members.length > 0 ? selectedGuild.members : [
                    {
                      userId: selectedGuild.leaderId,
                      username: "leader",
                      fullName: selectedGuild.leaderName,
                      role: "leader" as const,
                      level: selectedGuild.level * 2,
                      xp: selectedGuild.totalXp / 2,
                      streak: 30,
                      detoxScore: 98,
                      joinedAt: "2026-01-01",
                      status: "focusing" as const,
                      currentTask: "Deep Study Sprint"
                    }
                  ]).map((member, idx) => (
                    <div 
                      key={member.userId || idx} 
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white/80 text-sm">
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{member.fullName}</span>
                            {member.role === 'leader' && (
                              <Crown className="w-3.5 h-3.5 text-[#FFD700]" title="Guild Leader" />
                            )}
                          </div>
                          <p className="text-[10px] text-white/40 font-mono">
                            Level {member.level} • {member.streak}d Streak
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1",
                          member.status === 'focusing' 
                            ? "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30" 
                            : "bg-white/5 text-white/40"
                        )}>
                          <Radio className="w-2.5 h-2.5" />
                          {member.status === 'focusing' ? 'Focusing' : 'Standby'}
                        </span>
                        <span className="text-xs font-mono font-bold text-white/70">
                          {member.detoxScore}% Detox
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center gap-3 border-t border-white/10">
                <button
                  onClick={() => setSelectedGuild(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                >
                  Close
                </button>
                {selectedGuild.joined ? (
                  <button
                    onClick={() => handleLeaveGuild(selectedGuild.id)}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors border border-red-500/30"
                  >
                    Leave Guild
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleJoinGuild(selectedGuild);
                      setSelectedGuild(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] font-mono"
                  >
                    Join {selectedGuild.name}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Guild Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#39FF14]/15 border border-[#39FF14]/40 flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                  <Shield className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Found a New Study Guild</h3>
                  <p className="text-xs text-white/40 mt-0.5 font-sans">Establish an academic group and link your squad in database.</p>
                </div>
              </div>

              <form onSubmit={handleCreateGuild} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5 tracking-wider">Guild Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BUET Titans, DMC Med Squad, Apex SSC 2026"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5 tracking-wider">Guild Tag (Max 5 chars)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="e.g. BUET, TITAN"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 font-mono uppercase focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5 tracking-wider">Target Domain</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as Guild["category"])}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#141414] border border-white/10 text-white text-xs focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Medical">Medical</option>
                      <option value="Varsity">Varsity</option>
                      <option value="HSC">HSC</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 block mb-1.5 tracking-wider">Guild Description / Motto</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your study syndicate's mission, daily commitments, and target examinations..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#39FF14]/5 border border-[#39FF14]/20 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                    Founding members get an instant <span className="text-[#39FF14] font-bold">+5% Focus Synergy XP Multiplier</span> and automatic Guild ID association in cloud storage.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)] font-mono"
                  >
                    {isSubmitting ? "Creating..." : "Establish Guild"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
