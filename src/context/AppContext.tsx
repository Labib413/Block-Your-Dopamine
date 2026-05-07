import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react";
import { BADGES, HSC_SYLLABUS, HSC_SUBJECT_NAMES } from "../constants";
import { supabase } from "../lib/supabase";
import { safeStringify, isUUID, generateId, stringToUUID } from "../lib/utils";
import { logger } from "../lib/logger";
export interface User {
  id: string;
  email: string;
  uniqueId: string;
  daysActive: number;
  lastActiveDate: string;
  user_metadata: {
    full_name: string;
    avatar_url?: string;
  };
}

export type ResourceType = "YOUTUBE" | "PDF" | "IMAGE" | "OTHERS";

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
}

export type Priority = "Low" | "Medium" | "High";
export type Status = "To Do" | "In Progress" | "Done";

export interface Task {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  priority: Priority | null;
  reminders: string[];
  status: Status;
}

export interface AcademicSubject {
  id: string;
  name: string;
  progress: number;
}

export interface AcademicSettings {
  examDate: string | null;
  focusSubjectId: string | null;
  prepStartDate: string | null;
}

export interface ChapterResource {
  id: string;
  title: string;
  url: string;
}

export interface AcademicChapter {
  id: string;
  subject_id: string;
  chapter_name: string;
  is_weak: boolean;
  is_important: boolean;
  is_active: boolean;
  read_textbook: boolean;
  watch_class: boolean;
  practice_problems: boolean;
  make_notes: boolean;
  resources: ChapterResource[];
  _timestamp?: number;
}

export interface HealthTargets {
  hydration: string;
  sleep: string;
  footsteps: string;
  calories: string;
  screenTime: string;
}

interface AppState {
  xp: number;
  level: number;
  streak: number;
  lastStreakDate: string | null;
  consecutiveMissedDays: number;
  streakSeasonStartDate: string | null;
  focusTime: number; // in seconds
  isFocusing: boolean;
  tasksCompleted: number;
  detoxPercent: number;
  physicalFitness: number;
  weeklyRank: string;
  globalRank: string;
  topSkill: string;
  resources: Resource[];
  sessionScores: number[]; // Array of all session detox scores
  
  // Health Metrics
  hydrationIntake: number;
  sleepHours: number;
  sleepSessions: number;
  steps: number;
  consumedCalories: number;
  screenTimeHours: number;
  screenTimeMinutes: number;
  healthTargets: HealthTargets;
  
  // Tasks
  tasks: Task[];
  
  // Daily Stats
  totalNetFocusTime: number; // in seconds
  dailyTotalFocusTime: number; // in seconds
  dailyGoalHours: number;
  dailySessions: number;
  lastResetDate: string; // YYYY-MM-DD
  
  // Current Session
  currentSessionDuration: number; // in minutes
  currentSessionId: string | null;
  currentSubjectId: string | null;
  currentSessionResources: ChapterResource[];
  isManualExit: boolean;
  sessionTimeLeft: number;
  sessionDistractionTime: number;
  isSessionDistracted: boolean;
  
  // User Profile
  gender: string;
  
  // Notifications
  notificationsEnabled: boolean;
  notifications: NotificationItem[];

  // Auth
  user: User | null;
  profile: {
    fullName: string;
    avatarUrl?: string;
    institution?: string;
    class?: string;
    subjectGroup?: string;
    year?: string;
    gender?: string;
  } | null;
  
  // Time Engine
  currentTime: string; // HH:MM
  currentDate: string; // YYYY-MM-DD
  daysActive: number;
  lastSyncTime: string;
  
  // Equipped Badges
  equippedBadges: (string | null)[]; // Array of 3 badge IDs
  unlockedBadgeIds: string[];
  badgeHealth: Record<string, number>;
  lastActivityTimestamp: string;
  
  // Weekly Stats for Badges
  weeklyHistory: {
    netFocusTime: number;
    tasksCompleted: number;
    totalTasks: number;
  }[];
  isSyncing: boolean;
  hasFetchedFocusData: boolean;
  latestMood: { text: string; emoji: string } | null;
  macros: { protein: number; carbs: number; fats: number };
  geminiApiKey: string | null;
  syncQueue: any[];
  currentSessionStartTime: string | null;
  offlineSyncQueue: any[];
  
  // Academic Hub
  academicSubjects: AcademicSubject[];
  academicSettings: AcademicSettings;
  academicChapters: AcademicChapter[];
  recalculateAllProgress: () => void;
}

interface AppContextType extends Omit<AppState, 'currentTime' | 'currentDate' | 'lastSyncTime'> {
  currentTime: string;
  currentDate: string;
  lastSyncTime: string;
  isSyncing: boolean;
  addXP: (amount: number) => void;
  getRequiredXP: (level: number) => number;
  incrementTasks: () => void;
  addFitness: (amount: number) => void;
  toggleFocus: () => void;
  startFocusSession: (durationMinutes: number, subjectId?: string) => void;
  endFocusSession: (netFocusTime: number, totalAttemptedTime: number, resourceUsed?: string) => void;
  saveSessionFragment: (netFocusTime: number, totalAttemptedTime: number) => void;
  cancelFocusSession: () => void;
  setIsManualExit: (val: boolean) => void;
  setSessionTimeLeft: (time: number) => void;
  setSessionDistractionTime: (time: number) => void;
  setIsSessionDistracted: (isDistracted: boolean) => void;
  updateDetox: (amount: number) => void;
  setDailyGoalHours: (hours: number) => void;
  dailySessions: number;
  totalNetFocusTime: number;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  removeResource: (id: string) => void;
  updateGender: (gender: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Health Actions
  updateHydration: (amount: number) => void;
  updateSleep: (hours: number, sessionDelta?: number) => void;
  updateSteps: (steps: number) => void;
  updateCalories: (calories: number, bypass?: boolean) => void;
  updateScreenTime: (hours: number, minutes: number) => void;
  updateHealthTargets: (targets: HealthTargets) => void;
  updateProfile: (profileData: Partial<NonNullable<AppState['profile']>>) => Promise<void>;
  updateMood: (text: string, emoji: string) => Promise<void>;
  updateMacros: (protein: number, carbs: number, fats: number, calories?: number) => Promise<void>;
  updateGeminiApiKey: (key: string | null) => Promise<void>;
  // Task Actions
  addTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: Status) => void;
  // Badge Actions
  equipBadge: (badgeId: string) => void;
  badgeHealth: Record<string, number>;
  unlockedBadgeIds: string[];
  // Auth Actions
  login: (fullName: string, email: string) => void;
  logout: () => void;
  handleDailyReset: () => void;
  syncData: (view?: string) => Promise<void>;
  // Utility Actions
  modifyFocusTime: (netDelta: number, totalDelta: number) => void;
  addNotification: (title: string, message: string) => void;
  syncOfflineQueue: () => Promise<void>;
  updateAcademicProgress: (subjectId: string, progress: number) => Promise<void>;
  updateAcademicSettings: (settings: Partial<AcademicSettings>) => Promise<void>;
  updateChapterProgress: (chapterId: string, updates: Partial<AcademicChapter>) => Promise<void>;
  resetSyllabus: () => void;
  addChapterResource: (chapterId: string, resource: ChapterResource) => Promise<void>;
  deleteChapterResource: (chapterId: string, resourceId: string) => Promise<void>;
  isSupabaseConnected: boolean | null;
  connectionError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getLocalDateString = (date: Date) => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date); // Returns YYYY-MM-DD
};

const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
};

