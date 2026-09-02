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
  GraduationCap
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { useBYDData } from '../hooks/useBYDData';
import { useRealtimeSync } from '../hooks/useRealtimeSync';
import { supabase } from '../lib/supabase';

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

            {/* Graphs & Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Activity Graph */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="lg:col-span-2 bg-[#121212] border border-white/[0.06] rounded-[24px] p-8 shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-sans font-semibold text-white">Activity Graph</h3>
                    <p className="text-white/40 text-[13px] font-medium mt-1">Focus hours distribution for {reportRange.toLowerCase()}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#171717] px-3 py-1.5 rounded-full border border-white/[0.04]">
                    <div className="w-2 h-2 bg-[#39FF14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.6)]" />
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Focus Hours</span>
                  </div>
                </div>
                
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}
                        dy={10}
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
                        itemStyle={{ color: '#39FF14', fontSize: '13px', fontWeight: '600' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                      <Bar 
                        dataKey="hours" 
                        fill="url(#barGradient)" 
                        radius={[4, 4, 4, 4]} 
                        barSize={24}
                        animationDuration={1500}
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
