import React, { useState } from "react";
import { 
  CalendarCheck, 
  ListTodo, 
  Calendar, 
  Clock, 
  Bell, 
  Plus, 
  Trash2,
  ChevronDown,
  Target,
  Tag,
  GraduationCap,
  Church,
  Layers,
  Circle,
  CircleDot,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn, generateId } from "@/src/lib/utils";
import { useApp } from "@/src/context/AppContext";

type Priority = "Low" | "Medium" | "High";
type Status = "To Do" | "In Progress" | "Done";

interface Task {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  priority: Priority | null;
  reminders: string[];
  status: Status;
}

interface PlannerProps {
  onBack?: () => void;
}

const categories = [
  { name: "Academic", icon: GraduationCap },
  { name: "Religious", icon: Church },
  { name: "Others", icon: Layers }
];

const getCategoryIcon = (catName: string) => {
  const cat = categories.find(c => c.name === catName);
  return cat ? cat.icon : Tag;
};

const getPriorityColor = (p: Priority | null) => {
  switch (p) {
    case "High": return "text-red-400 border-red-400/30 bg-red-400/10 shadow-[0_0_10px_rgba(248,113,113,0.2)]";
    case "Medium": return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]";
    case "Low": return "text-green-400 border-green-400/30 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.2)]";
    default: return "text-white/40 border-white/20 bg-white/5";
  }
};

