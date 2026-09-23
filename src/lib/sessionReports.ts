import { db, doc, setDoc, getDocs, collection, syncItemToFirestore } from './firebase';

export interface SessionReportItem {
  reportId: string;
  userId: string;
  periodType: 'daily' | 'weekly' | 'monthly';
  periodKey: string;
  dateLabel: string;
  totalSessions: number;
  completedSessions: number;
  totalDurationSeconds: number;
  totalNetFocusSeconds: number;
  totalFocusHours: number;
  avgDetoxScore: number;
  chartBreakdown?: any[];
  sessionsSummary?: any[];
  updatedAt: string;
}

// Timezone aware date helper (Asia/Dhaka)
export const getDhakaDateString = (date: Date = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
};

// ISO Week number helper
export const getDhakaWeekKey = (date: Date = new Date()): { key: string; label: string; startStr: string; endStr: string } => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  const weekKey = `${year}-W${String(weekNo).padStart(2, '0')}`;

  // Start of week (Monday) and end (Sunday)
  const monday = new Date(date);
  const currentDay = monday.getDay();
  const diffToMonday = monday.getDate() - (currentDay === 0 ? 6 : currentDay - 1);
  monday.setDate(diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startStr = getDhakaDateString(monday);
  const endStr = getDhakaDateString(sunday);
  const label = `Week ${weekNo} (${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  return { key: weekKey, label, startStr, endStr };
};

// Month key helper
export const getDhakaMonthKey = (date: Date = new Date()): { key: string; label: string; year: number; month: number } => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, '0')}`;
  const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { key, label, year, month };
};

/**
 * Normalizes any session payload from Context / Supabase / Firestore
 */
export function normalizeSession(s: any) {
  if (!s) return null;
  const id = s.id || s.session_id || s.logId || `session_${s.start_time || s.created_at || Date.now()}`;
  const createdAt = s.created_at || s.start_time || s.timestamp || new Date().toISOString();

  let durationMinutes = 0;
  let durationSeconds = 0;

  if (s.duration_minutes !== undefined && s.duration_minutes !== null) {
    durationMinutes = Number(s.duration_minutes);
    durationSeconds = durationMinutes * 60;
  } else if (s.total_duration !== undefined && s.total_duration !== null) {
    durationSeconds = Number(s.total_duration);
    durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  } else if (s.session_duration !== undefined && s.session_duration !== null) {
    const val = Number(s.session_duration);
    if (val > 120) {
      durationSeconds = val;
      durationMinutes = Math.round(val / 60);
    } else {
      durationMinutes = val;
      durationSeconds = val * 60;
    }
  }

  let netFocusSeconds = durationSeconds;
  if (s.net_focus_seconds !== undefined && s.net_focus_seconds !== null) {
    netFocusSeconds = Number(s.net_focus_seconds);
  } else if (s.net_focus_time !== undefined && s.net_focus_time !== null) {
    netFocusSeconds = Number(s.net_focus_time);
  }

  const detoxScore = Number(s.detox_score ?? s.growth_percentage ?? 100);
  const isProductive = s.is_productive !== undefined ? Boolean(s.is_productive) : (detoxScore >= 60);
  const taskName = s.task_name || s.subject || s.resource_used || (isProductive ? 'Focus Session' : 'Detox Block');

  return {
    id,
    session_id: id,
    created_at: createdAt,
    start_time: createdAt,
    duration_minutes: durationMinutes,
    duration_seconds: durationSeconds,
    net_focus_seconds: netFocusSeconds,
    detox_score: detoxScore,
    is_productive: isProductive,
    task_name: taskName
  };
}

/**
 * Compiles and saves Daily, Weekly, and Monthly aggregated session reports to Firestore
 */
