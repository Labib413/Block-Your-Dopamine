import { 
  LayoutDashboard, 
  GraduationCap, 
  Calendar, 
  User, 
  HeartPulse, 
  TrendingUp, 
  Activity, 
  BarChart3,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: GraduationCap, label: "Academic" },
  { icon: Calendar, label: "Planner" },
  { icon: HeartPulse, label: "Wellness" },
  { icon: TrendingUp, label: "Detox" },
  { icon: Activity, label: "Health" },
  { icon: BarChart3, label: "Reports" },
];

export function Sidebar({ onNavigate, currentView }: { onNavigate: (view: string) => void, currentView: string }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const { user, profile } = useApp();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isMinimized ? 88 : 280 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="h-screen bg-[#090909] border-r border-white/[0.06] flex flex-col sticky top-0 overflow-hidden shrink-0 z-50 shadow-2xl shadow-black"
    >
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-hide transition-all duration-300", 
        isMinimized ? "p-4" : "p-6"
      )}>
        {/* Header */}
        <motion.div 
          layout
          className={cn(
            "flex mb-10", 
            isMinimized ? "flex-col items-center gap-6" : "items-center justify-between"
          )}
        >
          <motion.div layout className="flex items-center gap-4">
            <motion.div layout className="w-10 h-10 bg-[#39FF14] rounded-[14px] flex items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.3)] shrink-0">
              <Flame className="text-black w-5 h-5" fill="currentColor" />
            </motion.div>
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col overflow-hidden whitespace-nowrap"
                >
                  <span className="text-xl font-['Gelasio',serif] font-bold tracking-wide drop-shadow-md leading-none mb-1">
                    <span className="text-[#39FF14]">B</span>
                    <span className="text-white">Y</span>
                    <span className="text-[#39FF14]">D</span>
                  </span>
                  <span className="text-[7px] font-sans font-bold text-white/40 uppercase tracking-[0.2em] leading-none">
                    Block Your Dopamine
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button 
            layout
            onClick={() => setIsMinimized(!isMinimized)}
            className={cn(
              "z-50 w-8 h-8 flex items-center justify-center rounded-full bg-[#121212] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.04] transition-all duration-300 shrink-0",
              !isMinimized && "-mr-2"
            )}
            title={isMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isMinimized ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </motion.button>
        </motion.div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => onNavigate(item.label)}
                className={cn(
                  "w-full flex items-center transition-all duration-200 group relative",
                  isMinimized ? "justify-center p-3 rounded-2xl" : "justify-between px-4 py-3 rounded-2xl",
                  currentView === item.label 
                    ? "bg-[#39FF14]/10 border border-[#39FF14]/20 text-[#39FF14]" 
                    : "border border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]"
                )}
                title={isMinimized ? item.label : undefined}
              >
                <div className="flex items-center">
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-300 shrink-0",
                    currentView === item.label ? "text-[#39FF14]" : "text-white/40 group-hover:text-white",
                    "group-hover:scale-110"
                  )} />
                  <AnimatePresence initial={false}>
                    {!isMinimized && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: "auto", marginLeft: 14 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[14px] font-semibold whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className={cn(
        "mt-auto border-t border-white/[0.04] bg-[#0a0a0a] transition-all duration-300", 
        isMinimized ? "p-4" : "p-6"
      )}>
        <button
          onClick={() => onNavigate("Personal")}
          className={cn(
            "w-full flex items-center transition-all duration-200 group relative overflow-hidden",
            isMinimized ? "justify-center p-0 rounded-full" : "justify-between p-3 -mx-3 rounded-[20px]",
            currentView === "Personal" 
              ? "bg-[#39FF14]/5 ring-1 ring-[#39FF14]/20" 
              : "hover:bg-white/[0.04]"
          )}
          title={isMinimized ? "Personal" : undefined}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-full bg-[#121212] border border-white/[0.08] flex items-center justify-center overflow-hidden transition-colors shrink-0",
              isMinimized ? "w-10 h-10" : "w-11 h-11",
              currentView === "Personal" ? "border-[#39FF14]/50 shadow-[0_0_12px_rgba(57,255,20,0.2)]" : "group-hover:border-white/20"
            )}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-white/40 group-hover:text-white" />
              )}
            </div>
            
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-start overflow-hidden whitespace-nowrap"
                >
                  <span className="text-[14px] font-bold text-white truncate max-w-[120px] leading-tight mb-0.5">
                    {user ? profile?.fullName : "Personal"}
                  </span>
                  <span className="text-[11px] text-white/40 font-medium tracking-wide">
                    {user ? "View Profile" : "User Panel"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence initial={false}>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}

