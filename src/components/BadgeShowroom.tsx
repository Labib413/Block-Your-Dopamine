import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Droplets, 
  Moon, 
  Footprints, 
  Zap, 
  ShieldCheck, 
  Flame, 
  Star,
  Brain,
  Trophy,
  Check,
  Search,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  Info,
  ChevronRight,
  Shield,
  Heart,
  Crown,
  Activity,
  Maximize2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BADGES, Badge } from '../constants';
import { useApp } from '../context/AppContext';

interface BadgeShowroomProps {
  isOpen: boolean;
  onClose: () => void;
}

// Synergy buffs for badges to make the system deeply engaging
const BADGE_PERKS: Record<string, { buff: string; perkDesc: string }> = {
  'h1': { buff: '+5% Hydration Streak XP', perkDesc: 'Boosts health XP earned from logging hydration habits.' },
  'h2': { buff: '+8% Morning Focus Power', perkDesc: 'Accelerates morning session score between 5 AM - 9 AM.' },
  'h3': { buff: '+10% Recovery Resilience', perkDesc: 'Shields streak against 1 missed habit log.' },
  'h4': { buff: '+5% Vitality Surge', perkDesc: 'Grants extra XP on reaching daily step milestones.' },
  'f1': { buff: '+5% Focus XP Multiplier', perkDesc: 'Multiplies all net focus time points by 1.05x.' },
  'f2': { buff: '+8% Flow State Resonance', perkDesc: 'Decreases dopamine decay rate during active focus sessions.' },
  'f3': { buff: '+12% Deep Work Synergy', perkDesc: 'Unlocks advanced ambient soundscapes in Guild study rooms.' },
  'f4': { buff: '+15% Architect Insight', perkDesc: 'Increases syllabus master score calculation speed.' },
  'f5': { buff: '+20% Unstoppable Aura', perkDesc: 'Broadcasts gold focus aura in Guild rooms.' },
  'f6': { buff: '+25% Apex Mastery Boost', perkDesc: 'Exclusive crown emblem on leaderboard and +25% total XP.' },
  's1': { buff: 'BYD Pioneer Status', perkDesc: 'Permanent founding member glow in all community guilds.' },
  's2': { buff: 'Sentinel Bug Hunter', perkDesc: 'Special golden bug insignia and priority feature previews.' },
};

