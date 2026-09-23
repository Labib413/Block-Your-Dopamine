import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  Clock, 
  Target, 
  CheckCircle2, 
  Calendar, 
  ChevronLeft, 
  ArrowUpRight, 
  Activity,
  History,
  ExternalLink,
  ChevronDown,
  Heart,
  GraduationCap,
  Database,
  RefreshCw,
  Sparkles,
  Cloud,
  Check
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useBYDData } from '../hooks/useBYDData';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { supabase } from '../lib/supabase';
import { db, collection, getDocs } from '../lib/firebase';
import { 
  syncAggregatedReportsToFirestore, 
  fetchAllSessionReportsFromFirestore, 
  getDhakaDateString,
  getDhakaWeekKey,
  getDhakaMonthKey,
  type SessionReportItem 
} from '../lib/sessionReports';

// Use console as fallback logger
const logger = console;

const SummaryCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  badge, 
  badgeType = "positive",
  iconColor = "text-[#39FF14]",
  iconBg = "bg-[#39FF14]/10",
  iconBorder = "border-[#39FF14]/20",
  chartColor = "#39FF14"
}: any) => (
  <motion.div 
    whileHover={{ y: -2 }}
    className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 relative overflow-hidden group shadow-lg shadow-black/20"
  >
    {/* Subtle Glow */}
    <div className={`absolute -right-10 -top-10 w-32 h-32 ${iconBg} blur-[50px] opacity-40 group-hover:opacity-80 transition-opacity duration-500`} />
    
    <div className="flex items-start justify-between mb-8 relative z-10">
      <div className={`p-3.5 rounded-[16px] ${iconBg} border ${iconBorder} backdrop-blur-sm`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      
      <div className={cn(
        "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
        badgeType === "positive" ? "bg-[#39FF14]/5 text-[#39FF14] border-[#39FF14]/10" : "bg-[#3B82F6]/5 text-[#3B82F6] border-[#3B82F6]/10"
      )}>
        {badgeType === "positive" ? <ArrowUpRight className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
        <span>{badge}</span>
      </div>
    </div>

    <div className="relative z-10">
      <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-2">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-sans font-semibold text-white tracking-tight">{value}</span>
        <span className="text-white/40 text-sm font-medium">{unit}</span>
      </div>
    </div>

    {/* Decorative Sparkline */}
    <div className="absolute bottom-4 right-0 w-32 h-16 opacity-30 pointer-events-none transition-transform duration-500 group-hover:scale-105">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
        <path 
          d="M0,20 C20,20 30,10 50,15 C70,20 80,5 100,10" 
          fill="none" 
          stroke={chartColor} 
          strokeWidth="2"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0px 2px 4px ${chartColor}40)` }}
        />
      </svg>
    </div>
  </motion.div>
);

export function ReportsView({ onBack }: { onBack: () => void }) {
  const { 
    user, 
    tasksCompleted, 
    tasks, 
    weeklyHistory, 
    totalNetFocusTime, 
    detoxPercent,
    steps,
    hydrationIntake,
    sleepHours,
    consumedCalories,
    focusHistory,
    healthHistory,
    academicChapters
  } = useApp();
  
  // Fetch sessions and focus_logs from Firestore + Supabase via useBYDData
  const { data: rawSessions, isLoading: isSessionsLoading } = useBYDData('sessions');
  const { data: rawFocusLogs } = useBYDData('focus_logs');
  useRealtimeSync('sessions');
  useRealtimeSync('focus_logs');

  const [reportRange, setReportRange] = useState<"Today" | "Last 7 Days" | "Last 30 Days">("Last 7 Days");
  const [graphViewMode, setGraphViewMode] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [directFirestoreSessions, setDirectFirestoreSessions] = useState<any[]>([]);
  const [firebaseReports, setFirebaseReports] = useState<SessionReportItem[]>([]);
  const [isSyncingReports, setIsSyncingReports] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Health Metrics State
  const [healthStats, setHealthStats] = useState({
    avgSteps: 0,
    avgHydration: 0,
    avgSleep: 0,
    totalCalories: 0
  });

  // Planner Metrics State
  const [plannerStats, setPlannerStats] = useState({
    completed: 0,
    total: 0,
    completionRate: 0
  });

  // Timezone-aware date string helper (Asia/Dhaka)
  const getLocalDateString = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // Direct Firestore Fetch for guaranteed per-user persistence
  useEffect(() => {
    let isMounted = true;
    async function loadFirestoreData() {
      if (!user?.id) return;
      try {
        const [reportsSnap, sessionsSnap] = await Promise.all([
          fetchAllSessionReportsFromFirestore(user.id),
          getDocs(collection(db, 'users', user.id, 'sessions')).catch(() => ({ empty: true, docs: [] }))
        ]);

        if (isMounted) {
          if (reportsSnap && reportsSnap.length > 0) {
            setFirebaseReports(reportsSnap);
          }
          if ('docs' in sessionsSnap && !sessionsSnap.empty) {
            const docs = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setDirectFirestoreSessions(docs);
          }
        }
      } catch (e) {
        console.warn("[ReportsView] Firestore direct fetch error:", e);
      }
    }
    loadFirestoreData();
    return () => { isMounted = false; };
  }, [user?.id]);

  // Synchronized mode changer for Activity Graph
  const handleGraphModeChange = (mode: "daily" | "weekly" | "monthly") => {
    setGraphViewMode(mode);
    if (mode === 'daily') setReportRange("Today");
    else if (mode === 'weekly') setReportRange("Last 7 Days");
    else if (mode === 'monthly') setReportRange("Last 30 Days");
  };

  // 1. Unify and normalize sessions from Firestore, Supabase, AppContext focusHistory, and direct Firestore fetch
  const allSessions = useMemo(() => {
    const sessionMap = new Map<string, any>();

    const processItem = (s: any) => {
      if (!s) return;
      const key = s.id || s.session_id || s.logId || `${s.start_time || s.created_at || s.timestamp}`;
      const createdAt = s.created_at || s.start_time || s.timestamp || new Date().toISOString();

      let durationMinutes = 0;
      if (s.duration_minutes !== undefined && s.duration_minutes !== null) {
        durationMinutes = Number(s.duration_minutes);
      } else if (s.total_duration !== undefined && s.total_duration !== null) {
        durationMinutes = Math.max(1, Math.round(Number(s.total_duration) / 60));
      } else if (s.session_duration !== undefined && s.session_duration !== null) {
        const val = Number(s.session_duration);
        durationMinutes = val > 120 ? Math.round(val / 60) : val;
      } else if (s.net_focus_time !== undefined && s.net_focus_time !== null) {
        durationMinutes = Math.max(1, Math.round(Number(s.net_focus_time) / 60));
      } else if (s.net_focus_seconds !== undefined && s.net_focus_seconds !== null) {
        durationMinutes = Math.max(1, Math.round(Number(s.net_focus_seconds) / 60));
      }

      const detoxScore = Number(s.detox_score ?? s.growth_percentage ?? 100);
      const isProductive = s.is_productive !== undefined 
        ? Boolean(s.is_productive) 
        : (detoxScore >= 60);

      const taskName = s.task_name || s.subject || s.resource_used || (isProductive ? 'Focus Session' : 'Detox Block');

      sessionMap.set(key, {
        id: key,
        session_id: key,
        created_at: createdAt,
        duration_minutes: durationMinutes,
        is_productive: isProductive,
        detox_score: detoxScore,
        task_name: taskName,
      });
    };

    (directFirestoreSessions || []).forEach(processItem);
    (rawSessions || []).forEach(processItem);
    (rawFocusLogs || []).forEach(processItem);
    (focusHistory || []).forEach(processItem);

    return Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [directFirestoreSessions, rawSessions, rawFocusLogs, focusHistory]);

  // Sync all historical & active sessions to Firestore Daily/Weekly/Monthly reports
  const handleSyncAllToFirebase = async () => {
    if (!user?.id || isSyncingReports) return;
    setIsSyncingReports(true);
    try {
      const res = await syncAggregatedReportsToFirestore(user.id, null, allSessions);
      if (res) {
        setFirebaseReports(prev => {
          const map = new Map<string, SessionReportItem>();
          prev.forEach(r => map.set(r.reportId, r));
          map.set(res.daily.reportId, res.daily);
          map.set(res.weekly.reportId, res.weekly);
          map.set(res.monthly.reportId, res.monthly);
          return Array.from(map.values());
        });
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 3000);
      }
    } catch (e) {
      console.error("[ReportsView] Sync all to Firebase failed:", e);
    } finally {
      setIsSyncingReports(false);
    }
  };

  // 2. Filter sessions by selected report range
  const sessions = useMemo(() => {
    const now = new Date();
    const dhakaTodayStr = getLocalDateString(now);
    const dhakaToday = new Date(dhakaTodayStr);

    if (reportRange === "Today") {
      return allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === dhakaTodayStr);
    }

    const days = reportRange === "Last 7 Days" ? 7 : 30;
    const cutoff = new Date(dhakaToday);
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = getLocalDateString(cutoff);

    return allSessions.filter(s => getLocalDateString(new Date(s.created_at)) >= cutoffStr);
  }, [allSessions, reportRange]);

  const isLoading = isSessionsLoading;

  useEffect(() => {
    async function fetchReportsData() {
      if (!user) return;
      
      const now = new Date();
      const dhakaTodayStr = getLocalDateString(now);
      const dhakaToday = new Date(dhakaTodayStr);
      
      let startDateStr = dhakaTodayStr;
      if (reportRange === "Last 7 Days") {
        const d = new Date(dhakaToday);
        d.setDate(d.getDate() - 7);
        startDateStr = getLocalDateString(d);
      } else if (reportRange === "Last 30 Days") {
        const d = new Date(dhakaToday);
        d.setDate(d.getDate() - 30);
        startDateStr = getLocalDateString(d);
      }

      try {
        let combinedHealth: any[] = [];
        
        // 1. Fetch Health Logs from Firebase Firestore
        if (user?.id) {
          try {
            const hCol = collection(db, 'users', user.id, 'health_logs');
            const hSnap = await getDocs(hCol);
            if (!hSnap.empty) {
              combinedHealth = hSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
          } catch (e) {
            logger.warn("[Firestore] health_logs fetch error:", e);
          }
        }

        // 2. Fetch from Supabase local adapter
        try {
          const { data: localHealth } = await supabase
            .from('health_logs')
            .select('*')
            .eq('user_id', user.id);
          if (localHealth && localHealth.length > 0) {
            const healthMap = new Map();
            combinedHealth.forEach(h => healthMap.set(h.entry_date || h.id, h));
            localHealth.forEach(h => healthMap.set(h.entry_date || h.id, { ...(healthMap.get(h.entry_date || h.id) || {}), ...h }));
            combinedHealth = Array.from(healthMap.values());
          }
        } catch (e) {
          logger.warn("[Supabase] health_logs fetch error:", e);
        }

        // 3. Merge with AppContext healthHistory
        if (healthHistory && healthHistory.length > 0) {
          const healthMap = new Map();
          combinedHealth.forEach(h => healthMap.set(h.entry_date || h.id, h));
          healthHistory.forEach(h => healthMap.set(h.entry_date || h.id, { ...(healthMap.get(h.entry_date || h.id) || {}), ...h }));
          combinedHealth = Array.from(healthMap.values());
        }

        const filteredHealth = combinedHealth.filter(h => (h.entry_date || '') >= startDateStr);

        if (filteredHealth.length > 0) {
          const avgSteps = Math.round(filteredHealth.reduce((acc, curr) => acc + (curr.steps || 0), 0) / filteredHealth.length);
          const avgHydration = Number((filteredHealth.reduce((acc, curr) => acc + (curr.hydration || 0), 0) / filteredHealth.length).toFixed(1));
          const avgSleep = Number((filteredHealth.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) / filteredHealth.length).toFixed(1));
          const totalCalories = filteredHealth.reduce((acc, curr) => acc + (curr.calories || 0), 0);

          if (reportRange === "Today") {
            setHealthStats({
              avgSteps: steps > 0 ? steps : avgSteps,
              avgHydration: hydrationIntake > 0 ? hydrationIntake : avgHydration,
              avgSleep: sleepHours > 0 ? sleepHours : avgSleep,
              totalCalories: consumedCalories > 0 ? consumedCalories : totalCalories
            });
          } else {
            setHealthStats({ avgSteps, avgHydration, avgSleep, totalCalories });
          }
        } else if (reportRange === "Today") {
          setHealthStats({
            avgSteps: steps,
            avgHydration: hydrationIntake,
            avgSleep: sleepHours,
            totalCalories: consumedCalories
          });
        } else {
          setHealthStats({ avgSteps: 0, avgHydration: 0, avgSleep: 0, totalCalories: 0 });
        }

        // Planner Stats (Sync from Firestore + AppContext)
        let allTasks = tasks || [];
        if (user?.id) {
          try {
            const tCol = collection(db, 'users', user.id, 'planner_tasks');
            const tSnap = await getDocs(tCol);
            if (!tSnap.empty) {
              const fTasks = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
              const tMap = new Map();
              allTasks.forEach(t => tMap.set(t.id, t));
              fTasks.forEach(t => tMap.set(t.id, { ...(tMap.get(t.id) || {}), ...t }));
              allTasks = Array.from(tMap.values());
            }
          } catch (e) {}
        }

        const completedCount = allTasks.filter(t => t.completed || t.status === 'completed').length;
        const totalCount = allTasks.length;

        // Academic chapters completion
        const completedChapters = (academicChapters || []).filter((c: any) => c.is_completed || c.progress >= 100).length;
        const totalChapters = (academicChapters || []).length;

        const finalCompleted = completedChapters > 0 ? completedChapters : (completedCount || tasksCompleted);
        const finalTotal = totalChapters > 0 ? totalChapters : Math.max(finalCompleted, totalCount || tasks.length);
        const rate = finalTotal > 0 ? Math.round((finalCompleted / finalTotal) * 100) : 0;

        setPlannerStats({
          completed: finalCompleted,
          total: finalTotal,
          completionRate: rate
        });

      } catch (err) {
        logger.error("Error fetching reports:", err);
      }
    }

    fetchReportsData();
  }, [user, reportRange, weeklyHistory, tasksCompleted, tasks, steps, hydrationIntake, sleepHours, consumedCalories, healthHistory, academicChapters]);

  const stats = useMemo(() => {
    let totalSecs = sessions.reduce((acc: number, s: any) => acc + ((s?.duration_minutes || 0) * 60), 0);
    
    // If reportRange is "Today", take live totalNetFocusTime from AppContext if it is higher
    if (reportRange === "Today" && totalNetFocusTime > totalSecs) {
      totalSecs = totalNetFocusTime;
    }

    let totalNetSecs = sessions.reduce((acc: number, s: any) => acc + ((s?.is_productive ? (s?.duration_minutes || 0) : 0) * 60), 0);
    if (reportRange === "Today" && totalNetFocusTime > 0) {
      totalNetSecs = Math.max(totalNetSecs, totalNetFocusTime);
    }

    const totalHours = (totalSecs / 3600).toFixed(1);
    let avgDepth = totalSecs > 0 ? Math.round((totalNetSecs / totalSecs) * 100) : 0;
    if (reportRange === "Today" && detoxPercent > 0 && avgDepth === 0) {
      avgDepth = Math.round(detoxPercent);
    }

    const fullTrees = sessions.filter((s: any) => s?.is_productive).length || (totalHours !== "0.0" ? 1 : 0);

    return { totalHours, avgDepth, fullTrees };
  }, [sessions, reportRange, totalNetFocusTime, detoxPercent]);

  const chartData = useMemo(() => {
    const now = new Date();
    const dhakaTodayStr = getLocalDateString(now);

    if (graphViewMode === "daily") {
      const todaySessions = allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === dhakaTodayStr);
      const nowDhakaHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(now));

      return Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        const hourSessions = todaySessions.filter((s: any) => {
          if (!s?.created_at) return false;
          const d = new Date(s.created_at);
          const dhakaHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(d));
          return dhakaHour === hour;
        });

        let hours = hourSessions.reduce((acc: number, s: any) => acc + (s?.duration_minutes || 0), 0) / 60;
        if (hour === nowDhakaHour && hours === 0 && totalNetFocusTime > 0) {
          hours = totalNetFocusTime / 3600;
        }

        const label = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
        return {
          name: hour % 3 === 0 ? label : `${hour}:00`,
          fullLabel: `${label} (${hour}:00 - ${hour + 1}:00)`,
          hours: parseFloat(hours.toFixed(2)),
          sessionsCount: hourSessions.length,
          isCurrentHour: hour === nowDhakaHour
        };
      });
    }

    if (graphViewMode === "weekly") {
      const { startStr } = getDhakaWeekKey(now);
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return dayNames.map((name, idx) => {
        const targetDate = new Date(startStr);
        targetDate.setDate(targetDate.getDate() + idx);
        const targetStr = getLocalDateString(targetDate);
        const daySessions = allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === targetStr);

        let hours = daySessions.reduce((acc: number, s: any) => acc + (s?.duration_minutes || 0), 0) / 60;
        if (targetStr === dhakaTodayStr && hours === 0 && totalNetFocusTime > 0) {
          hours = totalNetFocusTime / 3600;
        }

        return {
          name,
          fullLabel: `${name}, ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          hours: parseFloat(hours.toFixed(2)),
          sessionsCount: daySessions.length,
          fullDate: targetStr
        };
      });
    }

    // Monthly view: all days of the current month
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const targetDate = new Date(year, month, dayNum);
      const targetStr = getLocalDateString(targetDate);
      const daySessions = allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === targetStr);

      let hours = daySessions.reduce((acc: number, s: any) => acc + (s?.duration_minutes || 0), 0) / 60;
      if (targetStr === dhakaTodayStr && hours === 0 && totalNetFocusTime > 0) {
        hours = totalNetFocusTime / 3600;
      }

      return {
        name: `${dayNum}`,
        fullLabel: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        hours: parseFloat(hours.toFixed(2)),
        sessionsCount: daySessions.length,
        fullDate: targetStr
      };
    });
  }, [allSessions, graphViewMode, totalNetFocusTime]);

  const activeGraphStats = useMemo(() => {
    const totalHours = chartData.reduce((acc: number, d: any) => acc + (d.hours || 0), 0).toFixed(1);
    const sessionsCount = chartData.reduce((acc: number, d: any) => acc + (d.sessionsCount || 0), 0);
    
    let relevantSessions: any[] = [];
    const now = new Date();
    const todayStr = getLocalDateString(now);

    if (graphViewMode === "daily") {
      relevantSessions = allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === todayStr);
    } else if (graphViewMode === "weekly") {
      const { startStr, endStr } = getDhakaWeekKey(now);
      relevantSessions = allSessions.filter(s => {
        const d = getLocalDateString(new Date(s.created_at));
        return d >= startStr && d <= endStr;
      });
    } else {
      const { key: mKey } = getDhakaMonthKey(now);
      relevantSessions = allSessions.filter(s => getDhakaMonthKey(new Date(s.created_at)).key === mKey);
    }

    const efficiency = relevantSessions.length > 0
      ? Math.round(relevantSessions.reduce((acc: number, s: any) => acc + (s.detox_score || 100), 0) / relevantSessions.length)
      : (detoxPercent > 0 ? Math.round(detoxPercent) : 100);

    return { totalHours, sessionsCount, efficiency };
  }, [chartData, allSessions, graphViewMode, detoxPercent]);

  const { todayReportSummary, weekReportSummary, monthReportSummary } = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const { key: weekKey, label: weekLabel, startStr: weekStart, endStr: weekEnd } = getDhakaWeekKey(now);
    const { key: monthKey, label: monthLabel } = getDhakaMonthKey(now);

    const dailyFb = firebaseReports.find(r => r.periodType === 'daily' && r.periodKey === todayStr);
    const weeklyFb = firebaseReports.find(r => r.periodType === 'weekly' && r.periodKey === weekKey);
    const monthlyFb = firebaseReports.find(r => r.periodType === 'monthly' && r.periodKey === monthKey);

    const todaySessions = allSessions.filter(s => getLocalDateString(new Date(s.created_at)) === todayStr);
    const weekSessions = allSessions.filter(s => {
      const d = getLocalDateString(new Date(s.created_at));
      return d >= weekStart && d <= weekEnd;
    });
    const monthSessions = allSessions.filter(s => getDhakaMonthKey(new Date(s.created_at)).key === monthKey);

    const calcStats = (fb: SessionReportItem | undefined, list: any[]) => {
      if (fb) {
        return {
          focusHours: fb.totalFocusHours,
          sessionsCount: fb.totalSessions,
          avgScore: fb.avgDetoxScore
        };
      }
      const focusHours = parseFloat((list.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / 60).toFixed(1));
      const sessionsCount = list.length;
      const avgScore = list.length > 0 
        ? Math.round(list.reduce((acc, s) => acc + (s.detox_score || 100), 0) / list.length)
        : 100;
      return { focusHours, sessionsCount, avgScore };
    };

    return {
      todayReportSummary: {
        label: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        docKey: `daily_${todayStr}`,
        ...calcStats(dailyFb, todaySessions)
      },
      weekReportSummary: {
        label: weekLabel,
        docKey: `weekly_${weekKey}`,
        ...calcStats(weeklyFb, weekSessions)
      },
      monthReportSummary: {
        label: monthLabel,
        docKey: `monthly_${monthKey}`,
        ...calcStats(monthlyFb, monthSessions)
      }
    };
  }, [firebaseReports, allSessions]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090909] text-white">
      {/* Header */}
      <div className="px-8 md:px-12 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-[#121212] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all shadow-sm shadow-black/50 text-white/60 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-sans font-semibold tracking-tight">Focus <span className="text-[#39FF14]">Analytics</span></h1>
            <p className="text-white/40 text-sm font-medium">Deep dive into your productivity patterns</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-[14px] bg-[#121212] border border-white/[0.06] text-[12px] font-medium text-white/70">
            <div className="w-2 h-2 rounded-full bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.8)] animate-pulse" />
            <span>Firebase Connected</span>
          </div>

          <div className="relative z-50">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 bg-[#121212] border border-white/[0.06] px-4 py-2.5 rounded-[14px] hover:border-white/20 hover:bg-white/[0.04] transition-all shadow-sm shadow-black/50 group"
            >
              <Calendar className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
              <span className="text-sm font-medium text-white/90">{reportRange}</span>
              <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isDropdownOpen && "rotate-180")} />
            </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full right-0 mt-2 w-48 bg-[#171717] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl shadow-black"
              >
                {(["Today", "Last 7 Days", "Last 30 Days"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setReportRange(range);
                      if (range === "Today") setGraphViewMode("daily");
                      else if (range === "Last 7 Days") setGraphViewMode("weekly");
                      else if (range === "Last 30 Days") setGraphViewMode("monthly");
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center justify-between group",
                      reportRange === range ? "text-white bg-white/[0.04]" : "text-white/60 hover:text-white hover:bg-white/[0.02]"
                    )}
                  >
                    {range}
                    {reportRange === range && <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

      <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 space-y-6 scrollbar-hide">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-white/40 h-64 font-medium text-sm">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard 
                title="Total Study Hours"
                value={stats.totalHours}
                unit="hours"
                icon={Clock}
                badge="+12%"
                badgeType="positive"
                iconColor="text-[#39FF14]"
                iconBg="bg-[#39FF14]/10"
                iconBorder="border-[#39FF14]/20"
                chartColor="#39FF14"
              />
              <SummaryCard 
                title="Average Focus Depth"
                value={`${stats.avgDepth}%`}
                unit="efficiency"
                icon={Target}
                badge="Stable"
                badgeType="neutral"
                iconColor="text-[#3B82F6]"
                iconBg="bg-[#3B82F6]/10"
                iconBorder="border-[#3B82F6]/20"
                chartColor="#3B82F6"
              />
              <SummaryCard 
                title="Tasks Completed"
                value={tasksCompleted}
                unit="tasks"
                icon={CheckCircle2}
                badge="New High"
                badgeType="positive"
                iconColor="text-[#23C552]"
                iconBg="bg-[#23C552]/10"
                iconBorder="border-[#23C552]/20"
                chartColor="#23C552"
              />
            </div>

            {/* Firebase Saved Reports Segment */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-sans font-semibold text-white flex items-center gap-2">
                      Firebase Session Reports
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20">
                        Cloud Persistent
                      </span>
                    </h3>
                    <p className="text-white/40 text-[13px] font-medium mt-0.5">
                      Per-user daily sessions, weekly rollups & monthly summaries saved to Firestore
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSyncAllToFirebase}
                  disabled={isSyncingReports}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer",
                    syncSuccess 
                      ? "bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/40"
                      : "bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08]"
                  )}
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isSyncingReports && "animate-spin")} />
                  <span>{isSyncingReports ? "Saving to Cloud..." : syncSuccess ? "Reports Saved to Firebase" : "Sync Reports to Firebase"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Daily Report Card */}
                <div 
                  onClick={() => handleGraphModeChange("daily")}
                  className={cn(
                    "p-4 rounded-2xl bg-[#171717] border transition-all cursor-pointer",
                    graphViewMode === "daily" ? "border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.15)]" : "border-white/[0.06] hover:border-white/[0.15]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 font-semibold">Daily Report</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full border border-[#39FF14]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-2 truncate">
                    {todayReportSummary.label}
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.04] text-center">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Focus</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{todayReportSummary.focusHours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Sessions</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{todayReportSummary.sessionsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Score</div>
                      <div className="text-xs font-bold text-[#39FF14] font-mono mt-0.5">{todayReportSummary.avgScore}%</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/30 font-mono">
                    <span className="truncate">/{todayReportSummary.docKey}</span>
                    <span className="text-[#39FF14]/80">Click to view</span>
                  </div>
                </div>

                {/* Weekly Report Card */}
                <div 
                  onClick={() => handleGraphModeChange("weekly")}
                  className={cn(
                    "p-4 rounded-2xl bg-[#171717] border transition-all cursor-pointer",
                    graphViewMode === "weekly" ? "border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.15)]" : "border-white/[0.06] hover:border-white/[0.15]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 font-semibold">Weekly Report</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full border border-[#39FF14]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-2 truncate">
                    {weekReportSummary.label}
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.04] text-center">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Focus</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{weekReportSummary.focusHours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Sessions</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{weekReportSummary.sessionsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Score</div>
                      <div className="text-xs font-bold text-[#39FF14] font-mono mt-0.5">{weekReportSummary.avgScore}%</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/30 font-mono">
                    <span className="truncate">/{weekReportSummary.docKey}</span>
                    <span className="text-[#39FF14]/80">Click to view</span>
                  </div>
                </div>

                {/* Monthly Report Card */}
                <div 
                  onClick={() => handleGraphModeChange("monthly")}
                  className={cn(
                    "p-4 rounded-2xl bg-[#171717] border transition-all cursor-pointer",
                    graphViewMode === "monthly" ? "border-[#39FF14]/50 shadow-[0_0_15px_rgba(57,255,20,0.15)]" : "border-white/[0.06] hover:border-white/[0.15]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/50 font-semibold">Monthly Report</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#39FF14] bg-[#39FF14]/10 px-2 py-0.5 rounded-full border border-[#39FF14]/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
                      Active
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-2 truncate">
                    {monthReportSummary.label}
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/[0.04] text-center">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Focus</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{monthReportSummary.focusHours}h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Sessions</div>
                      <div className="text-xs font-bold text-white font-mono mt-0.5">{monthReportSummary.sessionsCount}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase">Score</div>
                      <div className="text-xs font-bold text-[#39FF14] font-mono mt-0.5">{monthReportSummary.avgScore}%</div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-white/30 font-mono">
                    <span className="truncate">/{monthReportSummary.docKey}</span>
                    <span className="text-[#39FF14]/80">Click to view</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Graphs & Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Activity Graph */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-[#121212] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 shadow-lg shadow-black/20 flex flex-col justify-between"
              >
                <div>
                  {/* Graph Header with Daily / Weekly / Monthly Switcher */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-sans font-semibold text-white">Activity Graph</h3>
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20 uppercase tracking-wider">
                          {graphViewMode === 'daily' ? '24H Daily' : graphViewMode === 'weekly' ? '7-Day Weekly' : 'Monthly View'}
                        </span>
                      </div>
                      <p className="text-white/40 text-[13px] font-medium mt-1">
                        {graphViewMode === 'daily' && "Focus distribution by hour for today"}
                        {graphViewMode === 'weekly' && "Daily focus hours over this week"}
                        {graphViewMode === 'monthly' && "Day-by-day focus performance this month"}
                      </p>
                    </div>

                    {/* Daily / Weekly / Monthly Segmented Toggle */}
                    <div className="flex items-center p-1 bg-[#171717] border border-white/[0.08] rounded-xl self-start sm:self-auto shadow-inner">
                      {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => handleGraphModeChange(mode)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200 cursor-pointer",
                            graphViewMode === mode
                              ? "bg-[#39FF14] text-black shadow-[0_0_12px_rgba(57,255,20,0.35)]"
                              : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                          )}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Metric Highlights for Selected View */}
                  <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40">Total Focus</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {activeGraphStats.totalHours} <span className="text-xs text-white/40 font-normal">hrs</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40">Sessions</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        {activeGraphStats.sessionsCount} <span className="text-xs text-white/40 font-normal">total</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40">Efficiency</div>
                      <div className="text-base font-bold text-[#39FF14] font-mono mt-0.5">
                        {activeGraphStats.efficiency}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#39FF14" stopOpacity={1} />
                            <stop offset="100%" stopColor="#39FF14" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: graphViewMode === 'monthly' ? 9 : 11, fontWeight: 500 }}
                          dy={10}
                          interval={graphViewMode === 'monthly' ? 2 : 0}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                          dx={-10}
                          tickCount={5}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          contentStyle={{ 
                            backgroundColor: '#171717', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            padding: '12px'
                          }}
                          formatter={(value: any) => [`${value} hrs`, 'Focus Duration']}
                          labelFormatter={(label: any, payload: any) => {
                            if (payload && payload[0]?.payload?.fullLabel) {
                              return payload[0].payload.fullLabel;
                            }
                            return label;
                          }}
                          itemStyle={{ color: '#39FF14', fontSize: '13px', fontWeight: '600' }}
                          labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Bar 
                          dataKey="hours" 
                          fill="url(#barGradient)" 
                          radius={[4, 4, 0, 0]} 
                          barSize={graphViewMode === 'daily' ? 8 : graphViewMode === 'weekly' ? 26 : 6}
                          animationDuration={800}
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.hours > 0 ? "url(#barGradient)" : "rgba(255,255,255,0.02)"} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#39FF14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">
                      {graphViewMode === 'daily' ? 'Hourly Distribution' : graphViewMode === 'weekly' ? 'Daily Focus' : 'Days of Month'}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">
                    {graphViewMode === 'daily' ? '24 Hours' : graphViewMode === 'weekly' ? 'Mon — Sun' : '1 — 31 Days'}
                  </span>
                </div>
              </motion.div>

              {/* Detailed Session Log */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="lg:col-span-3 bg-[#121212] border border-white/[0.06] rounded-[24px] shadow-lg shadow-black/20 overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-white/[0.06] bg-[#121212] flex items-center justify-between z-10 relative">
                  <h3 className="text-lg font-sans font-semibold text-white">Detailed Session Log</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto neon-scrollbar bg-[#090909]/20 relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#121212] backdrop-blur-md border-b border-white/[0.06]">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">Date & Time</th>
                        <th className="px-6 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">Duration</th>
                        <th className="px-6 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">Detox Score</th>
                        <th className="px-6 py-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">Resource</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {sessions && sessions.length > 0 ? (
                        sessions.map((session: any) => (
                          <tr key={session?.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-white/90">
                                  {session?.created_at ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                </span>
                                <span className="text-[11px] text-white/40 font-medium">
                                  {session?.created_at ? new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-white/70">{session?.duration_minutes || 0}m</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                session?.is_productive 
                                  ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20" 
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              )}>
                                {session?.is_productive ? "Completed" : "Interrupted"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#39FF14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" 
                                    style={{ width: `${session?.is_productive ? 100 : 70}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-white/70">
                                  {session?.is_productive ? "100%" : "70%"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-white/50 group-hover:text-white/90 transition-colors">
                                <span className="text-[13px] font-medium truncate max-w-[120px]">{session?.task_name || 'N/A'}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <History className="w-8 h-8 text-white/10" />
                              <p className="text-white/30 text-sm font-medium">No focus sessions recorded yet.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Analytics */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-8 relative overflow-hidden shadow-lg shadow-black/20"
              >
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <Heart className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-lg font-sans font-semibold text-white">Health Analytics</h3>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Avg Steps", value: healthStats.avgSteps.toLocaleString(), unit: "Steps", color: "#39FF14" },
                    { label: "Hydration", value: healthStats.avgHydration, unit: "Water", color: "#3B82F6" },
                    { label: "Sleep", value: healthStats.avgSleep, unit: "Hours", color: "#A855F7" },
                    { label: "Calories", value: healthStats.totalCalories.toLocaleString(), unit: "kcal", color: "#F97316" }
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col group cursor-default">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">{stat.label}</p>
                      <div className="flex items-baseline gap-1 mb-3">
                        <p className="text-xl font-bold text-white tracking-tight">{stat.value}</p>
                        <span className="text-[10px] text-white/40 font-medium">{stat.unit}</span>
                      </div>
                      <div className="h-8 w-full mt-auto opacity-40 group-hover:opacity-100 transition-opacity">
                        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
                          <path 
                            d={`M0,${20 + Math.random()*5} Q25,${10 + Math.random()*15} 50,${15 + Math.random()*10} T100,${10 + Math.random()*15}`} 
                            fill="none" 
                            stroke={stat.color} 
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-white/30 font-medium">Daily averages from tracked data</span>
                  <button className="text-[11px] font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                    View Full Health Report <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>

              {/* Academic Analytics */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-[#121212] border border-white/[0.06] rounded-[24px] p-8 relative overflow-hidden shadow-lg shadow-black/20"
              >
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <GraduationCap className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-sans font-semibold text-white">Academic Analytics</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6 items-center">
                  <div className="col-span-2 grid grid-cols-2 gap-8">
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Courses Completed</span>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-bold text-white tracking-tight">{plannerStats.completed}</span>
                        <span className="text-white/30 text-sm font-medium">/ {plannerStats.total}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#39FF14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" style={{ width: `${plannerStats.total > 0 ? (plannerStats.completed/plannerStats.total)*100 : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-2">Assignments</span>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-bold text-white tracking-tight">{Math.round(plannerStats.completed * 1.5)}</span>
                        <span className="text-white/30 text-sm font-medium">/ {Math.round(plannerStats.total * 1.5) || 0}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3B82F6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${plannerStats.completionRate}%` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center relative">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#39FF14" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 45}`} strokeDashoffset={`${2 * Math.PI * 45 * (1 - plannerStats.completionRate / 100)}`} strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(57,255,20,0.4)] transition-all duration-1000" />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-white tracking-tight">{plannerStats.completionRate}%</span>
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold mt-0.5">Overall</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                  <span className="text-[11px] text-white/30 font-medium">Track your academic performance</span>
                  <button className="text-[11px] font-semibold text-white/50 hover:text-white transition-colors flex items-center gap-1">
                    View Full Academic Report <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
