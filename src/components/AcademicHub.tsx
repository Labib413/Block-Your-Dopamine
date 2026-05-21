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

// নতুন হুকগুলো ইমপোর্ট করা হচ্ছে
import { useSubjects, useChapters } from "../hooks/useAcademicData";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

const SubjectCard = memo(({ 
  subject, 
  idx, 
  chapters, 
  onClick 
}: { 
  subject: any, 
  idx: number, 
  chapters: any[], 
  onClick: (id: string) => void 
}) => {
  // এই সাবজেক্টের চ্যাপ্টারগুলো ফিল্টার করা
  const subjectChapters = chapters?.filter(c => c.subject_id === subject.id) || [];
  const completedChapters = subjectChapters.filter(c => c.is_completed).length;
  const progress = subjectChapters.length > 0 
    ? Math.round((completedChapters / subjectChapters.length) * 100) 
    : 0;

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
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - progress / 100) }}
                transition={{ duration: 1, delay: idx * 0.1 }}
                className="text-neon-green"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-mono font-bold text-white">{progress}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-white group-hover:text-neon-green transition-colors leading-tight">{subject.name}</p>
            <div className="flex flex-col items-center mt-1">
              <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest leading-none">Progress</p>
              <p className="text-[8px] text-neon-green/60 font-mono mt-0.5">
                {subjectChapters.length} Chapters
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
});

export function AcademicHub({ onBack, onSubjectClick, onStudyNow, onCustomizeSyllabus }: { onBack: () => void, onSubjectClick: (id: string) => void, onStudyNow: (id: string) => void, onCustomizeSyllabus: () => void }) {
  const { user, academicSettings, updateAcademicSettings, connectionError } = useApp();
  const [activeTab, setActiveTab] = useState("Overview");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // ১. নতুন ডাটা ইঞ্জিন কল করা (TanStack Query)
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: allChapters, isLoading: chaptersLoading } = useChapters();

  // ২. রিয়েল-টাইম সিঙ্ক চালু করা
  useRealtimeSync('academic_subjects');
  useRealtimeSync('academic_chapters');

  // Countdown Logic
  const [timeLeft, setTimeLeft] = useState({ years: 0, months: 0, days: 0, hours: 0 });

  useEffect(() => {
    if (!academicSettings?.examDate) return;
    const calculateTime = () => {
      const target = new Date(academicSettings.examDate!);
      const now = new Date();
      if (target <= now) return setTimeLeft({ years: 0, months: 0, days: 0, hours: 0 });

      let years = target.getFullYear() - now.getFullYear();
      let months = target.getMonth() - now.getMonth();
      let days = target.getDate() - now.getDate();
      let hours = target.getHours() - now.getHours();

      if (hours < 0) { hours += 24; days--; }
      if (days < 0) { days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); months--; }
      if (months < 0) { months += 12; years--; }

      setTimeLeft({ years, months, days, hours });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [academicSettings?.examDate]);

  // সামগ্রিক প্রগ্রেস ক্যালকুলেশন
  const overallProgress = useMemo(() => {
    if (!allChapters?.length) return 0;
    const completed = allChapters.filter(c => c.is_completed).length;
    return Math.round((completed / allChapters.length) * 100);
  }, [allChapters]);

  // লোডিং স্টেট হ্যান্ডেল করা (Professional Skeleton)
  if ((subjectsLoading || chaptersLoading) && user) {
    return (
      <div className="flex-1 p-8 md:px-12 pt-4 animate-pulse">
        <div className="h-40 bg-white/5 rounded-[32px] mb-8 mt-24" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-white/5 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  const focusSubject = subjects?.[0]; // আপাতত প্রথম সাবজেক্টকে ফোকাস ধরছি

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
        {['Overview', 'Set Routine', 'Community'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all duration-300 ${
              activeTab === tab 
                ? "bg-neon-green/10 border-neon-green/50 text-neon-green shadow-[0_0_20px_rgba(57,255,20,0.1)]" 
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
            }`}
          >
            <span className="font-bold text-xs uppercase tracking-widest">{tab}</span>
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          <GlassCard className="p-8 relative overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
              <div className="lg:col-span-2 space-y-8">
                <div className="flex flex-wrap gap-4">
                  {[
                    { value: timeLeft.years, label: 'Year' },
                    { value: timeLeft.months, label: 'Month' },
                    { value: timeLeft.days, label: 'Days' },
                    { value: timeLeft.hours, label: 'Hour' }
                  ].map((unit, idx) => (
                    <div key={idx} className="flex-1 min-w-[80px] p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl font-mono font-bold text-neon-green mb-1">{unit.value}</div>
                      <div className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{unit.label}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neon-green/10 rounded-xl flex items-center justify-center">
                        <BookOpen className="text-neon-green w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">{focusSubject?.name || "Select Subject"}</h3>
                        <p className="text-[10px] text-neon-green font-bold">Recommended for today</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onStudyNow(focusSubject?.id || '')}
                      className="px-5 py-2.5 rounded-xl bg-neon-green text-black font-bold text-xs uppercase tracking-tight flex items-center gap-2 hover:shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Study Now
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center border-l border-white/5 pl-8">
                 <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <motion.circle
                        cx="96" cy="96" r="84" stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={2 * Math.PI * 84}
                        animate={{ strokeDashoffset: 2 * Math.PI * 84 * (1 - overallProgress / 100) }}
                        className="text-neon-green"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-mono font-bold text-white">{overallProgress}%</span>
                      <span className="text-[10px] uppercase font-bold text-white/40 mt-2">Overall Progress</span>
                    </div>
                 </div>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Subject Progress</h2>
              <button onClick={onCustomizeSyllabus} className="text-xs font-bold uppercase text-white/40 hover:text-white">Customize Syllabus</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subjects?.map((subject, idx) => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  idx={idx} 
                  chapters={allChapters || []} 
                  onClick={onSubjectClick} 
                />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Set Routine' && <AcademicRoutineView onStudyNow={onStudyNow} />}
    </div>
  );
}