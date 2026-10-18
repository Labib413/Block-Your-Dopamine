import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Settings2, 
  CheckCircle2, 
  Circle,
  LayoutGrid,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp, AcademicChapter } from "../context/AppContext";
import { HSC_SYLLABUS, HSC_SUBJECT_NAMES } from "../constants";
import { cn, stringToUUID } from "../lib/utils";

interface CustomizeSyllabusViewProps {
  onBack: () => void;
}

export function CustomizeSyllabusView({ onBack }: CustomizeSyllabusViewProps) {
  const { 
    academicSubjects, 
    academicChapters, 
    updateChapterProgress,
    resetSyllabus,
    user
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const subjects = useMemo(() => {
    const defaultSubjects = [
      { id: 'p1', name: 'Physics 1st Paper' },
      { id: 'p2', name: 'Physics 2nd Paper' },
      { id: 'm1', name: 'Math 1st Paper' },
      { id: 'm2', name: 'Math 2nd Paper' },
      { id: 'c1', name: 'Chemistry 1st Paper' },
      { id: 'c2', name: 'Chemistry 2nd Paper' },
      { id: 'b1', name: 'Biology 1st Paper' },
      { id: 'b2', name: 'Biology 2nd Paper' },
      { id: 'ict', name: 'ICT' },
    ];
    
    return defaultSubjects.map(ds => {
      const cloud = academicSubjects.find(s => s.id === ds.id);
      return {
        ...ds,
        progress: cloud ? cloud.progress : 0
      };
    });
  }, [academicSubjects]);

  const chaptersForSelected = useMemo(() => {
    if (!selectedSubjectId) return [];
    
    const syllabusNames = HSC_SYLLABUS[selectedSubjectId] || [];

    // Optimization: Create a Map for O(1) chapter lookups
    const chapterMap = new Map<string, AcademicChapter>();
    for (const c of academicChapters) {
      chapterMap.set(c.id, c);
    }

    return syllabusNames.map(name => {
      const rawId = `${user?.id || 'anon'}_${selectedSubjectId}_ch_${name.replace(/\s+/g, '_')}`;
      // CRITICAL FIX: Must use stringToUUID to match consistency with the rest of the app
      const chapterId = stringToUUID(rawId);
      const existing = chapterMap.get(chapterId);
      
      return existing || {
        id: chapterId,
        subject_id: selectedSubjectId,
        chapter_name: name,
        is_active: true // Default to active
      } as AcademicChapter;
    });
  }, [selectedSubjectId, academicChapters, user?.id]);

  const handleToggleChapter = (chapter: AcademicChapter) => {
    updateChapterProgress(chapter.id, { 
      is_active: !chapter.is_active,
      subject_id: chapter.subject_id,
      chapter_name: chapter.chapter_name
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] text-white">
      <AnimatePresence mode="wait">
        {!selectedSubjectId ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 overflow-y-auto scrollbar-hide p-8 flex flex-col"
          >
            {/* Header */}
            <div className="flex flex-col items-center justify-center gap-4 py-8 mb-8">
               <button 
                onClick={onBack}
                className="absolute left-8 top-8 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-neon-green/10 hover:border-neon-green/50 transition-all group"
              >
                <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-neon-green" />
              </button>

              <div className="w-16 h-16 bg-neon-green/10 border border-neon-green/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.15)] backdrop-blur-md">
                <Settings2 className="text-neon-green w-8 h-8" />
              </div>
              <h1 className="text-4xl font-sans font-bold text-white tracking-tighter text-center">Customize Your Syllabus</h1>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] text-center">Select a subject to toggle active chapters</p>
            </div>

            {/* 3x3 Subject Grid */}
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {subjects.map((subject, idx) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedSubjectId(subject.id)}
                >
                  <GlassCard className="p-8 cursor-pointer group hover:border-neon-green/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(57,255,20,0.05)] flex flex-col items-center justify-center min-h-[200px] border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[32px]">
                    <div className="text-center space-y-3">
                      <h3 className="text-2xl font-sans font-bold text-white group-hover:text-neon-green transition-colors leading-tight tracking-tighter">{subject.name}</h3>
                      <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.4em]">Active Syllabus</p>
                    </div>

                    <div className="mt-8 flex items-center gap-3 py-2 px-6 rounded-full bg-white/5 border border-white/10 text-white/40 group-hover:bg-neon-green/10 group-hover:border-neon-green/30 group-hover:text-neon-green transition-all text-[10px] font-black uppercase tracking-widest">
                      Customize <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="chapters"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
             {/* Header */}
             <div className="p-10 pb-6 relative flex flex-col items-center">
              <div className="absolute left-10 top-10">
                <button 
                  onClick={() => setSelectedSubjectId(null)}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-green/50 transition-all group"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:text-neon-green" />
                </button>
              </div>

              <div className="absolute right-10 top-10">
                <button 
                  onClick={() => {
                    if (window.confirm("This will reset every chapter to 'Active'. Continue?")) {
                      resetSyllabus();
                    }
                  }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/50 transition-all group flex items-center gap-2"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-red-500">Reset All</span>
                  <Settings2 className="w-4 h-4 text-white/40 group-hover:text-red-500" />
                </button>
              </div>

              <div className="w-12 h-12 bg-neon-green/10 border border-neon-green/20 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="text-neon-green w-6 h-6" />
              </div>
              <h2 className="text-3xl font-sans font-bold text-white tracking-tighter text-center">
                {HSC_SUBJECT_NAMES[selectedSubjectId] || "Subject Syllabus"}
              </h2>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Include/Exclude Chapters</p>
            </div>

            {/* Chapters List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 space-y-3 scrollbar-hide w-full max-w-7xl mx-auto px-6 md:px-12">
              {chaptersForSelected.map((chapter, idx) => (
                <GlassCard 
                  key={chapter.id}
                  className={cn(
                    "p-6 md:p-8 cursor-pointer transition-all duration-500 flex items-center justify-between group rounded-[24px] border-white/5",
                    chapter.is_active 
                      ? "bg-white/[0.03] border-neon-green/20 shadow-[0_0_40px_rgba(57,255,20,0.03)]" 
                      : "opacity-30 grayscale hover:opacity-50 transition-opacity"
                  )}
                  onClick={() => handleToggleChapter(chapter)}
                >
                  <div className="flex items-center gap-8 md:gap-12">
                    <span className="text-xl md:text-2xl font-mono font-bold text-white/10 group-hover:text-neon-green/30 transition-colors w-12">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className={cn(
                      "text-xl md:text-2xl font-bold transition-colors tracking-tighter",
                      chapter.is_active ? "text-white" : "text-white/40"
                    )}>
                      {chapter.chapter_name}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                    chapter.is_active 
                      ? "bg-neon-green/5 border-neon-green shadow-[0_0_25px_rgba(57,255,20,0.3)]" 
                      : "border-white/10"
                  )}>
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-500",
                      chapter.is_active ? "bg-neon-green scale-100 shadow-[0_0_15px_#39FF14]" : "bg-transparent scale-0"
                    )} />
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-2xl flex justify-center">
               <button 
                onClick={() => setSelectedSubjectId(null)}
                className="px-12 py-4 rounded-2xl bg-neon-green text-black font-black text-xs uppercase tracking-[0.3em] hover:shadow-[0_0_40px_rgba(57,255,20,0.5)] transition-all active:scale-[0.96] flex items-center gap-3"
              >
                Sync Syllabus <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