export const BadgeShowroom: React.FC<BadgeShowroomProps> = ({ isOpen, onClose }) => {
  const { equipBadge, equippedBadges, unlockedBadgeIds, badgeHealth } = useApp();
  
  const [activeCategory, setActiveCategory] = useState<'All' | 'Health' | 'Focus' | 'Special'>('All');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Unlocked' | 'Locked'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspectedBadge, setInspectedBadge] = useState<Badge | null>(null);

  // Statistics
  const totalBadges = BADGES.length;
  const unlockedCount = useMemo(() => BADGES.filter(b => unlockedBadgeIds.includes(b.id)).length, [unlockedBadgeIds]);
  const unlockPercentage = Math.round((unlockedCount / (totalBadges || 1)) * 100);

  // Active synergy bonus calculation based on equipped badges
  const activeSynergies = useMemo(() => {
    return equippedBadges
      .filter((id): id is string => Boolean(id))
      .map(id => {
        const badge = BADGES.find(b => b.id === id);
        const perk = BADGE_PERKS[id];
        return { badge, perk };
      })
      .filter((item): item is { badge: Badge; perk: { buff: string; perkDesc: string } } => Boolean(item.badge && item.perk));
  }, [equippedBadges]);

  // Filtered badges list
  const filteredBadges = useMemo(() => {
    return BADGES.filter(badge => {
      const isUnlocked = unlockedBadgeIds.includes(badge.id);
      
      // Category filter
      if (activeCategory !== 'All' && badge.category !== activeCategory) {
        return false;
      }
      // Rarity filter
      if (selectedRarity !== 'All' && badge.rarity !== selectedRarity) {
        return false;
      }
      // Status filter
      if (filterStatus === 'Unlocked' && !isUnlocked) return false;
      if (filterStatus === 'Locked' && isUnlocked) return false;
      
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = badge.title.toLowerCase().includes(q);
        const matchesDesc = badge.description.toLowerCase().includes(q);
        const matchesPerk = BADGE_PERKS[badge.id]?.buff.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesPerk) return false;
      }
      
      return true;
    });
  }, [activeCategory, selectedRarity, filterStatus, searchQuery, unlockedBadgeIds]);

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': 
        return {
          border: 'border-pink-500/40 text-pink-400 bg-pink-500/10 shadow-[0_0_12px_rgba(236,72,153,0.25)]',
          glow: 'rgba(236,72,153,0.3)',
          gradient: 'from-pink-500/20 via-purple-500/10 to-transparent'
        };
      case 'Epic': 
        return {
          border: 'border-amber-500/40 text-amber-400 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
          glow: 'rgba(245,158,11,0.3)',
          gradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
        };
      case 'Rare': 
        return {
          border: 'border-purple-500/40 text-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
          glow: 'rgba(168,85,247,0.25)',
          gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent'
        };
      default: 
        return {
          border: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.15)]',
          glow: 'rgba(6,182,212,0.2)',
          gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent'
        };
    }
  };

  const slotLabels = [
    { title: 'Health Slot', category: 'Health', icon: Heart, color: '#00F2FF' },
    { title: 'Focus Slot', category: 'Focus', icon: Brain, color: '#00FF9D' },
    { title: 'Wildcard Slot', category: 'Special', icon: Crown, color: '#EC4899' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl transition-all"
          />

          {/* Main Modal Container */}
          <motion.div 
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="relative w-full max-w-5xl bg-[#08080c]/95 border border-white/10 rounded-[28px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex flex-col max-h-[92vh] z-10"
          >
            {/* Top Glowing Ambient Accents */}
            <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#00ff66]/50 to-transparent pointer-events-none" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-28 bg-[#00ff66]/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Header Section */}
            <div className="px-6 py-5 sm:px-8 border-b border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.01]">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00ff66]/20 to-[#00f2ff]/10 border border-[#00ff66]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.25)]">
                    <Trophy className="w-5 h-5 text-[#00ff66]" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#00ff66] border-2 border-black flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-black" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                      Badge Vault & Loadout
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-[#00ff66]">
                      v2.5
                    </span>
                  </div>
                  <p className="text-white/40 text-xs font-medium tracking-wide">
                    Equip unlocked achievements to empower focus synergies & daily perks
                  </p>
                </div>
              </div>

              {/* Progress & Close */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                {/* Vault Progress Pill */}
                <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Unlocked</span>
                    <span className="text-xs font-bold text-white">
                      {unlockedCount} <span className="text-white/40 font-normal">/ {totalBadges}</span>
                    </span>
                  </div>
                  <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${unlockPercentage}%` }}
                      className="h-full bg-gradient-to-r from-[#00ff66] to-[#00f2ff] shadow-[0_0_8px_rgba(0,255,102,0.5)]"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#00ff66]">{unlockPercentage}%</span>
                </div>

                <button 
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loadout Rack: 3 Equipped Slots */}
            <div className="px-6 py-4 sm:px-8 bg-black/40 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#00ff66]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    Active Equipped Loadout (3 Slots)
                  </span>
                </div>
                {activeSynergies.length > 0 && (
                  <span className="text-[9px] font-mono text-[#00ff66] flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    {activeSynergies.length} Synergy Perks Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {slotLabels.map((slot, index) => {
                  const equippedId = equippedBadges[index];
                  const badge = equippedId ? BADGES.find(b => b.id === equippedId) : null;
                  const perk = equippedId ? BADGE_PERKS[equippedId] : null;
                  const health = (equippedId && badgeHealth[equippedId] !== undefined) ? badgeHealth[equippedId] : 100;
                  const rarityStyle = badge ? getRarityBadgeStyle(badge.rarity) : null;

                  return (
                    <motion.div
                      key={index}
                      whileHover={badge ? { scale: 1.01 } : {}}
                      className={cn(
                        "relative p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 overflow-hidden",
                        badge 
                          ? "bg-white/[0.04] border-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.4)]" 
                          : "bg-white/[0.01] border-dashed border-white/10 text-white/30"
                      )}
                    >
                      {badge ? (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Mini Frame */}
                            <div 
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border relative flex-shrink-0",
                                rarityStyle?.border || "border-white/20 bg-white/5"
                              )}
                              style={{ backgroundColor: `${badge.color}15` }}
                            >
                              {typeof badge.icon === 'string' ? (
                                <img 
                                  src={badge.icon} 
                                  alt={badge.title} 
                                  className="w-6 h-6 object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <badge.icon 
                                  className="w-5 h-5 drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" 
                                  style={{ color: badge.color }} 
                                />
                              )}
                            </div>

                            {/* Badge Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-white/40">
                                  {slot.category}
                                </span>
                                <span className={cn("text-[7px] font-black px-1 py-0.2 rounded border", rarityStyle?.border)}>
                                  {badge.rarity}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-white truncate">{badge.title}</h4>
                              {perk && (
                                <p className="text-[9px] text-[#00ff66] truncate font-medium">{perk.buff}</p>
                              )}
                            </div>
                          </div>

                          {/* Unequip Button */}
                          <button
                            onClick={() => equipBadge(badge.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 text-[9px] font-bold transition-all flex items-center gap-1 flex-shrink-0 cursor-pointer"
                            title="Unequip badge"
                          >
                            <X className="w-3 h-3" />
                            <span className="hidden xs:inline">Unequip</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full text-white/30 py-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center">
                              <slot.icon className="w-3.5 h-3.5 text-white/20" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{slot.title}</p>
                              <p className="text-[9px] text-white/20">Empty slot</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-white/20 px-2 py-0.5 rounded bg-white/[0.02]">
                            Select below
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Controls Bar: Category Tabs, Rarity, Search, View Mode */}
            <div className="px-6 pt-4 pb-3 sm:px-8 border-b border-white/[0.05] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white/[0.01]">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {(['All', 'Health', 'Focus', 'Special'] as const).map((cat) => {
                  const count = cat === 'All' 
                    ? BADGES.length 
                    : BADGES.filter(b => b.category === cat).length;
                  const unlockedInCat = cat === 'All'
                    ? unlockedCount
                    : BADGES.filter(b => b.category === cat && unlockedBadgeIds.includes(b.id)).length;

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border flex items-center gap-2 cursor-pointer flex-shrink-0",
                        activeCategory === cat 
                          ? "bg-[#00ff66]/10 border-[#00ff66]/40 text-[#00ff66] shadow-[0_0_12px_rgba(0,255,102,0.15)]" 
                          : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
                      )}
                    >
                      <span>{cat}</span>
                      <span className={cn(
                        "text-[9px] font-mono px-1.5 py-0.2 rounded-md",
                        activeCategory === cat ? "bg-[#00ff66]/20 text-[#00ff66]" : "bg-white/5 text-white/30"
                      )}>
                        {unlockedInCat}/{count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search badges..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00ff66]/50 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Toggle (All / Unlocked / Locked) */}
                <div className="flex bg-white/[0.03] border border-white/10 rounded-xl p-0.5">
                  {(['All', 'Unlocked', 'Locked'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                        filterStatus === status
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* View Mode Switcher */}
                <div className="hidden sm:flex bg-white/[0.03] border border-white/10 rounded-xl p-0.5">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === 'grid' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn("p-1.5 rounded-lg transition-all cursor-pointer", viewMode === 'list' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}
                    title="List view"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Badges Grid / Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-hide">
              {filteredBadges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-white/20" />
                  </div>
                  <h4 className="text-base font-bold text-white/60">No badges match your filter</h4>
                  <p className="text-xs text-white/30 max-w-sm mt-1">
                    Try adjusting your search terms, category, or status toggle to explore more achievements.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setSelectedRarity('All');
                      setFilterStatus('All');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredBadges.map((badge) => {
                      const isUnlocked = unlockedBadgeIds.includes(badge.id);
                      const isEquipped = equippedBadges.includes(badge.id);
                      const rarity = getRarityBadgeStyle(badge.rarity);
                      const perk = BADGE_PERKS[badge.id];
                      const health = (badgeHealth[badge.id] !== undefined) ? badgeHealth[badge.id] : 100;

                      return (
                        <motion.div
                          key={badge.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          onClick={() => setInspectedBadge(badge)}
                          className={cn(
                            "group relative p-4.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer",
                            isUnlocked 
                              ? isEquipped
                                ? "bg-white/[0.06] border-[#00ff66]/40 shadow-[0_0_20px_rgba(0,255,102,0.15)] hover:border-[#00ff66]/60"
                                : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] shadow-lg"
                              : "bg-black/50 border-white/5 opacity-55 hover:opacity-75"
                          )}
                        >
                          {/* Radial Background Accent on Hover / Unlocked */}
                          {isUnlocked && (
                            <div 
                              className="absolute -top-12 -right-12 w-32 h-32 blur-[40px] opacity-15 rounded-full pointer-events-none transition-opacity group-hover:opacity-30"
                              style={{ backgroundColor: badge.color }}
                            />
                          )}

                          {/* Top Row: Frame + Rarity + Category */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              {/* Holographic Frame */}
                              <div className="relative">
                                <div className={cn(
                                  "w-13 h-13 rounded-2xl flex items-center justify-center border transition-all duration-300 relative",
                                  isUnlocked ? rarity.border : "border-white/5 bg-black/40",
                                  isUnlocked && "group-hover:scale-105"
                                )}
                                style={isUnlocked ? { backgroundColor: `${badge.color}15` } : {}}
                                >
                                  {/* Corner marks for game feel */}
                                  {isUnlocked && (
                                    <>
                                      <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-white/30" />
                                      <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-white/30" />
                                      <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-white/30" />
                                      <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-white/30" />
                                    </>
                                  )}

                                  {typeof badge.icon === 'string' ? (
                                    <img 
                                      src={badge.icon} 
                                      alt={badge.title}
                                      className={cn(
                                        "w-8 h-8 object-contain transition-all duration-300",
                                        isUnlocked ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "grayscale opacity-40"
                                      )}
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <badge.icon 
                                      className={cn(
                                        "w-7 h-7 transition-all duration-300",
                                        isUnlocked ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "opacity-30 text-white/40"
                                      )}
                                      style={{ color: isUnlocked ? badge.color : '#555' }} 
                                    />
                                  )}
                                </div>

                                {!isUnlocked && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-lg">
                                    <Lock className="w-2.5 h-2.5 text-white/40" />
                                  </div>
                                )}
                              </div>

                              {/* Badges & Tags */}
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border",
                                    isUnlocked ? rarity.border : "border-white/10 bg-white/5 text-white/30"
                                  )}>
                                    {badge.rarity}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-white/5 border border-white/5 text-white/40">
                                    {badge.category}
                                  </span>
                                </div>

                                {isEquipped && (
                                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66] text-[8px] font-black tracking-widest uppercase">
                                    <Check className="w-2.5 h-2.5" />
                                    Equipped
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Badge Title & Description */}
                            <h3 className={cn(
                              "text-sm font-bold tracking-wide transition-colors mb-1",
                              isUnlocked ? "text-white group-hover:text-[#00ff66]" : "text-white/40"
                            )}>
                              {badge.title}
                            </h3>
                            <p className="text-[11px] text-white/40 font-medium leading-relaxed line-clamp-2 mb-3">
                              {badge.description}
                            </p>

                            {/* Synergy Buff Display */}
                            {perk && (
                              <div className={cn(
                                "p-2 rounded-xl mb-3 border text-[10px] flex items-center gap-2",
                                isUnlocked 
                                  ? "bg-[#00ff66]/5 border-[#00ff66]/20 text-[#00ff66]" 
                                  : "bg-white/[0.02] border-white/5 text-white/30"
                              )}>
                                <Zap className="w-3 h-3 flex-shrink-0" />
                                <span className="font-semibold truncate">{perk.buff}</span>
                              </div>
                            )}

                            {/* Durability meter for Health / Focus badges */}
                            {isUnlocked && badge.category !== 'Special' && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-[9px] font-mono text-white/40 mb-1">
                                  <span>Integrity</span>
                                  <span className={cn(
                                    "font-bold",
                                    health > 60 ? "text-[#00ff66]" : health > 30 ? "text-amber-400" : "text-red-400"
                                  )}>
                                    {Math.round(health)}%
                                  </span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full transition-all duration-500",
                                      health > 60 ? "bg-[#00ff66]" : health > 30 ? "bg-amber-400" : "bg-red-500"
                                    )}
                                    style={{ width: `${health}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Footer */}
                          <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between gap-2 mt-auto">
                            <span className="text-[9px] text-white/30 flex items-center gap-1">
                              <Info className="w-2.5 h-2.5" />
                              Click to inspect
                            </span>

                            {isUnlocked ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  equipBadge(badge.id);
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer",
                                  isEquipped
                                    ? "bg-[#00ff66] text-black shadow-[0_0_15px_rgba(0,255,102,0.4)] hover:bg-[#00ff66]/90"
                                    : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                                )}
                              >
                                {isEquipped ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Equipped
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3 h-3" />
                                    Equip
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/5 text-[9px] font-bold text-white/30 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Locked
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : (
                /* Compact List View */
                <div className="flex flex-col gap-2.5">
                  {filteredBadges.map((badge) => {
                    const isUnlocked = unlockedBadgeIds.includes(badge.id);
                    const isEquipped = equippedBadges.includes(badge.id);
                    const rarity = getRarityBadgeStyle(badge.rarity);
                    const perk = BADGE_PERKS[badge.id];

                    return (
                      <div
                        key={badge.id}
                        onClick={() => setInspectedBadge(badge)}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer",
                          isUnlocked 
                            ? isEquipped
                              ? "bg-white/[0.06] border-[#00ff66]/40 shadow-sm"
                              : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                            : "bg-black/40 border-white/5 opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0",
                            isUnlocked ? rarity.border : "border-white/5 bg-black/40"
                          )}>
                            {typeof badge.icon === 'string' ? (
                              <img src={badge.icon} alt={badge.title} className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <badge.icon className="w-5 h-5" style={{ color: isUnlocked ? badge.color : '#555' }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={cn("text-xs font-bold truncate", isUnlocked ? "text-white" : "text-white/40")}>
                                {badge.title}
                              </h4>
                              <span className={cn("text-[8px] font-black px-1.5 py-0.2 rounded border", isUnlocked ? rarity.border : "border-white/5 text-white/30")}>
                                {badge.rarity}
                              </span>
                              <span className="text-[8px] font-bold text-white/30 uppercase">{badge.category}</span>
                            </div>
                            <p className="text-[10px] text-white/40 truncate">{badge.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          {perk && (
                            <span className="hidden md:inline-block text-[10px] font-mono text-[#00ff66] bg-[#00ff66]/5 px-2.5 py-1 rounded-lg border border-[#00ff66]/20">
                              {perk.buff}
                            </span>
                          )}

                          {isUnlocked ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                equipBadge(badge.id);
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 cursor-pointer",
                                isEquipped
                                  ? "bg-[#00ff66] text-black"
                                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {isEquipped ? <Check className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                              {isEquipped ? "Equipped" : "Equip"}
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-white/30 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.02]">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 sm:px-8 border-t border-white/[0.06] bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00ff66]" />
                <span className="text-[10px] font-mono">
                  Daily focus & health routines sustain badge integrity & unlock legendary tiers.
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00ff66]" /> Common
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" /> Rare
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Epic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-400" /> Legendary
                </span>
              </div>
            </div>
          </motion.div>

          {/* Inspected Badge Modal Drawer */}
          <AnimatePresence>
            {inspectedBadge && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setInspectedBadge(null)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-md bg-[#0c0c12] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-20 overflow-hidden"
                >
                  {/* Glowing backdrop in modal */}
                  <div 
                    className="absolute -top-16 -right-16 w-48 h-48 blur-[60px] opacity-25 rounded-full pointer-events-none"
                    style={{ backgroundColor: inspectedBadge.color }}
                  />

                  {/* Close button */}
                  <button 
                    onClick={() => setInspectedBadge(null)}
                    className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Badge Big Icon */}
                  <div className="flex flex-col items-center text-center mt-2 mb-5">
                    <div 
                      className={cn(
                        "w-24 h-24 rounded-3xl flex items-center justify-center border-2 mb-4 relative shadow-2xl",
                        unlockedBadgeIds.includes(inspectedBadge.id) 
                          ? getRarityBadgeStyle(inspectedBadge.rarity).border 
                          : "border-white/10 bg-black/60"
                      )}
                      style={{ backgroundColor: `${inspectedBadge.color}15` }}
                    >
                      {typeof inspectedBadge.icon === 'string' ? (
                        <img 
                          src={inspectedBadge.icon} 
                          alt={inspectedBadge.title} 
                          className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <inspectedBadge.icon 
                          className="w-12 h-12 drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]" 
                          style={{ color: inspectedBadge.color }} 
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                        getRarityBadgeStyle(inspectedBadge.rarity).border
                      )}>
                        {inspectedBadge.rarity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/50">
                        {inspectedBadge.category} Category
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white tracking-tight">{inspectedBadge.title}</h3>
                    <p className="text-xs text-white/50 mt-1 max-w-xs">{inspectedBadge.description}</p>
                  </div>

                  {/* Perk Details */}
                  {BADGE_PERKS[inspectedBadge.id] && (
                    <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
                      <div className="flex items-center gap-2 text-[#00ff66] mb-1">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold">{BADGE_PERKS[inspectedBadge.id].buff}</span>
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        {BADGE_PERKS[inspectedBadge.id].perkDesc}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {unlockedBadgeIds.includes(inspectedBadge.id) ? (
                      <button
                        onClick={() => {
                          equipBadge(inspectedBadge.id);
                          setInspectedBadge(null);
                        }}
                        className={cn(
                          "w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer",
                          equippedBadges.includes(inspectedBadge.id)
                            ? "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"
                            : "bg-[#00ff66] text-black hover:bg-[#00ff66]/90 shadow-[0_0_20px_rgba(0,255,102,0.4)]"
                        )}
                      >
                        {equippedBadges.includes(inspectedBadge.id) ? (
                          <>
                            <X className="w-4 h-4" /> Unequip Badge
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Equip Badge to Loadout
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-center text-xs font-bold text-white/40 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> Locked — Complete Requirement to Unlock
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
