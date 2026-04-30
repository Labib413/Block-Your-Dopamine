import { Bell, ArrowLeft, Trash2, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import { GlassCard } from "./GlassCard";
import { cn } from "@/src/lib/utils";

interface NotificationsViewProps {
  onBack: () => void;
}

export function NotificationsView({ onBack }: NotificationsViewProps) {
  const { 
    notifications, 
    deleteNotification, 
    clearAllNotifications,
    notificationsEnabled,
    setNotificationsEnabled
  } = useApp();

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h2 className="text-3xl font-sans font-bold text-white">Notification Center</h2>
            <p className="text-white/40 mt-1">Manage your alerts and updates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <span className="text-sm font-bold text-white/60">Global Alerts</span>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                notificationsEnabled ? "bg-neon-green" : "bg-white/20"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 rounded-full bg-[#050505] transition-transform",
                notificationsEnabled ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          
          {notifications?.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <GlassCard className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className={cn("w-5 h-5", notificationsEnabled ? "text-neon-green" : "text-red-500")} />
            <h3 className="font-sans font-bold text-lg">Recent Alerts</h3>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-bold text-white/60">
              {notifications?.length || 0}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {!notificationsEnabled ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Bell className="w-16 h-16 text-red-500 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Notifications Disabled</h4>
              <p className="text-white/60 max-w-md">
                You won't receive any new alerts. Turn on Global Alerts to stay updated.
              </p>
            </div>
          ) : notifications?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <CheckCircle2 className="w-16 h-16 text-neon-green mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">All Caught Up!</h4>
              <p className="text-white/60 max-w-md">
                You have no new notifications at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex items-start justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 text-neon-green" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white mb-1">{notif.title}</h4>
                      <p className="text-sm text-white/60 leading-relaxed">{notif.message}</p>
                      <span className="text-xs font-mono text-neon-green/60 mt-3 block">{notif.time}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
