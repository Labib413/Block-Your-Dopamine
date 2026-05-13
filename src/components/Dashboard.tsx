import { useState, useEffect, Fragment, memo, useMemo } from "react";
import { 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Heart, 
  Plus, 
  Zap, 
  Brain,
  ArrowUpRight,
  GraduationCap,
  Pause,
  Play,
  ShieldAlert,
  Trash2,
  Globe,
  Quote,
  AlertCircle,
  Link as LinkIcon
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { getDailyQuote, getAIInsight } from "../services/gemini";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from "recharts";
import { cn, formatTime } from "@/src/lib/utils";
import { DistractionGuard } from "./DistractionGuard";
import { useDisplayState } from "../hooks/useDisplayState";

const DailyInspiration = memo(({ quote }: { quote: { text: string; author?: string } }) => {
  return (
    <div className="overflow-visible p-3 -m-3 mb-6 isolation-isolate">
      <GlassCard className="relative overflow-visible group border-l-4 border-l-neon-green hover:shadow-[0_0_50px_rgba(57,255,20,0.3)] transition-all duration-300 ease-in-out">
        {/* Background decorative elements - contained within an overflow-hidden wrapper */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-neon-green/5 blur-[40px] rounded-full group-hover:bg-neon-green/10 transition-all duration-700" />
          <div className="absolute right-4 top-4 opacity-[0.03] transform rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Quote size={60} />
          </div>
        </div>

        <div className="relative z-10 p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-neon-green drop-shadow-[0_0_8px_rgba(0,255,0,0.5)]" fill="currentColor" />
            <h2 className="text-xs md:text-sm font-extrabold text-neon-green uppercase tracking-[0.25em] drop-shadow-[0_0_8px_rgba(0,255,0,0.3)]">Daily Inspiration</h2>
          </div>
          
          <div className="relative mt-2">
            <Quote className="absolute -left-2 -top-1 w-5 h-5 text-white/10 rotate-180" />
            <p className="text-xl md:text-2xl font-sans font-light italic text-white/95 leading-relaxed max-w-4xl pl-6 tracking-wide">
              "{quote.text}"
            </p>
          </div>
          
          {quote.author && (
            <div className="mt-2 flex items-center gap-2 pl-4">
              <div className="h-[1px] w-4 bg-neon-green/30" />
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                {quote.author}
              </p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
});

const ProgressCircle = memo(({ level, progressPercent, xp, requiredXP, weeklyRank, globalRank, topSkill }: { level: number, progressPercent: number, xp: number, requiredXP: number, weeklyRank: string, globalRank: string, topSkill: string }) => (
  <GlassCard className="col-span-8 flex items-center gap-12">
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-white/5"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={440}
          strokeDashoffset={440 - (440 * progressPercent) / 100}
          className="text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Level {level}</span>
        <div className="flex items-baseline justify-center tabular-nums">
          <span className="text-2xl font-sans font-bold text-white">
            {Math.floor(progressPercent)}
          </span>
          <span className="text-2xl font-bold text-white ml-0.5">%</span>
        </div>
      </div>
    </div>

    <div className="flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-sans font-bold">Progress Overview</h3>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-3">
        <div 
          className="h-full bg-neon-green shadow-[0_0_10px_rgba(57,255,20,0.5)] transition-all duration-1000" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{xp}/{requiredXP} XP earned to Level {level + 1}</span>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Weekly Rank</div>
          <div className="text-lg font-sans font-bold text-white">{weeklyRank}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Global Rank</div>
          <div className="text-lg font-sans font-bold text-white">{globalRank}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Top Skill</div>
          <div className="text-lg font-sans font-bold text-white">{topSkill}</div>
        </div>
      </div>
    </div>
  </GlassCard>
));

const TrendsChart = memo(({ displayChartData, visibleLines }: { displayChartData: any[], visibleLines: any }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      {/* existing defs */}
      <defs>
        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#39FF14" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id="colorPlanner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
      <XAxis 
        dataKey="name" 
        stroke="#444" 
        fontSize={10} 
        tickLine={false} 
        axisLine={false}
        dy={10}
      />
      <YAxis 
        domain={[0, 100]} 
        hide 
      />
      <Tooltip 
        content={({ active, payload, label }) => {
          if (active && payload && payload.length) {
            return (
              <div className="bg-[#1a1d21]/95 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl ring-1 ring-white/5">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-3">{label} Analysis</p>
                <div className="space-y-3">
                  {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs font-bold text-white/90 capitalize">{entry.name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold" style={{ color: entry.color }}>
                          {entry.name === 'focus' ? `${entry.payload.focusRawValue}h` : 
                           entry.name === 'planner' ? `${entry.payload.plannerRawValue} Tasks` : 
                           `${entry.payload.healthRawValue} Score`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        }}
      />
      {visibleLines.focus && (
        <Area 
          type="monotone" 
          dataKey="focus" 
          name="focus"
          stroke="#39FF14" 
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorFocus)"
          animationDuration={2000}
        />
      )}
      {visibleLines.planner && (
        <Area 
          type="monotone" 
          dataKey="planner" 
          name="planner"
          stroke="#a855f7" 
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorPlanner)"
          animationDuration={2000}
        />
      )}
      {visibleLines.health && (
        <Area 
          type="monotone" 
          dataKey="health" 
          name="health"
          stroke="#60a5fa" 
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorHealth)"
          animationDuration={2000}
        />
      )}
    </AreaChart>
  </ResponsiveContainer>
));

export function Dashboard() {
  const [quote, setQuote] = useState({ text: "Loading inspiration...", author: "" });
  const [aiInsight, setAiInsight] = useState("Analyzing your performance...");
  const [activeTab, setActiveTab] = useState("Week");

  const { 
    user,
    xp, 
    level, 
    focusTime, 
    tasksCompleted, 
    detoxPercent, 
    sessionScores,
    totalNetFocusTime,
    physicalFitness,
    weeklyRank,
    globalRank,
    topSkill,
    toggleFocus,
    incrementTasks,
    addFitness,
    updateDetox,
    addXP,
    getRequiredXP,
    tasks,
    hydrationIntake,
    sleepHours,
    geminiApiKey,
    focusHistory,
    healthHistory,
    isDataLoading,
    connectionError,
    setIsAuthModalOpen
  } = useDisplayState();

  const [visibleLines, setVisibleLines] = useState({
    focus: true,
    planner: true,
    health: true
  });

  const getLocalDateString = (date: Date) => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const requiredXP = getRequiredXP(level);
  const progressPercent = (xp / requiredXP) * 100;

  useEffect(() => {
    getDailyQuote(geminiApiKey).then(setQuote);
  }, [geminiApiKey]);

  // Debounce AI insight calls to prevent hitting rate limits
  useEffect(() => {
    if ((tasksCompleted > 0 || focusTime > 0) && !isDataLoading) {
      const timer = setTimeout(() => {
        getAIInsight({ focusTime, tasks: tasksCompleted }, geminiApiKey).then(setAiInsight);
      }, 5000); // Only update every 5 seconds of activity
      return () => clearTimeout(timer);
    }
  }, [tasksCompleted, Math.floor(focusTime / 60), geminiApiKey, isDataLoading]); // Only trigger on task change or every minute of focus

  const displayChartData = useMemo(() => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    let numPoints = 7;
    let labelFormat: (d: Date) => string;
    let mapKey: (d: Date) => string;

    if (activeTab === "Week") {
      numPoints = 7;
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labelFormat = (d) => dayNames[d.getDay()];
      mapKey = (d) => getLocalDateString(d);
    } else if (activeTab === "Month") {
      numPoints = 30;
      labelFormat = (d) => `${d.getDate()}`;
      mapKey = (d) => getLocalDateString(d);
    } else { // Year
      numPoints = 12;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      labelFormat = (d) => monthNames[d.getMonth()];
      mapKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    const dataPoints = Array.from({ length: numPoints }, (_, i) => {
      const d = new Date(todayDate);
      if (activeTab === "Year") {
        d.setMonth(d.getMonth() - (11 - i));
        d.setDate(1); // Standardize on first of month to avoid overflow issues
      } else {
        d.setDate(d.getDate() - (numPoints - 1 - i));
      }
      
      return {
        key: mapKey(d),
        name: labelFormat(d),
        focus: 0,
        planner: 0,
        health: 0,
        focusRaw: 0,
        plannerRaw: 0,
        healthRaw: 0
      };
    });

    // Aggregate Focus (Net focus time)
    (focusHistory || []).forEach(s => {
      const sDate = new Date(s.start_time || s.timestamp);
      const k = activeTab === "Year" 
        ? `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}`
        : getLocalDateString(sDate);
      const dp = dataPoints.find(d => d.key === k);
      if (dp) {
        const dur = s.session_duration || 0;
        const score = s.growth_percentage || 0;
        dp.focusRaw += (score / 100) * dur;
      }
    });

    // Aggregate Health Metrics
    (healthHistory || []).forEach(h => {
      const k = activeTab === "Year" 
        ? h.entry_date.substring(0, 7)
        : h.entry_date;
      const dp = dataPoints.find(d => d.key === k);
      if (dp) {
        const sleep = h.sleep_hours || 0;
        const hydration = h.hydration || 0;
        const score = (sleep * 0.6 + hydration * 0.4);
        if (activeTab === "Year") {
          dp.healthRaw += score;
        } else {
          dp.healthRaw = Math.max(dp.healthRaw, score);
        }
      }
    });

    // Aggregate Planner Tasks
    tasks.forEach(t => {
      if (t.status === 'Done') {
        const k = activeTab === "Year" 
          ? t.date.substring(0, 7)
          : t.date;
        const dp = dataPoints.find(d => d.key === k);
        if (dp) {
          dp.plannerRaw += 1;
        }
      }
    });

    // Normalize
    const focusGoal = activeTab === "Year" ? 28800 * 30 : 28800; // 8h/day goal
    const healthGoal = activeTab === "Year" ? 6 * 30 : 6;
    const plannerGoal = activeTab === "Year" ? 5 * 30 : 5;

    return dataPoints.map(d => ({
      ...d,
      focus: Math.min(100, (d.focusRaw / focusGoal) * 100),
      health: Math.min(100, (d.healthRaw / healthGoal) * 100),
      planner: Math.min(100, (d.plannerRaw / plannerGoal) * 100),
      focusRawValue: (d.focusRaw / 3600).toFixed(1),
      healthRawValue: d.healthRaw.toFixed(1),
      plannerRawValue: d.plannerRaw
    }));
  }, [focusHistory, healthHistory, tasks, activeTab]);

  const handleAIAction = async (type: 'consistency' | 'peak') => {
    setAiInsight("AI is thinking...");
    const insight = await getAIInsight({ 
      type, 
      focusTime, 
      tasks: tasksCompleted, 
      level, 
      xp 
    }, geminiApiKey);
    setAiInsight(insight);
  };

  if (connectionError && user) {
    return (
      <div className="flex-1 p-8 md:px-12 pt-4 flex flex-col items-center justify-center">
        <GlassCard className="p-8 text-center max-w-lg border-red-500/20 bg-red-500/5">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-50 mb-2">Connection Error</h2>
          <p className="text-red-200/60 text-sm mb-6">{connectionError}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg transition-colors text-sm font-bold tracking-widest uppercase">
            Retry Connection
          </button>
        </GlassCard>
      </div>
    );
  }

  if (isDataLoading && user) {
    return (
      <div className="flex-1 p-8 md:px-12 pt-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-[32px] mb-8" />
        <div className="grid grid-cols-12 gap-8 mb-8">
          <div className="col-span-8 h-48 bg-white/5 rounded-[32px]" />
          <div className="col-span-4 h-48 bg-white/5 rounded-[32px]" />
        </div>
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-white/5 rounded-[32px]" />)}
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 h-96 bg-white/5 rounded-[32px]" />
          <div className="col-span-4 h-96 bg-white/5 rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-visible p-8 md:px-12 pt-4">
      {/* Daily Inspiration Wrapper to prevent clipping */}
      <DailyInspiration quote={quote} />

      <div className="grid grid-cols-12 gap-8 mb-8">
        <ProgressCircle level={level} progressPercent={progressPercent} xp={xp} requiredXP={requiredXP} weeklyRank={weeklyRank} globalRank={globalRank} topSkill={topSkill} />

        {/* AI Insight Card */}
        <GlassCard className="col-span-4 flex flex-col p-6">
          <div className="flex items-center gap-3 mb-5">
            <Brain className="w-8 h-8 text-neon-green" />
            <h3 className="text-2xl font-sans font-bold">AI Advisor</h3>
          </div>
          <p className="text-white/70 text-base leading-relaxed mb-8 flex-1">
            {aiInsight}
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => handleAIAction('consistency')}
              className="w-full py-3 rounded-xl bg-neon-green text-black font-bold text-sm uppercase tracking-widest hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Consistency Check
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button 
              onClick={() => handleAIAction('peak')}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all duration-300"
            >
              Peak Performance
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-4 gap-6 mb-8 overflow-visible p-4 -m-4">
        {[
      { icon: Clock, label: "FOCUS TIME", value: formatTime(totalNetFocusTime), color: "text-blue-400", glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]", border: "border-blue-400/20", bg: "bg-blue-400/5", iconBg: "bg-blue-400/10" },
      { icon: CheckCircle2, label: "TASKS COMPLETED", value: (tasksCompleted || 0).toString(), color: "text-purple-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", border: "border-purple-500/20", bg: "bg-purple-500/5", iconBg: "bg-purple-500/10" },
      { icon: TrendingUp, label: "Detox", value: `${detoxPercent}%`, color: "text-neon-green", glow: "shadow-[0_0_20px_rgba(57,255,20,0.3)]", border: "border-neon-green/20", bg: "bg-neon-green/5", iconBg: "bg-neon-green/10" },
      { icon: Heart, label: "PHYSICAL FITNESS", value: `${physicalFitness}/200`, color: "text-red-400", glow: "shadow-[0_0_20px_rgba(248,113,113,0.3)]", border: "border-red-400/20", bg: "bg-red-400/5", iconBg: "bg-red-400/10" },
    ].map((metric) => (
      <Fragment key={metric.label}>
        <GlassCard 
          className={cn(
            "p-8 rounded-[32px] border transition-all duration-500 cursor-default",
            metric.border,
            metric.bg,
            metric.glow
          )}
        >
              <div className="flex items-start justify-between mb-8">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center relative overflow-hidden", metric.iconBg)}>
                  <div className={cn("absolute inset-0 blur-lg opacity-50", metric.bg)} />
                  <metric.icon className={cn("w-7 h-7 relative z-10", metric.color)} />
                </div>
              </div>
              <div className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-3">{metric.label}</div>
              <div className={cn("text-4xl font-mono font-bold tabular-nums", metric.color)}>{metric.value}</div>
            </GlassCard>
          </Fragment>
        ))}
      </div>

      {/* Quick Access & Productivity Graph */}
      <div className="grid grid-cols-12 gap-8 overflow-visible p-4 -m-4">
        <GlassCard className="col-span-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-sans font-bold">Productivity Trends</h3>
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, focus: !prev.focus }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    visibleLines.focus ? "bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.focus ? "bg-[#39FF14] shadow-[0_0_8px_#39FF14]" : "bg-white/20")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Focus</span>
                </button>
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, planner: !prev.planner }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    visibleLines.planner ? "bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7]" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.planner ? "bg-[#a855f7] shadow-[0_0_8px_#a855f7]" : "bg-white/20")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Planner</span>
                </button>
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, health: !prev.health }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    visibleLines.health ? "bg-[#60a5fa]/10 border-[#60a5fa]/30 text-[#60a5fa]" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.health ? "bg-[#60a5fa] shadow-[0_0_8px_#60a5fa]" : "bg-white/20")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Health</span>
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              {["Week", "Month", "Year"].map((t) => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all",
                    activeTab === t ? "bg-neon-green/10 border-neon-green/30 text-neon-green" : "border-white/10 text-white/40 hover:text-white"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <TrendsChart displayChartData={displayChartData} visibleLines={visibleLines} />
          </div>
        </GlassCard>

        <DistractionGuard />
      </div>
    </div>
  );
}