// Helper function to generate default chapters
const generateDefaultChapters = (userId: string | null) => {
  const chapters: AcademicChapter[] = [];
  Object.entries(HSC_SYLLABUS).forEach(([subjectId, syllabusChapters]) => {
    syllabusChapters.forEach(name => {
      const rawId = userId ? `${userId}_${subjectId}_ch_${name.replace(/\s+/g, '_')}` : `anon_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const id = stringToUUID(rawId);
      chapters.push({
        id,
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
      });
    });
  });
  return chapters;
};

// Helper function to calculate progress for all subjects
const calculateAllSubjectsProgress = (chapters: AcademicChapter[], userId: string | null) => {
  const subjects = [
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

  // PRIMARY FIX: Filter out any duplicate chapter IDs to prevent "ghost" data
  const uniqueChapters = Array.from(new Map(chapters.map(c => [c.id, c])).values()) as AcademicChapter[];

  const updatedSubjects = subjects.map(s => {
    const subjectId = s.id;
    const officialNames = HSC_SYLLABUS[subjectId] || [];
    
    let totalActiveCount = 0;
    let completedTasks = 0;

    // THE MASTER CALCULATION LOOP:
    // We iterate over the official syllabus to ensure the denominator is structural, 
    // but we check the state for each chapter to see if it's been deactivated or completed.
    officialNames.forEach(name => {
      const rawId = `${userId || 'anon'}_${subjectId}_ch_${name.replace(/\s+/g, '_')}`;
      const chapterId = stringToUUID(rawId);
      
      const chapter = uniqueChapters.find(c => c.id === chapterId);
      
      // HYDRATION PRIORITY: Check localStorage explicitly if chapter not in state yet
      let isActive = true;
      try {
        const checklistSaved = localStorage.getItem(`byd_chapter_${chapterId}_checklist`);
        const globalSettings = localStorage.getItem('BYD_Syllabus_Settings');
        
        if (checklistSaved) {
          const parsed = JSON.parse(checklistSaved);
          if (parsed.is_active !== undefined) isActive = parsed.is_active;
        } else if (globalSettings) {
          const parsedGlobal = JSON.parse(globalSettings);
          const matched = parsedGlobal.find((c: any) => c.id === chapterId);
          if (matched && matched.is_active !== undefined) isActive = matched.is_active;
        } else if (chapter) {
          isActive = chapter.is_active;
        }
      } catch (e) {
        if (chapter) isActive = chapter.is_active;
      }

      if (isActive) {
        totalActiveCount++;
        if (chapter) {
          if (chapter.read_textbook) completedTasks++;
          if (chapter.watch_class) completedTasks++;
          if (chapter.practice_problems) completedTasks++;
          if (chapter.make_notes) completedTasks++;
        }
      }
    });

    const totalPossibleTasks = totalActiveCount * 4;
    const progressValue = totalPossibleTasks > 0 
      ? Math.round((completedTasks / totalPossibleTasks) * 100) 
      : 0;

    // logger.log(`[BYD LOG] Subject: ${s.name}, Active Chapters: ${totalActiveCount}, Tasks: ${completedTasks}/${totalPossibleTasks}, Progress: ${progressValue}%`);
    
    try {
      localStorage.setItem(`BYD_Progress_${subjectId}`, String(progressValue));
      // Explicitly save the dynamic denominator to prevent refresh flicker
      localStorage.setItem(`BYD_Denom_${subjectId}`, String(totalActiveCount));
    } catch (e) {}
      
    return { id: subjectId, name: s.name, progress: progressValue };
  });

  return updatedSubjects;
};

const getDayDifference = (date1: string, date2: string) => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // Set to midnight to count full days
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
};


export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    const now = new Date();
    const today = getLocalDateString(now);
    
    // Try to load from localStorage
    const saved = localStorage.getItem('blockYourDopamineState');
    const lastFocusData = localStorage.getItem('last_focus_data');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Fallback to last_focus_data if it's newer or if parsed data is missing focus info
        if (lastFocusData) {
          try {
            const focusParsed = JSON.parse(lastFocusData);
            // Only use if it's from today (to prevent stale data from yesterday)
            const focusDate = getLocalDateString(new Date(focusParsed.timestamp || 0));
            if (focusDate === today) {
              parsed.totalNetFocusTime = focusParsed.totalNetFocusTime ?? parsed.totalNetFocusTime;
              parsed.dailyTotalFocusTime = focusParsed.dailyTotalFocusTime ?? parsed.dailyTotalFocusTime;
              parsed.dailySessions = focusParsed.dailySessions ?? parsed.dailySessions;
              parsed.detoxPercent = focusParsed.detoxPercent ?? parsed.detoxPercent;
              parsed.lastResetDate = today; // Ensure it doesn't get reset below
            }
          } catch (e) {
            logger.error("Failed to parse last_focus_data", e);
          }
        }

        // One-time manual data adjustment: Subtract 2 hours (7200 seconds)
        const manualAdjustmentFlag = 'manual_adjustment_v2_sub_2h';
        if (!localStorage.getItem(manualAdjustmentFlag)) {
          logger.log("Applying one-time manual data adjustment: -2 hours focus time");
          const twoHoursInSeconds = 7200;
          if (typeof parsed.totalNetFocusTime === 'number') {
            parsed.totalNetFocusTime = Math.max(0, parsed.totalNetFocusTime - twoHoursInSeconds);
          }
          if (typeof parsed.dailyTotalFocusTime === 'number') {
            parsed.dailyTotalFocusTime = Math.max(0, parsed.dailyTotalFocusTime - twoHoursInSeconds);
          }
          localStorage.setItem(manualAdjustmentFlag, 'true');
          // Update the saved state in localStorage immediately to ensure consistency
          localStorage.setItem('blockYourDopamineState', safeStringify(parsed));
        }

        // One-time manual data adjustment: Add 6h to Net, 6h 10m to Total
        const manualAdjustmentFlagV3 = 'manual_adjustment_v3_add_6h_6h10m';
        if (!localStorage.getItem(manualAdjustmentFlagV3)) {
          logger.log("Applying one-time manual data adjustment: +6h Net, +6h 10m Total");
          const sixHoursInSeconds = 21600;
          const sixHoursTenMinsInSeconds = 22200;
          if (typeof parsed.totalNetFocusTime === 'number') {
            parsed.totalNetFocusTime += sixHoursInSeconds;
          }
          if (typeof parsed.dailyTotalFocusTime === 'number') {
            parsed.dailyTotalFocusTime += sixHoursTenMinsInSeconds;
          }
          localStorage.setItem(manualAdjustmentFlagV3, 'true');
          // Update the saved state in localStorage immediately to ensure consistency
          localStorage.setItem('blockYourDopamineState', safeStringify(parsed));
        }

        // One-time manual data restoration: Set both to 6h 10m (22200 seconds)
        const manualRestorationFlagV4 = 'manual_restoration_v4_set_6h10m';
        if (!localStorage.getItem(manualRestorationFlagV4)) {
          logger.log("Applying one-time manual data restoration: 6h 10m focus time");
          const sixHoursTenMinsInSeconds = 22200;
          parsed.totalNetFocusTime = sixHoursTenMinsInSeconds;
          parsed.dailyTotalFocusTime = sixHoursTenMinsInSeconds;
          parsed.detoxPercent = 100;
          localStorage.setItem(manualRestorationFlagV4, 'true');
          // Update the saved state in localStorage immediately to ensure consistency
          localStorage.setItem('blockYourDopamineState', safeStringify(parsed));
        }

        // Check if we need to reset daily stats
        if (parsed.lastResetDate !== today) {
          parsed.totalNetFocusTime = 0;
          parsed.dailyTotalFocusTime = 0;
          parsed.dailySessions = 0;
          parsed.tasksCompleted = 0;
          parsed.physicalFitness = 0;
          parsed.detoxPercent = 0;
          parsed.sessionScores = [];
          
          // Ghost Clock Reset: Health Metrics
          parsed.hydrationIntake = 0;
          parsed.sleepHours = 0;
          parsed.sleepSessions = 0;
          parsed.steps = 0;
          parsed.consumedCalories = 0;
          parsed.screenTimeHours = 0;
          parsed.screenTimeMinutes = 0;
          
          // Ghost Clock Reset: Planner Auto-Removal
          if (parsed.tasks) {
            parsed.tasks = parsed.tasks.filter((task: Task) => {
              if (!task.date) return true;
              const taskDate = new Date(task.date);
              const currentDate = new Date(today);
              return taskDate >= currentDate;
            });
          }
          
          parsed.lastResetDate = today;
        }
          const isFocusing = parsed.isFocusing || false;
          const currentSessionId = parsed.currentSessionId || null;
          const currentSessionDuration = parsed.currentSessionDuration || 0;
          const isManualExit = false;
  
          let initialResources: Resource[] = [];
          try {
            const savedResources = localStorage.getItem('byd_study_resources');
            if (savedResources) {
              initialResources = JSON.parse(savedResources);
            }
          } catch (e) {
            logger.error("Failed to parse byd_study_resources", e);
          }

          // Reliable Calculations: Detox = (Net Focus / Total Focus) * 100
          const parsedNet = parsed.totalNetFocusTime || 0;
          const parsedTotal = parsed.dailyTotalFocusTime || 0;
          const calculatedDetox = parsedTotal > 0 ? Math.round((parsedNet / parsedTotal) * 10000) / 100 : 100;

          // Migrate Tasks before sync queue so IDs can be matched
          const migratedTasks = (parsed.tasks || []).map((t: any) => {
            if (t.id && !isUUID(t.id)) {
              return { ...t, id: stringToUUID(t.id), old_id: t.id };
            }
            return t;
          });

          // Migrate Academic Chapters & Hydrate with granular checklist data
          const defaultChapters = generateDefaultChapters(parsed.user?.id);
          const migratedChapters = (() => {
            // Priority Hydration: Try BYD_Syllabus_Settings first as it's the explicit Source of Truth
            let savedChapters = [];
            try {
              const settingsRaw = localStorage.getItem('BYD_Syllabus_Settings');
              if (settingsRaw) {
                savedChapters = JSON.parse(settingsRaw);
              }
            } catch (e) {}

            if (!savedChapters || savedChapters.length === 0) {
              savedChapters = (parsed.academicChapters && Array.isArray(parsed.academicChapters)) ? parsed.academicChapters : [];
            }
            
            // Map chapters and optionally hydrate from granular storage
            const chapters = defaultChapters.map(def => {
              const existing = savedChapters.find((c: any) => {
                const oldLiteralId = parsed.user?.id ? `${parsed.user.id}_${def.subject_id}_ch_${def.chapter_name.replace(/\s+/g, '_')}` : `anon_${def.subject_id}_ch_${def.chapter_name.replace(/\s+/g, '_')}`;
                return c.id === def.id || c.id === oldLiteralId;
              });
              
              let chapter = existing ? { ...existing, chapter_name: def.chapter_name, id: def.id } : def;

              // Granular Hydration: Check for dedicated chapter checklist key
              try {
                const granularKey = `byd_chapter_${chapter.id}_checklist`;
                const savedGranular = localStorage.getItem(granularKey);
                if (savedGranular) {
                  const checklist = JSON.parse(savedGranular);
                  // Only hydrate if it has valid data
                  if (checklist && typeof checklist === 'object') {
                    // Merit: this provides a second layer of verification
                    chapter = {
                      ...chapter,
                      read_textbook: checklist.read_textbook ?? chapter.read_textbook,
                      watch_class: checklist.watch_class ?? chapter.watch_class,
                      practice_problems: checklist.practice_problems ?? chapter.practice_problems,
                      make_notes: checklist.make_notes ?? chapter.make_notes,
                      is_active: checklist.is_active ?? chapter.is_active
                    };
                  }
                }
              } catch (e) {
                logger.error(`Error hydrating granular data for ${chapter.id}`, e);
              }

              return chapter;
            });
            
            return chapters;
          })();

          const calculatedSubjects = calculateAllSubjectsProgress(migratedChapters, parsed.user?.id);

          return { 
            ...parsed, 
            isFocusing, 
            currentSessionDuration,
            currentSessionId,
            isManualExit,
          streak: parsed.streak || 0,
          lastStreakDate: parsed.lastStreakDate || null,
          consecutiveMissedDays: parsed.consecutiveMissedDays || 0,
          streakSeasonStartDate: parsed.streakSeasonStartDate || today,
          totalNetFocusTime: parsedNet,
          dailyTotalFocusTime: parsedTotal,
          dailyGoalHours: parsed.dailyGoalHours || 2.0,
          dailySessions: parsed.dailySessions || 0,
          detoxPercent: calculatedDetox,
          hydrationIntake: parsed.hydrationIntake || 0,
          sleepHours: parsed.sleepHours || 0,
          sleepSessions: parsed.sleepSessions || 0,
          steps: parsed.steps || 0,
          consumedCalories: parsed.consumedCalories || 0,
          screenTimeHours: parsed.screenTimeHours || 0,
          screenTimeMinutes: parsed.screenTimeMinutes || 0,
          healthTargets: parsed.healthTargets || {
            hydration: '8',
            sleep: '8',
            footsteps: '10000',
            calories: '2000'
          },
          notificationsEnabled: parsed.notificationsEnabled ?? true,
          notifications: parsed.notifications || [],
          equippedBadges: parsed.equippedBadges || [null, null, null],
          unlockedBadgeIds: parsed.unlockedBadgeIds || [],
          badgeHealth: parsed.badgeHealth || {},
          lastActivityTimestamp: parsed.lastActivityTimestamp || new Date().toISOString(),
          weeklyHistory: parsed.weeklyHistory || [],
          sessionScores: parsed.sessionScores || [],
          hasFetchedFocusData: false,
          latestMood: parsed.latestMood || null,
          macros: parsed.macros || { protein: 0, carbs: 0, fats: 0 },
          geminiApiKey: parsed.geminiApiKey || localStorage.getItem('byd_user_gemini_key') || null,
          syncQueue: (parsed.syncQueue || []).filter((item: any) => {
            // Purge known problematic IDs that are blocking sync or invalid structures
            const badId = "wwvk9cypymopag4nz";
            if (item?.data?.id === badId || item?.where?.id === badId) return false;
            return item && item.table;
          }).map((item: any) => {
            // Migration for sync queue items
            if (item.table === 'academic_progress' && item.data && item.data.subject_id) {
              delete item.data.subject_id;
            }
            if (item.data && item.data.id && !isUUID(item.data.id)) {
              if (item.table === 'academic_chapters' && item.data.chapter_name && item.data.subject_id) {
                const rawId = (parsed.user?.id || 'anon') + '_' + item.data.subject_id + '_ch_' + item.data.chapter_name.replace(/\s+/g, '_');
                item.data.id = stringToUUID(rawId);
              } else {
                // Generic UUID conversion for any other table ID
                item.data.id = stringToUUID(String(item.data.id));
              }
            }
            // Also check for 'where' clause in delete operations
            if (item.where && item.where.id && !isUUID(item.where.id)) {
                item.where.id = stringToUUID(String(item.where.id));
            }
            return item;
          }),
          offlineSyncQueue: (parsed.offlineSyncQueue || []).map((item: any) => {
            if (item.table === 'academic_progress' && item.data && item.data.subject_id) {
              delete item.data.subject_id;
            }
            if (item.data && item.data.id && !isUUID(item.data.id)) {
              item.data.id = stringToUUID(String(item.data.id));
            }
            if (item.data && item.data.session_id && !isUUID(item.data.session_id)) {
              item.data.session_id = stringToUUID(String(item.data.session_id));
            }
            return item;
          }),
          currentSessionStartTime: parsed.currentSessionStartTime || null,
          isSyncing: false,
          resources: initialResources.length > 0 ? initialResources : (parsed.resources || []),
          academicSettings: parsed.academicSettings || { examDate: null, focusSubjectId: null, prepStartDate: null },
          academicChapters: migratedChapters,
          academicSubjects: calculatedSubjects,
          tasks: migratedTasks,
        };
      } catch (e) {
        logger.error("Failed to parse saved state", e);
      }
    }
    
    let initialFocus = {
      totalNetFocusTime: 0,
      dailyTotalFocusTime: 0,
      dailySessions: 0,
      detoxPercent: 0
    };

    let initialResources: Resource[] = [];
    try {
      const savedResources = localStorage.getItem('byd_study_resources');
      if (savedResources) {
        initialResources = JSON.parse(savedResources);
      }
    } catch (e) {
      console.error("Failed to parse byd_study_resources", e);
    }

    return {
      xp: 0,
      level: 1,
      streak: 0,
      lastStreakDate: null,
      consecutiveMissedDays: 0,
      streakSeasonStartDate: today,
      focusTime: 0,
      isFocusing: false,
      tasksCompleted: 0,
      detoxPercent: initialFocus.detoxPercent,
      physicalFitness: 0,
      weeklyRank: "---",
      globalRank: "---",
      topSkill: "None",
      resources: initialResources,
      totalNetFocusTime: initialFocus.totalNetFocusTime,
      dailyTotalFocusTime: initialFocus.dailyTotalFocusTime,
      dailyGoalHours: 2.0,
      dailySessions: initialFocus.dailySessions,
      lastResetDate: today,
      currentSessionDuration: 0,
      currentSessionId: null,
      currentSubjectId: null,
      currentSessionResources: [],
      isManualExit: false,
      sessionTimeLeft: 0,
      sessionDistractionTime: 0,
      isSessionDistracted: false,
      gender: "Male",
      hydrationIntake: 0,
      sleepHours: 0,
      sleepSessions: 0,
      steps: 0,
      consumedCalories: 0,
      screenTimeHours: 0,
      screenTimeMinutes: 0,
      healthTargets: {
        hydration: '8',
        sleep: '8',
        footsteps: '10000',
        calories: '2000'
      },
      tasks: [],
      notificationsEnabled: true,
      notifications: [],
      user: null,
      profile: null,
      daysActive: 1,
      equippedBadges: [null, null, null],
      unlockedBadgeIds: [],
      badgeHealth: {},
      lastActivityTimestamp: now.toISOString(),
      weeklyHistory: [],
      sessionScores: [],
      isSyncing: false,
      hasFetchedFocusData: false,
      latestMood: null,
      macros: { protein: 0, carbs: 0, fats: 0 },
      geminiApiKey: localStorage.getItem('byd_user_gemini_key') || null,
      syncQueue: [],
      offlineSyncQueue: [],
      currentSessionStartTime: null,
      academicSettings: { examDate: null, focusSubjectId: null, prepStartDate: null },
      academicChapters: generateDefaultChapters(null),
      academicSubjects: calculateAllSubjectsProgress(generateDefaultChapters(null), null)
    };
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const addNotification = useCallback((title: string, message: string) => {
    setState(prev => ({
      ...prev,
      notifications: [
        {
          id: generateId(),
          title,
          message,
          time: "Just now"
        },
        ...prev.notifications
      ]
    }));
  }, []);

  const modifyFocusTime = useCallback((netDelta: number, totalDelta: number) => {
    setState(prev => ({
      ...prev,
      totalNetFocusTime: Math.max(0, prev.totalNetFocusTime + netDelta),
      dailyTotalFocusTime: Math.max(0, prev.dailyTotalFocusTime + totalDelta)
    }));
  }, []);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Sync Queue Processor with Debounce & Error Recovery
  const processSyncQueue = useCallback(async () => {
    if (!state.user || !state.syncQueue || state.syncQueue.length === 0) return;
    if (isSyncingRef.current) {
      logger.log("Sync already in progress, skipping...");
      return;
    }

    isSyncingRef.current = true;
    const queue = [...state.syncQueue].filter(item => item && item.table);
    // Clear queue locally first (Optimistic)
    setState(prev => ({ ...prev, syncQueue: [] }));

    try {
      logger.log(`Processing sync queue with ${queue.length} items...`);
      
      // Group updates by table to minimize requests
      const updatesByTable: Record<string, any[]> = {};
      queue.forEach(item => {
        if (!updatesByTable[item.table]) updatesByTable[item.table] = [];
        updatesByTable[item.table].push(item);
      });

      const syncPromises = Object.entries(updatesByTable).map(async ([table, items]) => {
        // For upserts, we often only care about the latest state for a specific key (e.g., user_id + entry_date)
        // This is a simple optimization: only send the last update for each unique key in the batch
        const uniqueItems = items.reduce((acc, item) => {
          // Use item.key, or item.id, or a random UUID for inserts, or 'default'
          const key = item.key || item.id || (item.type === 'insert' ? `insert_${generateId()}` : 'default');
          acc[key] = item;
          return acc;
        }, {} as Record<string, any>);

        return Promise.all(Object.values(uniqueItems).map(async (item: any) => {
          const { table, data, type, id, key } = item;
          
          try {
            let sanitizedData = { ...data };
            if (table === 'sessions') {
              delete sanitizedData.duration;
              delete sanitizedData.status;
            }
            if (type === 'upsert') {
              // BYD Sanitization: Remove internal fields before database sync
              if (table === 'academic_chapters' && sanitizedData._timestamp) {
                // DO NOT DELETE _timestamp here - we need it in the DB for latest-wins logic
              }
              return await supabase.from(table).upsert(sanitizedData, { onConflict: item.onConflict || 'id' });
            } else if (type === 'insert') {
              return await supabase.from(table).insert(sanitizedData);
            } else if (type === 'update') {
              return await supabase.from(table).update(sanitizedData).eq('id', id);
            } else if (type === 'delete') {
              return await supabase.from(table).delete().eq('id', id);
            }
          } catch (err: any) {
            // Catch individual request errors to prevent Promise.all from failing entirely
            return { error: err };
          }
        }));
      });

      const results = await Promise.all(syncPromises);
      const flattenedResults = results.flat();
      const errors = flattenedResults.filter(r => r && (r as any).error);

      if (errors.length > 0) {
        const errorMsgs = errors.map(e => {
          const err = (e as any).error;
          return typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
        });

        const isNetworkOrTimeout = errorMsgs.every(m => 
          m.toLowerCase().includes("fetch") || 
          m.toLowerCase().includes("network") || 
          m.toLowerCase().includes("timeout") ||
          m.toLowerCase().includes("signal timed out")
        );

        if (!isNetworkOrTimeout) {
          logger.error("Sync errors detected:", errorMsgs);
        } else {
          logger.warn("Network issue during sync:", errorMsgs);
        }
        
        const containsFatal = errorMsgs.some(m => m.toLowerCase().includes("relation") || m.toLowerCase().includes("column") || m.toLowerCase().includes("not found") || m.toLowerCase().includes("constraint"));
        
        const combinedError = new Error(`Sync failed for ${errors.length} items. ${errorMsgs.join('; ')}`);
        (combinedError as any).isFatal = containsFatal;
        (combinedError as any).isNetworkOrTimeout = isNetworkOrTimeout;
        throw combinedError;
      }

      logger.log("Sync queue completed successfully!");
      setState(prev => ({ 
        ...prev, 
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) 
      }));
    } catch (error: any) {
      if (!error.isNetworkOrTimeout && !error.message?.toLowerCase().includes("fetch")) {
        console.error("Sync queue processing failed. Saving to localStorage for retry...", error);
      } else {
        console.warn("Sync queue blocked by network. Retrying later...");
      }
      
      const isFatalError = error.isFatal || error.message?.toLowerCase().includes("relation") || error.message?.toLowerCase().includes("not found");
      const isLockError = error.message?.includes("Lock broken") || error.message?.includes("AbortError") || error.message?.includes("timeout");
      
      if (!isFatalError) {
        // Save failed items back to queue and localStorage for retry
        setState(prev => ({ ...prev, syncQueue: [...queue, ...prev.syncQueue] }));
        
        // Retry after 30 seconds (or shorter if it was just a lock error)
        setTimeout(() => {
          processSyncQueue();
        }, isLockError ? 5000 : 30000);
      } else {
        console.warn("Fatal sync error (missing table/bucket). Retries disabled until next refresh.");
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [state.user, state.syncQueue]);

  // Debounced Sync Trigger
  const triggerSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      processSyncQueue();
    }, 2000); // 2-second debounce
  }, [processSyncQueue]);

  const updateAcademicProgress = useCallback(async (subjectId: string, progress: number) => {
    setState(prev => {
      const updatedSubjects = prev.academicSubjects.map(s => 
        s.id === subjectId ? { ...s, progress } : s
      );
      
      const newSyncQueue = [...(prev.syncQueue || [])];
      const userId = prev.user?.id;
      const rawProgressId = userId ? `${userId}_${subjectId}` : `anon_${subjectId}`;
      const progressId = stringToUUID(rawProgressId);

      newSyncQueue.push({
        table: 'academic_progress',
        type: 'upsert',
        data: { id: progressId, user_id: userId, progress },
        onConflict: 'id'
      });

      const nextState = { ...prev, academicSubjects: updatedSubjects, syncQueue: newSyncQueue };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        logger.error("Progress persistence failed", e);
      }

      return nextState;
    });
    triggerSync();
  }, [triggerSync]);

  const updateAcademicSettings = useCallback(async (settings: Partial<AcademicSettings>) => {
    setState(prev => {
      const updatedSettings = { ...prev.academicSettings, ...settings };
      
      const newSyncQueue = [...(prev.syncQueue || [])];
      newSyncQueue.push({
        table: 'academic_settings',
        type: 'upsert',
        data: { 
          user_id: state.user?.id, 
          exam_date: updatedSettings.examDate,
          focus_subject_id: updatedSettings.focusSubjectId,
          prep_start_date: updatedSettings.prepStartDate
        },
        onConflict: 'user_id'
      });

      const nextState = { ...prev, academicSettings: updatedSettings, syncQueue: newSyncQueue };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        logger.error("Settings persistence failed", e);
      }

      return nextState;
    });
    triggerSync();
  }, [state.user?.id, triggerSync]);

  const updateChapterProgress = useCallback(async (chapter_id: string, updates: Partial<AcademicChapter>) => {
    let finalChapter: AcademicChapter | null = null;
    let finalUpdatedChapters: AcademicChapter[] = [];
    let finalUpdatedSubjects: AcademicSubject[] = [];
    const timestamp = Date.now();

    setState(prev => {
      // 1. Find existing or generate from defaults if missing
      const existing = prev.academicChapters.find(c => c.id === chapter_id);
      
      const newChapter = existing ? { ...existing, ...updates, _timestamp: timestamp } : {
        id: chapter_id,
        subject_id: updates.subject_id || '',
        chapter_name: updates.chapter_name || '',
        is_weak: updates.is_weak ?? false,
        is_important: updates.is_important ?? false,
        is_active: updates.is_active ?? true,
        read_textbook: updates.read_textbook ?? false,
        watch_class: updates.watch_class ?? false,
        practice_problems: updates.practice_problems ?? false,
        make_notes: updates.make_notes ?? false,
        resources: updates.resources ?? [],
        ...updates,
        _timestamp: timestamp
      } as AcademicChapter;

      finalChapter = newChapter;

      const updatedChapters = prev.academicChapters.map(c => 
        c.id === chapter_id ? newChapter : c
      );
      
      if (!prev.academicChapters.some(c => c.id === chapter_id)) {
        updatedChapters.push(newChapter);
      }

      // Deduplicate
      const uniqueChapters = Array.from(new Map(updatedChapters.map(c => [c.id, c])).values()) as AcademicChapter[];
      finalUpdatedChapters = uniqueChapters;

      const updatedSubjects = calculateAllSubjectsProgress(uniqueChapters, prev.user?.id);
      finalUpdatedSubjects = updatedSubjects;

      const subjectId = newChapter.subject_id;
      const updatedSubject = updatedSubjects.find(s => s.id === subjectId);
      const progress = updatedSubject?.progress || 0;
      
      const newSyncQueue = [...(prev.syncQueue || [])];
      const userId = prev.user?.id;
      const rawProgressId = userId ? `${userId}_${subjectId}` : `anon_${subjectId}`;
      const progressId = stringToUUID(rawProgressId);

      newSyncQueue.push({
        table: 'academic_progress',
        type: 'upsert',
        data: { id: progressId, user_id: userId, progress },
        onConflict: 'id'
      });

      newSyncQueue.push({
        table: 'academic_chapters',
        type: 'upsert',
        data: { 
          id: newChapter.id,
          subject_id: newChapter.subject_id,
          chapter_name: newChapter.chapter_name,
          is_weak: newChapter.is_weak,
          is_important: newChapter.is_important,
          is_active: newChapter.is_active,
          read_textbook: newChapter.read_textbook,
          watch_class: newChapter.watch_class,
          practice_problems: newChapter.practice_problems,
          make_notes: newChapter.make_notes,
          resources: newChapter.resources, // Persist resources too
          user_id: userId,
          _timestamp: timestamp
        },
        onConflict: 'id'
      });

      return { 
        ...prev, 
        academicChapters: uniqueChapters, 
        academicSubjects: updatedSubjects,
        syncQueue: newSyncQueue 
      };
    });

    // Side Effects outside of setState for safety
    if (finalChapter) {
      const chapter = finalChapter as AcademicChapter;
      const subjectId = chapter.subject_id;
      
      try {
        const saved = localStorage.getItem('blockYourDopamineState');
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.academicChapters = finalUpdatedChapters;
          parsed.academicSubjects = finalUpdatedSubjects;
          parsed._timestamp = timestamp;
          localStorage.setItem('blockYourDopamineState', safeStringify(parsed));
        }

        // SYLLABUS SETTINGS EXPLICIT SAVE (Per Requirement)
        localStorage.setItem('BYD_Syllabus_Settings', safeStringify(finalUpdatedChapters));

        // Granular checkpoint
        const checklist = {
          read_textbook: chapter.read_textbook,
          watch_class: chapter.watch_class,
          practice_problems: chapter.practice_problems,
          make_notes: chapter.make_notes,
          is_active: chapter.is_active,
          _timestamp: timestamp
        };
        localStorage.setItem(`byd_chapter_${chapter.id}_checklist`, JSON.stringify(checklist));

        if (subjectId) {
          const activeCount = finalUpdatedChapters.filter(c => c.subject_id === subjectId && c.is_active === true).length;
          localStorage.setItem(`BYD_Denom_${subjectId}`, String(activeCount));
        }
      } catch (e) {
        logger.error("Persistence failed", e);
      }
    }

    triggerSync();
  }, [triggerSync]);


  const resetSyllabus = useCallback(() => {
    setState(prev => {
      const defaultChapters = generateDefaultChapters(prev.user?.id);
      const updatedSubjects = calculateAllSubjectsProgress(defaultChapters, prev.user?.id);
      
      // If logged in, queue these for update in cloud
      const newSyncQueue = [...(prev.syncQueue || [])];
      defaultChapters.forEach(chapter => {
        // BYD Sanitization: Never sync _timestamp internal field
        const { ...syncData } = chapter as any;
        delete syncData._timestamp;

        newSyncQueue.push({
          table: 'academic_chapters',
          type: 'upsert',
          data: { ...syncData, user_id: prev.user?.id },
          onConflict: 'id'
        });
      });

      const nextState = {
        ...prev,
        academicChapters: defaultChapters,
        academicSubjects: updatedSubjects,
        syncQueue: newSyncQueue
      };

      // Immediate persistence for critical study data
      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        logger.error("Immediate reset persistence failed", e);
      }

      return nextState;
    });
    triggerSync();
    addNotification("Syllabus Reset", "Every chapter has been set to active.");
  }, [triggerSync, addNotification]);

  const addChapterResource = useCallback(async (chapterId: string, resource: ChapterResource) => {
    setState(prev => {
      const updatedChapters = prev.academicChapters.map(c => {
        if (c.id === chapterId) {
          return { ...c, resources: [...c.resources, resource] };
        }
        return c;
      });
      
      const chapter = updatedChapters.find(c => c.id === chapterId);
      if (!chapter) return prev;

      const newSyncQueue = [...(prev.syncQueue || [])];
      newSyncQueue.push({
        table: 'academic_chapters',
        type: 'upsert',
        data: { 
          id: chapter.id, 
          user_id: state.user?.id, 
          resources: chapter.resources
        },
        onConflict: 'id'
      });

      const nextState = { ...prev, academicChapters: updatedChapters, syncQueue: newSyncQueue };

      // Immediate persistence
      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        logger.error("Resource add persistence failed", e);
      }

      return nextState;
    });
    triggerSync();
  }, [state.user?.id, triggerSync]);

  const deleteChapterResource = useCallback(async (chapterId: string, resourceId: string) => {
    setState(prev => {
      const updatedChapters = prev.academicChapters.map(c => {
        if (c.id === chapterId) {
          return { ...c, resources: c.resources.filter(r => r.id !== resourceId) };
        }
        return c;
      });
      
      const chapter = updatedChapters.find(c => c.id === chapterId);
      if (!chapter) return prev;

      const newSyncQueue = [...(prev.syncQueue || [])];
      newSyncQueue.push({
        table: 'academic_chapters',
        type: 'upsert',
        data: { 
          id: chapter.id, 
          user_id: state.user?.id, 
          resources: chapter.resources
        },
        onConflict: 'id'
      });

      const nextState = { ...prev, academicChapters: updatedChapters, syncQueue: newSyncQueue };

      // Immediate persistence
      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        logger.error("Resource delete persistence failed", e);
      }

      return nextState;
    });
    triggerSync();
  }, [state.user?.id, triggerSync]);

  // Offline sync queue management
  const OFFLINE_QUEUE_KEY = 'offline_sync_queue';
  
  const getOfflineQueue = useCallback((): any[] => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveOfflineQueue = useCallback((queue: any[]) => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, safeStringify(queue));
  }, []);

  const syncOfflineQueue = useCallback(async () => {
    if (!navigator.onLine || !state.user) return;
    
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`BYD Offline Protocol: Syncing ${queue.length} pending items...`);
    
    const remainingQueue: any[] = [];
    let successCount = 0;

    for (const item of queue) {
      try {
        let error;
        // Protocol: Ensure data has the current user's ID to prevent RLS violations
        const dataWithUser = { ...item.data, user_id: state.user.id };
        if (item.table === 'academic_chapters' && (dataWithUser as any)._timestamp) {
          // Keep _timestamp for latest-wins logic
        }
        
        if (item.table === 'sessions') {
          delete dataWithUser.duration;
          delete dataWithUser.status;
          const { error: err } = await supabase.from('sessions').upsert(dataWithUser, { onConflict: 'session_id' });
          error = err;
        } else if (item.table === 'focus_logs') {
          const { error: err } = await supabase.from('focus_logs').upsert(dataWithUser, { onConflict: 'session_id' });
          error = err;
        } else if (item.table === 'profiles') {
          const { error: err } = await supabase.from('profiles').upsert(dataWithUser, { onConflict: 'id' });
          error = err;
        } else if (item.table === 'academic_settings') {
          const { error: err } = await supabase.from('academic_settings').upsert(dataWithUser, { onConflict: 'user_id' });
          error = err;
        } else if (item.table === 'academic_progress') {
          const { error: err } = await supabase.from('academic_progress').upsert(dataWithUser, { onConflict: 'id' });
          error = err;
        } else if (item.table === 'academic_chapters') {
          const { error: err } = await supabase.from('academic_chapters').upsert(dataWithUser, { onConflict: 'id' });
          error = err;
        } else if (item.table === 'user_streaks') {
          const { error: err } = await supabase.from('user_streaks').upsert(dataWithUser, { onConflict: 'user_id' });
          error = err;
        } else {
          // General sync for other tables
          const { error: err } = await supabase.from(item.table).upsert(dataWithUser);
          error = err;
        }

        if (error) {
          logger.error(`Offline catch sync failed for ${item.table}:`, error);
          remainingQueue.push(item);
        } else {
          successCount++;
        }
      } catch (e) {
        logger.error(`Offline sync exception for ${item.table}:`, e);
        remainingQueue.push(item);
      }
    }

    saveOfflineQueue(remainingQueue);
    if (successCount > 0) {
      addNotification("Sync Complete", `${successCount} items have been synced to the cloud.`);
    }
  }, [state.user, getOfflineQueue, saveOfflineQueue, addNotification]);

  // Persist state to localStorage whenever it changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = state;
        const stateToSave = { ...persistentState, _timestamp: Date.now() };
        localStorage.setItem('blockYourDopamineState', safeStringify(stateToSave));
      } catch (e) {
        logger.error("Failed to persist state to localStorage:", e);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  // Cross-tab sync: Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blockYourDopamineState' && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // Only update if the new state is actually newer in case of race conditions
          setState(prev => {
            const currentTimestamp = (prev as any)._timestamp || 0;
            const newTimestamp = newState._timestamp || 0;
            
            if (newTimestamp > currentTimestamp) {
              logger.log("Syncing state from other tab...");
              return { 
                ...prev, 
                ...newState,
                // Preserve non-persistent UI state
                isFocusing: prev.isFocusing,
                currentSessionStartTime: prev.currentSessionStartTime,
                isSyncing: prev.isSyncing
              };
            }
            return prev;
          });
        } catch (err) {
          logger.error("Failed to parse storage sync data", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addToSyncQueue = useCallback((item: any) => {
    if (item && item.table) {
      // logger.log("Adding to sync queue:", item.table);
    } else {
      logger.warn("Attempted to add invalid item to sync queue:", item);
      return;
    }
    setState(prev => ({ ...prev, syncQueue: [...(prev.syncQueue || []), item] }));
    triggerSync();
  }, [triggerSync]);

  // Retry Pending Sessions on Mount
  useEffect(() => {
    const retryPendingSession = async () => {
      const pending = localStorage.getItem('pending_session');
      if (pending && state.user) {
        try {
          const sessionData = JSON.parse(pending);
          
          // BYD Protocol: Consistency Check
          // Ensure we are using the CURRENT user's ID to avoid RLS violations
          const targetUserId = state.user.id;
          
          logger.log("Found pending session, retrying upload...", sessionData);
          
          // Try both tables for backward compatibility during transition
          const { error: sessionsError } = await supabase.from('sessions').upsert({
            user_id: targetUserId,
            session_id: sessionData.session_id,
            total_duration: Math.floor(sessionData.total_duration || sessionData.total_session_seconds || 0),
            net_focus_time: Math.floor(sessionData.net_focus_time || sessionData.net_focus_seconds || 0),
            distraction_time: Math.floor(sessionData.distraction_time || ((sessionData.total_session_seconds || 0) - (sessionData.net_focus_seconds || 0))),
            detox_score: parseFloat(sessionData.detox_score || sessionData.growth_percentage || 0),
            start_time: sessionData.start_time
          }, { onConflict: 'session_id' });

          if (!sessionsError) {
            logger.log("Successfully uploaded pending session to 'sessions' table.");
            localStorage.removeItem('pending_session');
            return;
          }

          // Fallback to focus_logs if sessions table fails or doesn't exist yet
          const { error: logsError } = await supabase.from('focus_logs').upsert({
            user_id: targetUserId,
            session_id: sessionData.session_id,
            session_duration: Math.floor(sessionData.session_duration || sessionData.total_duration || 0),
            growth_percentage: Math.round(sessionData.growth_percentage || sessionData.detox_score || 0),
            start_time: sessionData.start_time,
            is_draft: sessionData.is_draft || false
          }, { onConflict: 'session_id' });

          if (!logsError) {
            logger.log("Successfully uploaded pending session to 'focus_logs' table.");
            localStorage.removeItem('pending_session');
          } else {
            logger.error("Failed to upload pending session to both tables:", { sessionsError, logsError });
          }
        } catch (e) {
          logger.error("Error parsing pending session:", e);
        }
      }
    };

    if (state.user) {
      retryPendingSession();
      syncOfflineQueue();
    }
  }, [state.user, syncOfflineQueue]);

  // Auth & Sync
  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL || 'undefined';
        logger.log("Testing Supabase connection to:", url);
        
        if (url === 'undefined' || !url) {
          setIsSupabaseConnected(false);
          setConnectionError("Supabase URL is missing. Please set VITE_SUPABASE_URL in Settings.");
          return;
        }

        const { error, status } = await supabase.from('focus_logs').select('id').limit(1);
        
        if (error) {
          setIsSupabaseConnected(false);
          
          if (error.message.includes('Failed to fetch')) {
            setConnectionError("Network Error: Failed to fetch. This usually means the Supabase URL is incorrect, the project is paused, or your internet is unstable.");
            logger.error("CRITICAL: Supabase 'Failed to fetch' detected. Possible causes:\n1. Incorrect VITE_SUPABASE_URL\n2. Supabase project is paused\n3. Network/CORS block\n4. Database is currently restarting");
          } else {
            setConnectionError(error.message);
          }
          logger.error("Supabase Connection Test Error:", error);
        } else {
          setIsSupabaseConnected(true);
          setConnectionError(null);
          logger.log("Supabase connection verified successfully. Status:", status);
        }
      } catch (err: any) {
        setIsSupabaseConnected(false);
        setConnectionError(err.message || "Unknown connection error");
        logger.error("Supabase Connection Test Exception:", err);
      }
    };
    testConnection();

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const user = session.user as unknown as User;
        const profile = { 
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatarUrl: user.user_metadata?.avatar_url 
        };
        setState(prev => ({ ...prev, user, profile }));
        fetchUserData(user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = session.user as unknown as User;
        const profile = { 
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatarUrl: user.user_metadata?.avatar_url 
        };
        setState(prev => ({ ...prev, user, profile }));
        fetchUserData(user.id);
      } else {
        setState(prev => ({ ...prev, user: null, profile: null }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const masterSync = useCallback(async (view?: string) => {
    if (!state.user || isSyncingRef.current) return;
    const userId = state.user.id;
    const today = getLocalDateString(new Date());

    try {
      isSyncingRef.current = true;
      if (state.syncQueue && state.syncQueue.length > 0) await processSyncQueue();

      const isAcademicTabTrigger = view === 'Academic';
      if (isAcademicTabTrigger) {
        setState(prev => ({ ...prev, isSyncing: false }));
        isSyncingRef.current = false;
        return;
      }

      setState(prev => ({ ...prev, isSyncing: true }));

      const fetchFocusData = async () => {
        const now = new Date();
        const dhakaOffset = 6 * 60 * 60 * 1000;
        const dhakaTime = new Date(now.getTime() + dhakaOffset);
        const startOfDhakaDay = new Date(dhakaTime);
        startOfDhakaDay.setUTCHours(0, 0, 0, 0);
        const startOfDhakaDayUTC = new Date(startOfDhakaDay.getTime() - dhakaOffset);
        const endOfDhakaDay = new Date(dhakaTime);
        endOfDhakaDay.setUTCHours(23, 59, 59, 999);
        const endOfDhakaDayUTC = new Date(endOfDhakaDay.getTime() - dhakaOffset);

        const [logsRes, sessionsRes] = await Promise.all([
          supabase.from('focus_logs').select('*').eq('user_id', userId).gte('start_time', startOfDhakaDayUTC.toISOString()).lte('start_time', endOfDhakaDayUTC.toISOString()),
          supabase.from('sessions').select('*').eq('user_id', userId).gte('start_time', startOfDhakaDayUTC.toISOString()).lte('start_time', endOfDhakaDayUTC.toISOString())
        ]);
        
        const combined = new Map<string, any>();
        (logsRes.data || []).forEach(log => { if (log.session_id) combined.set(log.session_id, log); });
        (sessionsRes.data || []).forEach(s => {
          const mapped = { ...s, session_duration: s.total_duration, growth_percentage: s.detox_score };
          if (s.session_id) {
            const existing = combined.get(s.session_id);
            if (!existing || mapped.session_duration >= existing.session_duration) combined.set(s.session_id, mapped);
          } else {
            combined.set(`legacy_${s.id}`, mapped);
          }
        });
        return Array.from(combined.values());
      };

      const jobs: Record<string, any> = {
        profile: supabase.from('profiles').select('*').eq('id', userId).single(),
        streak: supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
      };

      if (!view || view === 'Dashboard' || view === 'Reports' || view === 'Detox') {
        jobs.focus = fetchFocusData();
        jobs.detoxSettings = supabase.from('detox_settings').select('*').eq('user_id', userId).single();
        jobs.prefs = supabase.from('user_preferences').select('*').eq('user_id', userId).single();
      }

      if (!view || view === 'Planner') jobs.tasks = supabase.from('planner_tasks').select('*').eq('user_id', userId);

      if (!view || view === 'Health') {
        jobs.healthLogs = supabase.from('health_logs').select('*').eq('user_id', userId);
        jobs.macroData = supabase.from('macro_data').select('*').eq('user_id', userId).eq('entry_date', today).single();
      }

      if (!view || view === 'Dashboard' || view === 'Personal') {
        jobs.mood = supabase.from('mood_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(1);
        jobs.resources = supabase.from('resources').select('*').eq('user_id', userId);
      }

      if (!view || view === 'Academic') {
        jobs.academicProgress = supabase.from('academic_progress').select('*').eq('user_id', userId);
        jobs.academicSettings = supabase.from('academic_settings').select('*').eq('user_id', userId).single();
        jobs.academicChapters = supabase.from('academic_chapters').select('*').eq('user_id', userId);
      }

      const keys = Object.keys(jobs);
      const resultsArray = await Promise.all(Object.values(jobs));
      const results: Record<string, any> = {};
      keys.forEach((key, i) => { results[key] = resultsArray[i]; });

      // Build New State Object
      setState(prev => {
        let next = { ...prev };

        if (results.profile?.data) {
          const pd = results.profile.data;
          next.profile = {
            fullName: pd.full_name || prev.profile?.fullName || '',
            avatarUrl: pd.avatar_url || prev.profile?.avatarUrl,
            institution: pd.institution || '', class: pd.class || '',
            subjectGroup: pd.subject_group || '', year: pd.year || '',
            gender: pd.gender || 'Male'
          };
          next.gender = pd.gender || prev.gender;
        }

        if (results.tasks?.data) next.tasks = results.tasks.data;
        if (results.streak?.data) {
          const sd = results.streak.data;
          let fs = sd.streak_count || 0;
          let flsd = sd.last_streak_date || null;
          let fcmd = sd.consecutive_missed_days || 0;
          let fsssd = sd.season_start_date || today;

          const sDiff = getDayDifference(fsssd, today);
          if (sDiff >= 90) { fs = 0; fcmd = 0; flsd = null; fsssd = today; }
          else if (flsd) {
            const daysSince = getDayDifference(flsd, today);
            if (daysSince >= 3) { fs = 0; fcmd = 0; }
            else fcmd = (daysSince > 0 && flsd !== today) ? daysSince : 0;
          }

          if (fs > prev.streak || (flsd && flsd !== prev.lastStreakDate)) {
            next.streak = fs; next.lastStreakDate = flsd;
            next.consecutiveMissedDays = fcmd; next.streakSeasonStartDate = fsssd;
          }
        }

        if (results.healthLogs?.data) {
          const health = results.healthLogs.data.find((h: any) => h.entry_date === today);
          if (health) {
            // "Stale-While-Revalidate": Merge DB data with local state using Max Wins for counters 
            // to prevent flickering to zero during background syncs
            next.hydrationIntake = Math.max(prev.hydrationIntake || 0, health.hydration || 0);
            next.steps = Math.max(prev.steps || 0, health.steps || 0);
            next.sleepHours = Math.max(prev.sleepHours || 0, health.sleep_hours || 0);
            next.sleepSessions = Math.max(prev.sleepSessions || 0, health.sleep_sessions || 0);
            next.consumedCalories = Math.max(prev.consumedCalories || 0, health.calories || 0);
            
            const totalScreenMins = health.screen_time_minutes || 0;
            const currentScreenMins = (prev.screenTimeHours || 0) * 60 + (prev.screenTimeMinutes || 0);
            const finalScreenMins = Math.max(currentScreenMins, totalScreenMins);
            
            next.screenTimeHours = Math.floor(finalScreenMins / 60);
            next.screenTimeMinutes = finalScreenMins % 60;
          }
        }

        const dsSetting = results.detoxSettings?.data || results.prefs?.data;
        if (dsSetting) {
          next.dailyGoalHours = (dsSetting.daily_focus_goal_minutes || 120) / 60;
          next.healthTargets = {
            calories: String(dsSetting.daily_calorie_goal || 2000),
            footsteps: String(dsSetting.daily_step_goal || 10000),
            sleep: String(dsSetting.daily_sleep_goal || 8),
            hydration: String(dsSetting.daily_hydration_goal || 8),
            screenTime: String(dsSetting.daily_screen_time_goal || 4)
          };
        }

        if (results.focus) {
          let tNet = 0, tAtt = 0, scs: number[] = [];
          results.focus.forEach((s: any) => {
            const dur = s.session_duration || 0;
            const sc = s.growth_percentage || 0;
            tAtt += dur; tNet += Math.trunc((sc / 100) * dur);
            scs.push(sc);
          });
          
          // "Stale-While-Revalidate": Only update focus time if DB has more data (Max Wins)
          // or if we have no local focus data yet for today. This prevents 
          // the UI from flashing back to 0 during background revalidation.
          next.totalNetFocusTime = Math.max(prev.totalNetFocusTime || 0, tNet);
          next.dailyTotalFocusTime = Math.max(prev.dailyTotalFocusTime || 0, tAtt);
          next.dailySessions = Math.max(prev.dailySessions || 0, results.focus.length);
          
          // Re-calculate derived detox percent based on the merged times
          next.detoxPercent = next.dailyTotalFocusTime > 0 
            ? Math.round((next.totalNetFocusTime / next.dailyTotalFocusTime) * 10000) / 100 
            : 100;
            
          next.sessionScores = scs.length >= (prev.sessionScores?.length || 0) ? scs : prev.sessionScores;
          next.hasFetchedFocusData = true;
        }

        if (results.mood?.data?.length > 0) next.latestMood = { text: results.mood.data[0].note, emoji: results.mood.data[0].mood_type };

        if (results.resources?.data) {
          if (!prev.syncQueue?.some(item => item && item.table === 'resources')) {
            next.resources = results.resources.data.map((r: any) => ({ 
              id: r.id, title: r.title, url: r.url, type: r.type, 
              subject_id: r.subject_id, is_completed: r.is_completed 
            }));
          }
        }

        if (results.academicProgress?.data) next.academicSubjects = results.academicProgress.data;
        if (results.academicSettings?.data) {
          const aS = results.academicSettings.data;
          next.academicSettings = { examDate: aS.exam_date || null, focusSubjectId: aS.focus_subject_id || null, prepStartDate: aS.prep_start_date || null };
        }
        if (results.academicChapters?.data) {
          const cloudChapters = results.academicChapters.data;
          const defaultChapters = generateDefaultChapters(userId);
          const mergedChapters = defaultChapters.map(defaultCh => {
            const cloudCh = cloudChapters.find((c: any) => c.id === defaultCh.id);
            const localCh = prev.academicChapters.find(c => c.id === defaultCh.id);
            let localTimestamp = localCh?._timestamp || 0;
            try {
              const checklistRaw = localStorage.getItem(`byd_chapter_${defaultCh.id}_checklist`);
              if (checklistRaw) {
                 const parsed = JSON.parse(checklistRaw);
                 if (parsed._timestamp) localTimestamp = Math.max(localTimestamp, parsed._timestamp);
              }
            } catch(e) {}
            const cloudTimestamp = cloudCh?._timestamp || 0;
            if (localTimestamp > cloudTimestamp) return localCh || defaultCh;
            if (cloudCh) return {
              id: cloudCh.id, subject_id: cloudCh.subject_id, chapter_name: cloudCh.chapter_name,
              is_weak: cloudCh.is_weak ?? (localCh?.is_weak ?? false), is_important: cloudCh.is_important ?? (localCh?.is_important ?? false),
              is_active: cloudCh.is_active ?? (localCh?.is_active ?? true), read_textbook: cloudCh.read_textbook ?? (localCh?.read_textbook ?? false),
              watch_class: cloudCh.watch_class ?? (localCh?.watch_class ?? false), practice_problems: cloudCh.practice_problems ?? (localCh?.practice_problems ?? false),
              make_notes: cloudCh.make_notes ?? (localCh?.make_notes ?? false), resources: Array.isArray(cloudCh.resources) ? cloudCh.resources : (localCh?.resources ?? []),
              _timestamp: cloudCh._timestamp || 0
            };
            return localCh || defaultCh;
          });
          next.academicChapters = mergedChapters;
          next.academicSubjects = calculateAllSubjectsProgress(mergedChapters, userId);
        }

        next.isSyncing = false;
        next.lastResetDate = today;
        next.lastSyncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        setTimeout(() => {
          try {
            const { currentTime, currentDate, lastSyncTime, ...pState } = next;
            localStorage.setItem('blockYourDopamineState', safeStringify(pState));
            localStorage.setItem('last_focus_data', safeStringify({
              totalNetFocusTime: next.totalNetFocusTime,
              dailyTotalFocusTime: next.dailyTotalFocusTime,
              dailySessions: next.dailySessions,
              detoxPercent: next.detoxPercent,
              timestamp: Date.now()
            }));
          } catch (e) {}
        }, 0);

        return next;
      });
    } catch (error) {
      logger.error("Master Sync failed:", error);
      setState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [state.user?.id, state.academicChapters, state.syncQueue, processSyncQueue]);

  const syncData = masterSync;
  const fetchUserData = masterSync;

  // BYD Offline Protocol: Automatic Background Sync Listener
  useEffect(() => {
    const handleOnline = () => {
      logger.log("BYD Offline Protocol: Internet connection established. Starting background sync...");
      syncOfflineQueue();
      processSyncQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOfflineQueue, processSyncQueue]);

  // Background Sync: Every 5 minutes
  useEffect(() => {
    if (!state.user) return;
    
    // Real-time listener for focus_logs
    const channel = supabase
      .channel('focus_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'focus_logs',
          filter: `user_id=eq.${state.user.id}`
        },
        (payload) => {
          logger.log('New session detected via real-time:', payload);
          // Re-fetch focus data to ensure accuracy
          masterSync();
        }
      )
      .subscribe();

    const syncInterval = setInterval(() => {
      // logger.log("Auto-syncing data in background...");
      masterSync();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
    };
  }, [state.user?.id, masterSync]);

  // Window Focus & Visibility Revalidation (SWR Pattern)
  useEffect(() => {
    if (!state.user) return;

    let lastRevalidate = 0;
    const REVALIDATE_COOLDOWN = 10000; // 10 seconds cooldown to prevent spam

    const handleRevalidate = () => {
      const now = Date.now();
      if (now - lastRevalidate < REVALIDATE_COOLDOWN) return;

      if (document.visibilityState === 'visible') {
        logger.log("BYD Protocol: Window visibility change - triggering background sync...");
        masterSync();
        lastRevalidate = now;
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRevalidate < REVALIDATE_COOLDOWN) return;

      logger.log("BYD Protocol: Window focused - triggering background sync...");
      masterSync();
      lastRevalidate = now;
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [state.user?.id, masterSync]);

  // Isolated Clock State to prevent full-app re-renders on every minute update
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return {
      currentTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      currentDate: getLocalDateString(now),
      lastSyncTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  });

  const isManualExitRef = useRef(false);
  const isSessionDistractedRef = useRef(false);

  // Sync ref with state
  useEffect(() => {
    isSessionDistractedRef.current = state.isSessionDistracted;
  }, [state.isSessionDistracted]);

  // Distraction Logic
  useEffect(() => {
    const isUrlSafe = (url: string) => {
      if (!url || typeof url !== 'string') return false;
      const safeDomains = ['notebooklm.google.com', 'youtube.com', 'youtu.be'];
      try {
        const hostname = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
        // Check hardcoded safe domains
        if (safeDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
          return true;
        }
        // Check against current session resources
        const savedSession = localStorage.getItem('current_session_tabs');
        if (savedSession) {
          const resources = JSON.parse(savedSession);
          return resources.some((res: any) => {
            try {
              if (!res?.url) return false;
              const resHostname = new URL(res.url.startsWith('http') ? res.url : 'https://' + res.url).hostname;
              return hostname === resHostname || hostname.endsWith('.' + resHostname);
            } catch {
              return false;
            }
          });
        }
      } catch (e) {
        return false;
      }
      return false;
    };

    const handleDistractionStart = (e?: Event) => {
      if (!state.isFocusing || state.sessionTimeLeft <= 0) return;
      
      const isWindowBlur = e?.type === 'blur';
      
      const checkAndTrigger = () => {
        // If it's a window blur, check if we're focused on an iframe (like YouTube)
        if (isWindowBlur && document.activeElement?.tagName === 'IFRAME') {
          const iframe = document.activeElement as HTMLIFrameElement;
          if (isUrlSafe(iframe.src)) {
            return; // Safe resource
          }
        }

        // Check if we just opened a safe window (we can't easily check focus of other windows, 
        // but we can assume if the user just clicked a safe resource link, it's fine)
        if (localStorage.getItem('isInteractingWithSafeResource') === 'true') {
          return;
        }

        if (!isSessionDistractedRef.current) {
          setIsSessionDistracted(true);
        }
      };

      if (isWindowBlur) {
        // Small delay needed for activeElement to update when clicking an iframe
        setTimeout(checkAndTrigger, 100);
      } else {
        checkAndTrigger();
      }
    };

    const handleDistractionEnd = () => {
      localStorage.removeItem('isInteractingWithSafeResource');
      if (isSessionDistractedRef.current) {
        setIsSessionDistracted(false);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleDistractionStart();
      } else {
        // Only stop distraction if the window is also focused
        if (document.hasFocus()) {
          handleDistractionEnd();
        }
      }
    };

    window.addEventListener("blur", handleDistractionStart, { passive: true });
    window.addEventListener("focus", handleDistractionEnd, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

    // Initial check: if the app starts in the background or blurred
    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      handleDistractionStart();
    }

    return () => {
      window.removeEventListener("blur", handleDistractionStart);
      window.removeEventListener("focus", handleDistractionEnd);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [state.isFocusing, state.sessionTimeLeft]);

  // Central Time Engine: Background Monitoring
  const checkResetRef = useRef<() => void>();

  useEffect(() => {
    const checkReset = () => {
      const now = new Date();
      const dateStr = getLocalDateString(now);
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      
      setClock(prev => {
        if (prev.currentTime === timeStr && prev.currentDate === dateStr) {
          return prev;
        }
        return {
          currentTime: timeStr,
          currentDate: dateStr,
          lastSyncTime: timeStr
        };
      });

      setState(prev => {
        // Ghost Clock Sync: Detect Date Transition (Midnight)
        if (prev.currentDate !== dateStr) {
          if (prev.syncQueue && prev.syncQueue.length > 0) {
            logger.log("Central Time Engine: Date transition detected, but sync queue is not empty. Deferring reset...");
            // Trigger sync, will check again next minute
            triggerSync();
            return prev;
          }
          logger.log("Central Time Engine: Date transition detected. Triggering Ghost Clock Reset...");
          return performDailyReset(prev, dateStr, timeStr);
        }
        return prev;
      });
    };

    checkResetRef.current = checkReset;

    // Initial check on mount
    checkReset();

    let timeEngine: NodeJS.Timeout | null = null;
    
    if (!state.isFocusing) {
      timeEngine = setInterval(() => checkResetRef.current?.(), 60000); // Check every minute
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.isFocusing) {
        logger.log("App became active. Checking Ghost Clock...");
        checkResetRef.current?.();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange, { passive: true });

    return () => {
      if (timeEngine) clearInterval(timeEngine);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isFocusing]);

  // Auth Listener (Mock)
  useEffect(() => {
    const savedAuth = localStorage.getItem('blockYourDopamineAuth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setState(prev => ({ 
          ...prev, 
          user: authData.user,
          profile: authData.profile
        }));
      } catch (e) {
        console.error("Failed to parse saved auth", e);
      }
    }
  }, []);

  // Throttled localStorage save to prevent performance issues during frequent updates
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saveToStorage = () => {
      try {
        // Optimization: Don't save transient UI state like currentTime to localStorage
        // This reduces the payload size and frequency of disk writes
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = state;
        localStorage.setItem('blockYourDopamineState', safeStringify(persistentState));
        lastSaveTimeRef.current = Date.now();
      } catch (e) {
        console.error("Failed to save state to localStorage", e);
      }
    };

    const now = Date.now();
    // Throttle: Save immediately if it's been more than 10 seconds, otherwise wait
    if (now - lastSaveTimeRef.current > 10000) {
      saveToStorage();
    } else {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(saveToStorage, 10000);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state]);

  // Persist Auth Data separately for consistency
  useEffect(() => {
    if (state.user || state.profile) {
      try {
        localStorage.setItem('blockYourDopamineAuth', safeStringify({ 
          user: state.user, 
          profile: state.profile 
        }));
      } catch (e) {
        console.error("Failed to save auth to localStorage", e);
      }
    }
  }, [state.user, state.profile]);

  const checkFocusBadges = (history: AppState['weeklyHistory'], currentUnlocked: string[]) => {
    const newUnlocked = new Set(currentUnlocked);
    let changed = false;

    const checkCondition = (weeks: number, minHours: number, minCompletion: number) => {
      if (history.length < weeks) return false;
      const relevantWeeks = history.slice(-weeks);
      return relevantWeeks.every(w => {
        const hours = w.netFocusTime / 3600;
        const completion = w.totalTasks > 0 ? (w.tasksCompleted / w.totalTasks) * 100 : 0;
        return hours >= minHours && completion >= minCompletion;
      });
    };

    // Badge: The Spark (1 week, 5h+)
    if (!newUnlocked.has('f1') && checkCondition(1, 5, 0)) {
      newUnlocked.add('f1');
      changed = true;
    }
    // Badge: Neural Flow (1 week, 5h+, 20%)
    if (!newUnlocked.has('f2') && checkCondition(1, 5, 20)) {
      newUnlocked.add('f2');
      changed = true;
    }
    // Badge: Deep Diver (2 weeks, 6h+, 40%)
    if (!newUnlocked.has('f3') && checkCondition(2, 6, 40)) {
      newUnlocked.add('f3');
      changed = true;
    }
    // Badge: The Architect (2 weeks, 8h+, 60%)
    if (!newUnlocked.has('f4') && checkCondition(2, 8, 60)) {
      newUnlocked.add('f4');
      changed = true;
    }
    // Badge: Unstoppable (3 weeks, 10h+, 80%)
    if (!newUnlocked.has('f5') && checkCondition(3, 10, 80)) {
      newUnlocked.add('f5');
      changed = true;
    }
    // Badge: Apex Focus (3 weeks, 11h+, 90%)
    if (!newUnlocked.has('f6') && checkCondition(3, 11, 90)) {
      newUnlocked.add('f6');
      changed = true;
    }

    if (changed) {
      setState(prev => ({
        ...prev,
        unlockedBadgeIds: Array.from(newUnlocked),
        notifications: [
          {
            id: generateId(),
            title: "New Badge Unlocked!",
            message: "You've earned a new Focus badge. Check your showroom.",
            time: "Just now"
          },
          ...prev.notifications
        ]
      }));
    }
  };

  const logActivity = () => {
    const now = new Date().toISOString();
    setState(prev => {
      const newHealth = { ...prev.badgeHealth };
      
      // Refill health for equipped Health and Focus badges
      prev.equippedBadges.forEach(id => {
        if (!id) return;
        const badge = BADGES.find(b => b.id === id);
        if (badge && (badge.category === 'Health' || badge.category === 'Focus')) {
          newHealth[id] = 100;
        }
      });

      return {
        ...prev,
        lastActivityTimestamp: now,
        badgeHealth: newHealth
      };
    });
  };

  const performDailyReset = (prev: AppState, today: string, timeStr: string): AppState => {
    if (prev.lastResetDate === today) return prev;

    const now = new Date();
    const lastActivity = new Date(prev.lastActivityTimestamp);
    const diffTime = Math.abs(now.getTime() - lastActivity.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let newUnlockedIds = [...prev.unlockedBadgeIds];
    let newEquipped = [...prev.equippedBadges];
    let newHealth = { ...prev.badgeHealth };

    // Only decrease health if a full day has passed without activity
    if (diffDays >= 1) {
      prev.equippedBadges.forEach((id, index) => {
        if (!id) return;
        const badge = BADGES.find(b => b.id === id);
        if (badge && (badge.category === 'Health' || badge.category === 'Focus')) {
          const currentHealth = prev.badgeHealth[id] ?? 100;
          const healthDecrease = (1 / 7) * 100;
          const updatedHealth = Math.max(0, currentHealth - healthDecrease);
          
          newHealth[id] = updatedHealth;

          if (updatedHealth <= 0) {
            newUnlockedIds = newUnlockedIds.filter(bid => bid !== id);
            newEquipped[index] = null;
          }
        }
      });
    }

    // Weekly History Update (Check if it's Sunday or 7 days passed)
    let newWeeklyHistory = [...prev.weeklyHistory];
    const lastResetDateObj = new Date(prev.lastResetDate);
    const isNewWeek = lastResetDateObj.getDay() === 0 && now.getDay() !== 0; // Simple Sunday check

    if (isNewWeek || prev.weeklyHistory.length === 0) {
      const currentWeekStats = {
        netFocusTime: prev.totalNetFocusTime,
        tasksCompleted: prev.tasksCompleted,
        totalTasks: prev.tasks.length
      };
      newWeeklyHistory.push(currentWeekStats);
      if (newWeeklyHistory.length > 5) newWeeklyHistory.shift();
    } else if (newWeeklyHistory.length > 0) {
      const lastIdx = newWeeklyHistory.length - 1;
      newWeeklyHistory[lastIdx] = {
        netFocusTime: newWeeklyHistory[lastIdx].netFocusTime + prev.totalNetFocusTime,
        tasksCompleted: newWeeklyHistory[lastIdx].tasksCompleted + prev.tasksCompleted,
        totalTasks: newWeeklyHistory[lastIdx].totalTasks + prev.tasks.length
      };
    } else {
      newWeeklyHistory = [{
        netFocusTime: prev.totalNetFocusTime,
        tasksCompleted: prev.tasksCompleted,
        totalTasks: prev.tasks.length
      }];
    }

    // Check badges after updating history
    setTimeout(() => checkFocusBadges(newWeeklyHistory, prev.unlockedBadgeIds), 100);

    // Clear any active session from previous day
    localStorage.removeItem('current_session');
    localStorage.removeItem('distraction_start_time');

    // Streak Reset Logic (Grace Period)
    // Daily Reset Logic: Disabled to prevent streak loss as requested
    /*
    const yesterday = getYesterdayDateString();
    let newStreak = prev.streak;
    if (prev.lastStreakDate && prev.lastStreakDate !== today && prev.lastStreakDate !== yesterday) {
      // Soft reset logic moved or disabled
    }
    */
    const newStreak = prev.streak;

    return {
      ...prev,
      lastResetDate: today,
      currentDate: today,
      lastSyncTime: timeStr,
      streak: newStreak,
      totalNetFocusTime: 0,
      dailyTotalFocusTime: 0,
      dailySessions: 0,
      tasksCompleted: 0,
      physicalFitness: 0,
      detoxPercent: 100,
      sessionScores: [],
      hydrationIntake: 0,
      sleepHours: 0,
      sleepSessions: 0,
      steps: 0,
      consumedCalories: 0,
      screenTimeHours: 0,
      screenTimeMinutes: 0,
      unlockedBadgeIds: newUnlockedIds,
      equippedBadges: newEquipped,
      badgeHealth: newHealth,
      daysActive: prev.daysActive + 1,
      tasks: prev.tasks.filter(task => {
        if (!task.date) return true;
        const taskDate = new Date(task.date);
        const currentDate = new Date(today);
        return taskDate >= currentDate;
      })
    };
  };

  const handleDailyReset = () => {
    const now = new Date();
    const today = getLocalDateString(now);
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setState(prev => performDailyReset(prev, today, timeStr));
  };

  const getRequiredXP = (level: number) => {
    if (level <= 1) return 100;
    if (level === 2) return 150;
    return 300 * Math.pow(2, level - 3);
  };

  const addXP = (amount: number) => {
    logActivity();
    setState(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      
      while (newXP >= getRequiredXP(newLevel)) {
        newXP -= getRequiredXP(newLevel);
        newLevel += 1;
      }

      return { 
        ...prev, 
        xp: newXP, 
        level: newLevel,
        weeklyRank: newLevel > 1 ? "---" : "N/A",
        globalRank: newLevel > 1 ? "---" : "N/A",
        topSkill: prev.focusTime > 300 ? "Focus" : prev.topSkill
      };
    });
  };

  const incrementTasks = () => {
    logActivity();
    setState(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
    addXP(10); // 10 XP per task
  };

  const addFitness = (amount: number) => {
    logActivity();
    setState(prev => ({ ...prev, physicalFitness: Math.min(200, prev.physicalFitness + amount) }));
    addXP(5);
  };

  const toggleFocus = () => {
    setState(prev => ({ ...prev, isFocusing: !prev.isFocusing }));
  };

  const startFocusSession = (durationMinutes: number, subjectId?: string) => {
    if (durationMinutes <= 0) {
      console.warn("Cannot start session: Duration must be greater than 0.");
      return;
    }
    localStorage.removeItem('distraction_start_time');
    localStorage.removeItem('current_session');
    localStorage.removeItem('pending_session'); // Clear any old pending session
    isManualExitRef.current = false;
    const startTime = new Date().toISOString();

    // Aggregating resources if subjectId is provided
    let sessionResources: ChapterResource[] = [];
    if (subjectId) {
      const subjectChapters = state.academicChapters.filter(c => c.subject_id === subjectId);
      sessionResources = subjectChapters.flatMap(c => c.resources || []);
    }

    setState(prev => ({ 
      ...prev, 
      isFocusing: true, 
      currentSessionDuration: durationMinutes,
      currentSessionId: generateId(),
      currentSubjectId: subjectId || null,
      currentSessionResources: sessionResources,
      currentSessionStartTime: startTime,
      isManualExit: false,
      sessionTimeLeft: durationMinutes * 60,
      sessionDistractionTime: 0,
      isSessionDistracted: false
    }));
  };

  const saveSessionFragment = async (netFocusTime: number, totalAttemptedTime: number) => {
    if (!state.user || !state.currentSessionStartTime) return;

    const safeNetFocus = Number.isFinite(netFocusTime) ? netFocusTime : 0;
    const safeTotalAttempted = Number.isFinite(totalAttemptedTime) ? totalAttemptedTime : 0;
    const sessionScore = safeTotalAttempted > 0 
      ? Math.round((safeNetFocus / safeTotalAttempted) * 10000) / 100 
      : 100;

    const fragmentData = {
      user_id: state.user.id,
      session_id: state.currentSessionId,
      session_duration: Math.floor(safeTotalAttempted),
      net_focus_seconds: Math.floor(safeNetFocus),
      total_session_seconds: Math.floor(safeTotalAttempted),
      growth_percentage: Math.round(sessionScore),
      start_time: state.currentSessionStartTime,
      is_draft: true
    };

    // LocalStorage Backup (Primary)
    localStorage.setItem('pending_session', safeStringify(fragmentData));

    // Supabase Sync (Background Draft)
    try {
      const { error } = await supabase
        .from('focus_logs')
        .upsert(fragmentData, { onConflict: 'session_id' });
      
      if (!error) {
        console.log("Session fragment (Draft) synced to Supabase.");
      }
    } catch (err) {
      logger.error("Failed to sync draft to Supabase:", err);
    }
  };

  const endFocusSession = async (netFocusTime: number, totalAttemptedTime: number, resourceUsed?: string) => {
    if (!isManualExitRef.current) {
      logger.warn("Attempted to end session without manual exit trigger. Blocked.");
      return;
    }
    // NaN Guards & Absolute Math Support
    let safeNetFocus = Number.isFinite(netFocusTime) ? Math.max(0, netFocusTime) : 0;
    let safeTotalAttempted = Number.isFinite(totalAttemptedTime) ? Math.max(0, totalAttemptedTime) : 0;

    // Validation Guard: Check if we have a better backup in localStorage
    try {
      const pendingSession = localStorage.getItem('pending_session');
      if (pendingSession) {
        const parsed = JSON.parse(pendingSession);
        // If the backup has the same ID but a LONGER duration, use it (prevents truncation)
        if (parsed.session_id === state.currentSessionId && parsed.session_duration > safeTotalAttempted) {
          logger.warn(`Validation Guard: Local storage backup has longer duration (${parsed.session_duration}s) than current session (${safeTotalAttempted}s). Using backup to prevent truncation.`);
          safeTotalAttempted = parsed.session_duration;
          safeNetFocus = parsed.net_focus_seconds || parsed.net_focus_time || safeNetFocus;
        }
      }
    } catch (e) {
      logger.error("Validation Guard Error:", e);
    }

    logActivity();
    
    // The Detox Formula: Hardcoded as requested
    const sessionScore = safeTotalAttempted > 0 
      ? Math.round((safeNetFocus / safeTotalAttempted) * 10000) / 100 
      : 100;

    // 1. OPTIMISTIC UI & State Cleanup
    let computedNewStreak = 0;
    
    setState(prev => {
      const newDailyNet = Math.trunc(prev.totalNetFocusTime + safeNetFocus);
      const newDailyTotal = Math.trunc(prev.dailyTotalFocusTime + safeTotalAttempted);
      
      const earnedXP = Math.floor(safeNetFocus / 60);
      let newXP = prev.xp + earnedXP;
      let newLevel = prev.level;
      
      while (newXP >= getRequiredXP(newLevel)) {
        newXP -= getRequiredXP(newLevel);
        newLevel += 1;
      }

      // Clear all local states to prevent '0m 00s' freeze
      try {
        localStorage.removeItem('current_session');
        localStorage.removeItem('distraction_start_time');
        localStorage.removeItem('isInteractingWithSafeResource');
        localStorage.removeItem('current_session_tabs');
        localStorage.removeItem('current_session_active_tab');
        localStorage.removeItem('current_session_resource_states');
        localStorage.removeItem('isDistracted');
        localStorage.removeItem('startTime');
        localStorage.removeItem('isManualExit');
      } catch (e) {
        logger.error("Failed to clear session from localStorage", e);
      }

      const today = getLocalDateString(new Date());
      const isNewStreakDay = prev.lastStreakDate !== today;
      const newStreak = isNewStreakDay ? prev.streak + 1 : prev.streak;
      computedNewStreak = newStreak;

      const newState = {
        ...prev,
        isFocusing: false,
        currentSessionDuration: 0,
        currentSessionId: null,
        currentSubjectId: null,
        currentSessionResources: [],
        totalNetFocusTime: newDailyNet,
        dailyTotalFocusTime: newDailyTotal,
        dailySessions: prev.dailySessions + 1,
        detoxPercent: newDailyTotal > 0 ? Math.round((newDailyNet / newDailyTotal) * 10000) / 100 : 100,
        sessionScores: [...prev.sessionScores, sessionScore],
        focusTime: prev.focusTime + safeTotalAttempted,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        lastStreakDate: today,
        consecutiveMissedDays: 0
      };

      // Persistent save BEFORE background sync
      try {
        const { currentTime, currentDate, lastSyncTime, ...persistentState } = newState;
        localStorage.setItem('blockYourDopamineState', safeStringify(persistentState));
      } catch (e) {}

      return newState;
    });

    // 2. Silent Background Sync Execution
    const startIso = state.currentSessionStartTime || new Date(Date.now() - (safeTotalAttempted * 1000)).toISOString();
    const finalSessionData = {
      user_id: state.user?.id,
      session_id: state.currentSessionId,
      total_duration: Math.floor(safeTotalAttempted),
      net_focus_time: Math.floor(safeNetFocus),
      distraction_time: Math.floor(safeTotalAttempted - safeNetFocus),
      detox_score: parseFloat(sessionScore.toFixed(2)),
      start_time: startIso
    };

    const finalStreakData = {
      user_id: state.user?.id,
      streak_count: computedNewStreak,
      last_streak_date: getLocalDateString(new Date()),
      consecutive_missed_days: 0,
      season_start_date: state.streakSeasonStartDate
    };

    if (state.user) {
      // Trigger inserts immediately in background
      const sessionsItem = {
        table: 'sessions',
        data: finalSessionData,
        session_id: state.currentSessionId
      };
      
      const streaksItem = {
        table: 'user_streaks',
        data: finalStreakData,
        onConflict: 'user_id'
      };
      
      // Add to offline queue
      const currentOfflineQueue = getOfflineQueue();
      saveOfflineQueue([...currentOfflineQueue, sessionsItem, streaksItem]);

      if (navigator.onLine) {
        // Await sync sessions to ensure dashboard triggers after DB updates
        try {
          const { error } = await supabase.from('sessions').upsert(finalSessionData, { onConflict: 'session_id' });
          if (!error) localStorage.removeItem('pending_session');
          await supabase.from('user_streaks').upsert(finalStreakData, { onConflict: 'user_id' });
        } catch(err) {
          logger.error("Error syncing final session", err);
        }
      }
    }
  };

  const cancelFocusSession = () => {
    if (!isManualExitRef.current) {
      logger.warn("Attempted to cancel session without manual exit trigger. Blocked.");
      return;
    }
    localStorage.removeItem('current_session');
    localStorage.removeItem('distraction_start_time');
    localStorage.removeItem('isInteractingWithSafeResource');
    isManualExitRef.current = false;
    setState(prev => ({
      ...prev,
      isFocusing: false,
      currentSessionDuration: 0,
      currentSessionId: null,
      currentSubjectId: null,
      currentSessionResources: [],
      isManualExit: false
    }));
  };

  const setIsManualExit = (val: boolean) => {
    isManualExitRef.current = val;
    setState(prev => ({ ...prev, isManualExit: val }));
  };

  const setSessionTimeLeft = (time: number) => {
    setState(prev => {
      return { ...prev, sessionTimeLeft: time };
    });
  };

  const setSessionDistractionTime = (time: number) => {
    setState(prev => {
      return { ...prev, sessionDistractionTime: time };
    });
  };

  const setIsSessionDistracted = (isDistracted: boolean) => {
    setState(prev => ({ ...prev, isSessionDistracted: isDistracted }));
  };

  const updateDetox = (amount: number) => {
    logActivity();
    const addedSeconds = Math.trunc((amount / 100) * (state.dailyGoalHours * 3600));
    
    setState(prev => {
      const newDailyNet = Math.trunc(prev.totalNetFocusTime + addedSeconds);
      const newDailyTotal = Math.trunc(prev.dailyTotalFocusTime + addedSeconds);
      const newDetoxPercent = newDailyTotal > 0 
        ? Math.round((newDailyNet / newDailyTotal) * 10000) / 100 
        : 100;
      return { ...prev, totalNetFocusTime: newDailyNet, dailyTotalFocusTime: newDailyTotal, detoxPercent: newDetoxPercent, focusTime: prev.focusTime + addedSeconds };
    });

    if (state.user) {
      const logId = generateId();
      addToSyncQueue({
        table: 'focus_logs',
        type: 'upsert',
        key: logId,
        data: {
          id: logId,
          user_id: state.user.id,
          start_time: new Date().toISOString(),
          session_duration: Math.round(addedSeconds / 60),
          growth_percentage: amount
        }
      });
    }
    
    addXP(2);
  };

  const setDailyGoalHours = (hours: number) => {
    setState(prev => ({ ...prev, dailyGoalHours: hours }));
    
    if (state.user) {
      addToSyncQueue({
        table: 'user_preferences',
        type: 'upsert',
        onConflict: 'user_id',
        key: `goal_${state.user.id}`,
        data: {
          user_id: state.user.id,
          daily_focus_goal_minutes: Math.round(hours * 60)
        }
      });
    }
  };

  const addResource = (resource: Resource) => {
    setState(prev => {
      const newResources = [...prev.resources, resource];
      localStorage.setItem('byd_study_resources', safeStringify(newResources));
      return { ...prev, resources: newResources };
    });
    
    if (state.user) {
      addToSyncQueue({
        table: 'resources',
        type: 'upsert',
        key: resource.id,
        data: {
          id: resource.id,
          user_id: state.user.id,
          type: resource.type,
          title: resource.title,
          url: resource.url
        }
      });
    }
  };

  const updateResource = (id: string, updates: Partial<Resource>) => {
    setState(prev => {
      const newResources = prev.resources.map(r => r.id === id ? { ...r, ...updates } : r);
      localStorage.setItem('byd_study_resources', safeStringify(newResources));
      return { ...prev, resources: newResources };
    });

    if (state.user) {
      addToSyncQueue({
        table: 'resources',
        type: 'update',
        id: id,
        data: updates
      });
    }
  };

  const removeResource = (id: string) => {
    setState(prev => {
      const newResources = prev.resources.filter(r => r.id !== id);
      localStorage.setItem('byd_study_resources', safeStringify(newResources));
      return { ...prev, resources: newResources };
    });

    if (state.user) {
      addToSyncQueue({
        table: 'resources',
        type: 'delete',
        id: id
      });
    }
  };

  const updateGender = (gender: string) => {
    setState(prev => ({ ...prev, gender }));
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setState(prev => ({ ...prev, notificationsEnabled: enabled }));
  };

  const deleteNotification = (id: string) => {
    setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
  };

  const clearAllNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  const updateHydration = (amount: number) => {
    if (amount > 50) return; // Unrealistic validation
    logActivity();
    setState(prev => ({ ...prev, hydrationIntake: amount }));
    
    if (state.user) {
      const today = getLocalDateString(new Date());
      addToSyncQueue({
        table: 'health_logs',
        type: 'upsert',
        onConflict: 'user_id,entry_date',
        key: `hydration_${state.user.id}_${today}`,
        data: {
          user_id: state.user.id,
          entry_date: today,
          hydration: amount
        }
      });
    }
  };

  const updateSleep = (hours: number, sessionDelta: number = 0) => {
    if (hours > 24) return; // Unrealistic validation
    logActivity();
    setState(prev => {
      const newSessions = Math.max(0, prev.sleepSessions + sessionDelta);
      
      if (state.user) {
        const today = getLocalDateString(new Date());
        addToSyncQueue({
          table: 'health_logs',
          type: 'upsert',
          onConflict: 'user_id,entry_date',
          key: `sleep_${state.user.id}_${today}`,
          data: {
            user_id: state.user.id,
            entry_date: today,
            sleep_hours: hours,
            sleep_sessions: newSessions
          }
        });
      }

      return { 
        ...prev, 
        sleepHours: hours,
        sleepSessions: newSessions
      };
    });
  };

  const updateSteps = (steps: number) => {
    if (steps > 100000) return; // Unrealistic validation
    logActivity();
    setState(prev => ({ ...prev, steps }));
    
    if (state.user) {
      const today = getLocalDateString(new Date());
      addToSyncQueue({
        table: 'health_logs',
        type: 'upsert',
        onConflict: 'user_id,entry_date',
        key: `steps_${state.user.id}_${today}`,
        data: {
          user_id: state.user.id,
          entry_date: today,
          steps: steps
        }
      });
    }
  };

  const updateCalories = (calories: number, bypass: boolean = false) => {
    if (!bypass && calories > 5000) return; // Unrealistic validation
    logActivity();
    setState(prev => ({ ...prev, consumedCalories: calories }));
    
    if (state.user) {
      const today = getLocalDateString(new Date());
      addToSyncQueue({
        table: 'health_logs',
        type: 'upsert',
        onConflict: 'user_id,entry_date',
        key: `calories_${state.user.id}_${today}`,
        data: {
          user_id: state.user.id,
          entry_date: today,
          calories: calories
        }
      });
    }
  };

  const updateScreenTime = (hours: number, minutes: number) => {
    setState(prev => ({ ...prev, screenTimeHours: hours, screenTimeMinutes: minutes }));
    
    if (state.user) {
      const today = getLocalDateString(new Date());
      addToSyncQueue({
        table: 'health_logs',
        type: 'upsert',
        onConflict: 'user_id,entry_date',
        key: `screentime_${state.user.id}_${today}`,
        data: {
          user_id: state.user.id,
          entry_date: today,
          screen_time_minutes: (hours * 60) + minutes
        }
      });
    }
  };

  const updateHealthTargets = (targets: HealthTargets) => {
    setState(prev => ({ ...prev, healthTargets: targets }));
    
    if (state.user) {
      addToSyncQueue({
        table: 'user_preferences',
        type: 'upsert',
        onConflict: 'user_id',
        key: `health_targets_${state.user.id}`,
        data: {
          user_id: state.user.id,
          daily_calorie_goal: Number(targets.calories) || 2000,
          daily_step_goal: Number(targets.footsteps) || 10000
        }
      });
    }
  };

  const updateProfile = (profileData: Partial<NonNullable<AppState['profile']>>) => {
    if (!state.user) return;

    // Update local state immediately
    setState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...profileData } : { fullName: '', ...profileData } as any,
      gender: profileData.gender || prev.gender
    }));

    // Update Supabase via queue
    addToSyncQueue({
      table: 'profiles',
      type: 'upsert',
      onConflict: 'id',
      key: `profile_${state.user.id}`,
      data: {
        id: state.user.id,
        full_name: profileData.fullName,
        institution: profileData.institution,
        class: profileData.class,
        subject_group: profileData.subjectGroup,
        year: profileData.year,
        gender: profileData.gender,
        updated_at: new Date().toISOString()
      }
    });
  };

  const updateMood = (text: string, emoji: string) => {
    if (!state.user) return;
    
    setState(prev => ({ ...prev, latestMood: { text, emoji } }));
    
    const moodId = generateId();
    addToSyncQueue({
      table: 'mood_entries',
      type: 'upsert',
      key: moodId,
      data: {
        id: moodId,
        user_id: state.user.id,
        note: text,
        mood_type: emoji,
        timestamp: new Date().toISOString()
      }
    });
  };

  const updateMacros = (protein: number, carbs: number, fats: number, calories?: number) => {
    if (!state.user) return;
    const today = getLocalDateString(new Date());
    
    setState(prev => {
      const nextState = { ...prev, macros: { protein, carbs, fats } };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        console.error("Macros persistence failed", e);
      }

      return nextState;
    });

    addToSyncQueue({
    table: 'macro_data',
    type: 'upsert',
    onConflict: 'user_id,entry_date',
    key: `macros_${state.user.id}_${today}`,
    data: {
      user_id: state.user.id,
      entry_date: today,
      protein,
      carbs,
      fats,
      ...(calories !== undefined ? { calories } : {})
    }
  });
};

  const updateGeminiApiKey = async (key: string | null) => {
    setState(prev => ({ ...prev, geminiApiKey: key }));
    
    if (key) {
      localStorage.setItem('byd_user_gemini_key', key);
    } else {
      localStorage.removeItem('byd_user_gemini_key');
    }

    if (state.user) {
      addToSyncQueue({
        table: 'profiles',
        type: 'upsert',
        onConflict: 'id',
        key: `profile_key_${state.user.id}`,
        data: {
          id: state.user.id,
          gemini_api_key: key,
          updated_at: new Date().toISOString()
        }
      });
    }
  };

  const addTask = (task: Task) => {
    logActivity();
    
    // Update local state immediately
    setState(prev => {
      const nextState = { ...prev, tasks: [...prev.tasks, task] };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        console.error("Task add persistence failed", e);
      }

      return nextState;
    });

    if (state.user) {
      addToSyncQueue({
        table: 'planner_tasks',
        type: 'upsert',
        key: task.id,
        data: {
          id: task.id,
          user_id: state.user.id,
          title: task.title,
          category: task.category,
          date: task.date,
          time: task.time,
          priority: task.priority,
          status: task.status
        }
      });
    }
  };

  const deleteTask = (id: string) => {
    // Update local state immediately
    setState(prev => {
      const nextState = { ...prev, tasks: prev.tasks.filter(t => t.id !== id) };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        console.error("Task delete persistence failed", e);
      }

      return nextState;
    });

    if (state.user) {
    addToSyncQueue({
      table: 'planner_tasks',
      type: 'delete',
      id: id
    });
  }
};

  const updateTaskStatus = (id: string, status: Status) => {
    logActivity();
    
    // Update local state immediately
    setState(prev => {
      const nextState = {
        ...prev,
        tasks: prev.tasks.map(t => t.id === id ? { ...t, status } : t)
      };

      try {
        const { currentTime, currentDate, lastSyncTime, isSyncing, ...persistentState } = nextState;
        localStorage.setItem('blockYourDopamineState', safeStringify({ ...persistentState, _timestamp: Date.now() }));
      } catch (e) {
        console.error("Task update persistence failed", e);
      }

      return nextState;
    });

    if (state.user) {
    addToSyncQueue({
      table: 'planner_tasks',
      type: 'update',
      id: id,
      data: { status }
    });
  }
};

  const equipBadge = (badgeId: string) => {
    setState(prev => {
      // Find the badge to get its category
      const badge = BADGES.find(b => b.id === badgeId);
      if (!badge) return prev;

      const newEquipped = [...prev.equippedBadges];
      const currentIndex = newEquipped.indexOf(badgeId);

      // If already equipped, unequip it
      if (currentIndex !== -1) {
        newEquipped[currentIndex] = null;
        return { ...prev, equippedBadges: newEquipped };
      }

      if (badge.category === 'Health') {
        newEquipped[0] = badgeId;
      } else if (badge.category === 'Focus') {
        newEquipped[1] = badgeId;
      } else {
        // Special or any can go to slot 3
        newEquipped[2] = badgeId;
      }

      return { ...prev, equippedBadges: newEquipped };
    });
  };

  const login = (fullName: string, email: string) => {
    // This is now handled by Supabase Auth in AuthModal
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, user: null, profile: null, daysActive: 1 }));
  };

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const contextValue = React.useMemo(() => ({
    ...state,
    ...clock,
    addXP, 
    incrementTasks, 
    addFitness, 
    toggleFocus,
    startFocusSession,
    endFocusSession,
    cancelFocusSession,
    saveSessionFragment,
    setIsManualExit,
    setSessionTimeLeft,
    setSessionDistractionTime,
    setIsSessionDistracted,
    updateDetox,
    setDailyGoalHours,
    addResource,
    updateResource,
    removeResource,
    updateGender,
    setNotificationsEnabled,
    deleteNotification,
    clearAllNotifications,
    updateHydration,
    updateSleep,
    updateSteps,
    updateCalories,
    updateScreenTime,
    updateHealthTargets,
    updateProfile,
    updateMood,
    updateMacros,
    updateGeminiApiKey,
    addTask,
    deleteTask,
    updateTaskStatus,
    equipBadge,
    getRequiredXP,
    login,
    logout,
    handleDailyReset,
    syncData,
    syncOfflineQueue,
    updateAcademicProgress,
    updateAcademicSettings,
    updateChapterProgress,
    resetSyllabus,
    recalculateAllProgress: () => {
      setState(prev => ({
        ...prev,
        academicSubjects: calculateAllSubjectsProgress(prev.academicChapters, prev.user?.id)
      }));
    },
    addChapterResource,
    deleteChapterResource,
    modifyFocusTime,
    addNotification,
    isSupabaseConnected,
    connectionError
  }), [state, clock, isSupabaseConnected, connectionError]);

  // 3. HARD RESET / RECALCULATION ON MOUNT
  // This ensures that any inconsistent state from hydration or legacy versions is immediately corrected
  useEffect(() => {
    // Instant Reset Strategy: Run after next tick to ensure hydration is finished
    const timer = setTimeout(() => {
      if (state.academicChapters.length > 0) {
        // FORCE Deduplication AND ID Normalization
        const sanitizedChapters = Array.from(new Map(state.academicChapters.map(c => {
          // Ensure ID is a valid UUID
          const validId = isUUID(c.id) ? c.id : stringToUUID(String(c.id));
          return [validId, { ...c, id: validId }];
        })).values()) as AcademicChapter[];

        const recalculatedSubjects = calculateAllSubjectsProgress(sanitizedChapters, state.user?.id);
        
        // Strict Comparison: Check if normalized state differs from current state
        const existingIds = state.academicChapters.map(c => c.id).sort();
        const sanitizedIds = sanitizedChapters.map(c => c.id).sort();
        
        const hasStructuralDifference = 
          existingIds.length !== sanitizedIds.length || 
          existingIds.some((id, index) => id !== sanitizedIds[index]);

        const hasProgressDifference = recalculatedSubjects.some((s, i) => 
          s.progress !== (state.academicSubjects.find(sub => sub.id === s.id)?.progress ?? -1)
        );
        
        if (hasStructuralDifference || hasProgressDifference) {
          logger.log("[BYD SYNC] High Precision Hard Reset: Normalizing chapter IDs and progress denominator.");
          setState(prev => ({
            ...prev,
            academicChapters: sanitizedChapters,
            academicSubjects: recalculatedSubjects
          }));
        }
      }
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

export function useGhostClock() {
  const { currentTime, currentDate } = useApp();
  return { currentTime, currentDate };
}
