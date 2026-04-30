import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Lock, 
  Droplets, 
  Moon, 
  Footprints, 
  Zap, 
  Monitor, 
  ShieldCheck, 
  Flame, 
  Star,
  Brain,
  Trophy,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BADGES, Badge } from '../constants';
import { useApp } from '../context/AppContext';

interface BadgeShowroomProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeShowroom: React.FC<BadgeShowroomProps> = ({ isOpen, onClose }) => {
  const { equipBadge, equippedBadges, unlockedBadgeIds, badgeHealth } = useApp();
  const [activeTab, setActiveTab] = useState<'Health' | 'Focus' | 'Special'>('Health');

  const filteredBadges = BADGES.filter(badge => badge.category === activeTab);
  const unlockedCount = BADGES.filter(b => unlockedBadgeIds.includes(b.id)).length;

  const getRarityStyles = (rarity: string, isUnlocked: boolean) => {
    if (!isUnlocked) return "border-white/5 bg-black/20";
    switch (rarity) {
      case 'Legendary': return "border-pink-500/50 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.3)]";
      case 'Rare': return "border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_rgba(139,92,246,0.2)]";
      default: return "border-blue-500/30 bg-blue-500/5 shadow-[0_0_10px_rgba(0,229,255,0.1)]";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.2)]">
                  <Trophy className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h2 className="text-2xl font-sans font-bold text-white tracking-tight">Achievements</h2>
                  <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Your Badge Showroom</p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-6 flex gap-2">
              {(['Health', 'Focus', 'Special'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border",
                    activeTab === tab 
                      ? "bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.1)]" 
                      : "bg-white/5 border-white/5 text-white/40 hover:text-white/60 hover:bg-white/10"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Badges Grid */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              {/* Collection Progress */}
              <div className="mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-neon-green/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-neon-green" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Collection Progress</p>
                    <h4 className="text-lg font-sans font-bold text-white">
                      {unlockedCount} / {BADGES.length} <span className="text-xs text-white/40 font-sans ml-1">Badges</span>
                    </h4>
                  </div>
                </div>
                <div className="flex-1 max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden ml-8">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
                    className="h-full bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)]"
                  />
                </div>
              </div>

              <motion.div 
                layout
                className="flex flex-col gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredBadges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "relative p-5 rounded-2xl border transition-all duration-500 group overflow-hidden",
                        unlockedBadgeIds.includes(badge.id) 
                          ? "bg-white/[0.05] border-white/10 hover:border-white/20 hover:bg-white/[0.08]" 
                          : "bg-black/40 border-white/5 opacity-50 grayscale"
                      )}
                    >
                      {/* Background Glow for Unlocked */}
                      {unlockedBadgeIds.includes(badge.id) && (
                        <div 
                          className="absolute -top-10 -right-10 w-32 h-32 blur-[50px] opacity-10 rounded-full transition-opacity group-hover:opacity-20"
                          style={{ backgroundColor: badge.color }}
                        />
                      )}

                      <div className="flex items-center gap-6 text-left relative z-10 w-full">
                        <div className="relative flex-shrink-0">
                          {/* Game-style Frame */}
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative",
                            typeof badge.icon === 'string' 
                              ? (unlockedBadgeIds.includes(badge.id) ? "border-white/20 bg-transparent" : "border-white/5 bg-black/20")
                              : getRarityStyles(badge.rarity, unlockedBadgeIds.includes(badge.id)),
                            unlockedBadgeIds.includes(badge.id) && "group-hover:scale-105 group-hover:rotate-2"
                          )}>
                            {/* Inner Decorative Corners */}
                            {unlockedBadgeIds.includes(badge.id) && (
                              <>
                                <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-white/20 rounded-tl-sm" />
                                <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-white/20 rounded-tr-sm" />
                                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-white/20 rounded-bl-sm" />
                                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-white/20 rounded-tr-sm" />
                              </>
                            )}
                            
                            {typeof badge.icon === 'string' ? (
                              <img 
                                src={badge.icon} 
                                alt={badge.title}
                                className={cn(
                                  "w-10 h-10 object-contain transition-all duration-500",
                                  unlockedBadgeIds.includes(badge.id) ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""
                                )}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <badge.icon 
                                className={cn(
                                  "w-8 h-8 transition-all duration-500",
                                  unlockedBadgeIds.includes(badge.id) ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""
                                )}
                                style={{ color: unlockedBadgeIds.includes(badge.id) ? badge.color : '#444' }} 
                              />
                            )}

                            {/* Health Bar for Unlocked Health/Focus Badges */}
                            {unlockedBadgeIds.includes(badge.id) && badge.category !== 'Special' && (
                              <div className="absolute -bottom-1 left-1.5 right-1.5 h-1 bg-black/40 rounded-full border border-white/5 overflow-hidden z-20">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${badgeHealth[badge.id] ?? 100}%` }}
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    (badgeHealth[badge.id] ?? 100) > 60 ? "bg-neon-green" : 
                                    (badgeHealth[badge.id] ?? 100) > 30 ? "bg-yellow-400" : "bg-red-500"
                                  )}
                                />
                              </div>
                            )}
                          </div>
                          
                          {/* Rarity Tag */}
                          {unlockedBadgeIds.includes(badge.id) && (
                            <div className={cn(
                              "absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-tighter border shadow-lg",
                              badge.rarity === 'Legendary' ? "bg-pink-500 border-pink-400 text-white" :
                              badge.rarity === 'Rare' ? "bg-purple-500 border-purple-400 text-white" :
                              "bg-blue-500 border-blue-400 text-white"
                            )}>
                              {badge.rarity}
                            </div>
                          )}

                          {!unlockedBadgeIds.includes(badge.id) && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-black border border-white/10 flex items-center justify-center shadow-xl">
                              <Lock className="w-2.5 h-2.5 text-white/40" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "text-base font-bold tracking-wide mb-0.5 transition-colors",
                            unlockedBadgeIds.includes(badge.id) ? "text-white" : "text-white/40"
                          )}>
                            {badge.title}
                          </h3>
                          <p className="text-xs text-white/30 font-medium leading-relaxed line-clamp-2">
                            {badge.description}
                          </p>
                        </div>

                        {unlockedBadgeIds.includes(badge.id) && (
                          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
                            <motion.div 
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border shadow-inner text-center"
                              style={{ color: badge.color, borderColor: `${badge.color}33`, backgroundColor: `${badge.color}11` }}
                            >
                              Unlocked
                            </motion.div>
                            
                            <button
                              onClick={() => equipBadge(badge.id)}
                              className={cn(
                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-w-[110px]",
                                equippedBadges.includes(badge.id)
                                  ? "bg-neon-green text-black shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                                  : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              {equippedBadges.includes(badge.id) ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  Equipped
                                </>
                              ) : (
                                "Equip Badge"
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Locked Overlay */}
                      {!unlockedBadgeIds.includes(badge.id) && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-none" />
                      )}

                      {/* Legendary Shimmer Effect */}
                      {unlockedBadgeIds.includes(badge.id) && badge.rarity === 'Legendary' && (
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-center">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                Keep pushing your limits to unlock more
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
