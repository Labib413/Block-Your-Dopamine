import { useState, ChangeEvent, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  Music, 
  Youtube, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Volume2, 
  Wind, 
  CloudRain, 
  Coffee, 
  Trees,
  Trash2,
  ExternalLink,
  Play,
  TrendingUp,
  ArrowLeft,
  RotateCcw,
  Upload,
  Globe,
  Loader2
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn, formatTime, generateId, isValidUrl } from "@/src/lib/utils";
import { useApp, Resource, ResourceType, ChapterResource } from "../context/AppContext";
import { useBYDData } from "../hooks/useBYDData";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { supabase } from "../lib/supabase";
import { HSC_SUBJECT_NAMES } from "../constants";

export function DetoxView({ onBack, initialTab = "Overview" }: { onBack: () => void, initialTab?: "Overview" | "Set Focus" }) {
  const [activeTab, setActiveTab] = useState<"Overview" | "Set Focus">(initialTab);
  const { 
    detoxPercent: contextDetoxPercent, 
    totalNetFocusTime: contextTotalNetFocusTime, 
    dailyTotalFocusTime: contextDailyTotalFocusTime, 
    focusTime,
    dailyGoalHours, 
    dailySessions, 
    setDailyGoalHours, 
    startFocusSession, 
    resources, 
    academicSettings,
    academicChapters,
    addResource, 
    removeResource,
    syncData
  } = useApp();

  const activeSubjectId = academicSettings.focusSubjectId;
  const activeSubjectName = activeSubjectId ? HSC_SUBJECT_NAMES[activeSubjectId] : null;

  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [hasCache] = useState(() => localStorage.getItem('focus_date') !== null);

  // Fetch latest focus data on mount
  useEffect(() => {
    syncData();
  }, [syncData]);

  const completedHours = contextTotalNetFocusTime / 3600;
  const goalPercentage = dailyGoalHours > 0 ? Math.min(100, (completedHours / dailyGoalHours) * 100) : 0;

  // Set Focus State
  const [timerDuration, setTimerDuration] = useState(25);
  const [timerInput, setTimerInput] = useState("00:25");
  const [selectedSound, setSelectedSound] = useState("Rain");
  const [volume, setVolume] = useState(50);
  const [resourceTab, setResourceTab] = useState<ResourceType>("YOUTUBE");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [goalInput, setGoalInput] = useState((dailyGoalHours || 2).toString());
  const [isUploading, setIsUploading] = useState(false);

  // Persistence: Fetch resources from Supabase
  const { data: dbResources, updateData: upsertResource, deleteData: removeDbResource } = useBYDData('resources');
  useRealtimeSync('resources');
  
  const allResources = useMemo(() => {
    const subjectResources = !activeSubjectId 
        ? [] 
        : academicChapters.filter(c => c.subject_id === activeSubjectId).flatMap(c => c.resources || []);

    const formattedSubjectRes = subjectResources.map(r => ({
      ...r,
      type: (r.url.includes('youtube.com') || r.url.includes('youtu.be')) ? 'YOUTUBE' : 'OTHERS'
    } as Resource));
    
    return [...(dbResources || []), ...formattedSubjectRes];
  }, [dbResources, activeSubjectId, academicChapters]);

  const handleUpdateGoal = () => {
    const str = goalInput.toLowerCase().trim();
    if (!str) return;

    let hours = 0;
    let minutes = 0;

    if (str.includes(':')) {
      const parts = str.split(':');
      hours = parseInt(parts[0]) || 0;
      minutes = parseInt(parts[1]) || 0;
    } else if (str.match(/[hm]/)) {
      const hMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hour)/);
      const mMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minute)/);
      
      if (hMatch) hours = parseFloat(hMatch[1]);
      if (mMatch) minutes = parseFloat(mMatch[1]);
    } else {
      const val = parseFloat(str);
      if (!isNaN(val)) {
        hours = val;
      }
    }

    const totalHours = hours + (minutes / 60);
    if (totalHours > 0) {
      const rounded = Math.round(totalHours * 10) / 10;
      setGoalInput(rounded.toString());
      setDailyGoalHours(rounded);
    }
  };

  const formatTimeHHMM = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setTimerInput(formatTimeHHMM(timerDuration));
  }, [timerDuration]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!newResourceTitle) {
        setNewResourceTitle(file.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleAddResource = async () => {
    if (!newResourceTitle) return;
    
    let finalUrl = newResourceUrl;
    
    if (selectedFile) {
      setIsUploading(true);
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${generateId()}.${fileExt}`;
        const filePath = `pdfs/${fileName}`;

        const { data, error } = await supabase.storage
          .from('Resources')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('Resources')
          .getPublicUrl(filePath);
        
        finalUrl = publicUrl;
      } catch (err: any) {
        console.error("Error uploading to Supabase:", err);
        alert(`Upload failed: ${err.message || "Unknown error"}. Please ensure the 'Resources' bucket exists and is public.`);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else if (newResourceUrl) {
      // Security: Validate the provided URL
      if (!isValidUrl(newResourceUrl)) {
        alert("Invalid or unsafe URL. Please provide a valid web link.");
        return;
      }

      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }
    } else {
      return; // Neither file nor URL
    }

    const newResource: Resource = {
      id: generateId(),
      type: resourceTab,
      title: newResourceTitle,
      url: finalUrl
    };
    upsertResource(newResource);
    setNewResourceTitle("");
    setNewResourceUrl("");
    setSelectedFile(null);
  };

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and colon
    if (!/^[0-9:]*$/.test(value)) return;
    setTimerInput(value);
  };

  const handleTimeBlur = () => {
    const value = timerInput;
    if (value.includes(':')) {
      const parts = value.split(':');
      const [h, m] = parts;
      const hours = parseInt(h) || 0;
      const minutes = parseInt(m) || 0;
      setTimerDuration(Math.min(720, hours * 60 + minutes));
    } else {
      const mins = parseInt(value) || 0;
      setTimerDuration(Math.min(720, mins));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 relative">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group z-20"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
      </button>

      {/* Detox Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="flex items-center gap-6 mb-2">
          <div className="w-14 h-14 bg-neon-green rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(57,255,20,0.4)]">
            <TrendingUp className="text-black w-8 h-8" strokeWidth={2.5} />
          </div>
          <h1 
            className="text-6xl font-modern font-bold tracking-tight text-neon-green uppercase italic"
          >
            Detox
          </h1>
        </div>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em]">
          {activeSubjectName ? `Focusing on ${activeSubjectName}` : "Concentration Mode"}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-12">
        {["Overview", "Set Focus"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-500 border",
              activeTab === tab 
                ? "bg-neon-green text-black border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.5)] scale-105" 
                : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "Overview" ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-12 gap-8">
              <GlassCard className="col-span-6 p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 rounded-2xl bg-neon-green/10">
                    <TrendingUp className="w-8 h-8 text-neon-green" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-sans font-bold">Detox Status</h2>
                    <p className="text-white/40">Monitor your digital consumption and focus health.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Detox Score</div>
                    <div className="text-3xl 2xl:text-4xl font-sans font-bold text-neon-green">
                      {contextDetoxPercent}%
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Net Focus Time</div>
                    <div className="text-3xl 2xl:text-4xl font-mono font-bold text-white tabular-nums">{formatTime(contextTotalNetFocusTime)}</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Total Focus</div>
                    <div className="text-3xl 2xl:text-4xl font-mono font-bold text-white tabular-nums">{formatTime(contextDailyTotalFocusTime)}</div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="col-span-6 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-3xl rounded-full pointer-events-none" />
                <div className="grid grid-cols-2 gap-8 h-full relative z-10">
                  {/* Daily Goal Progress */}
                  <div className="flex flex-col justify-center items-center text-center border-r border-white/10 pr-8">
                    <div className="w-32 h-32 flex items-center justify-center mb-6 relative">
                      {/* SVG Circular Progress Bar */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={364.4}
                          strokeDashoffset={364.4 - (364.4 * goalPercentage) / 100}
                          strokeLinecap="round"
                          className="text-neon-green drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] transition-all duration-700 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="flex items-baseline justify-center">
                          <>
                            <span className="text-3xl font-sans font-bold text-white">
                              {goalPercentage.toFixed(1)}
                            </span>
                            <span className="text-3xl font-bold text-white ml-0.5">%</span>
                          </>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-sans font-bold mb-2 uppercase tracking-tighter italic text-neon-green">Daily Goal</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                      YOU HAVE COMPLETED {completedHours.toFixed(1)} HOURS OF YOUR {dailyGoalHours} HOUR GOAL.
                    </p>
                  </div>

                  {/* Set Your Goal */}
                  <div className="flex flex-col justify-center items-center text-center pl-4">
                    <h3 className="text-xl font-sans font-bold mb-6 text-neon-green">Set Your Goal</h3>
                    <div className="flex flex-col gap-4 w-full max-w-[150px]">
                      <div className="flex flex-col gap-2 text-left">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Target Time</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            onBlur={handleUpdateGoal}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateGoal(); }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-2xl font-sans font-bold text-center outline-none focus:border-neon-green/50 transition-colors" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="set-focus"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-12 gap-8"
          >
            {/* Left Column: Timer & Sound */}
            <div className="col-span-7 space-y-8">
              <div className="h-[350px] flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-neon-green" />
                  <h2 className="text-xl font-sans font-bold text-neon-green uppercase italic tracking-tighter">Setup Focus Session</h2>
                </div>

                <GlassCard className="flex-1 p-3 text-center bg-white/10 border-white/20 shadow-[0_0_20px_rgba(57,255,20,0.05)] relative overflow-hidden group flex flex-col justify-center">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="text-[8px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">Session Duration</div>
                  
                  <div className="relative mb-8">
                    {/* Glowing Neon Green Progress Circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-48 h-48 transform -rotate-90">
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="1"
                          fill="transparent"
                          className="text-white/5"
                        />
                        <circle
                          cx="96"
                          cy="96"
                          r="88"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="transparent"
                          strokeDasharray={553} // 2 * PI * 88
                          strokeDashoffset={553 - (553 * Math.min(240, timerDuration)) / 240}
                          strokeLinecap="round"
                          className="text-neon-green drop-shadow-[0_0_12px_rgba(57,255,20,0.8)] transition-all duration-700 ease-out"
                        />
                      </svg>
                    </div>
                    
                    {/* Time Input Centered in Circle */}
                    <div className="relative flex flex-col items-center justify-center w-48 h-48">
                      <div className="relative group/input">
                        <input 
                          type="text"
                          value={timerInput}
                          onChange={handleTimeChange}
                          onBlur={handleTimeBlur}
                          onKeyDown={(e) => e.key === 'Enter' && handleTimeBlur()}
                          className="text-5xl font-sans font-bold text-white bg-transparent border-none text-center focus:outline-none focus:ring-0 w-[160px] tracking-tighter cursor-pointer hover:text-neon-green transition-colors"
                        />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-1 bg-neon-green group-focus-within/input:w-full transition-all duration-500 shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-3 gap-3 px-4">
                    {[25, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setTimerDuration(mins)}
                        className={cn(
                          "py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all",
                          timerDuration === mins 
                            ? "bg-neon-green/20 border-neon-green text-neon-green shadow-[0_0_12px_rgba(57,255,20,0.2)]" 
                            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Music className="w-5 h-5 text-neon-green" />
                <h3 className="text-lg font-sans font-bold">Focus Sound Selector</h3>
              </div>
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {[
                    { name: "White Noise", icon: Wind },
                    { name: "Rain", icon: CloudRain },
                    { name: "Lofi", icon: Coffee },
                    { name: "Nature", icon: Trees },
                  ].map((sound) => (
                    <button
                      key={sound.name}
                      onClick={() => setSelectedSound(sound.name)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
                        selectedSound === sound.name 
                          ? "bg-neon-green/10 border-neon-green/40 text-neon-green" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <sound.icon className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase tracking-widest">{sound.name}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Volume</span>
                    <span className="text-xs font-bold text-neon-green">{volume}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Volume2 className="w-4 h-4 text-white/20" />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right Column: Resources */}
            <div className="col-span-5 space-y-8">
              <div className="h-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-sans font-bold">Study Resources</h3>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{allResources.length} Added</span>
                </div>
                <GlassCard className="flex-1 p-6 overflow-y-auto relative bg-white/5 border-white/10 shadow-inner">
                  {allResources.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white/10 font-sans font-bold text-xl uppercase tracking-[0.2em]">No resources added</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allResources.map((res) => (
                        <div key={res.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5">
                              {res.type === "YOUTUBE" && <Youtube className="w-4 h-4 text-red-500" />}
                              {res.type === "PDF" && <FileText className="w-4 h-4 text-blue-500" />}
                              {res.type === "IMAGE" && <ImageIcon className="w-4 h-4 text-purple-500" />}
                              {res.type === "OTHERS" && <Globe className="w-4 h-4 text-emerald-500" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{res.title}</div>
                              <div className="text-[10px] text-white/40 truncate max-w-[150px]">{res.url}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a 
                              href={res.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 hover:text-neon-green transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => removeResource(res.id)}
                              className="p-2 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              <GlassCard className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Plus className="w-5 h-5 text-neon-green" />
                  <h3 className="text-lg font-sans font-bold">Add Resources Panel</h3>
                </div>

                <div className="flex gap-2 mb-6">
                  {(["YOUTUBE", "PDF", "IMAGE", "OTHERS"] as ResourceType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResourceTab(tab)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all border",
                        resourceTab === tab 
                          ? "bg-white/10 border-white/20 text-white" 
                          : "bg-transparent border-transparent text-white/20 hover:text-white/40"
                      )}
                    >
                      [{tab}]
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Title</label>
                    <input 
                      type="text" 
                      placeholder="Enter resource title..."
                      value={newResourceTitle}
                      onChange={(e) => setNewResourceTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">
                      {resourceTab === "YOUTUBE" ? "Video URL" : resourceTab === "PDF" ? "PDF Link / Upload" : resourceTab === "IMAGE" ? "Image URL / Upload" : "Website URL (http/https)"}
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder={selectedFile ? `Selected: ${selectedFile.name}` : resourceTab === "OTHERS" ? "https://example.com" : "Paste link here..."}
                          value={newResourceUrl}
                          onChange={(e) => {
                            setNewResourceUrl(e.target.value);
                            if (e.target.value) setSelectedFile(null);
                          }}
                          disabled={!!selectedFile}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 transition-colors disabled:opacity-50"
                        />
                        <button 
                          type="button"
                          onClick={handleAddResource}
                          disabled={!newResourceTitle || (!newResourceUrl && !selectedFile) || isUploading}
                          className="w-12 h-12 rounded-xl bg-neon-green text-black flex items-center justify-center hover:bg-white transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)] disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                        </button>
                      </div>
                      
                      {resourceTab !== "YOUTUBE" && resourceTab !== "OTHERS" && (
                        <div className="relative">
                          <input 
                            type="file" 
                            id="file-upload"
                            className="hidden" 
                            accept={resourceTab === "PDF" ? ".pdf" : "image/*"}
                            onChange={handleFileChange}
                          />
                          <label 
                            htmlFor="file-upload"
                            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-dashed border-white/20 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Upload className="w-3 h-3" />
                            {selectedFile ? "Change File" : "Upload from Device"}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Bottom Action Button */}
            <div className="col-span-12 flex justify-center pt-12 pb-4">
              <button 
                onClick={() => startFocusSession(timerDuration, activeSubjectId || undefined)}
                disabled={timerDuration <= 0}
                className={cn(
                  "px-16 py-5 rounded-full font-black text-xl uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-4 group relative overflow-hidden ring-4 ring-white/10",
                  timerDuration <= 0 
                    ? "bg-white/10 text-white/40 cursor-not-allowed" 
                    : "bg-neon-green text-black shadow-[0_0_50px_rgba(57,255,20,0.4)] hover:shadow-[0_0_70px_rgba(57,255,20,0.6)] hover:scale-[1.05] active:scale-95"
                )}
              >
                <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                <Play className="w-6 h-6 fill-current group-hover:scale-110 transition-transform relative z-10" />
                <span className="relative z-10">START FOCUS SESSION</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
