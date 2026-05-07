import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Heart, 
  Moon, 
  Droplets, 
  Footprints, 
  Flame, 
  Clock,
  Star,
  Zap,
  Smile,
  Music,
  ArrowLeft,
  Brain,
  Stethoscope,
  Sparkles,
  Plus,
  Monitor,
  Scale,
  PieChart,
  Minus,
  RefreshCw,
  Camera,
  Loader2,
  Send,
  Check,
  X,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GlassCard } from './GlassCard';
import { Type } from "@google/genai";
import { callGemini } from '../services/gemini';

import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

interface HealthHubProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const HealthHub: React.FC<HealthHubProps> = ({ onBack, onNavigate }) => {
  const { 
    user,
    hydrationIntake, updateHydration,
    sleepHours, sleepSessions, updateSleep,
    steps, updateSteps,
    consumedCalories, updateCalories,
    screenTimeHours, screenTimeMinutes, updateScreenTime,
    healthTargets, updateHealthTargets,
    latestMood, updateMood,
    macros, updateMacros,
    geminiApiKey,
    addNotification
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'Physical' | 'Mental'>('Physical');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success'>('idle');
  const [showKeyModal, setShowKeyModal] = useState(false);

  const checkApiKey = () => {
    if (!geminiApiKey) {
      setShowKeyModal(true);
      addNotification("API Key Required", "Kindly set your API KEY to use AI features.");
      return false;
    }
    return true;
  };

  const handleUpdateTargets = () => {
    setUpdateStatus('updating');
    // Simulate a small delay for "pro" feel
    setTimeout(() => {
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 2000);
    }, 600);
  };
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jarvisResponse, setJarvisResponse] = useState({
    brief: "Initializing diagnostic scan... Please update your metrics for a personalized health brief.",
    suggestions: [] as string[]
  });

  // Local Rule-based Analysis for Instant Updates
  const updateJarvisConsultation = useCallback(() => {
    const hTarget = Number(healthTargets.hydration) || 8;
    const sTarget = Number(healthTargets.sleep) || 8;
    
    let briefParts = [];
    let tips = [];

    // Hydration Logic
    if (hydrationIntake >= hTarget) {
      briefParts.push("Hydration target achieved.");
    } else if (hydrationIntake > hTarget / 2) {
      briefParts.push("Hydration nearly complete.");
      tips.push("• Drink 1-2 more glasses of water.");
    } else {
      briefParts.push("Hydration is very low.");
      tips.push("• Drink a glass of water now.");
    }

    // Sleep Logic
    if (sleepHours < sTarget) {
      briefParts.push("Sleep deficit detected.");
      tips.push("• Try to sleep early tonight.");
    } else {
      briefParts.push("Sleep duration is adequate.");
    }

    // Screen Time Logic
    if (screenTimeHours >= 4) {
      briefParts.push("Screen time is excessive.");
      tips.push("• Rest your eyes for 5 minutes.");
    }

    // Mood Logic
    if (latestMood) {
      if (latestMood.emoji === '😔' || latestMood.emoji === '😫') {
        briefParts.push("Mood seems a bit low.");
        tips.push("• Practice 5-min Box Breathing.");
      } else if (latestMood.emoji === '😊') {
        briefParts.push("Your mood is quite positive.");
      }
    }

    // Combine and limit
    const brief = briefParts.slice(0, 2).join(" ") || "Scanning your health data...";
    const finalTips = Array.from(new Set(tips)).slice(0, 2);

    setJarvisResponse(prev => {
      if (prev.brief === brief && JSON.stringify(prev.suggestions) === JSON.stringify(finalTips)) return prev;
      return { brief, suggestions: finalTips };
    });
  }, [hydrationIntake, sleepHours, screenTimeHours, latestMood, healthTargets]);

  // Trigger analysis instantly when metrics change
  useEffect(() => {
    updateJarvisConsultation();
  }, [updateJarvisConsultation]);

  const handleMoodUpdate = useCallback((text: string, emoji: string) => {
    updateMood(text, emoji);
  }, [updateMood]);

  const handleMealAdd = useCallback((cals: number) => {
    const newTotal = consumedCalories + cals;
    if (newTotal > 5000) {
      if (window.confirm(`Your total calories for today will be ${newTotal} kcal, which exceeds the 5,000 kcal limit. Do you want to proceed?`)) {
        updateCalories(newTotal, true);
      }
    } else {
      updateCalories(newTotal);
    }
  }, [consumedCalories, updateCalories]);

  return (
    <div className="flex-1 flex flex-col bg-[#050505] text-white min-h-screen relative overflow-hidden font-sans">
      {/* Background Ambient Glows for Neon Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#00E5FF]/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-[#00E5FF]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="pt-8 pb-4 flex flex-col items-center justify-center relative z-10 text-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF]/30 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00E5FF]/20 blur-xl rounded-full animate-pulse" />
            <Heart className="w-12 h-12 text-[#00E5FF] relative z-10 mb-2" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight uppercase">Health</h1>
          <p className="text-[#00E5FF]/60 text-sm font-medium mt-2 tracking-wide">
            - Track your health for the maximum Output
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-8 pb-8 grid grid-cols-12 gap-6 relative z-10 max-w-7xl mx-auto w-full items-center">
        
        {/* Left Section: Dr. Jarvis Consultation Card */}
        <div className="col-span-12 lg:col-span-8">
          <div className="p-8 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden group">
            {/* Subtle neon edge glow */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent" />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/5 to-transparent pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Left Element: Holographic Wave */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 border-2 border-[#00E5FF]/20 rounded-full"
                  />
                  <motion.div 
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-3 border border-[#00E5FF]/30 rounded-full"
                  />
                  <div className="w-20 h-20 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/40 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#00E5FF22,transparent)]" />
                    <Activity className="w-8 h-8 text-[#00E5FF] animate-pulse" />
                  </div>
                  {/* Pulse Rings */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
                      className="absolute inset-0 border border-[#00E5FF]/40 rounded-full"
                    />
                  ))}
                </div>
              </div>

              {/* Right Element: Consultation Content */}
              <div className="flex-1 flex flex-col w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#00E5FF]" />
                  <h2 className="text-xl font-bold text-white tracking-wide">Dr. Jarvis</h2>
                </div>
                
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 relative overflow-hidden flex flex-col">
                  {/* Grid Overlay */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                  
                  <div className="relative z-10 flex flex-col">
                    <h3 className="text-[10px] font-bold text-[#00E5FF]/40 uppercase tracking-[0.2em] mb-2 flex items-center justify-between">
                      Your Consultation
                      {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin" />}
                    </h3>
                    <div className="space-y-3">
                      <p className="text-white/70 text-sm leading-relaxed italic">
                        "{jarvisResponse.brief}"
                      </p>
                      {jarvisResponse.suggestions.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-white/5">
                          {jarvisResponse.suggestions.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#00E5FF] mt-1.5 shrink-0" />
                              <p className="text-[11px] text-[#00E5FF]/80 font-medium">{tip}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <p className="text-[10px] italic text-[#00E5FF]/40 font-medium">
                    - Analyzed by Dr. Jarvis
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <StatusItem icon={Monitor} value={`${screenTimeHours}h`} label="Time" />
              <div className="w-[1px] h-4 bg-white/10" />
              <StatusItem icon={Droplets} value={hydrationIntake.toString()} label="Glasses" />
              <div className="w-[1px] h-4 bg-white/10" />
              <StatusItem icon={Footprints} value={steps.toLocaleString()} label="steps" />
              <div className="w-[1px] h-4 bg-white/10" />
              <StatusItem icon={Moon} value={`${sleepHours.toFixed(1)}h`} label="sleep" />
              <div className="w-[1px] h-4 bg-white/10" />
              <StatusItem icon={Flame} value={consumedCalories.toString()} label="cal." />
            </div>
          </div>
        </div>

        {/* Right Section: Set Target */}
        <div className="col-span-12 lg:col-span-4">
          <div className="p-8 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden group">
            {/* Subtle neon edge glow */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF]/30 to-transparent" />
            
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col h-full">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-5 ml-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#00E5FF]" />
                Set Target
              </h2>
              
              <div className="flex-1 space-y-2.5">
                <TargetField 
                  label="Hydration" 
                  placeholder="glass" 
                  value={healthTargets.hydration}
                  onChange={(v: string) => updateHealthTargets({ ...healthTargets, hydration: v })}
                  onEnter={handleUpdateTargets}
                />
                <TargetField 
                  label="Sleep Time" 
                  placeholder="hour" 
                  value={healthTargets.sleep}
                  onChange={(v: string) => updateHealthTargets({ ...healthTargets, sleep: v })}
                  onEnter={handleUpdateTargets}
                />
                <TargetField 
                  label="Footsteps" 
                  placeholder="steps" 
                  value={healthTargets.footsteps}
                  onChange={(v: string) => updateHealthTargets({ ...healthTargets, footsteps: v })}
                  onEnter={handleUpdateTargets}
                />
                <TargetField 
                  label="Calory Intake" 
                  placeholder="cal." 
                  value={healthTargets.calories}
                  onChange={(v: string) => updateHealthTargets({ ...healthTargets, calories: v })}
                  onEnter={handleUpdateTargets}
                />
              </div>

              <button 
                onClick={handleUpdateTargets}
                disabled={updateStatus === 'updating'}
                className={cn(
                  "w-full mt-5 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 group/btn",
                  updateStatus === 'success' 
                    ? "bg-[#39FF14] text-black shadow-[0_0_20px_rgba(57,255,20,0.4)]" 
                    : "bg-[#00E5FF] text-black hover:bg-white"
                )}
              >
                {updateStatus === 'updating' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : updateStatus === 'success' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Targets Updated!
                  </>
                ) : (
                  <>
                    Update Targets
                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Switcher (Header for Grid) */}
      <div className="pt-2 pb-4 px-8 flex justify-center relative z-10 max-w-7xl mx-auto w-full">
        <div className="p-1.5 rounded-[14px] bg-white/[0.03] border border-white/5 backdrop-blur-xl flex items-center gap-2">
          <button
            onClick={() => setActiveCategory('Physical')}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeCategory === 'Physical' 
                ? "bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]" 
                : "text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/5"
            )}
          >
            <Activity className="w-4 h-4" />
            Physical
          </button>
          <button
            onClick={() => setActiveCategory('Mental')}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeCategory === 'Mental' 
                ? "bg-[#00E5FF] text-black shadow-[0_0_20px_rgba(0,229,255,0.4)]" 
                : "text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/5"
            )}
          >
            <Brain className="w-4 h-4" />
            Mental
          </button>
        </div>
      </div>

      {/* Physical Category Grid */}
      <AnimatePresence mode="wait">
        {activeCategory === 'Physical' && (
          <motion.div 
            key="physical"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-8 pb-6 grid grid-cols-2 auto-rows-[minmax(120px,_auto)] gap-4 relative z-10 max-w-7xl mx-auto w-full"
          >
            <SleepCard onUpdate={updateSleep} goal={Number(healthTargets.sleep) || 8} currentHours={sleepHours} sessions={sleepSessions} />
            <HydrationCard intake={hydrationIntake} onUpdate={updateHydration} goal={Number(healthTargets.hydration) || 8} />
            <FootstepsCard goal={Number(healthTargets.footsteps) || 10000} steps={steps} onUpdate={updateSteps} />
            <ScreenTimeCard onUpdate={updateScreenTime} hours={screenTimeHours} minutes={screenTimeMinutes} />
            <BMICard />
            <MacrosCard onAddMeal={handleMealAdd} goal={Number(healthTargets.calories) || 2000} consumed={consumedCalories} geminiApiKey={geminiApiKey} checkApiKey={checkApiKey} />
          </motion.div>
        )}
        {activeCategory === 'Mental' && (
          <motion.div 
            key="mental"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-8 pb-6 grid grid-cols-2 gap-4 relative z-10 max-w-7xl mx-auto w-full"
          >
            <HealYourselfCard />
            <MoodJournalCard onUpdate={handleMoodUpdate} geminiApiKey={geminiApiKey} checkApiKey={checkApiKey} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Modal Interception */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowKeyModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md p-8 rounded-[32px] bg-black border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A855F7] to-[#00E5FF]" />
              
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <Key className="w-8 h-8 text-[#A855F7]" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Connect <span className="text-[#A855F7]">Gemini AI</span></h3>
                  <p className="text-xs text-white/40 font-medium leading-relaxed">
                    Kindly set your <span className="text-white font-bold">GEMINI API KEY</span> in the System Settings to enable advanced meal analysis and mood journals.
                  </p>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <button 
                    onClick={() => {
                      setShowKeyModal(false);
                      onNavigate?.("Personal");
                    }}
                    className="w-full py-4 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Go to Settings
                  </button>
                  <button 
                    onClick={() => setShowKeyModal(false)}
                    className="w-full py-4 rounded-xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusItem = ({ icon: Icon, value, label }: any) => (
  <div className="flex items-center gap-1.5 group cursor-pointer">
    <Icon className="w-3.5 h-3.5 text-[#00E5FF]" />
    <div className="flex items-baseline gap-1">
      <span className="text-xs font-bold text-white">{value}</span>
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">{label}</span>
    </div>
  </div>
);

const TargetField = ({ label, placeholder, value, onChange, onEnter }: any) => (
  <div className="group">
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 group-hover:border-[#00E5FF]/50 transition-all duration-300 shadow-[0_0_0_rgba(0,229,255,0)] group-hover:shadow-[0_0_15px_rgba(0,229,255,0.1)]">
      <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{label}</label>
      <input 
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        className="bg-transparent text-right text-sm text-white font-bold focus:outline-none placeholder:text-white/20 w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  </div>
);

const BYDCard = ({ icon: Icon, title, goal, color, headerAction, children, compact, className }: any) => {
  return (
    <div 
      className={cn(
        "rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group transition-all duration-300 hover:bg-white/[0.04] hover:border-white/20 flex flex-col h-full min-h-[220px]",
        compact ? "p-3" : "p-5",
        className
      )}
    >
      {/* Subtle neon edge glow */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle Glow */}
      <div 
        className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      
      {/* Top Bar */}
      <div className={cn("flex items-start justify-between relative z-10", compact ? "mb-3" : "mb-4")}>
        <div className={cn("flex items-center", compact ? "gap-2.5" : "gap-3")}>
          <Icon className={cn(compact ? "w-4.5 h-4.5" : "w-5 h-5")} style={{ color }} />
          <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")} style={{ color }}>{title}</h3>
        </div>
        <div className={cn("flex flex-col items-end", compact ? "gap-1.5" : "gap-2")}>
          {goal && <span className={cn("font-bold text-white/40 uppercase tracking-widest", compact ? "text-[9px]" : "text-[10px]")}>{goal}</span>}
          {headerAction}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
};

const HydrationCard = ({ intake, onUpdate, goal }: { intake: number, onUpdate: (v: number) => void, goal: number }) => {
  const percentage = Math.min((intake / goal) * 100, 100);
  const color = "#3B82F6"; // Blue

  // Calculate Y offset for the wave. 24 is empty (below viewBox), -5 is full (covers top)
  const yOffset = 24 - (29 * percentage) / 100;

  return (
    <BYDCard icon={Droplets} title="Hydration" goal={`GOAL: ${goal} GLASSES`} color={color}>
      <div className="flex gap-4 h-full items-center p-2">
        {/* Left: Interactive Water Drop */}
        <div className="w-20 flex items-center justify-center relative">
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Outline & Glass Effect */}
            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full z-10" style={{ filter: `drop-shadow(0 4px 12px ${color}60)` }}>
              <defs>
                <linearGradient id="water-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
                <linearGradient id="water-gradient-light" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60A5FA" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="glass-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="40%" stopColor="white" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {/* Background Glass */}
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="rgba(255,255,255,0.05)" stroke="url(#glass-shine)" strokeWidth="0.5" />
              {/* Main Stroke */}
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="none" stroke="url(#water-gradient-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Highlight reflection */}
              <path d="M7.5 10 A 4.5 4.5 0 0 1 10 7.5" fill="none" stroke="white" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
            </svg>
            
            {/* Fill */}
            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full">
              <clipPath id="drop-clip-large">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </clipPath>
              <g clipPath="url(#drop-clip-large)">
                <motion.g
                  initial={false}
                  animate={{ y: yOffset }}
                  transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                >
                  <motion.path
                    d="M 0 5 Q 6 10 12 5 T 24 5 T 36 5 T 48 5 L 48 48 L 0 48 Z"
                    fill="url(#water-gradient-light)"
                    animate={{ x: [-24, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="opacity-60"
                  />
                  <motion.path
                    d="M 0 5 Q 6 0 12 5 T 24 5 T 36 5 T 48 5 L 48 48 L 0 48 Z"
                    fill="url(#water-gradient)"
                    animate={{ x: [0, -24] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="opacity-95"
                  />
                </motion.g>

                {/* Bubbles */}
                {intake > 0 && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <motion.circle cx="10" cy="22" r="0.8" fill="white" animate={{ y: [0, -15], opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeIn" }} />
                    <motion.circle cx="14" cy="24" r="1.2" fill="white" animate={{ y: [0, -18], opacity: [0, 0.5, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeIn", delay: 0.5 }} />
                    <motion.circle cx="8" cy="20" r="0.6" fill="white" animate={{ y: [0, -12], opacity: [0, 0.8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeIn", delay: 1.2 }} />
                  </motion.g>
                )}
              </g>
            </svg>
            
            {/* Number Overlay */}
            <motion.span 
              key={intake}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="absolute z-20 text-xl font-sans font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mt-3"
            >
              {intake}
            </motion.span>
          </div>
        </div>
        
        {/* Right: Controls and Text */}
        <div className="flex-1 flex flex-col gap-3 justify-center pr-2">
          <div className="flex gap-2">
            <button 
              onClick={() => onUpdate(Math.max(0, intake - 1))}
              className="flex-1 bg-[#1A1A1A] hover:bg-[#222] border border-white/5 rounded-lg py-2 flex items-center justify-center transition-colors"
            >
              <Minus className="w-4 h-4 text-white/60" />
            </button>
            <button 
              onClick={() => {
                if (intake < 50) onUpdate(intake + 1);
              }}
              className="flex-1 bg-[#1E3A8A] hover:bg-[#1E40AF] rounded-lg py-2 flex items-center justify-center transition-colors"
            >
              <Plus className="w-4 h-4 text-[#60A5FA]" />
            </button>
          </div>
          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider leading-tight">
            {intake <= 2 ? 'Start your day with a fresh glass of water!' : 
             intake <= 5 ? 'You are doing great! Keep hydrating for better focus.' : 
             'Almost there! Your brain is thankful for the hydration.'}
          </p>
        </div>
      </div>
    </BYDCard>
  );
};

const SleepCard = ({ onUpdate, goal, currentHours, sessions }: { onUpdate: (v: number, delta?: number) => void, goal: number, currentHours: number, sessions: number }) => {
  const color = "#A855F7"; // Purple
  
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeUp, setWakeUp] = useState("07:00");

  // Calculate duration
  const calculateDuration = () => {
    const [h1, m1] = bedtime.split(':').map(Number);
    const [h2, m2] = wakeUp.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return diff / 60;
  };

  const duration = calculateDuration();
  const rating = Math.min(Math.max(Math.round((duration / goal) * 5), 0), 5);

  const handleLogSession = () => {
    const newTotal = currentHours + duration;
    if (newTotal <= 24) {
      onUpdate(newTotal, 1);
    } else {
      alert("Total sleep hours cannot exceed 24 hours.");
    }
  };

  const handleCancelSession = () => {
    onUpdate(Math.max(0, currentHours - duration), -1);
  };

  return (
    <BYDCard icon={Moon} title="Sleep Tracker" goal={`GOAL: ${goal}H`} color={color}>
      <div className="flex flex-col h-full justify-between gap-2">
        {/* Time Inputs - Compact Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Bedtime</label>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 flex items-center justify-between">
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="bg-transparent text-white text-xs font-medium focus:outline-none [color-scheme:dark] w-full" />
              <Clock className="w-3 h-3 text-white/30" />
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Wake Up</label>
            <div className="bg-[#1A1A1A] border border-white/10 rounded-lg px-2 py-1 flex items-center justify-between">
              <input type="time" value={wakeUp} onChange={(e) => setWakeUp(e.target.value)} className="bg-transparent text-white text-xs font-medium focus:outline-none [color-scheme:dark] w-full" />
              <Clock className="w-3 h-3 text-white/30" />
            </div>
          </div>
        </div>
        
        {/* Rating and Total - Same Line */}
        <div className="flex items-center justify-between">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-yellow-500 fill-yellow-500" : "text-white/20"}`} />
            ))}
          </div>
          <span className="text-sm font-bold" style={{ color }}>{duration.toFixed(1)}h</span>
        </div>
        
        {/* Today's Sessions & Total Sleep - Compact */}
        <div className="flex items-center justify-between text-[9px] text-white/40 border-t border-white/5 pt-2">
          <span>Sessions: {sessions}</span>
          <span className="font-bold text-white/60">Total: {currentHours.toFixed(1)}h</span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={handleLogSession} className="flex-1 bg-[#39FF14] text-black text-[10px] font-bold py-2 rounded-lg hover:bg-[#32e612] transition-colors uppercase tracking-widest">
            Log Session
          </button>
          <button 
            onClick={handleCancelSession} 
            title="Cancel Last Session"
            className="px-3 bg-white/5 border border-white/10 text-white/60 text-[10px] font-bold py-2 rounded-lg hover:bg-white/10 transition-colors uppercase tracking-widest flex items-center justify-center group/cancel"
          >
            <X className="w-3 h-3 group-hover/cancel:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </BYDCard>
  );
};

const FootstepsCard = ({ goal, steps, onUpdate }: { goal: number, steps: number, onUpdate: (v: number) => void }) => {
  const percentage = Math.min((steps / goal) * 100, 100);
  const color = "#F59E0B"; // Orange

  return (
    <BYDCard icon={Footprints} title="Activity" goal={`GOAL: ${goal} STEPS`} color={color}>
      <div className="flex gap-3 items-center h-full">
        {/* Left: Input and Button */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 flex flex-col transition-all hover:bg-white/[0.05] hover:border-white/20 group/input">
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] mb-0.5 group-focus-within/input:text-[#F59E0B]/60 transition-colors">Steps Count</span>
            <input 
              type="number" 
              placeholder="0" 
              value={steps || ''}
              className="bg-transparent text-white text-base font-sans font-bold focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-white/10"
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val <= 100000) onUpdate(val);
              }}
            />
          </div>
          <button className="w-full bg-[#78350F]/40 hover:bg-[#92400E]/60 text-[#FDBA74] font-bold py-1 rounded-lg text-[9px] tracking-[0.2em] transition-all border border-[#78350F]/30 hover:border-[#FDBA74]/30 uppercase">
            Update
          </button>
        </div>
        
        {/* Right: Percentage Display */}
        <div className="w-20 h-20 flex flex-col items-center justify-center relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/10 to-transparent rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-2xl font-sans font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">{Math.round(percentage)}%</span>
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-bold text-white/40 uppercase tracking-[0.2em]">Goal</span>
            </div>
          </div>
          
          {/* Subtle Progress Ring Background */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 opacity-20" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="2" strokeDasharray="282.7" strokeDashoffset="0" />
            <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="4" strokeDasharray="282.7" strokeDashoffset={282.7 - (percentage / 100) * 282.7} strokeLinecap="round" className="transition-all duration-1000" />
          </svg>
        </div>
      </div>
    </BYDCard>
  );
};

const HealYourselfCard = () => {
  const [rhythm, setRhythm] = useState<'4-7-8' | 'Box' | '4-6'>('4-7-8');
  const [phase, setPhase] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setPhase('');
      setScale(1);
      return;
    }

    let timeout: NodeJS.Timeout;

    const runRhythm = async () => {
      while (isActive) {
        if (rhythm === '4-7-8') {
          setPhase('Inhale'); setScale(1.5); await new Promise(r => timeout = setTimeout(r, 4000));
          if (!isActive) break;
          setPhase('Hold'); setScale(1.5); await new Promise(r => timeout = setTimeout(r, 7000));
          if (!isActive) break;
          setPhase('Exhale'); setScale(1); await new Promise(r => timeout = setTimeout(r, 8000));
        } else if (rhythm === 'Box') {
          setPhase('Inhale'); setScale(1.5); await new Promise(r => timeout = setTimeout(r, 4000));
          if (!isActive) break;
          setPhase('Hold'); setScale(1.5); await new Promise(r => timeout = setTimeout(r, 4000));
          if (!isActive) break;
          setPhase('Exhale'); setScale(1); await new Promise(r => timeout = setTimeout(r, 4000));
          if (!isActive) break;
          setPhase('Hold'); setScale(1); await new Promise(r => timeout = setTimeout(r, 4000));
        } else if (rhythm === '4-6') {
          setPhase('Inhale'); setScale(1.5); await new Promise(r => timeout = setTimeout(r, 4000));
          if (!isActive) break;
          setPhase('Exhale'); setScale(1); await new Promise(r => timeout = setTimeout(r, 6000));
        }
      }
    };

    runRhythm();
    return () => clearTimeout(timeout);
  }, [isActive, rhythm]);

  return (
    <BYDCard icon={Sparkles} title="Heal Yourself" goal="BREATHING" color="#00E5FF">
      <div className="flex flex-col items-center justify-between h-full py-2">
        {/* Breathing Circle Container - Fixed Height & Z-Index */}
        <div className="h-48 flex items-center justify-center w-full relative z-0">
          <motion.div 
            animate={{ scale }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full border-4 border-[#00E5FF] flex items-center justify-center text-[#00E5FF] font-bold text-sm shadow-[0_0_20px_rgba(0,229,255,0.3)] max-w-[150px] max-h-[150px] relative"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={phase || 'idle'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center px-2"
              >
                {phase || "Let's Heal!"}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controls - Relative Z-Index */}
        <div className="w-full flex flex-col gap-4 relative z-10">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={cn("w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", isActive ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30")}
          >
            {isActive ? 'Stop/Reset' : 'Start Breathing'}
          </button>
          
          <div className="flex justify-center gap-2">
            {['4-7-8', 'Box', '4-6'].map(r => (
              <button 
                key={r} 
                onClick={() => { setRhythm(r as any); setIsActive(false); }} 
                className={cn("px-3 py-1.5 rounded-md text-[9px] font-bold transition-colors", rhythm === r ? "bg-[#00E5FF] text-black" : "bg-white/5 text-white/60 hover:bg-white/10")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BYDCard>
  );
};

const MoodJournalCard = ({ onUpdate, geminiApiKey, checkApiKey }: { onUpdate: (text: string, emoji: string) => void, geminiApiKey: string | null, checkApiKey: () => boolean }) => {
  const [text, setText] = useState('');
  const [mood, setMood] = useState<{emoji: string, suggestion: string} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMood = async () => {
    if (!text.trim() || isAnalyzing) return;
    if (!checkApiKey()) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await callGemini({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Analyze this journal entry and determine the mood. Provide a short, supportive response (max 20 words) and a single emoji that represents the mood. If the mood is sad or down, use the "😕" emoji. Entry: ${text}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emoji: { type: Type.STRING, description: "Representing emoji" },
              suggestion: { type: Type.STRING, description: "Supportive response" }
            },
            required: ["emoji", "suggestion"]
          }
        }
      }, geminiApiKey);

      if (response.text) {
        const result = JSON.parse(response.text);
        const detectedEmoji = result.emoji || '😐';
        const suggestion = result.suggestion || "I'm here to listen.";
        
        setMood({ emoji: detectedEmoji, suggestion });
        onUpdate(text, detectedEmoji);
      }
    } catch (error: any) {
      if (error?.message?.includes('Failed to fetch')) {
        logger.error("Gemini API Error: Failed to fetch. Check your internet connection or API key.");
      } else {
        logger.error("Error analyzing mood:", error);
      }
      // Fallback to local logic if AI fails
      const lowerText = text.toLowerCase();
      const sadKeywords = ['sad', 'tired', 'depressed', 'lonely', 'unhappy', 'down'];
      const happyKeywords = ['happy', 'great', 'good', 'joy', 'excited', 'positive'];
      const angryKeywords = ['angry', 'stressed', 'frustrated', 'annoyed', 'mad'];

      let detectedEmoji = '😐';
      let suggestion = "I'm not quite sure how you're feeling, but I'm here to listen.";

      if (sadKeywords.some(word => lowerText.includes(word))) {
        detectedEmoji = '😕';
        suggestion = "I'm sorry you're feeling this way. Take a deep breath.";
      } else if (happyKeywords.some(word => lowerText.includes(word))) {
        detectedEmoji = '😊';
        suggestion = "That's great to hear! Keep up the positive energy.";
      } else if (angryKeywords.some(word => lowerText.includes(word))) {
        detectedEmoji = '😫';
        suggestion = 'It sounds like you\'re stressed. Try some deep breathing.';
      }

      setMood({ emoji: detectedEmoji, suggestion });
      onUpdate(text, detectedEmoji);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <BYDCard icon={Smile} title="Mood Journal" goal="FAST AI ANALYSIS" color="#A855F7">
      <div className="flex flex-col h-full gap-4 relative">
        {/* AI Badge */}
        <div className="absolute top-[-35px] right-0 flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10 z-20">
          <Zap className="w-2 h-2 text-[#A855F7]" />
          <span className="text-[6px] font-bold text-white/60 uppercase tracking-widest">Flash Lite 3.1</span>
        </div>

        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share how you're feeling today..."
          disabled={isAnalyzing}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#A855F7]/50 transition-colors disabled:opacity-50 min-h-[120px] resize-none"
        />
        <button 
          onClick={analyzeMood} 
          disabled={isAnalyzing || !text.trim()}
          className="w-full bg-[#A855F7] text-white font-bold py-3 rounded-lg text-sm uppercase tracking-widest hover:bg-[#9333EA] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              ANALYZE MOOD
            </>
          )}
        </button>
        {mood && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10"
          >
            <span className="text-4xl drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">{mood.emoji}</span>
            <p className="text-xs text-white/80 leading-relaxed">{mood.suggestion}</p>
          </motion.div>
        )}
      </div>
    </BYDCard>
  );
};

const ScreenTimeCard = ({ onUpdate, hours, minutes }: { onUpdate: (h: number, m: number) => void, hours: number, minutes: number }) => {
  const color = "#EAB308"; // Yellow
  const [isSyncing, setIsSyncing] = useState(false);

  const totalMinutes = (hours * 60) + minutes;
  const goalMinutes = 4 * 60;
  const percentage = Math.min((totalMinutes / goalMinutes) * 100, 100);

  // Eye risk logic
  let riskLevel = "LOW";
  let riskTextColor = "text-blue-400";
  let barBgColor = "bg-blue-500";
  let suggestion = "Your screen time is well within healthy limits. Keep up the good work!";

  if (hours >= 4) {
    riskLevel = "HIGH";
    riskTextColor = "text-red-500";
    barBgColor = "bg-red-500";
    suggestion = "High risk of eye strain. Please take a 20-minute break immediately, look at something 20 feet away, and consider using blue light filters.";
  } else if (hours >= 2) {
    riskLevel = "MEDIUM";
    riskTextColor = "text-yellow-500";
    barBgColor = "bg-yellow-500";
    suggestion = "Moderate screen time. Remember the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.";
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulation for UI testing - in a real app, this would use a browser extension or native API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newHours = Math.floor(Math.random() * 6);
      const newMinutes = Math.floor(Math.random() * 60);
      onUpdate(newHours, newMinutes);
    } catch (error) {
      logger.warn("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <BYDCard 
      icon={Monitor} 
      title="Screen Time" 
      goal="GOAL: < 4 HOURS" 
      color={color}
      headerAction={
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1 text-[9px] font-bold text-white/40 hover:text-[#EAB308] active:text-[#EAB308] uppercase tracking-widest transition-colors group"
        >
          <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
          {isSyncing ? 'Syncing...' : 'Sync'}
        </button>
      }
    >
      <div className="flex flex-col h-full justify-between gap-1">
        <div className="flex gap-3 items-center">
          {/* Left: Circular Progress Bar */}
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* SVG Progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                {/* Background Track */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                {/* Progress Circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={351.858}
                  strokeDashoffset={351.858 - (percentage / 100) * 351.858}
                  strokeLinecap="round"
                  className="text-blue-500 transition-all duration-1000 ease-out"
                />
              </svg>
              
              {/* Inner Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <span className="text-blue-400/80 text-[8px] font-bold uppercase tracking-widest mb-0.5">Current</span>
                <span className="text-lg font-bold text-white tracking-tight">{hours}h {minutes}m</span>
              </div>
            </div>
          </div>
          
          {/* Right: Eye Risk Bar */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Eye Risk Level</span>
              <span className={`text-[11px] font-bold ${riskTextColor} tracking-wider`}>{riskLevel}</span>
            </div>
            
            {/* Linear Progress Bar */}
            <div className="h-1 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-white/10 relative">
              {/* The fill */}
              <div 
                className={`h-full ${barBgColor} transition-all duration-1000`} 
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            {/* Labels */}
            <div className="flex justify-between text-[9px] text-white/40 font-bold uppercase mt-1.5">
              <span>Low</span>
              <span>Med</span>
              <span>High</span>
            </div>
          </div>
        </div>

        {/* AI Suggestion Box (Full Width) */}
        <div className="px-3 py-3 min-h-[60px] rounded-xl bg-white/5 border border-white/10 relative overflow-hidden group flex items-center gap-3">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
          <Sparkles className={`w-5 h-5 shrink-0 ${riskTextColor}`} />
          <p className="text-[11px] text-white/70 leading-relaxed relative z-10">
            <span className="font-bold text-white/40 uppercase tracking-widest mr-1.5">AI:</span>
            {suggestion}
          </p>
        </div>
      </div>
    </BYDCard>
  );
};

const BMICard = () => {
  const color = "#EF4444"; // Red
  const [weight, setWeight] = React.useState(70);
  const [height, setHeight] = React.useState(175);

  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : "0.0";
  
  // Calculate rotation based on BMI (normal is ~22)
  const rotation = (Number(bmi) - 22) * 5;

  return (
    <BYDCard icon={Scale} title="BMI Calculator" goal="GOAL: 22.0 OPTIMAL" color={color}>
      <div className="flex flex-col gap-2 h-full">
        <div className="flex gap-2 items-center flex-1">
          {/* Left: Inputs */}
          <div className="flex flex-col gap-1.5 w-1/2">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 flex flex-col transition-all hover:bg-white/[0.05] hover:border-white/20 group/input">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] mb-0.5 group-focus-within/input:text-[#EF4444]/60 transition-colors">Weight (kg)</span>
              <input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="bg-transparent text-white text-base font-sans font-bold focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-1.5 flex flex-col transition-all hover:bg-white/[0.05] hover:border-white/20 group/input">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] mb-0.5 group-focus-within/input:text-[#EF4444]/60 transition-colors">Height (cm)</span>
              <input 
                type="number" 
                value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="bg-transparent text-white text-base font-sans font-bold focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              />
            </div>
          </div>

          {/* Right: Interactive Scale Icon */}
          <div className="w-1/2 flex items-center justify-center relative group cursor-pointer h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-[#EF4444]/20 to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity duration-500" />
            <motion.div 
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 100, damping: 10 }}
              className="relative z-10 w-14 h-14 rounded-full bg-[#0A0A0A] border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#EF4444]/30 transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
            >
              <Scale className="w-7 h-7 text-[#EF4444] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
            </motion.div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group/result">
          <div className="absolute inset-0 bg-gradient-to-r from-[#EF4444]/5 to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-500" />
          <div className="flex flex-col relative z-10">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.25em] mb-0.5">Current BMI</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-[8px] font-medium text-white/20 uppercase tracking-[0.2em]">Analysis</span>
            </div>
          </div>
          <span className="text-2xl font-sans font-bold tracking-tighter relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" style={{ color }}>{bmi}</span>
        </div>
      </div>
    </BYDCard>
  );
};

const MacrosCard = ({ onAddMeal, goal, consumed, geminiApiKey, checkApiKey }: { onAddMeal: (calories: number) => void, goal: number, consumed: number, geminiApiKey: string | null, checkApiKey: () => boolean }) => {
  const { macros, updateMacros } = useApp();
  const color = "#F97316"; // Orange
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [foodText, setFoodText] = React.useState("");
  const [pendingMeal, setPendingMeal] = React.useState<{foodName: string, protein: number, carbs: number, fats: number} | null>(null);

  // Daily goals for percentages
  const goals = {
    protein: 150,
    carbs: 250,
    fats: 80
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!checkApiKey()) {
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1];
        
        try {
          const response = await callGemini({
            model: "gemini-3.1-pro-preview",
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64String
                  }
                },
                {
                  text: "Analyze this food image and estimate the macronutrients (protein, carbs, fats) in grams for the entire portion shown. Return only the numbers."
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  foodName: { type: Type.STRING, description: "Name of the food identified" },
                  protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
                  carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
                  fats: { type: Type.NUMBER, description: "Estimated fats in grams" }
                },
                required: ["foodName", "protein", "carbs", "fats"]
              }
            }
          }, geminiApiKey);

          if (response.text) {
            const result = JSON.parse(response.text);
            setPendingMeal({
              foodName: result.foodName || "Unknown Food",
              protein: result.protein || 0,
              carbs: result.carbs || 0,
              fats: result.fats || 0
            });
          }
        } catch (error) {
          logger.error("Error analyzing image:", error);
        } finally {
          setIsScanning(false);
        }
      };
    } catch (error) {
      logger.error("Error scanning food:", error);
      setIsScanning(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!foodText.trim() || isScanning) return;
    if (!checkApiKey()) return;
    
    setIsScanning(true);
    setPreviewUrl(null); // Clear image preview if text is used

    try {
      const response = await callGemini({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze this food description and estimate the macronutrients (protein, carbs, fats) in grams for the entire portion described. Return only the numbers. Food: ${foodText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING, description: "Name of the food identified" },
              protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
              carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
              fats: { type: Type.NUMBER, description: "Estimated fats in grams" }
            },
            required: ["foodName", "protein", "carbs", "fats"]
          }
        }
      }, geminiApiKey);

      if (response.text) {
        const result = JSON.parse(response.text);
        setPendingMeal({
          foodName: result.foodName || foodText,
          protein: result.protein || 0,
          carbs: result.carbs || 0,
          fats: result.fats || 0
        });
      }
    } catch (error) {
      logger.error("Error scanning food text:", error);
    } finally {
      setIsScanning(false);
      setFoodText("");
    }
  };

  const handleUploadClick = () => {
    if (!isScanning) {
      fileInputRef.current?.click();
    }
  };

  const proteinPct = pendingMeal ? Math.min(100, (pendingMeal.protein / goals.protein) * 100) : 0;
  const carbsPct = pendingMeal ? Math.min(100, (pendingMeal.carbs / goals.carbs) * 100) : 0;
  const fatsPct = pendingMeal ? Math.min(100, (pendingMeal.fats / goals.fats) * 100) : 0;

  return (
    <BYDCard icon={PieChart} title="Macros" goal={`GOAL: ${goal} KCAL`} color={color}>
      <div className="flex flex-col h-full justify-between gap-1 relative">
        {/* Glass Card below goal - Now handles confirmation */}
        <div className={cn(
          "w-fit ml-auto py-1 px-2.5 rounded-xl border backdrop-blur-md flex flex-col gap-1.5 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)] mb-0.5 transition-all duration-300",
          pendingMeal 
            ? "bg-[#F97316]/20 border-[#F97316]/40 opacity-100" 
            : "bg-white/5 border-white/10 opacity-40"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                {pendingMeal ? pendingMeal.foodName : "New Meal"}
              </span>
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                {pendingMeal 
                  ? `${Math.round(pendingMeal.protein * 4 + pendingMeal.carbs * 4 + pendingMeal.fats * 9)} kcal`
                  : `${Math.round((macros?.protein || 0) * 4 + (macros?.carbs || 0) * 4 + (macros?.fats || 0) * 9)} kcal`
                }
              </span>
            </div>
          </div>

          <div className="flex gap-1.5 w-full pt-1 border-t border-white/10">
            <button 
              onClick={() => {
                setPendingMeal(null);
                setPreviewUrl(null);
              }}
              disabled={!pendingMeal}
              className="flex-1 py-0.5 px-2 rounded bg-white/5 hover:bg-white/10 text-[7px] font-bold text-white/40 uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              onClick={async () => {
                if (pendingMeal) {
                  const newMacros = {
                    protein: (macros?.protein || 0) + pendingMeal.protein,
                    carbs: (macros?.carbs || 0) + pendingMeal.carbs,
                    fats: (macros?.fats || 0) + pendingMeal.fats
                  };
                  
                  const totalCals = Math.round(pendingMeal.protein * 4 + pendingMeal.carbs * 4 + pendingMeal.fats * 9);
                  const newTotalCals = consumed + totalCals;
                  
                  updateMacros(newMacros.protein, newMacros.carbs, newMacros.fats, newTotalCals);
                  onAddMeal(totalCals);

                  setPendingMeal(null);
                  setPreviewUrl(null);
                }
              }}
              disabled={!pendingMeal}
              className="flex-1 py-0.5 px-2 rounded bg-[#F97316]/20 hover:bg-[#F97316]/30 text-[7px] font-bold text-[#F97316] uppercase tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        <div className={cn("flex gap-4 items-center h-full transition-opacity duration-300", "opacity-100")}>
          {/* Left: AI Food Scanner Upload & Text */}
          <div className="flex-1 h-full flex flex-col gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            onClick={handleUploadClick}
            disabled={isScanning}
            className="w-full flex-1 min-h-[110px] bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all group p-2 relative overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed hover:border-[#F97316]/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]"
          >
            {/* AI Badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10 z-20">
              <Sparkles className="w-2 h-2 text-[#F97316]" />
              <span className="text-[6px] font-bold text-white/60 uppercase tracking-widest">Gemini 3.1 Pro</span>
            </div>

            {previewUrl ? (
              <div className="absolute inset-0 w-full h-full">
                <img src={previewUrl} alt="Food preview" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {isScanning ? "Scanning..." : "Change Photo"}
                  </span>
                </div>
                {isScanning && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#F97316] animate-spin mb-1.5" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest animate-pulse">Analyzing...</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-[#F97316]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
                  <Camera className="w-6 h-6 text-[#F97316]" />
                </div>
                <div className="text-center relative z-10">
                  <span className="text-xs font-bold text-white block">AI Photo Scan</span>
                </div>
              </>
            )}
          </button>

          {/* Text Input */}
          <div className="relative group/text">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className="w-3 h-3 text-white/20 group-focus-within/text:text-[#F97316] transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Describe meal..." 
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextSubmit(); }}
              disabled={isScanning}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-8 pr-8 py-2 text-[10px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#F97316]/50 transition-colors disabled:opacity-50"
            />
            <button 
              onClick={handleTextSubmit}
              disabled={isScanning || !foodText.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#F97316] transition-colors disabled:opacity-50"
            >
              {isScanning && !previewUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right: Linear Progress Bars for Macros */}
        <div className="flex-1 flex flex-col gap-2 justify-center relative">
          {/* Protein */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Protein</span>
              <span className="text-xs font-bold text-white">{pendingMeal ? pendingMeal.protein : 0}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-white/10 relative">
              <div 
                className={cn(
                  "h-full bg-[#F97316] transition-all duration-500",
                  pendingMeal ? "opacity-100" : "opacity-0"
                )} 
                style={{ width: `${proteinPct}%` }} 
              />
            </div>
          </div>
          
          {/* Carbs */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Carbs</span>
              <span className="text-xs font-bold text-white">{pendingMeal ? pendingMeal.carbs : 0}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-white/10 relative">
              <div 
                className={cn(
                  "h-full bg-[#06B6D4] transition-all duration-500",
                  pendingMeal ? "opacity-100" : "opacity-0"
                )} 
                style={{ width: `${carbsPct}%` }} 
              />
            </div>
          </div>

          {/* Fats */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fats</span>
              <span className="text-xs font-bold text-white">{pendingMeal ? pendingMeal.fats : 0}g</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden border border-white/10 relative">
              <div 
                className={cn(
                  "h-full bg-[#A855F7] transition-all duration-500",
                  pendingMeal ? "opacity-100" : "opacity-0"
                )} 
                style={{ width: `${fatsPct}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </BYDCard>
);
};
