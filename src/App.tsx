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

  // Manual Session Correction: Subtract 2h as requested by user
  useEffect(() => {
    const hasSubtracted = localStorage.getItem('manual_session_subtracted_2h_v1');
    if (!hasSubtracted) {
      console.log("Subtracting 2h focus session as requested...");
      // 2 hours = 7200 seconds
      modifyFocusTime(-7200, -7200);
      addNotification("Session Corrected", "2 hours have been subtracted from your focus totals as requested.");
      localStorage.setItem('manual_session_subtracted_2h_v1', 'true');
    }
  }, [modifyFocusTime, addNotification]);

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
          <>
            <div className="p-8 pb-0">
              <Header onNavigate={handleNavigate} onShowBadges={() => setShowBadges(true)} />
            </div>
            <div className="flex-1 p-8">
              <GlassCard className="h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-4xl font-sans font-bold mb-4">{currentView}</h2>
                <p className="text-white/40 max-w-md">
                  This module is currently being optimized for peak performance. 
                  Check back soon for advanced {currentView.toLowerCase()} tracking.
                </p>
              </GlassCard>
            </div>
          </>
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
