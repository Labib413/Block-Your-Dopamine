import { 
  LayoutDashboard, 
  GraduationCap, 
  Calendar, 
  User, 
  HeartPulse, 
  ShieldAlert, 
  Activity, 
  BarChart3,
  Flame,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { useState } from "react";
import { cn, isValidUrl } from "@/src/lib/utils";
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
      animate={{ width: isMinimized ? 80 : 256 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="h-screen bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col sticky top-0 overflow-hidden shrink-0"
    >
      <div className={cn(
        "flex-1 overflow-y-auto scrollbar-hide transition-all duration-300", 
        isMinimized ? "p-4" : "p-6"
      )}>
        {/* Header */}
        <motion.div 
          layout
          className={cn(
            "flex mb-8", 
            isMinimized ? "flex-col items-center gap-5" : "items-center justify-between"
          )}
        >
          <motion.div layout className="flex items-center gap-3">
            <motion.div layout className="w-9 h-9 bg-neon-green rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.5)] shrink-0">
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
                  <span className="text-xl font-sans font-bold tracking-wide drop-shadow-[0_0_8px_rgba(57,255,20,0.4)]">
                    <span className="text-neon-green">B</span>
                    <span className="text-white">Y</span>
                    <span className="text-neon-green">D</span>
                  </span>
                  <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest leading-none mt-0.5">
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
              "z-50 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-white hover:text-neon-green hover:border-neon-green/50 hover:shadow-[0_0_12px_rgba(57,255,20,0.3)] transition-colors duration-300 shrink-0",
              !isMinimized && "-mr-3"
            )}
            title={isMinimized ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isMinimized ? <PanelLeftOpen className="w-4 h-4" strokeWidth={2.5} /> : <PanelLeftClose className="w-4 h-4" strokeWidth={2.5} />}
          </motion.button>
        </motion.div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.label}>
              <button
                onClick={() => onNavigate(item.label)}
                className={cn(
                  "w-full flex items-center rounded-xl transition-colors duration-200 group",
                  isMinimized ? "justify-center p-3" : "justify-between px-4 py-3",
                  currentView === item.label 
                    ? "bg-neon-green/10 text-neon-green" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
                title={isMinimized ? item.label : undefined}
              >
                <div className="flex items-center">
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110 shrink-0",
                    currentView === item.label ? "text-neon-green" : "text-white/40 group-hover:text-white"
                  )} />
                  <AnimatePresence initial={false}>
                    {!isMinimized && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
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
        "mt-auto border-t border-white/5 transition-all duration-300", 
        isMinimized ? "p-4" : "p-6"
      )}>
        <button
          onClick={() => onNavigate("Personal")}
          className={cn(
            "w-full flex items-center rounded-xl transition-colors duration-200 group",
            isMinimized ? "justify-center p-2" : "px-4 py-3",
            currentView === "Personal" 
              ? "bg-neon-green/10 text-neon-green" 
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
          title={isMinimized ? "Personal" : undefined}
        >
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-neon-green/50 transition-colors shrink-0">
            {profile?.avatarUrl && isValidUrl(profile.avatarUrl) ? (
              <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white/40 group-hover:text-white" />
            )}
          </div>
          <AnimatePresence initial={false}>
            {!isMinimized && (
              <motion.div 
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: "auto", marginLeft: 12 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-start overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-bold text-white truncate max-w-[120px]">
                  {user ? profile?.fullName : "Personal"}
                </span>
                <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                  {user ? "View Profile" : "User Panel"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
