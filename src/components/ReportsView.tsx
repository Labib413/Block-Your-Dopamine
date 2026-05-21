import React, { useState, useMemo } from "react";
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
  ArrowDownRight,
  Activity,
  History,
  ExternalLink,
  ChevronDown,
  Heart,
  GraduationCap
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useBYDData } from '../hooks/useBYDData';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

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
    consumedCalories
  } = useApp();
  
  const { data: focusSessions, isLoading: isSessionsLoading } = useBYDData('focus_sessions');
  useRealtimeSync('focus_sessions');

  const [reportRange, setReportRange] = useState<"Today" | "Last 7 Days" | "Last 30 Days">("Last 7 Days");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        // Fetch Health Data using local date strings
        const { data: healthData } = await supabase
          .from('health_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', startDateStr);

        if (healthData && healthData.length > 0) {
          const avgSteps = Math.round(healthData.reduce((acc, curr) => acc + (curr.steps || 0), 0) / healthData.length);
          const avgHydration = Number((healthData.reduce((acc, curr) => acc + (curr.hydration || 0), 0) / healthData.length).toFixed(1));
          const avgSleep = Number((healthData.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) / healthData.length).toFixed(1));
          const totalCalories = healthData.reduce((acc, curr) => acc + (curr.calories || 0), 0);

          // MERGE: If reportRange is "Today", prioritize AppContext values over DB (they are more live)
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
          // Fallback to AppContext if DB is empty for Today
          setHealthStats({
            avgSteps: steps,
            avgHydration: hydrationIntake,
            avgSleep: sleepHours,
            totalCalories: consumedCalories
          });
        } else {
          setHealthStats({ avgSteps: 0, avgHydration: 0, avgSleep: 0, totalCalories: 0 });
        }

        // Planner Stats (Sync from Weekly History)
        if (weeklyHistory && weeklyHistory.length > 0) {
          const relevantHistory = reportRange === "Today" ? [] : weeklyHistory.slice(-(reportRange === "Last 7 Days" ? 7 : 30));
          const completed = relevantHistory.reduce((acc, curr) => acc + curr.tasksCompleted, 0) || tasksCompleted;
          const total = relevantHistory.reduce((acc, curr) => acc + curr.totalTasks, 0) || tasks.length;
          setPlannerStats({
            completed,
            total: Math.max(completed, total),
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
          });
        } else {
          setPlannerStats({
            completed: tasksCompleted,
            total: tasks.length,
            completionRate: tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0
          });
        }

      } catch (err) {
        logger.error("Error fetching reports:", err);
      }
    }

    fetchReportsData();
  }, [user, reportRange, weeklyHistory, tasksCompleted, tasks.length]);

  const sessions = (focusSessions || []) as any[];
  const isLoading = isSessionsLoading;

  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) return { totalHours: "0.0", avgDepth: 0, fullTrees: 0 };
    
    // Combine local real-time focus time if looking at "Today"
    let totalSecs = sessions.reduce((acc: number, s: any) => acc + ((s?.duration_minutes || 0) * 60), 0);
    
    // Note: Assuming net focus time logic based on is_productive
    let totalNetSecs = sessions.reduce((acc: number, s: any) => acc + ((s?.is_productive ? (s?.duration_minutes || 0) : 0) * 60), 0);

    const totalHours = (totalSecs / 3600).toFixed(1);
    const avgDepth = totalSecs > 0 ? Math.round((totalNetSecs / totalSecs) * 100) : 0;
    const fullTrees = sessions.filter((s: any) => s?.is_productive).length;

    return { totalHours, avgDepth, fullTrees };
  }, [sessions]);

  const chartData = useMemo(() => {
    if (!sessions) return [];
    
    const rangeDays = reportRange === "Today" ? 1 : reportRange === "Last 7 Days" ? 7 : 30;
    
    if (reportRange === "Today") {
      return Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        const hourSessions = sessions.filter((s: any) => {
          if (!s?.created_at) return false;
          const d = new Date(s.created_at);
          const dhakaHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', hour: 'numeric', hour12: false }).format(d));
          return dhakaHour === hour;
        });
        const hours = hourSessions.reduce((acc: number, s: any) => acc + (s?.duration_minutes || 0), 0) / 60;
        return { name: `${hour}:00`, hours: parseFloat(hours.toFixed(2)) };
      });
    }

    // Helper for date string
    const getLocalDateString = (date: Date) => date.toISOString().split('T')[0];

    // Fixed Date Grid for Charts
    const today = new Date();
    const lastDays = Array.from({ length: rangeDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (rangeDays - 1 - i));
      return getLocalDateString(d);
    });

    return lastDays.map(date => {
      const daySessions = sessions.filter((s: any) => s?.created_at && getLocalDateString(new Date(s.created_at)) === date);
      const hours = daySessions.reduce((acc: number, s: any) => acc + (s?.duration_minutes || 0), 0) / 60;
      return {
        name: rangeDays === 30 
          ? new Date(date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
          : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        hours: parseFloat(hours.toFixed(2)),
        fullDate: date
      };
    });
  }, [sessions, reportRange]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] text-white">
      {/* Header */}
      <div className="p-8 pb-4 grid grid-cols-3 items-center">
        <div className="flex items-center">
          <button 
            onClick={onBack}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-green/50 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:text-neon-green" />
          </button>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-sans font-bold tracking-tight">Focus <span className="text-neon-green">Analytics</span></h1>
          <p className="text-white/40 text-sm">Deep dive into your productivity patterns</p>
        </div>

        <div className="flex justify-end relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:border-neon-green/50 hover:bg-white/10 transition-all group"
          >
            <Calendar className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-mono font-medium">{reportRange}</span>
            <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isDropdownOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                {(["Today", "Last 7 Days", "Last 30 Days"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setReportRange(range);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm font-medium transition-all hover:bg-neon-green/10 flex items-center justify-between group",
                      reportRange === range ? "text-neon-green bg-neon-green/5" : "text-white/60 hover:text-white"
                    )}
                  >
                    {range}
                    {reportRange === range && <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8 scrollbar-hide">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-white/40 h-64">Loading analytics...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard className="p-6 relative group overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-green/5 blur-3xl rounded-full group-hover:bg-neon-green/10 transition-all" />
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-neon-green/10 rounded-xl border border-neon-green/20">
                    <Clock className="w-6 h-6 text-neon-green" />
                  </div>
                  <div className="flex items-center gap-1 text-neon-green text-xs font-bold">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+12%</span>
                  </div>
                </div>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Total Study Hours</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-sans font-bold">{stats.totalHours}</span>
                  <span className="text-white/20 text-sm font-medium">hours</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative group overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-all" />
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Target className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-blue-400 text-xs font-bold">
                    <Activity className="w-3 h-3" />
                    <span>Stable</span>
                  </div>
                </div>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Average Focus Depth</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-sans font-bold">{stats.avgDepth}%</span>
                  <span className="text-white/20 text-sm font-medium">efficiency</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative group overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full group-hover:bg-emerald-500/10 transition-all" />
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>New High</span>
                  </div>
                </div>
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest mb-1">Tasks Completed</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-sans font-bold">{tasksCompleted}</span>
                  <span className="text-white/20 text-sm font-medium">tasks</span>
                </div>
              </GlassCard>
            </div>

            {/* Activity Graph */}
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-sans font-bold">Activity Graph</h3>
                  <p className="text-white/40 text-xs">Focus hours distribution for {reportRange.toLowerCase()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-neon-green rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Focus Hours</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39FF14" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#39FF14" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500 }}
                      dx={-10}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(5,5,5,0.9)', 
                        border: '1px solid rgba(57,255,20,0.2)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#39FF14', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                    />
                    <Bar 
                      dataKey="hours" 
                      fill="url(#barGradient)" 
                      radius={[6, 6, 0, 0]} 
                      barSize={40}
                      animationDuration={1500}
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.hours > 0 ? "url(#barGradient)" : "rgba(255,255,255,0.05)"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Detailed Session Log */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-neon-green" />
                <h3 className="text-xl font-sans font-bold">Detailed Session Log</h3>
              </div>
              
              <GlassCard className="overflow-hidden">
                <div className="max-h-[320px] overflow-y-auto neon-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#0a0a0a] backdrop-blur-md">
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Date & Time</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Detox Score</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Resource</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sessions && sessions.length > 0 ? (
                        sessions.map((session: any) => (
                          <tr key={session?.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white/90">
                                  {session?.created_at ? new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                </span>
                                <span className="text-[10px] text-white/30 font-mono">
                                  {session?.created_at ? new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-mono text-white/70">{session?.duration_minutes || 0}m</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                session?.is_productive 
                                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              )}>
                                {session?.is_productive ? "Productive" : "Distracted"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                            <span className="text-sm font-mono text-white/70">{session?.session_type || 'N/A'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-white/50 group-hover:text-white/80 transition-colors">
                                <span className="text-xs truncate max-w-[150px]">{session?.task_name || 'N/A'}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <History className="w-8 h-8 text-white/10" />
                              <p className="text-white/30 text-sm">No focus sessions recorded yet.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>

            {/* Health & Planner Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Analytics */}
              <GlassCard className="p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="w-5 h-5 text-red-400" />
                  <h3 className="text-xl font-sans font-bold uppercase tracking-widest">Health Analytics</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-red-400/60 transition-colors">Avg Steps</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-white">{healthStats.avgSteps.toLocaleString()}</p>
                      <span className="text-[10px] text-white/20">steps</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-blue-400/60 transition-colors">Avg Hydration</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-white">{healthStats.avgHydration}</p>
                      <span className="text-[10px] text-white/20">glasses</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-purple-400/60 transition-colors">Avg Sleep</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-white">{healthStats.avgSleep}</p>
                      <span className="text-[10px] text-white/20">hours</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 group-hover:text-orange-400/60 transition-colors">Total Calories</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-white">{healthStats.totalCalories.toLocaleString()}</p>
                      <span className="text-[10px] text-white/20">kcal</span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Academic Analytics */}
              <GlassCard className="p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center gap-2 mb-6">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl font-sans font-bold uppercase tracking-widest">Academic Analytics</h3>
                </div>
                
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-white/60 block mb-1">Courses Completed</span>
                        <span className="text-2xl font-bold text-white">{plannerStats.completed} <span className="text-white/20 text-sm font-medium">/ {plannerStats.total}</span></span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-white/60 block mb-1">Academic Progress</span>
                        <span className="text-2xl font-bold text-blue-400">{plannerStats.completionRate}%</span>
                      </div>
                    </div>
                    
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${plannerStats.completionRate}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
                    <p className="text-xs text-blue-300/70 italic leading-relaxed">
                      {plannerStats.completionRate >= 80 ? "Exceptional academic focus! You're maintaining a high-performance learning rhythm." :
                       plannerStats.completionRate >= 50 ? "Solid academic progress. You're staying on top of your core curriculum. Keep pushing." :
                       "Focus on small academic wins today. Completing just one module can help you build the momentum you need."}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