export async function syncAggregatedReportsToFirestore(
  userId: string,
  latestSession: any,
  allSessionsList: any[] = []
): Promise<{ daily: SessionReportItem; weekly: SessionReportItem; monthly: SessionReportItem } | null> {
  if (!userId) return null;

  try {
    const now = new Date();
    const todayStr = getDhakaDateString(now);
    const { key: weekKey, label: weekLabel, startStr: weekStartStr, endStr: weekEndStr } = getDhakaWeekKey(now);
    const { key: monthKey, label: monthLabel } = getDhakaMonthKey(now);

    // Prepare unified sessions list
    const sessionsMap = new Map<string, any>();
    allSessionsList.forEach(s => {
      const norm = normalizeSession(s);
      if (norm) sessionsMap.set(norm.id, norm);
    });

    if (latestSession) {
      const normLatest = normalizeSession(latestSession);
      if (normLatest) sessionsMap.set(normLatest.id, normLatest);
    }

    const unifiedSessions = Array.from(sessionsMap.values());

    // 1. DAILY REPORT
    const todaySessions = unifiedSessions.filter(s => getDhakaDateString(new Date(s.created_at)) === todayStr);
    const dailyTotalSeconds = todaySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const dailyNetSeconds = todaySessions.reduce((acc, s) => acc + s.net_focus_seconds, 0);
    const dailyCompleted = todaySessions.filter(s => s.is_productive).length;
    const dailyAvgDetox = todaySessions.length > 0 
      ? Math.round(todaySessions.reduce((acc, s) => acc + s.detox_score, 0) / todaySessions.length)
      : 100;

    // 24-hour distribution for daily report
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourSessions = todaySessions.filter(s => {
        const d = new Date(s.created_at);
        const dhakaHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(d));
        return dhakaHour === hour;
      });
      const hours = hourSessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
      return { hour, name: `${hour}:00`, hours: parseFloat(hours.toFixed(2)) };
    });

    const dailyReport: SessionReportItem = {
      reportId: `daily_${todayStr}`,
      userId,
      periodType: 'daily',
      periodKey: todayStr,
      dateLabel: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      totalSessions: todaySessions.length,
      completedSessions: dailyCompleted,
      totalDurationSeconds: dailyTotalSeconds,
      totalNetFocusSeconds: dailyNetSeconds,
      totalFocusHours: parseFloat((dailyNetSeconds / 3600).toFixed(2)),
      avgDetoxScore: dailyAvgDetox,
      chartBreakdown: hourlyBreakdown,
      sessionsSummary: todaySessions.slice(0, 15).map(s => ({
        id: s.id,
        durationMinutes: s.duration_minutes,
        detoxScore: s.detox_score,
        taskName: s.task_name,
        time: s.created_at
      })),
      updatedAt: now.toISOString()
    };

    // 2. WEEKLY REPORT
    const weekSessions = unifiedSessions.filter(s => {
      const dateStr = getDhakaDateString(new Date(s.created_at));
      return dateStr >= weekStartStr && dateStr <= weekEndStr;
    });
    const weekTotalSeconds = weekSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const weekNetSeconds = weekSessions.reduce((acc, s) => acc + s.net_focus_seconds, 0);
    const weekCompleted = weekSessions.filter(s => s.is_productive).length;
    const weekAvgDetox = weekSessions.length > 0 
      ? Math.round(weekSessions.reduce((acc, s) => acc + s.detox_score, 0) / weekSessions.length)
      : 100;

    // 7-day breakdown (Mon-Sun)
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekBreakdown = dayNames.map((name, idx) => {
      const targetDate = new Date(weekStartStr);
      targetDate.setDate(targetDate.getDate() + idx);
      const targetStr = getDhakaDateString(targetDate);
      const daySessions = weekSessions.filter(s => getDhakaDateString(new Date(s.created_at)) === targetStr);
      const hours = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
      return {
        name,
        date: targetStr,
        hours: parseFloat(hours.toFixed(2)),
        sessionsCount: daySessions.length
      };
    });

    const weeklyReport: SessionReportItem = {
      reportId: `weekly_${weekKey}`,
      userId,
      periodType: 'weekly',
      periodKey: weekKey,
      dateLabel: weekLabel,
      totalSessions: weekSessions.length,
      completedSessions: weekCompleted,
      totalDurationSeconds: weekTotalSeconds,
      totalNetFocusSeconds: weekNetSeconds,
      totalFocusHours: parseFloat((weekNetSeconds / 3600).toFixed(2)),
      avgDetoxScore: weekAvgDetox,
      chartBreakdown: weekBreakdown,
      updatedAt: now.toISOString()
    };

    // 3. MONTHLY REPORT
    const monthSessions = unifiedSessions.filter(s => {
      const d = new Date(s.created_at);
      return getDhakaMonthKey(d).key === monthKey;
    });
    const monthTotalSeconds = monthSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const monthNetSeconds = monthSessions.reduce((acc, s) => acc + s.net_focus_seconds, 0);
    const monthCompleted = monthSessions.filter(s => s.is_productive).length;
    const monthAvgDetox = monthSessions.length > 0 
      ? Math.round(monthSessions.reduce((acc, s) => acc + s.detox_score, 0) / monthSessions.length)
      : 100;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthBreakdown = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), dayNum);
      const targetStr = getDhakaDateString(targetDate);
      const daySessions = monthSessions.filter(s => getDhakaDateString(new Date(s.created_at)) === targetStr);
      const hours = daySessions.reduce((acc, s) => acc + s.duration_minutes, 0) / 60;
      return {
        day: dayNum,
        name: `${dayNum}`,
        date: targetStr,
        hours: parseFloat(hours.toFixed(2))
      };
    });

    const monthlyReport: SessionReportItem = {
      reportId: `monthly_${monthKey}`,
      userId,
      periodType: 'monthly',
      periodKey: monthKey,
      dateLabel: monthLabel,
      totalSessions: monthSessions.length,
      completedSessions: monthCompleted,
      totalDurationSeconds: monthTotalSeconds,
      totalNetFocusSeconds: monthNetSeconds,
      totalFocusHours: parseFloat((monthNetSeconds / 3600).toFixed(2)),
      avgDetoxScore: monthAvgDetox,
      chartBreakdown: monthBreakdown,
      updatedAt: now.toISOString()
    };

    // Commit all 3 reports to Firestore in background
    await Promise.all([
      syncItemToFirestore(userId, 'session_reports', dailyReport, 'upsert'),
      syncItemToFirestore(userId, 'session_reports', weeklyReport, 'upsert'),
      syncItemToFirestore(userId, 'session_reports', monthlyReport, 'upsert')
    ]);

    return { daily: dailyReport, weekly: weeklyReport, monthly: monthlyReport };
  } catch (error) {
    console.error("[sessionReports] Error syncing aggregated reports:", error);
    return null;
  }
}

/**
 * Fetches all saved session reports from Firestore
 */
export async function fetchAllSessionReportsFromFirestore(userId: string): Promise<SessionReportItem[]> {
  if (!userId) return [];
  try {
    const colRef = collection(db, 'users', userId, 'session_reports');
    const snap = await getDocs(colRef);
    if (snap.empty) return [];
    return snap.docs.map(doc => ({ reportId: doc.id, ...doc.data() } as SessionReportItem));
  } catch (err) {
    console.warn("[sessionReports] Failed to fetch session reports:", err);
    return [];
  }
}
