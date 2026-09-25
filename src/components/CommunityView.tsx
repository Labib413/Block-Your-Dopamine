import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Radio, 
  MessageSquare, 
  Send, 
  Heart, 
  Share2, 
  Crown, 
  Medal, 
  Search, 
  Filter, 
  ArrowLeft,
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Plus,
  FlameKindling,
  Target,
  Award,
  Shield,
  BookOpen,
  X
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { GlassCard } from "./GlassCard";
import { cn } from "@/src/lib/utils";
import { BADGES } from "../constants";
import { GuildStudyRoom } from "./GuildStudyRoom";

interface CommunityMember {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  level: number;
  xp: number;
  streak: number;
  netFocusMinutes: number;
  detoxScore: number;
  status: "focusing" | "idle" | "break";
  currentTask?: string;
  focusStartedAt?: string;
  badges: string[];
  institution?: string;
  year?: string;
  rank?: number;
}

interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  timestamp: string;
  type: "milestone" | "reflection" | "challenge_complete" | "general";
  content: string;
  statsHighlight?: {
    label: string;
    value: string;
  };
  reactions: {
    fire: number;
    boost: number;
    shield: number;
    diamond: number;
  };
  userReactions?: string[];
}

interface DetoxChallenge {
  id: string;
  title: string;
  description: string;
  category: "Detox" | "Focus" | "Monk Mode" | "Academic";
  daysDuration: number;
  participantsCount: number;
  joined: boolean;
  rewardXp: number;
  badgeRewardId?: string;
  endsInDays: number;
  goal: string;
}

interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  leader: string;
  membersCount: number;
  maxMembers: number;
  level: number;
  rank: number;
  totalXp: number;
  weeklyGoalHours: number;
  joined: boolean;
  category: "Engineering" | "Medical" | "Varsity" | "General" | "HSC";
  perks: string;
}

const INITIAL_GUILDS: Guild[] = [
  {
    id: "g1",
    name: "BUET Pioneers",
    tag: "BUET",
    description: "Dedicated to intense problem solving, higher mathematics, and hardcore engineering entrance prep.",
    leader: "Tanvir Hasan",
    membersCount: 48,
    maxMembers: 50,
    level: 12,
    rank: 1,
    totalXp: 184500,
    weeklyGoalHours: 350,
    joined: false,
    category: "Engineering",
    perks: "+10% Focus XP Buff & BUET Question Bank"
  },
  {
    id: "g2",
    name: "DMC Medicos Syndicate",
    tag: "DMC",
    description: "Daily biology memorization, medical question bank mastery, and zero-distraction grinds.",
    leader: "Nabila Tabassum",
    membersCount: 42,
    maxMembers: 50,
    level: 10,
    rank: 2,
    totalXp: 162000,
    weeklyGoalHours: 320,
    joined: true,
    category: "Medical",
    perks: "+8% Bio Mastery Buff & Med Flashcards"
  },
  {
    id: "g3",
    name: "Apex Scholars (DU Ka)",
    tag: "APEX",
    description: "Pure science champions competing for top national varsity ranks with disciplined routines.",
    leader: "Farhan Ahmed",
    membersCount: 36,
    maxMembers: 50,
    level: 8,
    rank: 3,
    totalXp: 139200,
    weeklyGoalHours: 280,
    joined: false,
    category: "Varsity",
    perks: "+5% Daily Streak Protection"
  },
  {
    id: "g4",
    name: "Monk Mode Elite",
    tag: "MONK",
    description: "Strict dopamine detox, 6+ hours daily net focus, and extreme discipline for HSC 2026.",
    leader: "Sabbir Hossain",
    membersCount: 29,
    maxMembers: 30,
    level: 7,
    rank: 4,
    totalXp: 118400,
    weeklyGoalHours: 250,
    joined: false,
    category: "HSC",
    perks: "Exclusive Monk Mode Audio & Emblems"
  }
];

