import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  Star, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  FileText,
  CheckCircle2,
  Circle,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp, AcademicChapter, ChapterResource } from "../context/AppContext";
import { logger } from "../lib/logger";
import { cn, generateId, stringToUUID } from "../lib/utils";
import { HSC_SYLLABUS, HSC_SUBJECT_NAMES } from "../constants";

interface SyllabusViewProps {
  subjectId: string;
  onBack: () => void;
}

export function SyllabusView({ subjectId, onBack }: SyllabusViewProps) {
  const { 
    user,
    academicSubjects, 
    academicChapters, 
    updateChapterProgress, 
    addChapterResource, 
    deleteChapterResource 
  } = useApp();

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [localChapters, setLocalChapters] = useState<AcademicChapter[]>([]);

  // 1. Initial Hydration: Load from local state source of truth
  useEffect(() => {
    const defaultNames = HSC_SYLLABUS[subjectId] || [];
    
    const baseChapters = defaultNames.map((name) => {
      const rawId = `${user?.id || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);
      
      const cloudData = academicChapters.find(c => c.id === chapterId);
      
      let chapter = cloudData || {
        id: chapterId,
        subject_id: subjectId,
        chapter_name: name,
        is_weak: false,
        is_important: false,
        is_active: true,
        read_textbook: false,
        watch_class: false,
        practice_problems: false,
        make_notes: false,
        resources: []
      } as AcademicChapter;

      return chapter;
    }).filter(c => c.is_active !== false);

    setLocalChapters(baseChapters);
  }, [subjectId, academicChapters, user?.id]);

  const subject = useMemo(() => {
    const cloudSubject = academicSubjects.find(s => s.id === subjectId);
    if (cloudSubject) return cloudSubject;
    
    return { 
      id: subjectId, 
      name: HSC_SUBJECT_NAMES[subjectId] || "Subject Syllabus",
      progress: 0 
    };
  }, [academicSubjects, subjectId]);
  
  const chapters = localChapters;

  const handleToggle = (chapterId: string, field: keyof AcademicChapter) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const newValue = !chapter[field];
    
    // 2. Optimistic Update (Instant UI)
    const updatedChapter = { ...chapter, [field]: newValue };
    setLocalChapters(prev => prev.map(c => c.id === chapterId ? updatedChapter : c));

    // 3. FULL STATE SYNC: Send the complete checklist state to prevent data loss
    if (['read_textbook', 'watch_class', 'practice_problems', 'make_notes'].includes(field)) {
      const checklist = {
        read_textbook: field === 'read_textbook' ? newValue : (chapter.read_textbook || false),
        watch_class: field === 'watch_class' ? newValue : (chapter.watch_class || false),
        practice_problems: field === 'practice_problems' ? newValue : (chapter.practice_problems || false),
        make_notes: field === 'make_notes' ? newValue : (chapter.make_notes || false),
        is_active: chapter.is_active,
        _timestamp: Date.now()
      };
      
      // 4. Background Sync with FULL OBJECT
      updateChapterProgress(chapterId, { 
        ...checklist,
        subject_id: subjectId, 
        chapter_name: chapter.chapter_name 
      });
    } else {
      // For non-checklist fields like is_weak or is_important
      updateChapterProgress(chapterId, { 
        [field]: newValue, 
        subject_id: subjectId, 
        chapter_name: chapter.chapter_name 
      });
    }
  };

  const handleAddResource = (chapterId: string) => {
    const url = prompt("Enter resource URL (e.g., YouTube link or Google Drive file):");
    if (!url) return;
    
    const title = prompt("Enter resource title (e.g., 'Physics Lecture' or 'Note PDF'):") || 'Untitled Resource';
    
    const resource: ChapterResource = {
      id: generateId(),
      title,
      url
    };
    
    addChapterResource(chapterId, resource);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] text-white">
      {/* Header */}
      <div className="p-10 pb-6 relative flex items-center justify-center">
        <div className="absolute left-10">
          <button 
            onClick={onBack}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-green/50 transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:text-neon-green" />
          </button>
        </div>

        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-4 justify-center">
            <BookOpen className="text-neon-green w-10 h-10" />
            <h1 className="text-4xl font-sans font-extrabold tracking-tighter text-white uppercase italic">
              {subject.name}
            </h1>
          </div>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.5em] mt-2 translate-x-2">Chapter-by-chapter study plan</p>
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-4 scrollbar-hide">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div key={chapter.id}>
              <GlassCard 
                className={cn(
                  "p-0 transition-all duration-500 overflow-hidden",
                  expandedChapterId === chapter.id ? "ring-1 ring-neon-green/30 shadow-[0_0_30px_rgba(57,255,20,0.05)] border-neon-green/20" : "hover:border-white/20"
                )}
              >
                <>
                {/* Chapter Header */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer group"
                  onClick={() => setExpandedChapterId(expandedChapterId === chapter.id ? null : chapter.id)}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-2xl font-mono font-bold text-white/20 group-hover:text-neon-green/50 transition-colors">{index + 1}.</div>
                    <div>
                      <h3 className="text-xl font-bold transition-colors group-hover:text-neon-green text-white">
                        {chapter.chapter_name}
                      </h3>
                    <div className="flex items-center gap-3 mt-1">
                      {chapter.is_weak && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                          <AlertCircle className="w-3 h-3" />
                          Weak Point
                        </span>
                      )}
                      {chapter.is_important && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                          <Star className="w-3 h-3 fill-yellow-400/50" />
                          Important
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Status Indicator */}
                <div className="flex items-center pr-2">
                  {(() => {
                    const isCompleted = chapter.read_textbook && chapter.watch_class && chapter.practice_problems && chapter.make_notes;
                    const isInProgress = !isCompleted && (chapter.read_textbook || chapter.watch_class || chapter.practice_problems || chapter.make_notes);
                    
                    if (isCompleted) {
                      return (
                        <div className="w-8 h-8 rounded-full bg-neon-green/10 border border-neon-green flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                          <CheckCircle2 className="w-5 h-5 text-neon-green" />
                        </div>
                      );
                    }
                    if (isInProgress) {
                      return (
                        <div className="w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                          <CheckCircle2 className="w-5 h-5 text-yellow-400" />
                        </div>
                      );
                    }
                    return (
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 transition-colors">
                        <Circle className="w-5 h-5 text-white/10 group-hover:text-white/20" />
                      </div>
                    );
                  })()}
                </div>
              </div>

            {/* Chapter Details */}
            <AnimatePresence>
              {expandedChapterId === chapter.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-t border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                >
                  <div className="p-4 sm:p-5 space-y-4 bg-gradient-to-b from-white/[0.02] to-transparent">
                    {/* Action Toggles */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => handleToggle(chapter.id, 'is_weak')}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border cursor-pointer",
                          chapter.is_weak 
                            ? "bg-red-500/15 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20"
                        )}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Mark Weak</span>
                      </button>
                      <button 
                        onClick={() => handleToggle(chapter.id, 'is_important')}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all border cursor-pointer",
                          chapter.is_important 
                            ? "bg-yellow-400/15 border-yellow-400/50 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.15)]" 
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/20"
                        )}
                      >
                        <Star className={cn("w-3.5 h-3.5", chapter.is_important && "fill-yellow-400")} />
                        <span>Mark Important</span>
                      </button>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                          Study Checklist
                        </h4>
                        <span className="text-[10px] font-mono text-white/40">
                          {[chapter.read_textbook, chapter.watch_class, chapter.practice_problems, chapter.make_notes].filter(Boolean).length}/4 Done
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { key: 'read_textbook' as const, label: 'Read Textbook' },
                          { key: 'watch_class' as const, label: 'Watch Class' },
                          { key: 'practice_problems' as const, label: 'Practice Problems' },
                          { key: 'make_notes' as const, label: 'Make Notes' }
                        ].map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => handleToggle(chapter.id, key)}
                            className={cn(
                              "flex items-center justify-between p-2.5 sm:px-3 sm:py-2.5 rounded-xl border transition-all cursor-pointer group text-left",
                              chapter[key] 
                                ? "bg-neon-green/15 border-neon-green/40 text-neon-green shadow-[0_0_12px_rgba(57,255,20,0.1)]" 
                                : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/25 hover:text-white"
                            )}
                          >
                            <span className="font-bold text-xs tracking-tight truncate mr-2">
                              {label}
                            </span>
                            {chapter[key] ? (
                              <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0 drop-shadow-[0_0_6px_rgba(57,255,20,0.5)]" />
                            ) : (
                              <Circle className="w-4 h-4 text-white/25 group-hover:text-white/50 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          Study Resources ({chapter.resources?.length || 0})
                        </h4>
                        <button 
                          onClick={() => handleAddResource(chapter.id)}
                          className="flex items-center gap-1.5 text-neon-green hover:text-neon-green/80 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-neon-green/10 border border-neon-green/20 hover:border-neon-green/40 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Resource
                        </button>
                      </div>
                      
                      <div className="space-y-1.5">
                        {chapter.resources && chapter.resources.length > 0 ? (
                          chapter.resources.map((res) => (
                            <div key={res.id} className="flex items-center justify-between p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white/[0.03] border border-white/10 group hover:border-white/20 hover:bg-white/[0.06] transition-all">
                              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                <div className="p-1.5 rounded-lg bg-neon-green/10 border border-neon-green/20 shrink-0">
                                  {res.url.includes('youtube') ? <Play className="w-3.5 h-3.5 text-neon-green" /> : <LinkIcon className="w-3.5 h-3.5 text-neon-green" />}
                                </div>
                                <div className="overflow-hidden min-w-0">
                                  <p className="text-xs font-bold text-white truncate">{res.title}</p>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-white/40 truncate flex items-center gap-1 hover:text-neon-green transition-colors">
                                    {res.url}
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                </div>
                              </div>
                              <button 
                                onClick={() => deleteChapterResource(chapter.id, res.id)}
                                className="p-1.5 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                                title="Delete resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center py-3 px-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01] text-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-white/20 shrink-0" />
                            <p className="text-[11px] text-white/30">No resources added. Click "Add Resource" to attach notes or videos.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </>
          </GlassCard>
          </div>
        ))
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10 opacity-20">
            <BookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No chapters selected</h3>
          <p className="text-white/40 text-sm max-w-[280px] mx-auto leading-relaxed">
            Your active syllabus for this subject is empty. Go to <span className="text-neon-green font-bold italic">Customize Syllabus</span> to add some!
          </p>
        </div>
      )}
    </div>
    </div>
  );
}

function Play({ className }: { className?: string }) {
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
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
