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
import { cn, generateId, stringToUUID, isValidUrl } from "../lib/utils";
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
    
    // Security: Validate the URL to prevent XSS via javascript: URIs
    if (!isValidUrl(url)) {
      alert("Invalid or dangerous URL provided. Please enter a valid HTTP, HTTPS, or relative link.");
      return;
    }

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
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/5"
                >
                  <div className="p-8 bg-white/[0.02] space-y-8">
                    {/* Action Toggles */}
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => handleToggle(chapter.id, 'is_weak')}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border",
                          chapter.is_weak 
                            ? "bg-red-400/10 border-red-400/50 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.1)]" 
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Mark Weak
                      </button>
                      <button 
                        onClick={() => handleToggle(chapter.id, 'is_important')}
                        className={cn(
                          "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border",
                          chapter.is_important 
                            ? "bg-yellow-400/10 border-yellow-400/50 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.1)]" 
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Star className={cn("w-4 h-4", chapter.is_important && "fill-yellow-400")} />
                        Mark Important
                      </button>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Study Checklist</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                              "flex items-center justify-between p-4 rounded-2xl border transition-all group",
                              chapter[key] 
                                ? "bg-neon-green/10 border-neon-green/30 text-neon-green shadow-[0_8px_30px_rgba(57,255,20,0.05)]" 
                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                            )}
                          >
                            <span className="font-bold text-sm tracking-tight">
                              {label}
                            </span>
                            {chapter[key] ? (
                              <CheckCircle2 className="w-5 h-5 text-neon-green" />
                            ) : (
                              <Circle className="w-5 h-5 text-white/20 group-hover:text-white/40" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Study Resources</h4>
                        <button 
                          onClick={() => handleAddResource(chapter.id)}
                          className="flex items-center gap-2 text-neon-green hover:underline text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Plus className="w-3 h-3" />
                          Add Resource
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {chapter.resources.length > 0 ? (
                          chapter.resources.map((res) => (
                            <div key={res.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-4 overflow-hidden">
                                <div className="p-2.5 rounded-xl bg-neon-green/10 border border-neon-green/20">
                                  {res.url.includes('youtube') ? <Play className="w-4 h-4 text-neon-green" /> : <LinkIcon className="w-4 h-4 text-neon-green" />}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-bold text-white truncate">{res.title}</p>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/30 truncate flex items-center gap-1 hover:text-neon-green transition-colors">
                                    {res.url}
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                              <button 
                                onClick={() => deleteChapterResource(chapter.id, res.id)}
                                className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/5 text-center">
                            <FileText className="w-8 h-8 text-white/5 mb-2" />
                            <p className="text-xs text-white/20">No resources added for this chapter.</p>
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
