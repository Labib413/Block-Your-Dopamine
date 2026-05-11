import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Plus, Check, Play, Moon, X, Trash2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp } from "../context/AppContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6); // 6 AM to 12 AM (24)

export function AcademicRoutineView({ onStudyNow }: { onStudyNow: (subjectId: string) => void }) {
  const { academicRoutines, addAcademicRoutine, updateAcademicRoutine, deleteAcademicRoutine, academicSubjects, updateAcademicProgress } = useApp();
  
  const [selectedSlot, setSelectedSlot] = useState<{ day: number, hour: number } | null>(null);

  // Derive current state
  const now = new Date();
  const currentDay = (now.getDay() + 6) % 7; // Convert 0 (Sun) - 6 (Sat) to 0 (Mon) - 6 (Sun)
  const currentHour = now.getHours();

  const getSlotRoutine = (day: number, hour: number) => {
    return academicRoutines.find(r => 
      r.day_of_week === day && 
      parseInt(r.start_time.split(':')[0]) === hour
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          Weekly Study Planner
        </h2>
      </div>

      <GlassCard className="p-1 overflow-x-auto scrollbar-hide relative group">
        <div className="min-w-[800px]">
          {/* Header row */}
          <div className="flex border-b border-white/5 sticky top-0 z-20 bg-black/50 backdrop-blur-md">
            <div className="w-16 flex-shrink-0" />
            {DAYS.map((day, dIdx) => (
              <div 
                key={day} 
                className={`flex-1 py-4 text-center border-l border-white/5 ${
                  dIdx === currentDay ? 'bg-neon-green/5 text-neon-green' : 'text-white/40'
                }`}
              >
                <div className="text-sm font-bold uppercase tracking-widest">{day}</div>
                {dIdx === currentDay && <div className="text-[10px] mt-1 uppercase font-bold tracking-tight">Today</div>}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className="relative">
            {HOURS.map((hour) => {
              const isCurrentHour = hour === currentHour;
              
              return (
                <div key={hour} className="flex border-b border-white/5 group/row">
                  {/* Time label */}
                  <div className={`w-16 flex-shrink-0 flex items-center justify-center py-4 border-r border-white/5 transition-colors ${
                    isCurrentHour ? 'text-neon-blue' : 'text-white/20'
                  }`}>
                    <span className="text-xs font-mono font-bold">
                      {hour > 12 ? hour - 12 : hour}{hour === 12 ? 'PM' : hour > 12 ? 'PM' : 'AM'}
                    </span>
                  </div>

                  {/* Day cells */}
                  {DAYS.map((_, day) => {
                    const routine = getSlotRoutine(day, hour);
                    const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;
                    const isPast = day < currentDay || (day === currentDay && hour < currentHour);
                    const isCurrentSlot = day === currentDay && hour === currentHour;
                    
                    return (
                      <div 
                        key={day}
                        onClick={() => !routine && setSelectedSlot({ day, hour })}
                        className={`flex-1 min-h-[80px] p-1.5 border-r border-white/5 relative transition-all duration-300 ${
                          !routine ? 'cursor-pointer hover:bg-white/5' : ''
                        } ${isSelected ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
                      >
                        {routine ? (
                          <div className={`group/card w-full h-full rounded-xl border backdrop-blur-sm p-3 relative flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                            routine.is_done 
                              ? 'bg-white/5 border-white/10 opacity-50'
                              : routine.color_type === 'Science' 
                                ? 'bg-neon-blue/10 border-neon-blue/30 shadow-[0_0_15px_rgba(96,165,250,0.1)]'
                                : routine.color_type === 'Break'
                                  ? 'bg-[#a855f7]/10 border-[#a855f7]/30'
                                  : 'bg-neon-green/10 border-neon-green/30 shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                          }`}>
                             {/* Conflicts could be indicated with a red border based on overlapping time but we simplified to 1 slot = 1 routine for grid view */}
                             <div className="flex justify-between items-start z-10">
                               <span className={`text-xs font-bold leading-tight ${routine.is_done ? 'text-white/40 line-through' : 'text-white'}`}>
                                 {routine.title}
                               </span>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   updateAcademicRoutine(routine.id, { is_done: !routine.is_done });
                                   if (!routine.is_done && routine.subject_id) {
                                     const subj = academicSubjects.find(s => s.id === routine.subject_id);
                                     if (subj) {
                                       updateAcademicProgress(routine.subject_id, Math.min(100, (subj.progress || 0) + 1));
                                     }
                                   }
                                 }}
                                 className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                   routine.is_done 
                                    ? 'bg-neon-green text-black' 
                                    : 'bg-black/30 border border-white/20 text-transparent hover:border-neon-green/50'
                                 }`}
                               >
                                 <Check className="w-3.5 h-3.5" />
                               </button>
                             </div>

                             {/* Delete Routine Button */}
                             <button
                               onClick={(e) => {
                                  e.stopPropagation();
                                  deleteAcademicRoutine(routine.id);
                               }}
                               className="absolute top-2 right-8 opacity-0 group-hover/card:opacity-100 transition-opacity p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>

                             {isCurrentSlot && !routine.is_done && (
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (routine.subject_id) onStudyNow(routine.subject_id);
                                   // If no subject, just start detox mode basically. Assuming onStudyNow handles it or falls back.
                                   // In AcademicHub: if no subject is passed to onStudyNow, we probably just switch tabs. We will see.
                                   else onStudyNow(''); 
                                 }}
                                 className="absolute bottom-2 left-2 right-2 py-1.5 rounded-lg bg-neon-blue text-black font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 opacity-0 translate-y-2 group-hover/card:opacity-100 group-hover/card:translate-y-0 transition-all z-20"
                               >
                                 <Play className="w-3 h-3 fill-current" />
                                 Start Now
                               </button>
                             )}
                          </div>
                        ) : (
                          // Empty state
                          <div className="w-full h-full flex flex-col items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-500">
                             {isSelected ? (
                               <span className="text-[10px] uppercase font-bold text-white tracking-widest flex items-center gap-1">
                                 <Plus className="w-3 h-3" /> Select
                               </span>
                             ) : isPast ? (
                               <span className="text-[10px] uppercase font-bold text-white/10 tracking-widest">
                                 Past
                               </span>
                             ) : (
                               <span className="text-[10px] uppercase font-bold text-white/10 tracking-widest flex flex-col items-center gap-1 group-hover/row:text-white/20 transition-colors">
                                 <Moon className="w-3 h-3 group-hover/row:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" /> Rest
                               </span>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Modal for Selecting Template */}
      {selectedSlot !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <GlassCard className="w-full max-w-md p-6 space-y-6 bg-[#0a0a0a] border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-xl font-bold text-white tracking-tight">Add Session</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
               {DAYS[selectedSlot.day]} • {selectedSlot.hour > 12 ? selectedSlot.hour - 12 : selectedSlot.hour}{selectedSlot.hour === 12 ? 'PM' : selectedSlot.hour > 12 ? 'PM' : 'AM'}
            </p>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
              <button 
                onClick={() => {
                  addAcademicRoutine({ day_of_week: selectedSlot.day, start_time: `${selectedSlot.hour}:00`, end_time: `${selectedSlot.hour + 1}:00`, title: "Break / Rest", subject_id: null, color_type: "Break", is_done: false });
                  setSelectedSlot(null);
                }}
                className="w-full p-4 rounded-xl border border-[#a855f7]/30 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Moon className="text-[#a855f7] w-5 h-5" />
                  <span className="font-bold text-[#a855f7]">Break / Rest</span>
                </div>
                <Plus className="w-4 h-4 text-[#a855f7] opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="pt-4 pb-2">
                <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Select Subject</span>
              </div>

              {academicSubjects.map(subj => {
                const isScience = ['Physics', 'Chemistry', 'ICT'].some(k => subj.name.includes(k));
                const colorClass = isScience ? 'neon-blue' : 'neon-green';
                const colorCode = isScience ? '#60a5fa' : '#39FF14';

                return (
                  <button 
                    key={subj.id}
                    onClick={() => {
                      addAcademicRoutine({ day_of_week: selectedSlot.day, start_time: `${selectedSlot.hour}:00`, end_time: `${selectedSlot.hour + 1}:00`, title: subj.name, subject_id: subj.id, color_type: isScience ? "Science" : "Core", is_done: false });
                      setSelectedSlot(null);
                    }}
                    className={`w-full p-4 rounded-xl border bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between group
                      ${isScience ? 'border-[#60a5fa]/30 hover:border-[#60a5fa]/50' : 'border-[#39FF14]/30 hover:border-[#39FF14]/50'}
                    `}
                  >
                    <span className={`font-bold text-white group-hover:text-[${colorCode}] transition-colors`}>{subj.name}</span>
                    <Plus className={`w-4 h-4 text-[${colorCode}] opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </button>
                )
              })}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