const INITIAL_MEMBERS: CommunityMember[] = [
  {
    id: "user_top_1",
    username: "arif_focus",
    fullName: "Arif Rahman",
    level: 19,
    xp: 9450,
    streak: 42,
    netFocusMinutes: 2840,
    detoxScore: 98,
    status: "focusing",
    currentTask: "Advanced Physics Chapter 4 - Thermodynamics",
    badges: ["f1", "f2", "f3", "f4", "h1", "h3"],
    institution: "BUET",
    year: "HSC 2025"
  },
  {
    id: "user_top_2",
    username: "nabil_detox",
    fullName: "Nabil Khan",
    level: 16,
    xp: 7820,
    streak: 31,
    netFocusMinutes: 2310,
    detoxScore: 94,
    status: "focusing",
    currentTask: "Monk Mode 4h Sprint - Organic Chemistry",
    badges: ["f1", "f2", "f5", "h2"],
    institution: "Notre Dame College",
    year: "HSC 2026"
  },
  {
    id: "user_top_3",
    username: "sadia_study",
    fullName: "Sadia Islam",
    level: 15,
    xp: 7100,
    streak: 28,
    netFocusMinutes: 2150,
    detoxScore: 96,
    status: "idle",
    badges: ["f1", "f3", "h1", "h4"],
    institution: "Viqarunnisa Noon",
    year: "HSC 2025"
  },
  {
    id: "user_top_4",
    username: "tanvir_code",
    fullName: "Tanvir Ahmed",
    level: 13,
    xp: 6200,
    streak: 19,
    netFocusMinutes: 1890,
    detoxScore: 91,
    status: "focusing",
    currentTask: "Calculus Deep Flow Session",
    badges: ["f1", "f2", "h2"],
    institution: "Dhaka College",
    year: "HSC 2026"
  },
  {
    id: "user_top_5",
    username: "fariha_monk",
    fullName: "Fariha Noor",
    level: 12,
    xp: 5800,
    streak: 15,
    netFocusMinutes: 1640,
    detoxScore: 89,
    status: "break",
    badges: ["f1", "h1"],
    institution: "Holy Cross College",
    year: "HSC 2025"
  }
];

const INITIAL_CHALLENGES: DetoxChallenge[] = [
  {
    id: "c1",
    title: "7-Day Social Media Blackout",
    description: "Zero minutes on blocked dopamine-trap domains. Complete 5 daily focus logs without distraction strikes.",
    category: "Monk Mode",
    daysDuration: 7,
    participantsCount: 428,
    joined: true,
    rewardXp: 1200,
    badgeRewardId: "f3",
    endsInDays: 3,
    goal: "0 Distraction Strikes"
  },
  {
    id: "c2",
    title: "50-Hour Weekly Focus Marathon",
    description: "Accumulate at least 50 hours of verified Net Focus Time across 7 days.",
    category: "Focus",
    daysDuration: 7,
    participantsCount: 312,
    joined: false,
    rewardXp: 2000,
    badgeRewardId: "f4",
    endsInDays: 5,
    goal: "50h Verified Focus"
  },
  {
    id: "c3",
    title: "Syllabus Mastery Sprint",
    description: "Complete 10 subtopics in your Academic Hub with 100% confidence rating.",
    category: "Academic",
    daysDuration: 14,
    participantsCount: 567,
    joined: false,
    rewardXp: 1500,
    badgeRewardId: "f2",
    endsInDays: 11,
    goal: "10 Topics Mastered"
  }
];

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "p1",
    userId: "user_top_1",
    username: "arif_focus",
    fullName: "Arif Rahman",
    timestamp: "12m ago",
    type: "milestone",
    content: "Just crossed 40 consecutive days of Monk Mode! Unlocked 'The Architect' badge. The hardest part was the first 4 days of social media withdrawal — after that, neural clarity took over.",
    statsHighlight: {
      label: "Detox Streak",
      value: "42 Days"
    },
    reactions: { fire: 34, boost: 18, shield: 12, diamond: 9 }
  },
  {
    id: "p2",
    userId: "user_top_2",
    username: "nabil_detox",
    fullName: "Nabil Khan",
    timestamp: "1h ago",
    type: "reflection",
    content: "Entered a 4-hour uninterrupted study block for HSC Organic Chemistry. Depex Mode and Ambient Rain sound kept my focus score locked at 98%. Let's push today!",
    statsHighlight: {
      label: "Net Focus",
      value: "4h 15m"
    },
    reactions: { fire: 22, boost: 15, shield: 8, diamond: 5 }
  }
];

