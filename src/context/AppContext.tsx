import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from "react";
import { BADGES, HSC_SYLLABUS } from "../constants";
import { supabase } from "../lib/supabase";
import { safeStringify, isUUID, generateId } from "../lib/utils";
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
  read_textbook: boolean;
  watch_class: boolean;
  practice_problems: boolean;
  make_notes: boolean;
  resources: ChapterResource[];
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
  syncQueue: any[];
  currentSessionStartTime: string | null;
  offlineSyncQueue: any[];
  
  // Academic Hub
  academicSubjects: AcademicSubject[];
  academicSettings: AcademicSettings;
  academicChapters: AcademicChapter[];
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
            console.error("Failed to parse last_focus_data", e);
          }
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
            console.error("Failed to parse byd_study_resources", e);
          }

          // Reliable Calculations: Detox = (Net Focus / Total Focus) * 100
          const parsedNet = parsed.totalNetFocusTime || 0;
          const parsedTotal = parsed.dailyTotalFocusTime || 0;
          const calculatedDetox = parsedTotal > 0 ? Math.round((parsedNet / parsedTotal) * 10000) / 100 : 100;

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
          tasks: parsed.tasks || [],
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
          syncQueue: (parsed.syncQueue || []).filter((item: any) => item && item.table),
          offlineSyncQueue: (parsed.offlineSyncQueue || []),
          currentSessionStartTime: parsed.currentSessionStartTime || null,
          isSyncing: false,
          resources: initialResources.length > 0 ? initialResources : (parsed.resources || []),
          academicSubjects: parsed.academicSubjects || [],
          academicSettings: parsed.academicSettings || { examDate: null, focusSubjectId: null },
          academicChapters: parsed.academicChapters || []
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    let initialFocus = {
      totalNetFocusTime: 0,
      dailyTotalFocusTime: 0,
      dailySessions: 0,
      detoxPercent: 0
    };

    if (lastFocusData) {
      try {
        const focusParsed = JSON.parse(lastFocusData);
        const focusDate = getLocalDateString(new Date(focusParsed.timestamp || 0));
        if (focusDate === today) {
          const parsedNet = focusParsed.totalNetFocusTime || 0;
          const parsedTotal = focusParsed.dailyTotalFocusTime || 0;
          const calculatedDetox = parsedTotal > 0 ? Math.round((parsedNet / parsedTotal) * 10000) / 100 : 100;
          
          initialFocus = {
            totalNetFocusTime: parsedNet,
            dailyTotalFocusTime: parsedTotal,
            dailySessions: focusParsed.dailySessions || 0,
            detoxPercent: calculatedDetox
          };
        }
      } catch (e) {
        console.error("Failed to parse last_focus_data in default state", e);
      }
    }

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
      syncQueue: [],
      offlineSyncQueue: [],
      currentSessionStartTime: null,
      academicSubjects: [],
      academicSettings: { examDate: null, focusSubjectId: null }
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
      console.log("Sync already in progress, skipping...");
      return;
    }

    isSyncingRef.current = true;
    const queue = [...state.syncQueue].filter(item => item && item.table);
    // Clear queue locally first (Optimistic)
    setState(prev => ({ ...prev, syncQueue: [] }));

    try {
      console.log(`Processing sync queue with ${queue.length} items...`);
      
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
            if (type === 'upsert') {
              return await supabase.from(table).upsert(data, { onConflict: item.onConflict || 'id' });
            } else if (type === 'insert') {
              return await supabase.from(table).insert(data);
            } else if (type === 'update') {
              return await supabase.from(table).update(data).eq('id', id);
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

        console.error("Sync errors detected:", errorMsgs);
        
        const containsFatal = errorMsgs.some(m => m.toLowerCase().includes("relation") || m.toLowerCase().includes("column") || m.toLowerCase().includes("not found") || m.toLowerCase().includes("constraint"));
        
        const combinedError = new Error(`Sync failed for ${errors.length} items. ${errorMsgs.join('; ')}`);
        (combinedError as any).isFatal = containsFatal;
        throw combinedError;
      }

      console.log("Sync queue completed successfully!");
      setState(prev => ({ 
        ...prev, 
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) 
      }));
    } catch (error: any) {
      console.error("Sync queue processing failed. Saving to localStorage for retry...", error);
      
      const isFatalError = error.isFatal || error.message?.toLowerCase().includes("relation") || error.message?.toLowerCase().includes("not found");
      const isLockError = error.message?.includes("Lock broken") || error.message?.includes("AbortError");
      
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
      const progressId = userId ? `${userId}_${subjectId}` : subjectId;

      newSyncQueue.push({
        table: 'academic_progress',
        type: 'upsert',
        data: { id: progressId, user_id: userId, progress },
        onConflict: 'id'
      });

      return { ...prev, academicSubjects: updatedSubjects, syncQueue: newSyncQueue };
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
          focus_subject_id: updatedSettings.focusSubjectId 
        },
        onConflict: 'user_id'
      });

      return { ...prev, academicSettings: updatedSettings, syncQueue: newSyncQueue };
    });
    triggerSync();
  }, [state.user?.id, triggerSync]);

  const updateChapterProgress = useCallback(async (chapterId: string, updates: Partial<AcademicChapter>) => {
    setState(prev => {
      // 1. Update the chapters list
      let updatedChapters = prev.academicChapters.map(c => 
        c.id === chapterId ? { ...c, ...updates } : c
      );
      
      let chapter = updatedChapters.find(c => c.id === chapterId);
      let isNew = false;

      if (!chapter) {
        isNew = true;
        chapter = {
          id: chapterId,
          subject_id: (updates as any).subject_id || '',
          chapter_name: (updates as any).chapter_name || '',
          is_weak: updates.is_weak || false,
          is_important: updates.is_important || false,
          read_textbook: updates.read_textbook || false,
          watch_class: updates.watch_class || false,
          practice_problems: updates.practice_problems || false,
          make_notes: updates.make_notes || false,
          resources: updates.resources || []
        };
        updatedChapters = [...prev.academicChapters, chapter];
      }

      // 2. Recalculate subject progress
      const subjectId = chapter.subject_id;
      const syllabusChapters = HSC_SYLLABUS[subjectId] || [];
      const totalCount = syllabusChapters.length;
      
      let updatedSubjects = prev.academicSubjects;
      const newSyncQueue = [...(prev.syncQueue || [])];

      if (totalCount > 0) {
        const completedCount = updatedChapters.filter(c => 
          c.subject_id === subjectId && 
          c.read_textbook && c.watch_class && c.practice_problems && c.make_notes
        ).length;
        
        const progress = Math.round((completedCount / totalCount) * 100);
        
        updatedSubjects = prev.academicSubjects.map(s => 
          s.id === subjectId ? { ...s, progress } : s
        );

        const userId = prev.user?.id;
        const progressId = userId ? `${userId}_${subjectId}` : subjectId;

        // Add progress update to sync queue
        newSyncQueue.push({
          table: 'academic_progress',
          type: 'upsert',
          data: { id: progressId, user_id: userId, progress },
          onConflict: 'id'
        });
      }

      // 3. Add chapter update to sync queue
      newSyncQueue.push({
        table: 'academic_chapters',
        type: 'upsert',
        data: { ...chapter, user_id: prev.user?.id },
        onConflict: 'id'
      });

      return { 
        ...prev, 
        academicChapters: updatedChapters, 
        academicSubjects: updatedSubjects,
        syncQueue: newSyncQueue 
      };
    });
    triggerSync();
  }, [state.user?.id, triggerSync]);

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

      return { ...prev, academicChapters: updatedChapters, syncQueue: newSyncQueue };
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

      return { ...prev, academicChapters: updatedChapters, syncQueue: newSyncQueue };
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
        
        if (item.table === 'sessions') {
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
          console.error(`Offline catch sync failed for ${item.table}:`, error);
          remainingQueue.push(item);
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`Offline sync exception for ${item.table}:`, e);
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
        localStorage.setItem('blockYourDopamineState', safeStringify(persistentState));
      } catch (e) {
        console.error("Failed to persist state to localStorage:", e);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [state]);

  const addToSyncQueue = useCallback((item: any) => {
    if (!item || !item.table) {
      console.warn("Attempted to add invalid item to sync queue:", item);
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
          
          console.log("Found pending session, retrying upload...", sessionData);
          
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
            console.log("Successfully uploaded pending session to 'sessions' table.");
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
            console.log("Successfully uploaded pending session to 'focus_logs' table.");
            localStorage.removeItem('pending_session');
          } else {
            console.error("Failed to upload pending session to both tables:", { sessionsError, logsError });
          }
        } catch (e) {
          console.error("Error parsing pending session:", e);
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
        console.log("Testing Supabase connection to:", url);
        
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
            console.error("CRITICAL: Supabase 'Failed to fetch' detected. Possible causes:\n1. Incorrect VITE_SUPABASE_URL\n2. Supabase project is paused\n3. Network/CORS block\n4. Database is currently restarting");
          } else {
            setConnectionError(error.message);
          }
          console.error("Supabase Connection Test Error:", error);
        } else {
          setIsSupabaseConnected(true);
          setConnectionError(null);
          console.log("Supabase connection verified successfully. Status:", status);
        }
      } catch (err: any) {
        setIsSupabaseConnected(false);
        setConnectionError(err.message || "Unknown connection error");
        console.error("Supabase Connection Test Exception:", err);
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
    if (!state.user) return;
    const userId = state.user.id;
    const today = getLocalDateString(new Date());

    try {
      // 1. Trigger Ghost Time Engine (Daily Reset Check)
      handleDailyReset();

      // Set loading state silently if cache exists
      setState(prev => {
        const hasCache = localStorage.getItem('blockYourDopamineState') !== null;
        return { ...prev, isSyncing: true };
      });

      // Selective Fetching Logic
      const fetchPromises: Promise<any>[] = [];
      
      // Always fetch profile and streak as they are global
      fetchPromises.push((async () => await supabase.from('profiles').select('*').eq('id', userId).single())());
      fetchPromises.push((async () => await supabase.from('user_streaks').select('*').eq('user_id', userId).single())());

      // View-specific fetching
      if (!view || view === 'Dashboard' || view === 'Reports' || view === 'Detox') {
        const fetchFocusData = async () => {
          const [logsRes, sessionsRes] = await Promise.all([
            supabase.from('focus_logs').select('*').eq('user_id', userId).gte('start_time', `${today}T00:00:00Z`).lte('start_time', `${today}T23:59:59Z`),
            supabase.from('sessions').select('*').eq('user_id', userId).gte('start_time', `${today}T00:00:00Z`).lte('start_time', `${today}T23:59:59Z`)
          ]);
          
          // Deduplicate data from both tables by session_id
          const combined = new Map<string, any>();
          
          (logsRes.data || []).forEach(log => {
            if (log.session_id) {
              combined.set(log.session_id, log);
            }
          });
          
          (sessionsRes.data || []).forEach(s => {
            const mapped = {
              ...s,
              session_duration: s.total_duration,
              growth_percentage: s.detox_score
            };
            if (s.session_id) {
              const existing = combined.get(s.session_id);
              if (!existing || mapped.session_duration >= existing.session_duration) {
                combined.set(s.session_id, mapped);
              }
            } else {
              combined.set(`legacy_${s.id}`, mapped);
            }
          });
          
          const combinedData = Array.from(combined.values());
          return { data: combinedData, error: logsRes.error || sessionsRes.error };
        };
        
        fetchPromises.push(fetchFocusData());
        fetchPromises.push((async () => await supabase.from('detox_settings').select('*').eq('user_id', userId).single())());
        fetchPromises.push((async () => await supabase.from('user_preferences').select('*').eq('user_id', userId).single())());
      } else {
        // Add placeholders to maintain array indices if needed, or handle dynamically
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
      }

      if (!view || view === 'Planner') {
        fetchPromises.push((async () => await supabase.from('planner_tasks').select('*').eq('user_id', userId))());
      } else {
        fetchPromises.push(Promise.resolve({ data: null }));
      }

      if (!view || view === 'Health') {
        fetchPromises.push((async () => await supabase.from('health_logs').select('*').eq('user_id', userId))());
        fetchPromises.push((async () => await supabase.from('macro_data').select('*').eq('user_id', userId).eq('entry_date', today).single())());
      } else {
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
      }

      if (!view || view === 'Dashboard' || view === 'Personal') {
        fetchPromises.push((async () => await supabase.from('mood_entries').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(1))());
        fetchPromises.push((async () => await supabase.from('resources').select('*').eq('user_id', userId))());
      } else {
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
      }

      if (!view || view === 'Academic') {
        fetchPromises.push((async () => await supabase.from('academic_progress').select('*').eq('user_id', userId))());
        fetchPromises.push((async () => await supabase.from('academic_settings').select('*').eq('user_id', userId).single())());
        fetchPromises.push((async () => await supabase.from('academic_chapters').select('*').eq('user_id', userId))());
      } else {
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
        fetchPromises.push(Promise.resolve({ data: null }));
      }

      const results = await Promise.all(fetchPromises);
      
      const profileRes = results[0];
      const streakRes = results[1];
      const focusRes = results[2];
      const settingsRes = results[3];
      const prefsRes = results[4];
      const tasksRes = results[5];
      const healthRes = results[6];
      const macroRes = results[7];
      const moodRes = results[8];
      const resourcesRes = results[9];
      const academicProgressRes = results[10];
      const academicSettingsRes = results[11];
      const academicChaptersRes = results[12];

      // Process Profile
      const profileData = profileRes.data;
      if (profileData) {
        setState(prev => ({
          ...prev,
          profile: {
            fullName: profileData.full_name || prev.profile?.fullName || '',
            avatarUrl: profileData.avatar_url || prev.profile?.avatarUrl,
            institution: profileData.institution || '',
            class: profileData.class || '',
            subjectGroup: profileData.subject_group || '',
            year: profileData.year || '',
            gender: profileData.gender || 'Male'
          },
          gender: profileData.gender || prev.gender
        }));
      }

      // Process Tasks
      let tasks = tasksRes.data;
      if (tasksRes.error && view === 'Planner') {
        const { data: fallbackTasks } = await supabase.from('tasks').select('*').eq('user_id', userId);
        tasks = fallbackTasks;
      }
      
      // Process Streak
      const streakData = streakRes.data;
      let finalStreak = streakData?.streak_count || 0;
      let finalLastStreakDate = streakData?.last_streak_date || null;
      let finalConsecutiveMissedDays = streakData?.consecutive_missed_days || 0;
      let finalStreakSeasonStartDate = streakData?.season_start_date || today;

      // Quarterly Reset (90 days)
      const seasonDaysDiff = getDayDifference(finalStreakSeasonStartDate, today);
      if (seasonDaysDiff >= 90) {
        console.log("BYD Protocol: Quarterly Streak Reset Triggered.");
        finalStreak = 0;
        finalConsecutiveMissedDays = 0;
        finalLastStreakDate = null;
        finalStreakSeasonStartDate = today;
      } else if (finalLastStreakDate) {
        const daysSinceLastSession = getDayDifference(finalLastStreakDate, today);
        if (daysSinceLastSession >= 3) {
          console.log("BYD Protocol: Streak broken (3 days missed). Resetting to 0.");
          finalStreak = 0;
          finalConsecutiveMissedDays = 0;
        } else {
          // If 1 or 2 days missed, keep streak but update missed days count for UI feedback
          finalConsecutiveMissedDays = (daysSinceLastSession > 0 && finalLastStreakDate !== today) ? daysSinceLastSession : 0;
        }
      }

      // Process Health
      const allHealth = healthRes.data;
      let healthState = {};
      if (allHealth && allHealth.length > 0) {
        const health = allHealth.find(h => h.entry_date === today);
        if (health) {
          healthState = {
            hydrationIntake: health.hydration || 0,
            steps: health.steps || 0,
            sleepHours: health.sleep_hours || 0,
            sleepSessions: health.sleep_sessions || 0,
            consumedCalories: health.calories || 0,
            screenTimeHours: Math.floor((health.screen_time_minutes || 0) / 60),
            screenTimeMinutes: (health.screen_time_minutes || 0) % 60
          };
        }
      }

      // Process Settings
      const detoxSettings = settingsRes.data || prefsRes.data;
      let settingsState = {};
      if (detoxSettings) {
        settingsState = {
          dailyGoalHours: (detoxSettings.daily_focus_goal_minutes || 120) / 60,
          healthTargets: {
            calories: String(detoxSettings.daily_calorie_goal || 2000),
            footsteps: String(detoxSettings.daily_step_goal || 10000),
            sleep: String(detoxSettings.daily_sleep_goal || 8),
            hydration: String(detoxSettings.daily_hydration_goal || 8),
            screenTime: String(detoxSettings.daily_screen_time_goal || 4)
          }
        };
      }

      // Process Focus Sessions
      const todaySessions = focusRes.data;
      let focusState = {};

      // Process Academic
      let academicState: any = {};
      if (academicProgressRes?.data) {
        academicState.academicSubjects = academicProgressRes.data;
      }
      if (academicSettingsRes?.data) {
        const settings = academicSettingsRes.data;
        academicState.academicSettings = {
          examDate: settings.exam_date || null,
          focusSubjectId: settings.focus_subject_id || null
        };
      }
      if (academicChaptersRes?.data) {
        academicState.academicChapters = academicChaptersRes.data.map((c: any) => ({
          id: c.id,
          subject_id: c.subject_id,
          chapter_name: c.chapter_name,
          is_weak: c.is_weak || false,
          is_important: c.is_important || false,
          read_textbook: c.read_textbook || false,
          watch_class: c.watch_class || false,
          practice_problems: c.practice_problems || false,
          make_notes: c.make_notes || false,
          resources: Array.isArray(c.resources) ? c.resources : []
        }));
      }

      if (todaySessions) {
        let totalNet = 0;
        let totalAttempted = 0;
        let scores: number[] = [];
        
        todaySessions.forEach(s => {
          const duration = s.session_duration || 0;
          const score = s.growth_percentage || 0;
          totalAttempted += duration;
          totalNet += Math.trunc((score / 100) * duration);
          scores.push(score);
        });

        focusState = {
          totalNet,
          totalAttempted,
          sessionsCount: todaySessions.length,
          scores,
          newDetoxPercent: totalAttempted > 0 ? Math.round((totalNet / totalAttempted) * 10000) / 100 : 100
        };
      }

      // Process Mood
      const moodData = moodRes.data && moodRes.data.length > 0 ? { text: moodRes.data[0].note, emoji: moodRes.data[0].mood_type } : null;

      // Process Macros
      const macroData = macroRes.data ? { protein: macroRes.data.protein || 0, carbs: macroRes.data.carbs || 0, fats: macroRes.data.fats || 0 } : null;

      // Process Resources
      const resourcesData = resourcesRes.data;
      if (resourcesData) {
        setState(prev => {
          // Only overwrite resources if there are no pending resource changes in the sync queue
          const hasPendingResourceChanges = prev.syncQueue?.some(item => item && item.table === 'resources');
          if (hasPendingResourceChanges) {
            console.log("Skipping resource sync as there are pending changes in the queue.");
            return prev;
          }
          
          // Merge cloud resources with local resources (Sync Safety)
          const cloudResources = resourcesData.map(r => ({
            id: r.id,
            type: r.type as ResourceType,
            title: r.title,
            url: r.url
          }));
          
          const localResources = (prev.resources || []).map(r => {
            if (!isUUID(r.id)) {
              console.warn(`Fixing invalid resource ID: ${r.id}`);
              return { ...r, id: generateId() };
            }
            return r;
          });

          const mergedResourcesMap = new Map<string, Resource>();
          const cloudResourceIds = new Set(cloudResources.map(r => r.id));
          let newSyncQueue = prev.syncQueue ? [...prev.syncQueue] : [];
          
          // Add local resources first
          localResources.forEach(r => {
            mergedResourcesMap.set(r.id, r);
            // If logged in and local resource is not in cloud, queue it for upload
            if (userId && !cloudResourceIds.has(r.id)) {
              newSyncQueue.push({
                table: 'resources',
                type: 'upsert',
                key: r.id,
                data: {
                  id: r.id,
                  user_id: userId,
                  type: r.type,
                  title: r.title,
                  url: r.url
                }
              });
            }
          });
          
          // Overwrite/Add cloud resources
          cloudResources.forEach(r => mergedResourcesMap.set(r.id, r));
          
          const finalResources = Array.from(mergedResourcesMap.values());
          
          // Persist the merged result to local storage
          localStorage.setItem('byd_study_resources', safeStringify(finalResources));
          
          return {
            ...prev,
            resources: finalResources,
            syncQueue: newSyncQueue
          };
        });
      }

      // Batch Update State
      setState(prev => {
        const isNewDay = prev.lastResetDate !== today;
        
        // Focus State Logic (Local-First Architecture)
        const baseNet = isNewDay ? 0 : prev.totalNetFocusTime;
        const baseTotal = isNewDay ? 0 : prev.dailyTotalFocusTime;
        const baseSessions = isNewDay ? 0 : prev.dailySessions;
        const baseDetox = isNewDay ? 100 : prev.detoxPercent;
        const baseScores = isNewDay ? [] : prev.sessionScores;

        const fState = focusState as any;
        
        // ONLY use Supabase data if our local data is empty (e.g., fresh login on a new device)
        // Otherwise, trust localStorage completely to prevent flickering and data loss
        const useLocalData = baseTotal > 0;
        
        const finalNet = useLocalData ? baseNet : (fState.totalNet || 0);
        const finalTotal = useLocalData ? baseTotal : (fState.totalAttempted || 0);
        const finalSessions = useLocalData ? baseSessions : (fState.sessionsCount || 0);
        const finalDetox = useLocalData ? baseDetox : (fState.newDetoxPercent || 100);
        const finalScores = useLocalData ? baseScores : (fState.scores || []);

        // Process Streak
        const hasPendingStreakChanges = prev.syncQueue?.some(item => item && item.table === 'user_streaks');
        const streakUpdate = (streakData && !hasPendingStreakChanges) ? { 
          streak: finalStreak, 
          lastStreakDate: finalLastStreakDate,
          consecutiveMissedDays: finalConsecutiveMissedDays,
          streakSeasonStartDate: finalStreakSeasonStartDate
        } : {};

        const newState = {
          ...prev,
          ...(tasks ? { tasks } : {}),
          ...streakUpdate,
          ...healthState,
          ...settingsState,
          ...academicState,
          ...(moodData ? { latestMood: moodData } : {}),
          ...(macroData ? { macros: macroData } : {}),
          totalNetFocusTime: finalNet,
          dailyTotalFocusTime: finalTotal,
          dailySessions: finalSessions,
          detoxPercent: finalDetox,
          sessionScores: finalScores,
          lastResetDate: today,
          hasFetchedFocusData: true,
          isSyncing: false,
          lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        };

        // Immediate save to localStorage after successful fetch
        setTimeout(() => {
          try {
            const { currentTime, currentDate, lastSyncTime, ...persistentState } = newState;
            localStorage.setItem('blockYourDopamineState', safeStringify(persistentState));
            localStorage.setItem('last_focus_data', safeStringify({
              totalNetFocusTime: finalNet,
              dailyTotalFocusTime: finalTotal,
              dailySessions: finalSessions,
              detoxPercent: finalDetox,
              timestamp: Date.now()
            }));
            localStorage.setItem('total_focus_time', finalNet.toString());
            localStorage.setItem('daily_total_focus_time', finalTotal.toString());
            localStorage.setItem('detox_score', finalDetox.toString());
            localStorage.setItem('focus_date', new Date().toDateString());
          } catch (e) {
            console.error("Failed to save state", e);
          }
        }, 0);

        return newState;
      });

    } catch (error) {
      console.error("Master Sync failed:", error);
      setState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }));
    }
  }, [state.user?.id]);

  const syncData = masterSync;
  const fetchUserData = masterSync;

  // BYD Offline Protocol: Automatic Background Sync Listener
  useEffect(() => {
    const handleOnline = () => {
      console.log("BYD Offline Protocol: Internet connection established. Starting background sync...");
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
          console.log('New session detected via real-time:', payload);
          // Re-fetch focus data to ensure accuracy
          masterSync();
        }
      )
      .subscribe();

    const syncInterval = setInterval(() => {
      console.log("Auto-syncing data in background...");
      masterSync();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => {
      clearInterval(syncInterval);
      supabase.removeChannel(channel);
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
            console.log("Central Time Engine: Date transition detected, but sync queue is not empty. Deferring reset...");
            // Trigger sync, will check again next minute
            triggerSync();
            return prev;
          }
          console.log("Central Time Engine: Date transition detected. Triggering Ghost Clock Reset...");
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
        console.log("App became active. Checking Ghost Clock...");
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
    const yesterday = getYesterdayDateString();
    let newStreak = prev.streak;
    if (prev.lastStreakDate && prev.lastStreakDate !== today && prev.lastStreakDate !== yesterday) {
      console.log("Streak broken during daily reset! Resetting to 0.");
      newStreak = 0;
    }

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

  const addXP = useCallback((amount: number) => {
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
  }, []);

  const incrementTasks = useCallback(() => {
    logActivity();
    setState(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
    addXP(10); // 10 XP per task
  }, [addXP]);

  const addFitness = useCallback((amount: number) => {
    logActivity();
    setState(prev => ({ ...prev, physicalFitness: Math.min(200, prev.physicalFitness + amount) }));
    addXP(5);
  }, [addXP]);

  const toggleFocus = useCallback(() => {
    setState(prev => ({ ...prev, isFocusing: !prev.isFocusing }));
  }, []);

  const startFocusSession = useCallback((durationMinutes: number, subjectId?: string) => {
    if (durationMinutes <= 0) {
      console.warn("Cannot start session: Duration must be greater than 0.");
      return;
    }
    localStorage.removeItem('distraction_start_time');
    localStorage.removeItem('current_session');
    localStorage.removeItem('pending_session'); // Clear any old pending session
    localStorage.removeItem('isInteractingWithSafeResource');
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
  }, [state.academicChapters]);

  const saveSessionFragment = async (netFocusTime: number, totalAttemptedTime: number) => {
    if (!state.user || !state.currentSessionStartTime) return;

    const safeNetFocus = (Number.isFinite(netFocusTime) && netFocusTime > 0) ? netFocusTime : 0;
    const safeTotalAttempted = (Number.isFinite(totalAttemptedTime) && totalAttemptedTime > 0) ? totalAttemptedTime : 0;
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
      console.error("Failed to sync draft to Supabase:", err);
    }
  };

  const endFocusSession = useCallback(async (netFocusTime: number, totalAttemptedTime: number, resourceUsed?: string) => {
    if (!isManualExitRef.current) {
      console.warn("Attempted to end session without manual exit trigger. Blocked.");
      return;
    }
    // NaN Guards & Absolute Math Support
    let safeNetFocus = (Number.isFinite(netFocusTime) && netFocusTime > 0) ? netFocusTime : 0;
    let safeTotalAttempted = (Number.isFinite(totalAttemptedTime) && totalAttemptedTime > 0) ? totalAttemptedTime : 0;

    // Validation Guard: Check if we have a better backup in localStorage
    try {
      const pendingSession = localStorage.getItem('pending_session');
      if (pendingSession) {
        const parsed = JSON.parse(pendingSession);
        // If the backup has the same ID but a LONGER duration, use it (prevents truncation)
        if (parsed.session_id === state.currentSessionId && parsed.session_duration > safeTotalAttempted) {
          console.warn(`Validation Guard: Local storage backup has longer duration (${parsed.session_duration}s) than current session (${safeTotalAttempted}s). Using backup to prevent truncation.`);
          safeTotalAttempted = parsed.session_duration;
          safeNetFocus = parsed.net_focus_seconds || parsed.net_focus_time || safeNetFocus;
        }
      }
    } catch (e) {
      console.error("Validation Guard Error:", e);
    }

    logActivity();
    
    // The Detox Formula: Hardcoded as requested
    const sessionScore = safeTotalAttempted > 0 
      ? Math.round((safeNetFocus / safeTotalAttempted) * 10000) / 100 
      : 100;

    // 1. OPTIMISTIC UI & State Cleanup
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
        console.error("Failed to clear session from localStorage", e);
      }

      const today = getLocalDateString(new Date());
      const isNewStreakDay = prev.lastStreakDate !== today;
      const newStreak = isNewStreakDay ? prev.streak + 1 : prev.streak;

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

      // 2. Silent Background Sync Execution
      const finalSessionData = {
        user_id: state.user?.id,
        session_id: state.currentSessionId,
        total_duration: Math.floor(safeTotalAttempted),
        net_focus_time: Math.floor(safeNetFocus),
        distraction_time: Math.floor(safeTotalAttempted - safeNetFocus),
        detox_score: parseFloat(sessionScore.toFixed(2)),
        start_time: state.currentSessionStartTime || new Date(Date.now() - (safeTotalAttempted * 1000)).toISOString()
      };

      const finalStreakData = {
        user_id: state.user?.id,
        streak_count: newStreak,
        last_streak_date: today,
        consecutive_missed_days: 0,
        season_start_date: prev.streakSeasonStartDate
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
          // Sync sessions
          supabase.from('sessions').upsert(finalSessionData, { onConflict: 'session_id' }).then(({ error }) => {
            if (!error) {
              localStorage.removeItem('pending_session');
            }
          });
          
          // Sync streak
          supabase.from('user_streaks').upsert(finalStreakData, { onConflict: 'user_id' }).then(({ error }) => {
            if (error) console.error("Streak sync failed:", error);
          });
        }
      }

      return newState;
    });
  }, [getOfflineQueue, saveOfflineQueue, state.user, state.currentSessionId, state.currentSessionStartTime, state.currentSessionDuration, state.xp, state.level, state.streak, state.lastStreakDate, state.totalNetFocusTime, state.dailyTotalFocusTime, state.dailySessions, state.focusTime, state.streakSeasonStartDate]);

  const cancelFocusSession = useCallback(() => {
    if (!isManualExitRef.current) {
      console.warn("Attempted to cancel session without manual exit trigger. Blocked.");
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
  }, []);

  const setIsManualExit = useCallback((val: boolean) => {
    isManualExitRef.current = val;
    setState(prev => ({ ...prev, isManualExit: val }));
  }, []);

  const setSessionTimeLeft = useCallback((time: number) => {
    setState(prev => {
      return { ...prev, sessionTimeLeft: time };
    });
  }, []);

  const setSessionDistractionTime = useCallback((time: number) => {
    setState(prev => {
      return { ...prev, sessionDistractionTime: time };
    });
  }, []);

  const setIsSessionDistracted = useCallback((isDistracted: boolean) => {
    setState(prev => ({ ...prev, isSessionDistracted: isDistracted }));
  }, []);

  const updateDetox = useCallback((amount: number) => {
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
  }, [addXP, addToSyncQueue, state.dailyGoalHours, state.user]);

  const setDailyGoalHours = useCallback((hours: number) => {
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
  }, [addToSyncQueue, state.user]);

  const addResource = useCallback((resource: Resource) => {
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
  }, [addToSyncQueue, state.user]);

  const updateResource = useCallback((id: string, updates: Partial<Resource>) => {
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
  }, [addToSyncQueue, state.user]);

  const removeResource = useCallback((id: string) => {
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
  }, [addToSyncQueue, state.user]);

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

  const updateHydration = useCallback((amount: number) => {
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
  }, [addToSyncQueue, state.user]);

  const updateSleep = useCallback((hours: number, sessionDelta: number = 0) => {
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
  }, [addToSyncQueue, state.user]);

  const updateSteps = useCallback((steps: number) => {
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
  }, [addToSyncQueue, state.user]);

  const updateCalories = useCallback((calories: number, bypass: boolean = false) => {
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
  }, [addToSyncQueue, state.user]);

  const updateScreenTime = useCallback((hours: number, minutes: number) => {
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
  }, [addToSyncQueue, state.user]);

  const updateHealthTargets = useCallback((targets: HealthTargets) => {
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
  }, [addToSyncQueue, state.user]);

  const updateProfile = useCallback(async (profileData: Partial<NonNullable<AppState['profile']>>) => {
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
  }, [addToSyncQueue, state.user]);

  const updateMood = useCallback(async (text: string, emoji: string) => {
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
  }, [addToSyncQueue, state.user]);

  const updateMacros = useCallback(async (protein: number, carbs: number, fats: number, calories?: number) => {
    if (!state.user) return;
    const today = getLocalDateString(new Date());
    
    setState(prev => ({ ...prev, macros: { protein, carbs, fats } }));
    
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
  }, [addToSyncQueue, state.user]);

  const addTask = useCallback((task: Task) => {
    logActivity();
    
    // Update local state immediately
    setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));

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
  }, [addToSyncQueue, state.user]);

  const deleteTask = useCallback((id: string) => {
    // Update local state immediately
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));

    if (state.user) {
      addToSyncQueue({
        table: 'planner_tasks',
        type: 'delete',
        id: id
      });
    }
  }, [addToSyncQueue, state.user]);

  const updateTaskStatus = useCallback((id: string, status: Status) => {
    logActivity();
    
    // Update local state immediately
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));

    if (state.user) {
      addToSyncQueue({
        table: 'planner_tasks',
        type: 'update',
        id: id,
        data: { status }
      });
    }
  }, [addToSyncQueue, state.user]);

  const equipBadge = useCallback((badgeId: string) => {
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
  }, []);

  const login = (fullName: string, email: string) => {
    // This is now handled by Supabase Auth in AuthModal
  };

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setState(prev => ({ ...prev, user: null, profile: null, daysActive: 1 }));
  }, []);

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
    addChapterResource,
    deleteChapterResource,
    modifyFocusTime,
    addNotification,
    isSupabaseConnected,
    connectionError
  }), [state, clock, isSupabaseConnected, connectionError]);

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