export function Planner({ onBack }: PlannerProps) {
  const { tasks, addTask, deleteTask, updateTaskStatus } = useApp();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<string[]>([]);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  };

  const setQuickTime = (hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    setTime(timeStr);
  };

  const reminders = [
    "No reminders", 
    "At time of event",
    "5 mins before", 
    "10 mins before",
    "15 mins before", 
    "30 mins before",
    "1 hour before", 
    "2 hours before",
    "1 day before"
  ];

  const handleAddTask = () => {
    if (!title.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      title,
      category,
      date,
      time,
      priority,
      reminders: selectedReminders,
      status: "To Do"
    };
    
    addTask(newTask);
    setTitle("");
    setCategory("");
    setDate("");
    setTime("");
    setPriority(null);
    setSelectedReminders([]);
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    updateTaskStatus(id, newStatus);
  };

  const todoTasks = tasks.filter(t => t.status === "To Do");
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const doneTasks = tasks.filter(t => t.status === "Done");

  return (
    <div className="flex-1 flex justify-center p-8 pt-0 scrollbar-hide relative overflow-hidden">
      {/* Background Ambient Glows for Neon Effect */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-500/30 blur-[130px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-purple-500/20 blur-[100px] rounded-full pointer-events-none" />
      
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all group z-20"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
        </button>
      )}

      <div className="w-full max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-16 flex flex-col items-center pt-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#0a0a0a]/80 flex items-center justify-center border border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <CalendarCheck className="w-6 h-6 text-[#A855F7]" />
            </div>
            <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Planner</h1>
          </div>
          <p className="text-sm text-white/50 font-medium">Master your Schedule, Conquer your Goals.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Set Task Component */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="mb-4 flex justify-center">
                <div className="px-6 py-2 rounded-full bg-[#0a0a0a]/80 border border-[#A855F7] backdrop-blur-sm flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <Target className="w-5 h-5 text-[#A855F7]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">SET PLAN</h2>
                </div>
              </div>
              <GlassCard className="w-full p-6 rounded-[32px] border-white/5 bg-[#1a1625]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="space-y-5">
                  {/* Task Title & Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Task Title</label>
                      <input
                        type="text"
                        placeholder="What needs to be done?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 focus:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Task Category</label>
                      <div className="relative">
                        <button 
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                          className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm text-white/80 hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            {category ? (
                              <>
                                {React.createElement(getCategoryIcon(category), { className: "w-4 h-4 text-purple-400" })}
                                <span>{category}</span>
                              </>
                            ) : (
                              <>
                                <Tag className="w-4 h-4 text-white/40" />
                                <span>Select Category</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", isCategoryOpen && "rotate-180")} />
                        </button>
                        
                        {isCategoryOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl z-20">
                            {categories.map((c) => (
                              <button
                                key={c.name}
                                onClick={() => {
                                  setCategory(c.name);
                                  setIsCategoryOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors first:rounded-t-2xl last:rounded-b-2xl flex items-center gap-3"
                              >
                                <c.icon className="w-4 h-4 text-white/40" />
                                {c.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Date</label>
                      <div className="relative mb-2">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                        <input
                          type={date ? "date" : "text"}
                          onFocus={(e) => (e.target.type = "date")}
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          placeholder=" "
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={setToday}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                        >
                          Today
                        </button>
                        <button 
                          onClick={setTomorrow}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Time</label>
                      <div className="relative mb-2">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                        <input
                          type={time ? "time" : "text"}
                          onFocus={(e) => (e.target.type = "time")}
                          onBlur={(e) => {
                            if (!e.target.value) e.target.type = "text";
                          }}
                          placeholder=" "
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all [color-scheme:dark]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setQuickTime(9)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                        >
                          9 AM
                        </button>
                        <button 
                          onClick={() => setQuickTime(14)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                        >
                          2 PM
                        </button>
                        <button 
                          onClick={() => setQuickTime(20)}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-white/40 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all"
                        >
                          8 PM
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Low", "Medium", "High"] as Priority[]).map((p) => {
                        const isActive = priority === p;
                        let activeColor = "";
                        if (p === "High") activeColor = "bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]";
                        else if (p === "Medium") activeColor = "bg-yellow-500/10 border-yellow-500/50 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]";
                        else activeColor = "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]";

                        return (
                          <button
                            key={p}
                            onClick={() => setPriority(isActive ? null : p)}
                            className={cn(
                              "py-2.5 rounded-xl text-xs font-bold transition-all border",
                              isActive 
                                ? activeColor
                                : "bg-[#0a0a0a] border-white/5 text-white/40 hover:bg-white/5"
                            )}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reminders */}
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Set Reminder</label>
                    <div className="relative">
                      <button 
                        onClick={() => setIsReminderOpen(!isReminderOpen)}
                        className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm text-white/80 hover:bg-white/5 transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Bell className="w-4 h-4 text-white/40 shrink-0" />
                          <span className="truncate">
                            {selectedReminders.length > 0 
                              ? selectedReminders.join(", ") 
                              : "No reminders"}
                          </span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform shrink-0", isReminderOpen && "rotate-180")} />
                      </button>
                      
                      {isReminderOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl max-h-48 overflow-y-auto shadow-xl z-20">
                          {reminders.map((r) => {
                            const isSelected = selectedReminders.includes(r);
                            return (
                              <button
                                key={r}
                                onClick={() => {
                                  if (r === "No reminders") {
                                    setSelectedReminders([]);
                                    setIsReminderOpen(false);
                                  } else {
                                    if (isSelected) {
                                      setSelectedReminders(selectedReminders.filter(item => item !== r));
                                    } else {
                                      setSelectedReminders([...selectedReminders, r]);
                                    }
                                  }
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between",
                                  isSelected 
                                    ? "bg-purple-500/10 text-purple-400" 
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                <span>{r}</span>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleAddTask}
                    className="w-full mt-4 py-4 rounded-2xl bg-purple-500 text-black font-bold text-sm uppercase tracking-widest hover:bg-purple-400 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Add To Task
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>

          {/* Task Status Board */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* To Do Column */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest">To Do</h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                    {todoTasks.length}
                  </span>
                </div>
                <div className="flex-1 bg-[#0a0a0a]/50 border border-white/5 rounded-[32px] p-4 space-y-3 overflow-y-auto scrollbar-hide min-h-[400px]">
                  {todoTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDelete={handleDeleteTask} 
                      onStatusChange={handleStatusChange} 
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                    <h3 className="text-sm font-bold text-purple-500/80 uppercase tracking-widest">In Progress</h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">
                    {inProgressTasks.length}
                  </span>
                </div>
                <div className="flex-1 bg-[#0a0a0a]/50 border border-white/5 rounded-[32px] p-4 space-y-3 overflow-y-auto scrollbar-hide min-h-[400px]">
                  {inProgressTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDelete={handleDeleteTask} 
                      onStatusChange={handleStatusChange} 
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Done</h3>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/40">
                    {doneTasks.length}
                  </span>
                </div>
                <div className="flex-1 bg-[#0a0a0a]/50 border border-white/5 rounded-[32px] p-4 space-y-3 overflow-y-auto scrollbar-hide min-h-[400px]">
                  {doneTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onDelete={handleDeleteTask} 
                      onStatusChange={handleStatusChange} 
                      getPriorityColor={getPriorityColor}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TaskCard = React.memo(({
  task,
  onDelete,
  onStatusChange,
  getPriorityColor
}: {
  task: Task, 
  onDelete: (id: string) => void,
  onStatusChange: (id: string, status: Status) => void,
  getPriorityColor: (p: Priority | null) => string
}) => {
  const handleStatusCycle = () => {
    if (task.status === "To Do") onStatusChange(task.id, "In Progress");
    else if (task.status === "In Progress") onStatusChange(task.id, "Done");
    else if (task.status === "Done") onStatusChange(task.id, "To Do");
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case "In Progress":
        return <CircleDot className="w-5 h-5 text-blue-400" />;
      case "Done":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      default:
        return <Circle className="w-5 h-5 text-white/20 hover:text-white/40" />;
    }
  };

  return (
    <GlassCard className="p-3 rounded-2xl border-white/5 bg-[#1a1625] hover:bg-[#201c2e] transition-colors group relative overflow-hidden">
      {/* Top Row: Checkbox, Title, Date/Time, and Delete */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <button 
            onClick={handleStatusCycle}
            className="shrink-0 transition-transform active:scale-90 mt-0.5"
          >
            {getStatusIcon()}
          </button>
          
          <h4 className={cn(
            "text-sm font-medium text-white/90 leading-snug break-words whitespace-normal",
            task.status === "Done" && "line-through text-white/40"
          )}>
            {task.title}
          </h4>
        </div>

        <div className="flex items-start gap-3 shrink-0 mt-0.5">
          {(task.date || task.time) && (
            <span className="text-[10px] text-white/40 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {task.date} {task.time}
            </span>
          )}
          
          <button 
            onClick={() => onDelete(task.id)}
            className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Priority, Reminders, Category, and Status */}
      <div className="flex items-center gap-3 mt-2 ml-8">
        {task.priority && (
          <span className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0", getPriorityColor(task.priority))}>
            {task.priority}
          </span>
        )}

        {task.category && (
          <div className="flex items-center text-purple-400/60 shrink-0" title={task.category}>
            {React.createElement(getCategoryIcon(task.category), { className: "w-3 h-3" })}
          </div>
        )}

        {task.reminders && task.reminders.length > 0 && (
          <span className="text-[10px] text-purple-400/70 flex items-center gap-1 shrink-0">
            <Bell className="w-3 h-3" />
            {task.reminders.length}
          </span>
        )}

        <span className={cn(
          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ml-auto",
          task.status === "To Do" && "text-white/30 bg-white/5",
          task.status === "In Progress" && "text-blue-400/80 bg-blue-400/10",
          task.status === "Done" && "text-emerald-400/80 bg-emerald-400/10"
        )}>
          {task.status}
        </span>
      </div>
    </GlassCard>
  );
});
