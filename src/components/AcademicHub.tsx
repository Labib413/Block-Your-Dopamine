import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import { motion } from "motion/react";
import { 
  GraduationCap, 
  RotateCcw, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Play, 
  Settings2,
  Users,
  Layout,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BookOpen,
  AlertCircle
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AcademicRoutineView } from "./AcademicRoutineView";
import { useApp } from "../context/AppContext";

const SubjectCard = memo(({ 
  subject, 
  idx, 
  academicChapters, 
  onClick 
}: { 
  subject: any, 
  idx: number, 
  academicChapters: any[], 
  onClick: (id: string) => void 
}) => {
  return (
    <div onClick={() => onClick(subject.id)}>
      <GlassCard className="p-4 hover:border-white/20 transition-all duration-300 group cursor-pointer">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - subject.progress / 100) }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className="text-neon-green"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-mono font-bold text-white">{subject.progress}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white group-hover:text-neon-green transition-colors leading-tight">{subject.name}</p>
            <div className="flex flex-col items-center mt-1">
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest leading-none">Progress</p>
              <p className="text-[8px] text-neon-green/60 font-mono mt-0.5">
                {academicChapters.filter(c => c.subject_id === subject.id && c.is_active !== false).length} Chapters
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
});

export function AcademicHub({ onBack, onSubjectClick, onStudyNow, onCustomizeSyllabus }: { onBack: () => void, onSubjectClick: (id: string) => void, onStudyNow: (id: string) => void, onCustomizeSyllabus: () => void }) {
  const { user, academicSubjects, academicChapters, academicSettings, updateAcademicProgress, updateAcademicSettings, startFocusSession, isDataLoading, connectionError } = useApp();
  const [activeTab, setActiveTab] = useState("Overview");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Countdown Logic
  const [timeLeft, setTimeLeft] = useState<{
    years: number;
    months: number;
    days: number;
    hours: number;
  }>({ years: 0, months: 0, days: 0, hours: 0 });

  useEffect(() => {
    if (!academicSettings.examDate) {
      setTimeLeft({ years: 0, months: 0, days: 0, hours: 0 });
      return;
    }

    const calculateTime = () => {
      const target = new Date(academicSettings.examDate!);
      if (isNaN(target.getTime())) {
        setTimeLeft({ years: 0, months: 0, days: 0, hours: 0 });
        return;
      }
      
      const now = new Date();
      if (target.getTime() <= now.getTime()) {
        setTimeLeft({ years: 0, months: 0, days: 0, hours: 0 });
        return;
      }

      // Real-time Logic Sync: Difference between target and current system time
      let years = target.getFullYear() - now.getFullYear();
      let months = target.getMonth() - now.getMonth();
      let days = target.getDate() - now.getDate();
      let hours = target.getHours() - now.getHours();

      // Precise adjust for negative values to ensure continuity
      if (hours < 0) {
        hours += 24;
        days--;
      }
      if (days < 0) {
        const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
        days += prevMonth.getDate();
        months--;
      }
      if (months < 0) {
        months += 12;
        years--;
      }

      setTimeLeft({ 
        years: Math.max(0, years), 
        months: Math.max(0, months), 
        days: Math.max(0, days), 
        hours: Math.max(0, hours) 
      });
    };

    // Initial Load Sync: Calculate immediately on mount/navigate
    calculateTime();
    
    // Hourly Background Update Logic
    // Check every minute if the hour value has changed to keep it stable but accurate
    const interval = setInterval(() => {
      const now = new Date();
      // If we are at the start of an hour (minute is 0), or if minutes are past 0 but we want to ensure sync
      // Actually, just calling calculateTime() every minute is fine if we only care about state updates
      // React will skip the re-render if the state values (years, months, days, hours) are identical.
      calculateTime();
    }, 1000 * 60); 
    
    return () => clearInterval(interval);
  }, [academicSettings.examDate]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      const updates: any = { 
        examDate: new Date(date).toISOString(),
        prepStartDate: new Date().toISOString() 
      };
      updateAcademicSettings(updates);
    }
  };

  const handleReset = () => {
    updateAcademicSettings({ examDate: null });
  };

  const subjects = useMemo(() => {
    const defaultSubjects = [
      { id: 'p1', name: 'Physics 1st Paper', progress: 0 },
      { id: 'p2', name: 'Physics 2nd Paper', progress: 0 },
      { id: 'm1', name: 'Math 1st Paper', progress: 0 },
      { id: 'm2', name: 'Math 2nd Paper', progress: 0 },
      { id: 'c1', name: 'Chemistry 1st Paper', progress: 0 },
      { id: 'c2', name: 'Chemistry 2nd Paper', progress: 0 },
      { id: 'b1', name: 'Biology 1st Paper', progress: 0 },
      { id: 'b2', name: 'Biology 2nd Paper', progress: 0 },
      { id: 'ict', name: 'ICT', progress: 0 },
    ];
    
    if (!academicSubjects || academicSubjects.length === 0) return defaultSubjects;
    
    // Merge existing with defaults if needed
    return defaultSubjects.map(ds => {
      const cloud = academicSubjects.find(s => s.name === ds.name || s.id === ds.id);
      return cloud ? { ...ds, ...cloud } : ds;
    });
  }, [academicSubjects]);

  const overallProgress = Math.round(
    subjects.reduce((acc, s) => acc + (s.progress || 0), 0) / (subjects.length || 1)
  );

  // Safe Fallback: Missing prepStartDate should evaluate to today's date if examDate exists
  useEffect(() => {
    if (academicSettings.examDate && !academicSettings.prepStartDate) {
      updateAcademicSettings({ prepStartDate: new Date().toISOString() });
    }
  }, [academicSettings.examDate, academicSettings.prepStartDate, updateAcademicSettings]);

  const paceData = useMemo(() => {
    if (!academicSettings.examDate) return null;
    
    const examDate = new Date(academicSettings.examDate);
    const now = new Date();
    
    // Sarothi Model: Use saved prepStartDate or default to NOW
    const prepStartDate = academicSettings.prepStartDate 
      ? new Date(academicSettings.prepStartDate) 
      : now;
      
    const totalTimeRange = examDate.getTime() - prepStartDate.getTime();
    const timeElapsed = now.getTime() - prepStartDate.getTime();
    
    // Edge Case: If ExamDate is in the past, timeElapsedPercentage is 100%
    const timeElapsedPercentage = examDate.getTime() <= now.getTime() 
      ? 100 
      : totalTimeRange > 0 ? (timeElapsed / totalTimeRange) * 100 : 0;
    
    const paceDifference = overallProgress - timeElapsedPercentage;
    const roundedDiff = Math.round(paceDifference);
    
    let status: 'Ahead' | 'Behind' | 'On Track' = 'On Track';
    if (paceDifference > 0.5) status = 'Ahead';
    else if (paceDifference < -0.5) status = 'Behind';
    
    return {
      diff: Math.abs(roundedDiff),
      status
    };
  }, [academicSettings.examDate, academicSettings.prepStartDate, overallProgress]);

  const focusSubject = subjects.find(s => s.id === academicSettings.focusSubjectId) || subjects[1]; // Default to Physics 2nd Paper as per sketch

  if (connectionError && user) {
    return (
      <div className="flex-1 p-8 md:px-12 pt-4 flex flex-col items-center justify-center min-h-screen">
        <GlassCard className="p-8 text-center max-w-lg border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-50 mb-2">Connection Error</h2>
          <p className="text-red-200/60 text-sm mb-6">{connectionError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors text-sm font-bold tracking-widest uppercase">
            Retry Connection
          </button>
        </GlassCard>
      </div>
    );
  }

  if (isDataLoading && user) {
    return (
      <div className="flex-1 p-8 md:px-12 pt-4 relative isolate min-h-screen flex flex-col animate-pulse">
        <div className="h-40 bg-white/5 rounded-[32px] mb-8 mt-24" />
        <div className="flex gap-4 mb-4">
          <div className="w-24 h-10 bg-white/5 rounded-xl" />
          <div className="w-24 h-10 bg-white/5 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px]" />)}
        </div>
        <div className="h-64 bg-white/5 rounded-[32px] mb-8" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto scrollbar-hide animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/20 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(57,255,20,0.15)] backdrop-blur-sm">
            <GraduationCap className="text-neon-green w-8 h-8" />
          </div>
          <h1 className="text-5xl font-sans font-bold text-white tracking-tighter">Academic Hub</h1>
        </div>
        <p className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase">Plan smart, Score Better</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-center gap-4">
        {[
          { id: 'Overview', icon: Layout },
          { id: 'Set Routine', icon: CalendarIcon },
          { id: 'Community', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all duration-300 ${
              activeTab === tab.id 
                ? "bg-neon-green/10 border-neon-green/50 text-neon-green shadow-[0_0_20px_rgba(57,255,20,0.1)]" 
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-bold text-xs uppercase tracking-widest">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeTab === 'Overview' && (
        <>
          {/* Main Stats Card */}
          <GlassCard className="p-8 relative overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              {/* Countdown & Focus Section */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/60">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Exam Countdown</span>
                  </div>
                <div className="flex items-center gap-2 relative">
                    {paceData && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md bg-black/20 transition-all duration-500 animate-in zoom-in-95 ${
                        paceData.status === 'Ahead' ? 'border-[#22c55e]/30 text-[#22c55e]' : 
                        paceData.status === 'Behind' ? 'border-[#ef4444]/30 text-[#ef4444]' : 
                        'border-[#60a5fa]/30 text-[#60a5fa]'
                      }`}>
                        {paceData.status === 'Ahead' ? <ArrowUpRight className="w-3.5 h-3.5" /> : 
                         paceData.status === 'Behind' ? <ArrowDownRight className="w-3.5 h-3.5" /> : 
                         <Minus className="w-3.5 h-3.5" />}
                        <span className="text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">
                          {paceData.status === 'On Track' ? 'On Track' : `${paceData.diff}% ${paceData.status}`}
                        </span>
                      </div>
                    )}
                    <button 
                      onClick={handleReset}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/50 transition-all hover:scale-110"
                      title="Reset Countdown"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="relative group">
                      <button 
                        type="button"
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-neon-green group-hover:border-neon-green/50 transition-all group-hover:scale-110"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                      <input 
                        type="datetime-local" 
                        ref={dateInputRef}
                        onChange={handleDateChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        title="Set Exam Date"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {[
                    { value: timeLeft.years, label: 'Year' },
                    { value: timeLeft.months, label: 'Month' },
                    { value: timeLeft.days, label: 'Days' },
                    { value: timeLeft.hours, label: 'Hour' }
                  ].map((unit, idx) => (
                    <div key={idx} className="flex-1 min-w-[80px] p-4 rounded-2xl bg-white/5 border border-white/10 text-center group-hover:bg-white/10 transition-colors">
                      <div className="text-2xl font-mono font-bold text-neon-green mb-1">{unit.value}</div>
                      <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{unit.label}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="flex items-center gap-2 text-white/60 mb-4">
                    <ShieldAlert className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-bold uppercase tracking-widest">Need Focus</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="text-neon-green w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{focusSubject?.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-neon-green transition-all duration-1000" 
                              style={{ width: `${focusSubject?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-neon-green font-bold">{focusSubject?.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => onStudyNow(focusSubject?.id || '')}
                      className="px-5 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-tight flex items-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Study Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Overall Progress Circle */}
              <div className="flex flex-col items-center justify-center border-l border-white/5 pl-8">
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="84"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-white/5"
                      />
                      <motion.circle
                        cx="96"
                        cy="96"
                        r="84"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 84}
                        initial={{ strokeDashoffset: 2 * Math.PI * 84 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 84 * (1 - overallProgress / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-neon-green"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-mono font-bold text-white leading-none">{overallProgress}%</span>
                      <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest mt-2">Syllabus Done</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Dynamic Background Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-green/5 blur-[100px] pointer-events-none" />
          </GlassCard>

          {/* Grid Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-green" />
                <h2 className="text-xl font-bold text-white tracking-tight">Subject Progress</h2>
              </div>
              <button 
                onClick={onCustomizeSyllabus}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
              >
                <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Customize Syllabus</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {subjects.map((subject, idx) => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  idx={idx} 
                  academicChapters={academicChapters} 
                  onClick={onSubjectClick} 
                />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Set Routine' && <AcademicRoutineView onStudyNow={onStudyNow} />}

      {activeTab === 'Community' && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-white/40 min-h-[400px]">
          <Users className="w-16 h-16 mb-4 opacity-50" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">Community Features Coming Soon</h2>
          <p className="max-w-md">Join study groups, compare progress, and share your routine with friends.</p>
        </div>
      )}
    </div>
  );
}

// Internal Icons for local use
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ShieldAlert({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
