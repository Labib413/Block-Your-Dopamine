import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/Dashboard";
import { DetoxView } from "./components/DetoxView";
import { AppProvider, useApp } from "./context/AppContext";
import { GlassCard } from "./components/GlassCard";
import { FullscreenDetox } from "./components/FullscreenDetox";
import { PersonalPanel } from "./components/PersonalPanel";
import { NotificationsView } from "./components/NotificationsView";
import { Planner } from "./components/Planner";
import { HealthHub } from "./components/HealthHub";
import { ReportsView } from "./components/ReportsView";
import { AcademicHub } from "./components/AcademicHub";
import { SyllabusView } from "./components/SyllabusView";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { BadgeShowroom } from "./components/BadgeShowroom";
import { AuthModal } from "./components/AuthModal";

function AppContent() {
  const [currentView, setCurrentView] = useState("Dashboard");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [detoxInitialTab, setDetoxInitialTab] = useState<"Overview" | "Set Focus">("Overview");
  const [showBadges, setShowBadges] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { isFocusing, currentSessionId, user, modifyFocusTime, addNotification, isSupabaseConnected, connectionError, syncData, updateAcademicSettings } = useApp();
  
  // Sync data on view changes
  useEffect(() => {
    if (user) {
      console.log(`Switching to ${currentView} - triggering background sync...`);
      syncData(currentView);
    }
  }, [currentView, user]);

  // Handle logout redirection
  useEffect(() => {
    if (!user && currentView === "Personal") {
      setCurrentView("Dashboard");
      setShowAuth(true);
    }
  }, [user, currentView]);

  const handleNavigate = (view: string) => {
    if (view === "Personal" && !user) {
      setShowAuth(true);
      return;
    }
    setCurrentView(view);
    if (view !== "Academic") {
      setSelectedSubjectId(null);
    }
    if (view !== "Detox") {
      setDetoxInitialTab("Overview");
    }
  };

  const handleStudyNow = (subjectId: string) => {
    updateAcademicSettings({ focusSubjectId: subjectId });
    setDetoxInitialTab("Set Focus");
    setCurrentView("Detox");
  };

  if (isFocusing) {
    return (
      <ErrorBoundary>
        <FullscreenDetox key={currentSessionId || 'detox'} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050505] selection:bg-neon-green/30" spellCheck="false" data-gramm="false">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-green/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar onNavigate={handleNavigate} currentView={currentView} />
      
      <main className="flex-1 flex flex-col relative z-10">
        {isSupabaseConnected === false && (
          <div className="mx-8 mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-md flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-red-400">Database Disconnected</p>
                <p className="text-xs text-red-400/60">{connectionError || "Failed to fetch. Check your Supabase URL or project status."}</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-[10px] font-bold text-red-400 uppercase tracking-wider transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {currentView === "Dashboard" && (
          <div className="p-8 pb-0">
            <Header onNavigate={handleNavigate} onShowBadges={() => setShowBadges(true)} />
          </div>
        )}
        
        {currentView === "Dashboard" ? (
          <Dashboard />
        ) : currentView === "Detox" ? (
          <DetoxView initialTab={detoxInitialTab} onBack={() => handleNavigate("Dashboard")} />
        ) : currentView === "Personal" ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <PersonalPanel onShowBadges={() => setShowBadges(true)} />
          </div>
        ) : currentView === "Notifications" ? (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <NotificationsView onBack={() => handleNavigate("Dashboard")} />
          </div>
        ) : currentView === "Planner" ? (
          <Planner onBack={() => handleNavigate("Dashboard")} />
        ) : currentView === "Academic" ? (
          selectedSubjectId ? (
            <SyllabusView subjectId={selectedSubjectId} onBack={() => setSelectedSubjectId(null)} />
          ) : (
            <AcademicHub onBack={() => handleNavigate("Dashboard")} onSubjectClick={setSelectedSubjectId} onStudyNow={handleStudyNow} />
          )
        ) : currentView === "Health" ? (
          <HealthHub onBack={() => handleNavigate("Dashboard")} />
        ) : currentView === "Reports" ? (
          <ReportsView onBack={() => handleNavigate("Dashboard")} />
        ) : (
          <div className="flex-1 flex flex-col p-8 overflow-hidden">
            <div className="pb-8">
              <Header onNavigate={handleNavigate} onShowBadges={() => setShowBadges(true)} />
            </div>
            <GlassCard className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute inset-0 bg-neon-green/5 blur-[120px] rounded-full translate-y-1/2 group-hover:bg-neon-green/10 transition-all duration-1000" />

              <div className="relative z-10 flex flex-col items-center max-w-lg">
                <div className="w-20 h-20 bg-neon-green/10 rounded-3xl flex items-center justify-center mb-8 border border-neon-green/20 group-hover:scale-110 transition-transform duration-500">
                  <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse shadow-[0_0_15px_#39ff14]" />
                </div>

                <h2 className="text-5xl font-sans font-black mb-6 tracking-tighter uppercase italic">
                  {currentView} <span className="text-neon-green text-2xl align-top">★</span>
                </h2>

                <div className="h-px w-24 bg-gradient-to-r from-transparent via-neon-green/50 to-transparent mb-8" />

                <p className="text-white/60 text-lg leading-relaxed mb-10 font-medium">
                  We're currently architecting the <span className="text-white font-bold">{currentView}</span> module for peak cognitive performance.
                </p>

                <p className="text-white/20 text-xs font-bold uppercase tracking-[0.3em]">
                  Status: Optimizing Core Systems
                </p>

                <button
                  onClick={() => handleNavigate("Dashboard")}
                  className="mt-12 px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-neon-green/10 hover:text-neon-green hover:border-neon-green/30 transition-all"
                >
                  Return to Headquarters
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>

      <BadgeShowroom isOpen={showBadges} onClose={() => setShowBadges(false)} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