export function CommunityView({ onBack, onNavigate }: { onBack?: () => void; onNavigate?: (view: string) => void }) {
  const { user, profile, streak, level, xp, totalNetFocusTime, detoxPercent, equippedBadges, isFocusing } = useApp();
  
  const [activeTab, setActiveTab] = useState<"Leaderboard" | "Live Pods" | "Feed" | "Challenges" | "Guild">("Leaderboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderboardFilter, setLeaderboardFilter] = useState<"All Time" | "Weekly" | "Today">("All Time");
  
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem("byd_community_posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [challenges, setChallenges] = useState<DetoxChallenge[]>(() => {
    const saved = localStorage.getItem("byd_community_challenges");
    return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
  });

  const [guilds, setGuilds] = useState<Guild[]>(() => {
    const saved = localStorage.getItem("byd_community_guilds");
    return saved ? JSON.parse(saved) : INITIAL_GUILDS;
  });

  const [guildFilter, setGuildFilter] = useState<string>("All");
  const [guildSearch, setGuildSearch] = useState<string>("");
  const [selectedGuildRoomId, setSelectedGuildRoomId] = useState<string | null>(null);
  const [isCreateGuildOpen, setIsCreateGuildOpen] = useState(false);
  const [newGuildName, setNewGuildName] = useState("");
  const [newGuildTag, setNewGuildTag] = useState("");
  const [newGuildDesc, setNewGuildDesc] = useState("");
  const [newGuildCategory, setNewGuildCategory] = useState<Guild["category"]>("Engineering");

  const [newPostContent, setNewPostContent] = useState("");
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);

  // Sync posts to localStorage
  useEffect(() => {
    localStorage.setItem("byd_community_posts", JSON.stringify(posts));
  }, [posts]);

  // Sync challenges to localStorage
  useEffect(() => {
    localStorage.setItem("byd_community_challenges", JSON.stringify(challenges));
  }, [challenges]);

  // Sync guilds to localStorage
  useEffect(() => {
    localStorage.setItem("byd_community_guilds", JSON.stringify(guilds));
  }, [guilds]);

  const currentUsername = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  const currentFullName = profile?.fullName || user?.user_metadata?.full_name || "Tasnem Hossen";

  // Build current user entry in leaderboard
  const myNetMinutes = Math.floor((totalNetFocusTime || 0) / 60);
  const myMemberEntry: CommunityMember = useMemo(() => ({
    id: user?.id || "local-user-001",
    username: currentUsername,
    fullName: currentFullName,
    avatarUrl: profile?.avatarUrl,
    level: level || 1,
    xp: xp || 0,
    streak: streak || 3,
    netFocusMinutes: myNetMinutes || 480,
    detoxScore: detoxPercent || 92,
    status: isFocusing ? "focusing" : "idle",
    currentTask: isFocusing ? "Deep Focus Session in Progress" : undefined,
    badges: equippedBadges && equippedBadges.length > 0 ? equippedBadges : ["f1", "h1"],
    institution: profile?.institution || "BYD Academy",
    year: profile?.year || "HSC 2026"
  }), [user?.id, currentUsername, currentFullName, profile, level, xp, streak, myNetMinutes, detoxPercent, isFocusing, equippedBadges]);

  // Combine and sort leaderboard members
  const allMembers = useMemo(() => {
    const list = [...INITIAL_MEMBERS.filter(m => m.username !== currentUsername), myMemberEntry];
    list.sort((a, b) => b.xp - a.xp);
    return list.map((m, idx) => ({ ...m, rank: idx + 1 }));
  }, [myMemberEntry, currentUsername]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(m => 
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.institution && m.institution.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allMembers, searchQuery]);

  const livePods = useMemo(() => {
    return allMembers.filter(m => m.status === "focusing");
  }, [allMembers]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      userId: user?.id || "local-user-001",
      username: currentUsername,
      fullName: currentFullName,
      avatarUrl: profile?.avatarUrl,
      timestamp: "Just now",
      type: "reflection",
      content: newPostContent.trim(),
      statsHighlight: streak > 0 ? {
        label: "Streak",
        value: `${streak} Days`
      } : undefined,
      reactions: { fire: 1, boost: 0, shield: 0, diamond: 0 },
      userReactions: ["fire"]
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  const handleToggleReaction = (postId: string, reactionKey: "fire" | "boost" | "shield" | "diamond") => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      const userReactions = post.userReactions || [];
      const hasReacted = userReactions.includes(reactionKey);
      
      const newReactions = { ...post.reactions };
      let newUserReactions = [...userReactions];

      if (hasReacted) {
        newReactions[reactionKey] = Math.max(0, newReactions[reactionKey] - 1);
        newUserReactions = newUserReactions.filter(r => r !== reactionKey);
      } else {
        newReactions[reactionKey] = (newReactions[reactionKey] || 0) + 1;
        newUserReactions.push(reactionKey);
      }

      return {
        ...post,
        reactions: newReactions,
        userReactions: newUserReactions
      };
    }));
  };

  const handleToggleChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(c => {
      if (c.id !== challengeId) return c;
      const nextJoined = !c.joined;
      return {
        ...c,
        joined: nextJoined,
        participantsCount: nextJoined ? c.participantsCount + 1 : Math.max(0, c.participantsCount - 1)
      };
    }));
  };

  const handleToggleGuild = (guildId: string) => {
    setGuilds(prev => prev.map(g => {
      if (g.id !== guildId) return g;
      const nextJoined = !g.joined;
      return {
        ...g,
        joined: nextJoined,
        membersCount: nextJoined ? g.membersCount + 1 : Math.max(1, g.membersCount - 1)
      };
    }));
  };

  const handleCreateGuild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuildName.trim() || !newGuildTag.trim()) return;

    const newGuild: Guild = {
      id: `g_${Date.now()}`,
      name: newGuildName.trim(),
      tag: newGuildTag.trim().toUpperCase(),
      description: newGuildDesc.trim() || "A high-focus academic syndicate dedicated to zero distractions.",
      leader: currentFullName,
      membersCount: 1,
      maxMembers: 50,
      level: 1,
      rank: guilds.length + 1,
      totalXp: 2500,
      weeklyGoalHours: 200,
      joined: true,
      category: newGuildCategory,
      perks: "+5% Synergy Focus Boost"
    };

    setGuilds(prev => [newGuild, ...prev]);
    setIsCreateGuildOpen(false);
    setNewGuildName("");
    setNewGuildTag("");
    setNewGuildDesc("");
    setSelectedGuildRoomId(newGuild.id);
  };

  const filteredGuilds = useMemo(() => {
    return guilds.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(guildSearch.toLowerCase()) || 
                            g.tag.toLowerCase().includes(guildSearch.toLowerCase()) ||
                            g.description.toLowerCase().includes(guildSearch.toLowerCase());
      const matchesCategory = guildFilter === "All" || g.category === guildFilter;
      return matchesSearch && matchesCategory;
    });
  }, [guilds, guildSearch, guildFilter]);

  const userJoinedGuild = useMemo(() => {
    return guilds.find(g => g.joined);
  }, [guilds]);

  const activeGuildForRoom = useMemo(() => {
    return guilds.find(g => g.id === selectedGuildRoomId);
  }, [guilds, selectedGuildRoomId]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                <Users className="w-5 h-5 text-[#39FF14]" />
              </div>
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">
                Community <span className="text-[#39FF14]">Hub</span>
              </h1>
            </div>
            <p className="text-white/40 text-xs mt-1 font-medium tracking-wide">
              Connect with fellow dopamine detox warriors, compete on global leaderboards, and study in live focus pods.
            </p>
          </div>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <Radio className="w-4 h-4 text-[#39FF14] animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-white/40 block leading-none">Live Detoxers</span>
              <span className="text-sm font-bold text-white">{livePods.length + 14} Online</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-white/40 block leading-none">Your Rank</span>
              <span className="text-sm font-bold text-[#39FF14]">#{myMemberEntry.rank || 4} Global</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0e0e0e] border border-white/[0.06] rounded-2xl w-fit">
        {(["Leaderboard", "Live Pods", "Feed", "Challenges", "Guild"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2",
              activeTab === tab
                ? "bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            {tab === "Leaderboard" && <Trophy className="w-3.5 h-3.5" />}
            {tab === "Live Pods" && <Radio className="w-3.5 h-3.5" />}
            {tab === "Feed" && <MessageSquare className="w-3.5 h-3.5" />}
            {tab === "Challenges" && <Target className="w-3.5 h-3.5" />}
            {tab === "Guild" && <Shield className="w-3.5 h-3.5" />}
            {tab}
            {tab === "Live Pods" && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[9px] font-black",
                activeTab === tab ? "bg-black/20 text-black" : "bg-[#39FF14]/20 text-[#39FF14]"
              )}>
                {livePods.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Leaderboard */}
      {activeTab === "Leaderboard" && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search warriors or institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {(["All Time", "Weekly", "Today"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLeaderboardFilter(filter)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors",
                    leaderboardFilter === filter
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allMembers.slice(0, 3).map((member, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              return (
                <GlassCard 
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={cn(
                    "cursor-pointer relative flex flex-col items-center text-center p-6 transition-all duration-300",
                    isFirst && "border-[#FFD700]/40 bg-[#FFD700]/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]",
                    isSecond && "border-slate-300/30 bg-white/5",
                    isThird && "border-amber-600/30 bg-amber-600/5",
                    member.username === currentUsername && "ring-1 ring-[#39FF14]/60 shadow-[0_0_20px_rgba(57,255,20,0.15)]"
                  )}
                >
                  <div className="absolute top-4 right-4">
                    {isFirst && <Crown className="w-6 h-6 text-[#FFD700]" />}
                    {isSecond && <Medal className="w-5 h-5 text-slate-300" />}
                    {isThird && <Medal className="w-5 h-5 text-amber-500" />}
                  </div>

                  <div className="relative mb-3">
                    <div className="w-16 h-16 rounded-full bg-[#121212] border-2 border-white/20 flex items-center justify-center overflow-hidden">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-white/70">{member.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div className={cn(
                      "absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                      isFirst ? "bg-[#FFD700] text-black" : isSecond ? "bg-slate-300 text-black" : "bg-amber-600 text-white"
                    )}>
                      #{idx + 1}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    {member.fullName}
                    {member.username === currentUsername && (
                      <span className="text-[10px] text-[#39FF14] font-black uppercase tracking-wider">(You)</span>
                    )}
                  </h3>
                  <span className="text-xs text-white/40 font-mono">@{member.username}</span>

                  <div className="mt-4 grid grid-cols-2 gap-2 w-full pt-4 border-t border-white/5">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase font-bold">XP</span>
                      <span className="text-sm font-bold text-[#39FF14]">{member.xp}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase font-bold">Streak</span>
                      <span className="text-sm font-bold text-orange-400">{member.streak}d</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {/* Full Leaderboard Table */}
          <div className="bg-[#090909] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/[0.06] grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span className="col-span-1 text-center">Rank</span>
              <span className="col-span-4">Warrior</span>
              <span className="col-span-2 text-center">Level & XP</span>
              <span className="col-span-2 text-center">Streak</span>
              <span className="col-span-2 text-center">Net Focus</span>
              <span className="col-span-1 text-right">Detox %</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {filteredMembers.map((member) => {
                const isMe = member.username === currentUsername;
                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={cn(
                      "p-4 grid grid-cols-12 items-center cursor-pointer transition-colors duration-200 hover:bg-white/[0.04]",
                      isMe && "bg-[#39FF14]/5 border-l-2 border-[#39FF14]"
                    )}
                  >
                    <div className="col-span-1 text-center font-mono font-bold text-sm">
                      {member.rank === 1 ? (
                        <span className="text-[#FFD700]">🥇 1</span>
                      ) : member.rank === 2 ? (
                        <span className="text-slate-300">🥈 2</span>
                      ) : member.rank === 3 ? (
                        <span className="text-amber-500">🥉 3</span>
                      ) : (
                        <span className="text-white/40">#{member.rank}</span>
                      )}
                    </div>

                    <div className="col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white/70">{member.fullName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                          {member.fullName}
                          {isMe && <span className="text-[9px] font-black text-[#39FF14] uppercase">(You)</span>}
                        </span>
                        <span className="text-xs text-white/40 truncate font-mono">
                          @{member.username} {member.institution ? `• ${member.institution}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-xs font-bold text-white block">Lvl {member.level}</span>
                      <span className="text-[10px] text-white/40 font-mono">{member.xp} XP</span>
                    </div>

                    <div className="col-span-2 text-center flex items-center justify-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-500" fill="currentColor" />
                      <span className="text-xs font-bold text-white">{member.streak} Days</span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="text-xs font-bold text-[#39FF14] block">
                        {Math.floor(member.netFocusMinutes / 60)}h {member.netFocusMinutes % 60}m
                      </span>
                    </div>

                    <div className="col-span-1 text-right">
                      <span className="px-2 py-0.5 rounded-lg bg-[#39FF14]/10 text-[#39FF14] text-xs font-bold font-mono">
                        {member.detoxScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Focus Pods */}
      {activeTab === "Live Pods" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#39FF14]/10 via-transparent to-blue-500/10 border border-[#39FF14]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-[#39FF14] animate-pulse" />
                <span className="text-xs font-bold text-[#39FF14] uppercase tracking-widest">Active Study Pods</span>
              </div>
              <h2 className="text-xl font-bold text-white">Live Peer Accountability</h2>
              <p className="text-xs text-white/40 mt-1 max-w-xl">
                Enter deep focus mode alongside fellow BYD members. Broadcast your live sprint or join an active session.
              </p>
            </div>

            <button
              onClick={() => onNavigate?.("Detox")}
              className="px-5 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_15px_rgba(57,255,20,0.3)] shrink-0 flex items-center gap-2"
            >
              <Flame className="w-4 h-4" fill="currentColor" />
              {isFocusing ? "Resume My Focus Session" : "Start Live Focus Sprint"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {livePods.map((member) => (
              <GlassCard key={member.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base font-bold text-white/70">{member.fullName.charAt(0)}</span>
                      )}
                      <div className="w-2.5 h-2.5 rounded-full bg-[#39FF14] border border-black absolute -bottom-0.5 -right-0.5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{member.fullName}</h4>
                      <span className="text-[11px] text-white/40 font-mono">@{member.username}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14] text-[10px] font-bold uppercase tracking-wider">
                    In Focus
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-white/40">
                    <Target className="w-3 h-3 text-[#39FF14]" /> Current Objective
                  </div>
                  <p className="text-xs font-medium text-white/90 leading-snug">
                    {member.currentTask || "Deep Monkish Focus Sprint"}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-white/40">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#39FF14]" /> Active Sprint
                  </span>
                  <span className="font-mono text-white/70 font-semibold">Streak: {member.streak}d</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Community Feed */}
      {activeTab === "Feed" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Create Post Form */}
          <GlassCard className="p-5">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#39FF14]/20 border border-[#39FF14]/40 flex items-center justify-center text-xs font-bold text-[#39FF14]">
                  {currentFullName.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block leading-none">{currentFullName}</span>
                  <span className="text-[10px] text-white/40 font-mono leading-none">Share your breakthrough</span>
                </div>
              </div>

              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share a milestone, focus insight, or motivational breakthrough with the BYD community..."
                rows={3}
                className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors resize-none"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-white/40 font-mono">
                  🔥 Automatic badge & streak badges attached
                </span>
                <button
                  type="submit"
                  disabled={!newPostContent.trim()}
                  className="px-4 py-2 rounded-xl bg-[#39FF14] hover:bg-[#32e012] disabled:opacity-40 disabled:hover:bg-[#39FF14] text-black font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-[0_0_12px_rgba(57,255,20,0.2)]"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </form>
          </GlassCard>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <GlassCard key={post.id} className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {post.avatarUrl ? (
                        <img src={post.avatarUrl} alt={post.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white/70">{post.fullName.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{post.fullName}</h4>
                      <span className="text-xs text-white/40 font-mono">@{post.username} • {post.timestamp}</span>
                    </div>
                  </div>

                  {post.statsHighlight && (
                    <div className="px-3 py-1 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-[#39FF14]" fill="currentColor" />
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-white/40 block leading-none">{post.statsHighlight.label}</span>
                        <span className="text-xs font-bold text-[#39FF14] font-mono leading-none">{post.statsHighlight.value}</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/90 leading-relaxed font-sans">
                  {post.content}
                </p>

                {/* Reaction Buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleToggleReaction(post.id, "fire")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      post.userReactions?.includes("fire")
                        ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    🔥 <span>{post.reactions.fire}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction(post.id, "boost")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      post.userReactions?.includes("boost")
                        ? "bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]"
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    ⚡ <span>{post.reactions.boost}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction(post.id, "shield")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      post.userReactions?.includes("shield")
                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    🛡️ <span>{post.reactions.shield}</span>
                  </button>

                  <button
                    onClick={() => handleToggleReaction(post.id, "diamond")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      post.userReactions?.includes("diamond")
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-400"
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    💎 <span>{post.reactions.diamond}</span>
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Challenges */}
      {activeTab === "Challenges" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <GlassCard key={challenge.id} className="p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                      {challenge.category}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#FFD700] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> +{challenge.rewardXp} XP
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{challenge.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-sans">{challenge.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 font-medium">Goal: {challenge.goal}</span>
                    <span className="text-[#39FF14] font-mono font-bold">{challenge.endsInDays}d left</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                      <Users className="w-3.5 h-3.5 text-white/30" />
                      <span>{challenge.participantsCount} Warriors</span>
                    </div>

                    <button
                      onClick={() => handleToggleChallenge(challenge.id)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
                        challenge.joined
                          ? "bg-white/10 text-white border border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                          : "bg-[#39FF14] hover:bg-[#32e012] text-black shadow-[0_0_15px_rgba(57,255,20,0.2)]"
                      )}
                    >
                      {challenge.joined ? "Joined ✓" : "Join Challenge"}
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Guild */}
      {activeTab === "Guild" && (
        selectedGuildRoomId && activeGuildForRoom ? (
          <GuildStudyRoom 
            guild={activeGuildForRoom} 
            onBack={() => setSelectedGuildRoomId(null)} 
            onToggleJoin={handleToggleGuild} 
          />
        ) : (
          <div className="space-y-6">
            {/* Active Guild Banner if Joined */}
            {userJoinedGuild && (
              <GlassCard className="p-6 border-[#39FF14]/30 relative overflow-hidden bg-gradient-to-r from-[#39FF14]/10 via-black to-transparent">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/40 flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                      <Shield className="w-7 h-7 text-[#39FF14]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#39FF14]/20 border border-[#39FF14]/40 text-[#39FF14] text-[10px] font-mono font-bold">
                          [{userJoinedGuild.tag}]
                        </span>
                        <h3 className="text-xl font-bold text-white tracking-tight">{userJoinedGuild.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-semibold">
                          Rank #{userJoinedGuild.rank}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-1 font-sans max-w-xl">{userJoinedGuild.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[11px] font-mono">
                        <span className="text-[#39FF14] flex items-center gap-1 font-bold">
                          <Zap className="w-3.5 h-3.5" /> {userJoinedGuild.perks}
                        </span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/60">Leader: {userJoinedGuild.leader}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-white/10 flex-wrap">
                    <button
                      onClick={() => setSelectedGuildRoomId(userJoinedGuild.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#FF8C00] hover:bg-[#ff9d26] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(255,140,0,0.25)] transition-all"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Enter Study Room</span>
                    </button>
                    <button
                      onClick={() => handleToggleGuild(userJoinedGuild.id)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      Leave
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Search, Filter & Create Guild Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search guild name or tag..."
                    value={guildSearch}
                    onChange={(e) => setGuildSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {(["All", "Engineering", "Medical", "Varsity", "HSC"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setGuildFilter(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
                        guildFilter === cat
                          ? "bg-[#39FF14]/20 border border-[#39FF14]/50 text-[#39FF14]"
                          : "bg-white/5 border border-white/5 text-white/50 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Guild Button */}
              <button
                onClick={() => setIsCreateGuildOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(57,255,20,0.25)] transition-all shrink-0 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Create Guild</span>
              </button>
            </div>

            {/* Guilds Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGuilds.map((guild) => (
                <GlassCard 
                  key={guild.id} 
                  onClick={() => {
                    if (!guild.joined) {
                      handleToggleGuild(guild.id);
                    }
                    setSelectedGuildRoomId(guild.id);
                  }}
                  className="p-6 flex flex-col justify-between space-y-6 hover:border-[#39FF14]/40 cursor-pointer group transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-base text-[#39FF14] group-hover:scale-105 transition-transform">
                          [{guild.tag}]
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-[#39FF14] transition-colors leading-tight">{guild.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                              Lv.{guild.level}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5">Leader: <span className="text-white/70 font-medium">{guild.leader}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-[#FFD700] flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> #{guild.rank}
                        </span>
                        <span className="text-[10px] text-white/30 uppercase font-semibold mt-0.5">{guild.category}</span>
                      </div>
                    </div>

                    <p className="text-xs text-white/50 leading-relaxed font-sans">{guild.description}</p>

                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2 text-xs text-[#39FF14]">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-medium">{guild.perks}</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-white/40 block font-sans font-bold">Total XP</span>
                        <span className="text-white font-bold">{guild.totalXp.toLocaleString()} XP</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-white/40 block font-sans font-bold">Warriors</span>
                        <span className="text-white font-bold">{guild.membersCount}/{guild.maxMembers}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-white/40 font-mono">
                        <Users className="w-3.5 h-3.5 text-white/30" />
                        <span>{guild.weeklyGoalHours}h weekly goal</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!guild.joined) {
                            handleToggleGuild(guild.id);
                          }
                          setSelectedGuildRoomId(guild.id);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5",
                          guild.joined
                            ? "bg-[#FF8C00] hover:bg-[#ff9d26] text-black shadow-[0_0_15px_rgba(255,140,0,0.25)]"
                            : "bg-[#39FF14] hover:bg-[#32e012] text-black shadow-[0_0_15px_rgba(57,255,20,0.2)]"
                        )}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{guild.joined ? "Enter Room" : "Join & Enter"}</span>
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )
      )}

      {/* Create Guild Modal */}
      <AnimatePresence>
        {isCreateGuildOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsCreateGuildOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.2)]">
                  <Shield className="w-6 h-6 text-[#39FF14]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Found a New Guild</h3>
                  <p className="text-xs text-white/40 mt-0.5 font-medium">Create a study syndicate for your batch or college.</p>
                </div>
              </div>

              <form onSubmit={handleCreateGuild} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">Guild Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., BUET Titan Squad, Medico Elite"
                    value={newGuildName}
                    onChange={(e) => setNewGuildName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">Guild Tag (Max 5 chars)</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="e.g. BUET, TITAN"
                      value={newGuildTag}
                      onChange={(e) => setNewGuildTag(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 font-mono uppercase focus:outline-none focus:border-[#39FF14]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">Target Domain</label>
                    <select
                      value={newGuildCategory}
                      onChange={(e) => setNewGuildCategory(e.target.value as Guild["category"])}
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
                  <label className="text-[10px] uppercase font-bold text-white/40 block mb-1 tracking-wider">Guild Mission / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your guild's focus, daily goals, and target exam..."
                    value={newGuildDesc}
                    onChange={(e) => setNewGuildDesc(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#39FF14]/50 transition-colors resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#39FF14]/5 border border-[#39FF14]/20 flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#39FF14] shrink-0" />
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Founding members receive an immediate <span className="text-[#39FF14] font-bold">+5% Synergy Focus Boost</span> and exclusive guild leader emblem.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateGuildOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#39FF14] hover:bg-[#32e012] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(57,255,20,0.25)]"
                  >
                    Found Guild
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {selectedMember.avatarUrl ? (
                    <img src={selectedMember.avatarUrl} alt={selectedMember.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white/70">{selectedMember.fullName.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedMember.fullName}</h3>
                  <p className="text-xs text-white/40 font-mono">@{selectedMember.username}</p>
                  {selectedMember.institution && (
                    <p className="text-[11px] text-[#39FF14] font-medium mt-0.5">{selectedMember.institution} • {selectedMember.year}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Level</span>
                  <span className="text-lg font-bold text-white font-mono">{selectedMember.level}</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Streak</span>
                  <span className="text-lg font-bold text-orange-400 font-mono">{selectedMember.streak}d</span>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Detox Score</span>
                  <span className="text-lg font-bold text-[#39FF14] font-mono">{selectedMember.detoxScore}%</span>
                </div>
              </div>

              {/* Earned Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/40 block">Equipped Badges</span>
                <div className="flex flex-wrap gap-2">
                  {selectedMember.badges.map((badgeId) => {
                    const badge = BADGES.find(b => b.id === badgeId);
                    return (
                      <div
                        key={badgeId}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-semibold text-white"
                      >
                        <Award className="w-3.5 h-3.5 text-[#39FF14]" />
                        <span>{badge?.title || badgeId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
