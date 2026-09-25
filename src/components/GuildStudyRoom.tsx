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
  Send
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp } from "../context/AppContext";
import { cn } from "@/src/lib/utils";

export interface GuildMemberDesk {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isFocusing: boolean;
  focusSecondsToday: number;
  currentSessionSeconds: number;
  currentSubject?: string;
  streak: number;
  level: number;
  cheersCount: number;
  isCurrentUser?: boolean;
}

export interface GuildData {
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

interface GuildStudyRoomProps {
  guild: GuildData;
  onBack: () => void;
  onToggleJoin: (guildId: string) => void;
}

// Generate realistic dynamic desks for the Guild
const GENERATE_INITIAL_DESKS = (guild: GuildData, currentUsername: string, isUserFocusing: boolean): GuildMemberDesk[] => {
  const mockNames = [
    { username: currentUsername || "you", fullName: "You (Warrior)", isCurrentUser: true, isFocusing: isUserFocusing, baseSec: 355, todaySec: 21600, subject: "Physics 1st Paper" },
    { username: "mkshaon7", fullName: "Shaon Ahmed", isFocusing: true, baseSec: 355, todaySec: 18450, subject: "Higher Math 2nd" },
    { username: "sinha✨", fullName: "Sinha Rahman", isFocusing: true, baseSec: 895, todaySec: 53734, subject: "Organic Chemistry" },
    { username: "shahnewazkamal", fullName: "Shahnewaz Kamal", isFocusing: false, baseSec: 0, todaySec: 64199, subject: "Botany" },
    { username: "motivationhubd5", fullName: "Fahim Faysal", isFocusing: false, baseSec: 0, todaySec: 43074, subject: "Biology 1st" },
    { username: "Mohammed", fullName: "Mohammed Ali", isFocusing: false, baseSec: 0, todaySec: 17130, subject: "Chemistry" },
    { username: "Tahira", fullName: "Tahira Khanom", isFocusing: false, baseSec: 0, todaySec: 13959, subject: "English & ICT" },
    { username: "Lighter", fullName: "Rashedul Islam", isFocusing: false, baseSec: 0, todaySec: 13534, subject: "Vector Calculus" },
    { username: "shihabmahmud8f17", fullName: "Shihab Mahmud", isFocusing: false, baseSec: 0, todaySec: 11864, subject: "Dynamics" },
    { username: "muhammadanaye", fullName: "Anayet Hossain", isFocusing: false, baseSec: 0, todaySec: 10925, subject: "Electrochemistry" },
    { username: "Md", fullName: "Md. Tanvir", isFocusing: false, baseSec: 0, todaySec: 10371, subject: "Wave & Optics" },
    { username: "Koushik", fullName: "Koushik Roy", isFocusing: false, baseSec: 0, todaySec: 10276, subject: "Integration" },
    { username: "Mehedi Antor", fullName: "Mehedi Hasan", isFocusing: false, baseSec: 0, todaySec: 9000, subject: "Zoology" },
    { username: "lodhha", fullName: "Subrata Lodh", isFocusing: false, baseSec: 0, todaySec: 8520, subject: "Genetics" },
    { username: "sahinjatuba54c5", fullName: "Sahinur Islam", isFocusing: false, baseSec: 0, todaySec: 7420, subject: "Thermodynamics" },
    { username: "nironchak", fullName: "Niron Chakma", isFocusing: false, baseSec: 0, todaySec: 6300, subject: "Static Electricity" }
  ];

  return mockNames.map((m, idx) => ({
    id: `desk_${idx}_${m.username}`,
    username: m.username,
    fullName: m.fullName,
    isFocusing: m.isFocusing,
    currentSessionSeconds: m.baseSec,
    focusSecondsToday: m.todaySec,
    currentSubject: m.subject,
    streak: Math.max(3, 30 - idx),
    level: Math.max(2, 20 - idx),
    cheersCount: Math.floor(Math.random() * 25) + 5,
    isCurrentUser: m.isCurrentUser
  }));
};

function formatTimer(seconds: number, showHoursAlways = false): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0 || showHoursAlways) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GuildStudyRoom({ guild, onBack, onToggleJoin }: GuildStudyRoomProps) {
  const { 
    user, 
    profile, 
    isFocusing, 
    startFocusSession, 
    stopFocusSession,
    totalNetFocusTime
  } = useApp();

  const currentUsername = profile?.username || user?.user_metadata?.username || user?.email?.split("@")[0] || "you";
  
  const [desks, setDesks] = useState<GuildMemberDesk[]>(() => {
    return GENERATE_INITIAL_DESKS(guild, currentUsername, isFocusing);
  });

  const [activeTab, setActiveTab] = useState<"Room" | "Leaderboard" | "CheerWall">("Room");
  const [selectedDesk, setSelectedDesk] = useState<GuildMemberDesk | null>(null);
  const [floatingCheers, setFloatingCheers] = useState<{ id: number; deskId: string; emoji: string }[]>([]);
  const [ambientAudio, setAmbientAudio] = useState(false);
  const [ambientSoundType, setAmbientSoundType] = useState<"Rain" | "Library" | "WhiteNoise" | "Cafe">("Rain");
  const [cheerMsg, setCheerMsg] = useState("");
  const [guildCheers, setGuildCheers] = useState<{ id: string; sender: string; text: string; time: string; emoji: string }[]>([
    { id: "c1", sender: "sinha✨", text: "Pushing for 6 hours today! Let's conquer HSC!", time: "5m ago", emoji: "🔥" },
    { id: "c2", sender: "mkshaon7", text: "Engineering Math sprint in session. Stay disciplined guys!", time: "18m ago", emoji: "⚡" },
    { id: "c3", sender: "shahnewazkamal", text: "Finished 17 hours study pot yesterday. Keep going!", time: "1h ago", emoji: "👑" }
  ]);

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

  const handlePostCheerMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheerMsg.trim()) return;

    setGuildCheers(prev => [
      {
        id: `c_${Date.now()}`,
        sender: currentUsername,
        text: cheerMsg.trim(),
        time: "Just now",
        emoji: "🔥"
      },
      ...prev
    ]);
    setCheerMsg("");
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

                  <button
                    onClick={() => handleSendCheer(member.id, "🔥")}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/10 text-xs flex items-center gap-1"
                  >
                    <span>🔥</span>
                    <span className="font-mono text-[11px]">{member.cheersCount}</span>
                  </button>
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

              <div className="pt-2">
                <button
                  onClick={() => setSelectedDesk(null)}
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
