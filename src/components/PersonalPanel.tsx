import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { BADGES } from '../constants';
import { TheSparkIcon } from './icons/TheSparkIcon';
import { 
  User, 
  ShieldCheck, 
  Save, 
  LogOut, 
  Settings, 
  Sparkles, 
  Copy, 
  ChevronDown,
  BookOpen,
  School,
  Calendar,
  Users,
  Key,
  Info,
  UserCircle,
  Fingerprint,
  Trophy,
  Bell,
  Mail,
  MessageSquare,
  Zap,
  CheckCircle2,
  Clock,
  HeartPulse,
  Leaf,
  Cloud,
  RefreshCw,
  Lightbulb
} from "lucide-react";
import { cn, isValidUrl, safeOpen } from "@/src/lib/utils";
import { logger } from "@/src/lib/logger";

const GlassSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  icon: Icon 
}: { 
  value?: string, 
  onChange?: (val: string) => void, 
  options: string[], 
  placeholder: string,
  icon: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full pl-12 pr-10 py-3.5 rounded-xl bg-white/5 backdrop-blur-md border text-sm font-medium text-white/80 flex items-center justify-between transition-all cursor-pointer hover:bg-white/10 text-left",
          isOpen ? "border-[#00ff66]/50 ring-2 ring-[#00ff66]/20 shadow-[0_0_15px_rgba(0,255,102,0.1)]" : "border-white/10"
        )}
      >
        <span className={!value ? "text-white/20" : ""}>{value || placeholder}</span>
        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 z-[9999] mt-2 rounded-xl bg-[#0a0a0a]/98 backdrop-blur-2xl border border-[#00ff66]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)] custom-scrollbar"
            style={{ 
              maxHeight: '160px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              pointerEvents: 'auto',
              position: 'absolute'
            }}
          >
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 5px !important;
                display: block !important;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2) !important;
                border-radius: 5px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #39FF14 !important;
                border-radius: 5px;
                box-shadow: 0 0 8px rgba(57, 255, 20, 0.4);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #00ff66 !important;
              }
              .custom-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #39FF14 rgba(0, 0, 0, 0.2);
                -ms-overflow-style: auto;
              }
            `}</style>
            <div className="py-2 pb-[10px]">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange?.(opt);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full h-10 px-5 text-left text-sm font-medium transition-all flex items-center gap-3 hover:bg-[#00ff66]/10 group relative",
                    value === opt ? "text-[#00ff66] bg-[#00ff66]/15" : "text-white/70 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-[#00ff66] transition-all duration-300 shadow-[0_0_8px_#00ff66]",
                    value === opt ? "h-1/2" : "group-hover:h-1/2"
                  )} />
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GlassField = ({ 
  label, 
  placeholder, 
  icon: Icon, 
  isSelect = false,
  options = [],
  value,
  onChange
}: { 
  label: string, 
  placeholder: string, 
  icon: any, 
  isSelect?: boolean,
  options?: string[],
  value?: string,
  onChange?: (val: string) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
        <Icon className="w-4 h-4 text-[#00ff66] drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]" />
      </div>
      {isSelect ? (
        <GlassSelect 
          value={value} 
          onChange={onChange} 
          options={options} 
          placeholder={placeholder} 
          icon={Icon}
        />
      ) : (
        <input 
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-sm font-medium text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#00ff66]/50 transition-all hover:bg-white/10"
        />
      )}
    </div>
    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] ml-4">{label}</label>
  </div>
);

export function PersonalPanel({ onShowBadges }: { onShowBadges?: () => void }) {
  const { 
    gender: savedGender, 
    updateGender, 
    notificationsEnabled, 
    setNotificationsEnabled,
    user,
    profile,
    updateProfile,
    logout,
    addNotification,
    lastSyncTime,
    lastResetDate,
    handleDailyReset,
    equippedBadges,
    badgeHealth,
    isSyncing,
    syncData,
    geminiApiKey,
    updateGeminiApiKey
  } = useApp();

  const [apiKey, setApiKey] = useState(geminiApiKey || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('byd_notification_modules');
      return saved ? JSON.parse(saved) : {
        PLANNER: true,
        ROUTINE: true,
        HEALTH: true,
        WELLNESS: true
      };
    } catch (e) {
      return {
        PLANNER: true,
        ROUTINE: true,
        HEALTH: true,
        WELLNESS: true
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('byd_notification_modules', JSON.stringify(activeModules));
  }, [activeModules]);

  const toggleModule = (module: string) => {
    setActiveModules(prev => ({ ...prev, [module]: !prev[module] }));
  };
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    institution: profile?.institution || "",
    class: profile?.class || "",
    subject: profile?.subjectGroup || "",
    year: profile?.year || "",
    gender: profile?.gender || "Male"
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        institution: profile.institution || "",
        class: profile.class || "",
        subject: profile.subjectGroup || "",
        year: profile.year || "",
        gender: profile.gender || "Male"
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        fullName: formData.fullName,
        institution: formData.institution,
        class: formData.class,
        subjectGroup: formData.subject,
        year: formData.year,
        gender: formData.gender
      });
      setSaveStatus('success');
      addNotification("Profile Updated", "Your information has been successfully saved to the cloud.");
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      logger.error("Failed to save profile:", err);
      addNotification("Save Failed", "Could not sync profile data. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    await syncData();
  };

  // Visual State Logic: Check if synced with system time
  const isSynced = lastResetDate === new Date().toISOString().split('T')[0];

  return (
    <div className="w-full min-h-full bg-[#050505] text-white font-sans flex flex-col items-center relative overflow-y-auto p-6 md:p-8 pb-16">
      {/* Background Ambient Glows for Neon Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#00ff66]/10 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-[#00ff66]/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header Area */}
      <header className="mb-10 relative z-10 flex flex-col items-center text-center max-w-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#00ff66]/20 blur-xl rounded-full animate-pulse" />
            <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-[#00ff66]/30 flex items-center justify-center shadow-[0_0_25px_rgba(0,255,102,0.2)] relative z-10">
              <User className="w-8 h-8 text-[#00ff66] drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
            PERSONAL <span className="text-[#00ff66]">PANEL</span>
          </h1>
        </div>
        <p className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase opacity-80">
          Identity & System Configuration
        </p>
      </header>

      <div className="flex flex-col gap-8 relative z-10 max-w-2xl mx-auto w-full">
        {/* Student Infograph Main Container */}
        <section className="w-full flex flex-col gap-4">
          {/* Heading Box */}
          <div className="py-4 px-8 rounded-2xl bg-white/[0.03] backdrop-blur-3xl border border-[#00ff66]/20 shadow-[0_0_30px_rgba(0,255,102,0.1)] relative overflow-hidden flex flex-col items-center justify-center gap-2 z-10 mx-auto">
            {/* Animated neon scanline effect */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00ff66] to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff66]/20 to-transparent" />
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#00ff66]/40 blur-md rounded-full animate-pulse" />
                {profile?.avatarUrl && isValidUrl(profile.avatarUrl) ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full relative z-10 border border-[#00ff66]/30" />
                ) : (
                  <BookOpen className="w-5 h-5 text-[#00ff66] relative z-10 drop-shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
                )}
              </div>
              <h2 className="text-sm font-black text-[#00ff66] tracking-[0.4em] uppercase drop-shadow-[0_0_10px_rgba(0,255,102,0.4)]">
                PERSONAL <span className="text-white">INFOGRAPH</span>
              </h2>
            </div>
          </div>

          <div className="p-8 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] relative overflow-visible">
            {/* Subtle neon edge glow */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#00ff66]/30 to-transparent" />
            
            {/* Top Stats Bar */}
            <div className="mb-10 flex flex-col sm:flex-row gap-4 relative z-10">
              {/* Unique ID Bar - Neon Style */}
              <div className="flex-1 p-5 rounded-xl bg-white/5 backdrop-blur-md border border-[#00ff66]/20 flex items-center justify-between group hover:border-[#00ff66]/40 transition-all shadow-inner">
                <div className="flex items-center gap-4">
                  {/* Logo Box */}
                  <div className="w-9 h-9 rounded-lg bg-[#39FF14] flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)]">
                    <Fingerprint className="w-5 h-5 text-black" />
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#00ff66] tracking-[0.3em] uppercase mb-0.5 drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">UNIQUE ID</span>
                    <span className="text-sm font-mono font-bold text-white/90 truncate max-w-[150px]">
                      {user?.uniqueId || "BYD-00000"}
                    </span>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-xl bg-[#00ff66]/10 flex items-center justify-center border border-[#00ff66]/30 cursor-pointer hover:bg-[#00ff66]/20 transition-all group shadow-lg">
                  <Copy className="w-4.5 h-4.5 text-[#00ff66] group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Badges Box */}
              <div 
                onClick={onShowBadges}
                className="w-full sm:w-56 p-5 rounded-xl bg-white/5 backdrop-blur-md border border-[#00ff66]/20 flex items-center group hover:border-[#00ff66]/40 transition-all shadow-inner cursor-pointer hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
              >
                <div className="flex flex-col w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[30px] h-[30px] rounded-lg bg-[#39FF14] flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.4)]">
                      <Trophy className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-[10px] font-black text-[#00ff66] tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]">BADGES</span>
                  </div>
                  
                  {/* 3 Segments (Badge Slots) */}
                  <div className="flex gap-2.5">
                    {equippedBadges.map((badgeId, i) => {
                      const badge = BADGES.find(b => b.id === badgeId);
                      return (
                        <div key={i} className={cn(
                          "flex-1 h-10 rounded-lg border transition-all overflow-hidden relative flex items-center justify-center group/slot hover:border-[#00ff66]/30",
                          badge && typeof badge.icon === 'string' ? "bg-transparent border-white/20" : "bg-white/5 border-white/10"
                        )}>
                          {badge ? (
                            <>
                              {typeof badge.icon !== 'string' && (
                                <div className="absolute inset-0 bg-gradient-to-br opacity-10" style={{ backgroundColor: badge.color }} />
                              )}
                              {badge.id === 'f1' ? (
                                <TheSparkIcon className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] text-emerald-400" />
                              ) : typeof badge.icon === 'string' ? (
                                <img 
                                  src={badge.icon} 
                                  alt={badge.title}
                                  className="w-5 h-5 relative z-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <badge.icon className="w-5 h-5 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ color: badge.color }} />
                              )}
                              {badge.category !== 'Special' && (
                                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 z-20">
                                  <div 
                                    className={cn(
                                      "h-full transition-all duration-500",
                                      (badgeHealth[badge.id] ?? 100) > 60 ? "bg-[#00ff66]" : 
                                      (badgeHealth[badge.id] ?? 100) > 30 ? "bg-yellow-400" : "bg-red-500"
                                    )}
                                    style={{ width: `${badgeHealth[badge.id] ?? 100}%` }}
                                  />
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full blur-[4px]" style={{ backgroundColor: badge.color }} />
                            </>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66]/10 group-hover/slot:bg-[#00ff66]/40 transition-colors" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Information Grid - 2 Columns per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 relative z-10">
              <GlassField 
                label="Full Name" 
                placeholder="Enter your name" 
                icon={User} 
                value={formData.fullName}
                onChange={(val) => setFormData(prev => ({ ...prev, fullName: val }))}
              />
              <GlassField 
                label="Institution" 
                placeholder="DUET, Gazipur" 
                icon={School} 
                value={formData.institution}
                onChange={(val) => setFormData(prev => ({ ...prev, institution: val }))}
              />
              
              <GlassField 
                label="Class" 
                placeholder="SSC" 
                icon={ChevronDown} 
                isSelect={true}
                options={["SSC", "HSC", "Honours", "Masters"]}
                value={formData.class}
                onChange={(val) => setFormData(prev => ({ ...prev, class: val }))}
              />
              <GlassField 
                label="Subject/Group" 
                placeholder="Science" 
                icon={Users} 
                isSelect={true}
                options={["Science", "Arts", "Commerce", "Engineering"]}
                value={formData.subject}
                onChange={(val) => setFormData(prev => ({ ...prev, subject: val }))}
              />
              
              <GlassField 
                label="Year" 
                placeholder="2026" 
                icon={Calendar} 
                value={formData.year}
                onChange={(val) => setFormData(prev => ({ ...prev, year: val }))}
              />
              <GlassField 
                label="Gender" 
                placeholder="Select Gender" 
                icon={ChevronDown} 
                isSelect={true}
                options={["Male", "Female", "Others"]}
                value={formData.gender}
                onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
              />
            </div>

            {/* Action Buttons - Row layout */}
            <div className="mt-12 flex flex-wrap gap-4 relative z-10">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "flex-2 min-w-[180px] h-14 rounded-xl font-black text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all",
                  saveStatus === 'success' 
                    ? "bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.3)]" 
                    : "bg-[#00ff66] text-black shadow-[0_8px_25px_rgba(0,255,102,0.3)] hover:brightness-110 hover:shadow-[0_12px_35px_rgba(0,255,102,0.5)]",
                  isSaving && "opacity-70 cursor-wait"
                )}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                    SAVING...
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    CHANGES SAVED!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    SAVE CHANGES
                  </>
                )}
              </button>
              <button 
                onClick={logout}
                className="flex-1 min-w-[140px] h-14 rounded-xl bg-white/5 backdrop-blur-md border border-red-500/40 text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </button>
            </div>
          </div>
        </section>

        {/* System Settings Section */}
        <section className="w-full flex flex-col gap-5 mb-8">
          <div className="py-3 px-6 rounded-xl bg-white/[0.03] backdrop-blur-3xl border border-[#00ff66]/20 shadow-[0_0_20px_rgba(0,255,102,0.1)] relative overflow-hidden flex items-center justify-center gap-3 z-10 mx-auto w-fit">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ff66]/30 to-transparent" />
            <Settings className="w-4 h-4 text-[#00ff66] drop-shadow-[0_0_5px_rgba(0,255,102,0.5)]" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              SYSTEM <span className="text-[#00ff66]">SETTINGS</span>
            </h2>
          </div>

          {/* AI Configuration Card - Neon Glass Style */}
          <div className="p-7 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00ff66]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <Sparkles className="w-4.5 h-4.5 text-[#00ff66]" />
              <h3 className="text-base font-bold text-white/90">AI Configuration</h3>
            </div>
            
            <p className="text-[11px] text-white/50 leading-relaxed mb-6 relative z-10 font-medium">
              Enable advanced AI features by connecting your Gemini API key.
            </p>

            <div className="relative group z-10">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Key className="w-4 h-4 text-[#00ff66]/70" />
              </div>
              <input 
                type="password"
                placeholder="GEMINI API KEY"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pl-12 pr-24 py-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 text-sm font-mono text-[#00ff66] placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-[#00ff66]/50 transition-all"
              />
              <button 
                onClick={async () => {
                  if (!apiKey.trim()) return;
                  await updateGeminiApiKey(apiKey.trim());
                  addNotification("API Key Connected", "Your Gemini API Key has been successfully linked and stored.");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-[#00ff66] text-black text-[10px] font-black shadow-[0_0_12px_rgba(0,255,102,0.3)] hover:brightness-110 active:scale-[0.95] transition-all"
              >
                CONNECT
              </button>
            </div>
            
            <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 relative z-10">
              <ShieldCheck className="w-4 h-4 text-[#00ff66]/80" />
              <span className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">End-to-End Encrypted Storage</span>
            </div>
          </div>

          {/* Notification Settings Card */}
          <div className="p-7 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#00ff66]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <Bell className="w-4.5 h-4.5 text-[#00ff66]" />
                <h3 className="text-base font-bold text-white/90">Notification Settings</h3>
              </div>
              
              {/* Toggle Button */}
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center",
                  notificationsEnabled ? "bg-[#00ff66]" : "bg-white/10"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full shadow-lg transition-all duration-300",
                  notificationsEnabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white/40"
                )} />
              </button>
            </div>

            {/* Sub-options Grid */}
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 transition-all duration-500",
              !notificationsEnabled && "opacity-30 grayscale pointer-events-none"
            )}>
              {[
                { label: "PLANNER", icon: Calendar, desc: "Daily schedule & tasks" },
                { label: "ROUTINE", icon: Clock, desc: "Habits & time blocks" },
                { label: "HEALTH", icon: HeartPulse, desc: "Physical metrics" },
                { label: "WELLNESS", icon: Leaf, desc: "Mental & emotional state" }
              ].map((opt, idx) => {
                const isActive = activeModules[opt.label];
                return (
                  <div 
                    key={idx} 
                    onClick={() => toggleModule(opt.label)}
                    className={cn(
                      "p-4 rounded-2xl bg-white/5 border transition-all group cursor-pointer",
                      isActive ? "border-white/10 hover:border-[#00ff66]/30" : "border-white/10 hover:border-red-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <opt.icon className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-[#00ff66]/60 group-hover:text-[#00ff66]" : "text-red-500/60 group-hover:text-red-500"
                      )} />
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        isActive 
                          ? "bg-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.5)]" 
                          : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                      )} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-black tracking-widest uppercase transition-colors",
                      isActive ? "text-white/80" : "text-white/40"
                    )}>{opt.label}</span>
                    <p className={cn(
                      "text-[10px] mt-1 truncate transition-colors",
                      isActive ? "text-white/40" : "text-white/20"
                    )}>{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cloud Sync Card */}
          <div className="p-7 rounded-[32px] bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-[#00ff66]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-start justify-between mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <Cloud className="w-5 h-5 text-[#00ff66]" />
                <h3 className="text-base font-bold text-white/90">Cloud Sync</h3>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    {isSynced ? "Active" : "Inactive"}
                  </span>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                    isSynced 
                      ? "bg-[#00ff66] shadow-[0_0_10px_rgba(0,255,102,0.8)] animate-pulse" 
                      : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                  )} />
                </div>
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={cn(
                    "flex items-center gap-1.5 transition-colors group",
                    isSyncing ? "text-[#00ff66]" : "text-white/40 hover:text-[#00ff66]"
                  )}
                >
                  <RefreshCw className={cn(
                    "w-3.5 h-3.5 transition-all duration-500",
                    isSyncing ? "animate-spin" : "group-hover:animate-spin"
                  )} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isSyncing ? "Syncing..." : "Sync Now"}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative z-10">
              <p className="text-xs text-white/60 leading-relaxed">
                Your data is synced with Central Time Engine. 
                Last synced: {lastSyncTime || "Just now"}.
              </p>
            </div>
          </div>

          {/* Feedback Card */}
          <div className="p-7 rounded-[32px] bg-[#1a1d21]/50 backdrop-blur-md border border-neon-green/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neon-green/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <Lightbulb className="w-5 h-5 text-neon-green" />
              <h3 className="text-base font-bold text-white/90">Help Us Build BYD</h3>
            </div>
            
            <p className="text-[11px] text-white/50 leading-relaxed mb-4 relative z-10 font-medium">
              Found a bug or have a killer idea? Your feedback helps us make the app better for everyone.
            </p>

            <ul className="text-[10px] text-white/40 space-y-1.5 mb-6 relative z-10 list-disc ml-4">
              <li>Write about bugs here</li>
              <li>Give us suggestions for new features</li>
              <li>Report any performance issues</li>
            </ul>

            <button 
              onClick={() => safeOpen('https://docs.google.com/forms/d/e/1FAIpQLScHKHARQjP2x-J5q-jQGtz7vo9WX_-irtmOo_35SY2djnkbQQ/viewform?usp=publish-editor', '_blank')}
              className="w-full py-4 rounded-xl bg-neon-green/10 backdrop-blur-md border border-neon-green/20 text-[10px] font-black text-neon-green tracking-[0.2em] hover:bg-neon-green/20 hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] active:scale-[0.98] transition-all relative z-10"
            >
              LAUNCH FEEDBACK FORM
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
