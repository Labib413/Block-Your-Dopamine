import { useState, useEffect, Fragment, memo } from "react";
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
  Link as LinkIcon
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { getDailyQuote, getAIInsight } from "../services/gemini";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from "recharts";
import { cn, formatTime } from "@/src/lib/utils";
import { useApp } from "../context/AppContext";

const initialChartData = [
  { name: "Mon", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Tue", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Wed", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Thu", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Fri", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Sat", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
  { name: "Sun", focus: 0, planner: 0, health: 0, focusRaw: 0, plannerRaw: 0, healthRaw: 0 },
];

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

export function Dashboard() {
  const [quote, setQuote] = useState({ text: "Loading inspiration...", author: "" });
  const [aiInsight, setAiInsight] = useState("Analyzing your performance...");
  const [chartData, setChartData] = useState(initialChartData);
  const [activeTab, setActiveTab] = useState("Week");
  const [blockedWebsites, setBlockedWebsites] = useState<{ name: string; url: string }[]>(() => {
    const saved = localStorage.getItem("blockedWebsites");
    return saved ? JSON.parse(saved) : [];
  });
  const [newSiteName, setNewSiteName] = useState("");
  const [newSiteUrl, setNewSiteUrl] = useState("");

  useEffect(() => {
    localStorage.setItem("blockedWebsites", JSON.stringify(blockedWebsites));
  }, [blockedWebsites]);

  const addWebsite = (e: any) => {
    e.preventDefault();
    if (newSiteName && newSiteUrl) {
      setBlockedWebsites([...blockedWebsites, { name: newSiteName, url: newSiteUrl }]);
      setNewSiteName("");
      setNewSiteUrl("");
    }
  };

  const removeWebsite = (index: number) => {
    setBlockedWebsites(blockedWebsites.filter((_, i) => i !== index));
  };

  const { 
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
    sleepHours
  } = useApp();

  const [visibleLines, setVisibleLines] = useState({
    focus: true,
    planner: true,
    health: true
  });

  const requiredXP = getRequiredXP(level);
  const progressPercent = (xp / requiredXP) * 100;

  useEffect(() => {
    getDailyQuote().then(setQuote);
  }, []);

  // Debounce AI insight calls to prevent hitting rate limits
  useEffect(() => {
    if (tasksCompleted > 0 || focusTime > 0) {
      const timer = setTimeout(() => {
        getAIInsight({ focusTime, tasks: tasksCompleted }).then(setAiInsight);
      }, 5000); // Only update every 5 seconds of activity
      return () => clearTimeout(timer);
    }
  }, [tasksCompleted, Math.floor(focusTime / 60)]); // Only trigger on task change or every minute of focus

  // Update chart data based on activity
  useEffect(() => {
    const today = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    
    // Calculate metrics
    const focusHours = totalNetFocusTime / 3600;
    const focusPercent = Math.min(100, (focusHours / 10) * 100); // 10h = 100%
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const plannerPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const healthPercent = Math.min(100, ((sleepHours / 8) * 50) + ((hydrationIntake / 8) * 50));
    const healthScore = (sleepHours * 0.6 + hydrationIntake * 0.4).toFixed(1);

    setChartData(prev => prev.map(d => 
      d.name === today ? { 
        ...d, 
        focus: focusPercent, 
        planner: plannerPercent, 
        health: healthPercent,
        focusRaw: focusHours.toFixed(1),
        plannerRaw: plannerPercent.toFixed(0),
        healthRaw: healthScore
      } : d
    ));
  }, [totalNetFocusTime, tasks, sleepHours, hydrationIntake]);

  const handleAIAction = async (type: 'consistency' | 'peak') => {
    setAiInsight("AI is thinking...");
    const insight = await getAIInsight({ 
      type, 
      focusTime, 
      tasks: tasksCompleted, 
      level, 
      xp 
    });
    setAiInsight(insight);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-visible p-8 md:px-12 pt-4">
      {/* Daily Inspiration Wrapper to prevent clipping */}
      <DailyInspiration quote={quote} />

      <div className="grid grid-cols-12 gap-8 mb-8">
        {/* Progress Card */}
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
      { icon: CheckCircle2, label: "TASKS COMPLETED", value: tasksCompleted.toString(), color: "text-purple-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", border: "border-purple-500/20", bg: "bg-purple-500/5", iconBg: "bg-purple-500/10" },
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
                    visibleLines.focus ? "bg-neon-green/10 border-neon-green/30 text-neon-green" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.focus ? "bg-neon-green shadow-[0_0_8px_#39FF14]" : "bg-white/20")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Focus</span>
                </button>
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, planner: !prev.planner }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    visibleLines.planner ? "bg-purple-500/10 border-purple-500/30 text-purple-500" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.planner ? "bg-purple-500 shadow-[0_0_8px_#A855F7]" : "bg-white/20")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Planner</span>
                </button>
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, health: !prev.health }))}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    visibleLines.health ? "bg-blue-400/10 border-blue-400/30 text-blue-400" : "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", visibleLines.health ? "bg-blue-400 shadow-[0_0_8px_#60A5FA]" : "bg-white/20")} />
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.2)" 
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
                        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3">{label} Metrics</p>
                          <div className="space-y-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-xs font-bold text-white/80 capitalize">{entry.name}</span>
                                </div>
                                <span className="text-xs font-mono font-bold" style={{ color: entry.color }}>
                                  {entry.name === 'focus' ? `${entry.payload.focusRaw}h` : 
                                   entry.name === 'planner' ? `${entry.payload.plannerRaw}%` : 
                                   `${entry.payload.healthRaw} Score`}
                                </span>
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
                  <Line 
                    type="monotone" 
                    dataKey="focus" 
                    name="focus"
                    stroke="#39FF14" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#39FF14", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, shadow: "0 0 15px #39FF14" }}
                    connectNulls
                    animationDuration={1500}
                  />
                )}
                {visibleLines.planner && (
                  <Line 
                    type="monotone" 
                    dataKey="planner" 
                    name="planner"
                    stroke="#A855F7" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#A855F7", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, shadow: "0 0 15px #A855F7" }}
                    connectNulls
                    animationDuration={1500}
                  />
                )}
                {visibleLines.health && (
                  <Line 
                    type="monotone" 
                    dataKey="health" 
                    name="health"
                    stroke="#60A5FA" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#60A5FA", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0, shadow: "0 0 15px #60A5FA" }}
                    connectNulls
                    animationDuration={1500}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard 
          className="col-span-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)] bg-red-950/40 rounded-[32px] p-8 relative overflow-visible" 
          hoverEffect={false}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center relative overflow-visible shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                <div className="absolute inset-0 bg-red-500/30 blur-lg opacity-50" />
                <ShieldAlert className="w-7 h-7 text-red-500 relative z-10 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-red-500/60 uppercase tracking-[0.2em] mb-1">SECURITY PROTOCOL</div>
                <h3 className="text-2xl font-sans font-bold text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">Distraction Guard</h3>
              </div>
            </div>
            
            <div className="space-y-6">
              <form onSubmit={addWebsite} className="space-y-3">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Website Name (e.g. Facebook)"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-red-500/30 focus:outline-none focus:border-red-500/50 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Website Link (e.g. facebook.com)"
                    value={newSiteUrl}
                    onChange={(e) => setNewSiteUrl(e.target.value)}
                    className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder:text-red-500/30 focus:outline-none focus:border-red-500/50 transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add to Guard
                </button>
              </form>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {blockedWebsites.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-red-500/20 rounded-2xl">
                    <Globe className="w-8 h-8 text-red-500/20 mx-auto mb-2" />
                    <p className="text-xs text-red-500/40 font-medium uppercase tracking-wider">No websites guarded</p>
                  </div>
                ) : (
                  blockedWebsites.map((site, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 group/item hover:border-red-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <LinkIcon className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-sm font-bold text-white truncate">{site.name}</div>
                          <div className="text-[10px] text-red-500/60 truncate">{site.url}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeWebsite(index)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-500/40 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
