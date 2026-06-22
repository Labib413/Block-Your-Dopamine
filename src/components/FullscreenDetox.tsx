import React, { useState, useEffect, useMemo, useRef } from "react";
import { cn, formatTime, safeStringify, generateId, safeOpen } from "@/src/lib/utils";
import { useApp, Resource, ResourceType } from "../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, X, Cloud, Youtube, FileText, Image as ImageIcon, Maximize, Minimize, Plus, Trash2, BookOpen, Timer, AlertCircle, Globe, ExternalLink, CheckCircle2, Loader2, Upload, ChevronLeft, ChevronRight, Download, ShieldCheck } from "lucide-react";
import { TreeGrowth } from "./TreeGrowth";
import { supabase } from "../lib/supabase";
import { HSC_SUBJECT_NAMES } from "../constants";
import { logger } from "../lib/logger";

// Native Browser PDF Viewer with scrolling and toolbar support
const PDFViewer = React.memo(({ url, title, onReupload }: { url: string; title: string; onReupload?: (file: File) => void }) => {
  const [loadError, setLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoadError(false);
  }, [url]);

  // Use Google Docs Viewer to bypass CORS and force rendering instead of downloading
  const viewerUrl = useMemo(() => {
    if (!url) return '';
    return 'https://docs.google.com/viewer?url=' + encodeURIComponent(url) + '&embedded=true';
  }, [url]);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] p-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Failed to Load PDF
        </h3>
        <p className="text-white/40 text-sm mb-8 max-w-xs leading-relaxed">
          Chrome might be blocking this file. Ensure your Supabase bucket is PUBLIC and CORS is allowed in the dashboard.
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button 
            onClick={() => safeOpen(url, '_blank')}
            className="w-full px-8 py-4 bg-neon-green text-black font-bold rounded-2xl hover:bg-neon-green/80 transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(57,255,20,0.3)]"
          >
            <ExternalLink className="w-5 h-5" />
            Open in New Tab
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-8 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Re-upload PDF
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onReupload) onReupload(file);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] overflow-hidden relative">
      <iframe
        src={viewerUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        title={title || "PDF Viewer"}
        className="w-full h-full border-none"
        style={{ backgroundColor: '#050505' }}
        onError={() => setLoadError(true)}
      />
      
      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        <a 
          href={url} 
          download={title}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-2 text-xs font-bold"
          title="Download PDF"
        >
          <Download className="w-4 h-4" />
          Download
        </a>
        <a 
          href={url} 
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-2 text-xs font-bold"
          title="Open Original"
        >
          <ExternalLink className="w-4 h-4" />
          Full View
        </a>
      </div>
    </div>
  );
});

// Isolated Resource Viewer Component to prevent re-renders on timer updates
const ResourceViewer = React.memo(({ 
  tab, 
  isSafe, 
  blobUrl, 
  retryCount, 
  onReopen,
  isExternalOpen,
  isActive,
  onStateUpdate,
  initialState,
  onReupload
}: { 
  tab: Resource;
  isSafe: boolean;
  blobUrl?: string;
  retryCount: number;
  onReopen: (res: Resource) => void;
  isExternalOpen: boolean;
  isActive: boolean;
  onStateUpdate: (id: string, state: any) => void;
  initialState?: any;
  onReupload?: (id: string, file: File) => void;
}) => {
  const [hasError, setHasError] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  
  // Use a ref to store the initial start time so it doesn't change and trigger src reloads
  const initialStartTime = React.useRef(initialState?.currentTime || 0);

  // Pause/Resume YouTube video when switching away/back
  useEffect(() => {
    if (tab.type === 'YOUTUBE' && iframeRef.current) {
      try {
        if (!isActive) {
          // Send pause command to YouTube iframe
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), 
            '*'
          );
        } else {
          // Tell YouTube to start sending updates when active
          iframeRef.current.contentWindow?.postMessage(
            JSON.stringify({ event: 'listening', func: '', args: [] }), 
            '*'
          );
        }
      } catch (e) {
        // Silently fail if postMessage is blocked
      }
    }
  }, [isActive, tab.type]);

  // Listen for messages from YouTube iframe to track current time
  useEffect(() => {
    if (tab.type !== 'YOUTUBE') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        // YouTube sends periodic updates if enablejsapi=1 is set
        if (data.event === 'infoDelivery' && data.info && typeof data.info.currentTime === 'number') {
          onStateUpdate(tab.id, { currentTime: data.info.currentTime });
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tab.id, tab.type, onStateUpdate]);

  const src = useMemo(() => {
    try {
      if (tab.type === 'PDF' && blobUrl) return blobUrl;
      if (tab.type === 'YOUTUBE') {
        const url = tab.url;
        let videoId = '';
        if (url.includes('youtube.com/watch?v=')) {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v') || '';
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        
        const start = Math.floor(initialStartTime.current);
        // Added enablejsapi=1 for better stability and origin for security
        return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0${start > 0 ? `&start=${start}` : ''}` : tab.url;
      }
      return tab.url;
    } catch (e) {
      return tab.url;
    }
  }, [tab.url, tab.type, blobUrl]);

  if (!isSafe) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-8">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
          <Globe className="w-10 h-10 text-emerald-500" />
        </div>
        <h3 className="text-xl font-sans font-bold text-white mb-3">External Resource Active</h3>
        <p className="text-white/40 max-w-sm mb-8 text-sm leading-relaxed">
          This site ({new URL(tab.url).hostname}) blocks embedded viewing for security. 
          It has been opened in a <span className="text-emerald-500 font-bold">Focused Resource Window</span>.
        </p>
        
        {!isExternalOpen ? (
          <button 
            onClick={() => onReopen(tab)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <ExternalLink className="w-4 h-4" />
            Re-open Resource Window
          </button>
        ) : (
          <div className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-emerald-500/30 text-emerald-500 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">Window is currently open</span>
          </div>
        )}
        
        <p className="mt-12 text-[10px] text-white/20 uppercase tracking-[0.2em] max-w-xs">
          Don't worry, the Distraction Stopwatch is paused while this window is open.
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Resource Failed to Load</h3>
        <p className="text-white/40 text-sm mb-6">There was an issue loading this resource. It might be blocked or the link might be broken.</p>
        <button 
          onClick={() => setHasError(false)}
          className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (tab.type === 'PDF') {
    return (
      <div className="absolute inset-0 bg-[#050505] overflow-hidden">
        <PDFViewer url={src} title={tab.title} onReupload={(file) => onReupload?.(tab.id, file)} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <iframe 
        ref={iframeRef}
        key={`${tab.id}-${retryCount}`}
        src={src} 
        style={{ width: '100%', height: '100%', border: 'none' }}
        className="border-none"
        title={tab.title}
        // Enhanced sandbox for stability
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={() => logger.log(`Resource loaded: ${tab.title}`)}
      />
    </div>
  );
}, (prev, next) => {
  // Strict Memoization: Only re-render if the resource ID or retry count changes
  return prev.tab.id === next.tab.id && 
         prev.retryCount === next.retryCount && 
         prev.isActive === next.isActive &&
         prev.blobUrl === next.blobUrl &&
         prev.isExternalOpen === next.isExternalOpen;
});

// Memoized static views to prevent re-renders on timer updates
const DetoxActivatedView = React.memo(() => (
  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
    <Cloud className="w-24 h-24 text-white/10 mb-6" />
    <h2 className="text-2xl font-sans font-bold text-white mb-2">Your Detox Activated.</h2>
    <p className="text-white/40 max-w-md">
      Select a resource from the sidebar to open it in a tab. All other distractions are blocked.
    </p>
  </div>
));

// Isolated Timer Display Component to prevent parent re-renders
const formatActiveTime = (seconds: number) => {
  const safeSeconds = seconds || 0;
  const m = Math.floor(safeSeconds / 60);
  const s = safeSeconds % 60;
  return (
    <span className="flex items-baseline gap-0.5 tabular-nums">
      <span>{m}</span>
      <span className="text-[0.5em] opacity-40 uppercase tracking-tighter mr-1">m</span>
      <span>{s.toString().padStart(2, '0')}</span>
      <span className="text-[0.5em] opacity-40 uppercase tracking-tighter">s</span>
    </span>
  );
};

const TimerText = React.memo(({ initialTime, isCompleted }: { initialTime: number, isCompleted: boolean }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (isCompleted) return;
      setTime(e.detail.timeLeft);
    };
    window.addEventListener('byd-time-update', handleUpdate as EventListener);
    return () => window.removeEventListener('byd-time-update', handleUpdate as EventListener);
  }, [isCompleted]);

  return <span className="tabular-nums">{isCompleted ? formatActiveTime(0) : formatActiveTime(time)}</span>;
});

const DistractionTimerText = React.memo(({ initialTime, isDistracted }: { initialTime: number, isDistracted: boolean }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setTime(e.detail.distractionTime);
    };
    window.addEventListener('byd-time-update', handleUpdate as EventListener);
    return () => window.removeEventListener('byd-time-update', handleUpdate as EventListener);
  }, []);

  return (
    <div className={`flex items-center gap-2 text-2xl font-mono font-bold tracking-wider transition-colors tabular-nums ${time > 0 ? 'text-red-500' : 'text-white/20'}`}>
      <Timer className={`w-5 h-5 ${isDistracted ? 'animate-pulse' : ''}`} />
      {formatActiveTime(time)}
    </div>
  );
});

// Memoized Study Resources Sidebar
const StudyResourcesSidebar = React.memo(({ 
  resources, 
  activeTabId, 
  onResourceClick, 
  onRemoveResource, 
  onAddResource,
  onFileUpload,
  isAddingResource,
  setIsAddingResource,
  newResource,
  setNewResource,
  totalDuration,
  isDistracted,
  isSessionCompleted,
  isUploading
}: { 
  resources: Resource[];
  activeTabId: string | null;
  onResourceClick: (res: Resource) => void;
  onRemoveResource: (id: string) => void;
  onAddResource: (customRes?: any) => void;
  onFileUpload: (file: File) => void;
  isAddingResource: boolean;
  setIsAddingResource: (val: boolean) => void;
  newResource: any;
  setNewResource: (val: any) => void;
  totalDuration: number;
  isDistracted: boolean;
  isSessionCompleted: boolean;
  isUploading: boolean;
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileUpload(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div 
      className="w-80 h-full border-r border-[#00f0ff]/20 flex flex-col relative shrink-0 shadow-[10px_0_30px_-15px_rgba(0,240,255,0.1)] bg-[#00f0ff]/[0.02]"
      style={{ 
        willChange: 'transform', 
        contain: 'content',
        transform: 'translateZ(0)',
        zIndex: 1
      }}
    >
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
          <Loader2 className="w-10 h-10 text-[#00f0ff] animate-spin mb-4" />
          <p className="text-[#00f0ff] text-xs font-bold uppercase tracking-widest animate-pulse">Uploading to Cloud...</p>
          <p className="text-white/40 text-[10px] mt-2">Bypassing security blocks permanently.</p>
        </div>
      )}
      <div className="p-4 border-b border-[#00f0ff]/20 flex justify-between items-center bg-[#00f0ff]/5">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#00f0ff] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#00f0ff]/80">Study Resources</h2>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="text-[#00f0ff]/60 hover:text-[#00f0ff] hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] transition-all p-1"
            title="Upload Local PDF"
          >
            <Upload className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsAddingResource(!isAddingResource)} 
            className="text-[#00f0ff]/60 hover:text-[#00f0ff] hover:drop-shadow-[0_0_5px_rgba(0,240,255,0.8)] transition-all p-1"
            title="Add Resource Link"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="application/pdf" 
          onChange={handleFileChange}
        />
      </div>
      
      {isAddingResource && (
        <div className="p-4 border-b border-[#00f0ff]/20 bg-black/20 space-y-3">
          <input 
            type="text" 
            placeholder="Resource Title" 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff]/50"
            value={newResource.title}
            onChange={e => setNewResource({...newResource, title: e.target.value})}
          />
          <input 
            type="url" 
            placeholder={
              newResource.type === 'YOUTUBE' ? "YouTube URL" : 
              newResource.type === 'PDF' ? "PDF URL" : 
              newResource.type === 'IMAGE' ? "Image URL" : 
              "Website URL (http/https)"
            }
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff]/50"
            value={newResource.url}
            onChange={e => setNewResource({...newResource, url: e.target.value})}
          />
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
            {(['YOUTUBE', 'PDF', 'IMAGE', 'OTHERS'] as ResourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewResource({ ...newResource, type })}
                className={`flex-1 py-1.5 text-[9px] font-bold rounded-md transition-all ${
                  newResource.type === type 
                    ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button 
            onClick={() => onAddResource()}
            disabled={!newResource.title || !newResource.url || (newResource.type === 'OTHERS' && !newResource.url.startsWith('http'))}
            className="w-full bg-[#00f0ff] text-black font-bold py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00f0ff]/90 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
          >
            Add Resource
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {resources.length === 0 ? (
          <div className="text-center text-white/20 text-sm mt-10">No resources added yet.</div>
        ) : (
          resources.map(res => (
            <div key={res.id} className="group relative flex items-center">
              <button
                onClick={() => onResourceClick(res)}
                className={`w-full flex items-center gap-3 p-3 pr-10 rounded-xl transition-all ${
                  activeTabId === res.id 
                    ? 'bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-white shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                    : 'bg-white/5 border border-transparent text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {res.type === "YOUTUBE" && <Youtube className="w-4 h-4 text-red-500 shrink-0" />}
                {res.type === "PDF" && <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                {res.type === "IMAGE" && <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />}
                {res.type === "OTHERS" && <Globe className="w-4 h-4 text-emerald-500 shrink-0" />}
                <span className="text-sm font-medium truncate">{res.title}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveResource(res.id);
                }}
                className="absolute right-2 p-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                title="Delete Resource"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Tree Grow Animation Area - Moved back to Sidebar below resources */}
      <div 
        className="h-64 w-80 border-t border-[#00f0ff]/20 relative overflow-hidden bg-gradient-to-b from-transparent to-[#00f0ff]/5 shrink-0"
        style={{ contain: 'strict' }}
      >
        <div className="text-[10px] uppercase tracking-widest text-[#00f0ff]/40 absolute top-4 left-4 z-20">Focus Tree</div>
        <TreeGrowth 
          totalDuration={totalDuration}
          isDistracted={isDistracted}
          isSessionCompleted={isSessionCompleted}
        />
      </div>
    </div>
  );
}, (prev, next) => {
  // Strict Isolation: Sidebar only re-renders on structural changes, not on every second
  return prev.isDistracted === next.isDistracted &&
         prev.resources === next.resources &&
         prev.activeTabId === next.activeTabId &&
         prev.isAddingResource === next.isAddingResource &&
         prev.newResource === next.newResource &&
         prev.totalDuration === next.totalDuration &&
         prev.isSessionCompleted === next.isSessionCompleted;
});

export const FullscreenDetox = React.memo(() => {
  const { 
    currentSessionDuration, 
    currentSessionId, 
    currentSubjectId,
    resources, 
    endFocusSession, 
    cancelFocusSession, 
    addResource, 
    updateResource,
    removeResource, 
    setIsManualExit,
    isSessionDistracted,
    setSessionTimeLeft,
    setSessionDistractionTime,
    setIsSessionDistracted,
    saveSessionFragment
  } = useApp();
  
  const activeSubjectName = currentSubjectId ? HSC_SUBJECT_NAMES[currentSubjectId] : null;

  // Use local state for UI updates to avoid context lag
  // We don't sync these from context anymore to avoid double-render loops
  const [openTabs, setOpenTabs] = useState<Resource[]>(() => {
    try {
      const saved = localStorage.getItem('current_session_tabs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeTabId, setActiveTabId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('current_session_active_tab');
    } catch (e) {
      return null;
    }
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [distractionTime, setDistractionTime] = useState(0);
  const [isDistracted, setIsDistracted] = useState(isSessionDistracted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [startTime, setStartTime] = useState(() => {
    try {
      const saved = localStorage.getItem('current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Number(parsed.startTime) || Date.now();
      }
    } catch (e) {}
    return Date.now();
  });
  
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSessionCompleted, setIsSessionCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem('current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Number(parsed.timeLeft) <= 0;
      }
    } catch (e) {}
    return false;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem('current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Number(parsed.timeLeft) <= 0;
      }
    } catch (e) {}
    return false;
  });
  const [newResource, setNewResource] = useState({ title: '', url: '', type: 'YOUTUBE' as ResourceType });
  const [externalWindows, setExternalWindows] = useState<{[key: string]: Window | null}>({});
  const [lastCheckpoint, setLastCheckpoint] = useState(Date.now());
  const [showSaveError, setShowSaveError] = useState(false);
  const [failedSessionData, setFailedSessionData] = useState<any>(null);

  const lastFragmentSaveRef = React.useRef(Date.now());
  const sessionBlobUrls = React.useRef<Set<string>>(new Set());

  const [resourceStates, setResourceStates] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('current_session_resource_states');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Helper to check if a URL is likely to block iframes
  const isIframeSafe = React.useCallback((url: string) => {
    if (!url || typeof url !== 'string') return true;
    // Whitelist internal resources and blob URLs
    if (url.startsWith('/resources/') || url.startsWith('blob:') || url.startsWith('data:')) {
      return true;
    }

    const blockedDomains = [
      'google.com',
      // 'notebooklm.google.com', // Whitelisted for external window
      'accounts.google.com',
      'github.com',
      'linkedin.com',
      'facebook.com',
      'twitter.com',
      'notion.so',
      'medium.com',
      'quora.com'
    ];

    const safeDomains = [
      'notebooklm.google.com',
      // 'supabase.co', // Moved to allow internal embedding
      // 'supabase.in',
    ];

    try {
      // Handle relative URLs by prepending origin
      const absoluteUrl = (url && url.startsWith('http')) ? url : window.location.origin + (url && url.startsWith('/') ? '' : '/') + url;
      const hostname = new URL(absoluteUrl).hostname;
      
      // Allow Supabase Storage to be embedded
      if (hostname.includes('supabase.co') || hostname.includes('supabase.in')) {
        return true;
      }

      // Check hardcoded safe domains
      const isSafe = safeDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      if (isSafe) return false; // Force external window for these to be safe

      // Check against hardcoded blocked domains
      const isDomainBlocked = blockedDomains.some(domain => hostname === domain || hostname.endsWith('.' + domain));
      if (isDomainBlocked) return false;

      // Check against user-defined blocked websites from Dashboard
      const savedBlocked = localStorage.getItem("blockedWebsites");
      if (savedBlocked) {
        const blockedWebsites = JSON.parse(savedBlocked);
        const isUserBlocked = blockedWebsites.some((site: any) => {
          try {
            if (!site?.url) return false;
            const siteHostname = new URL(site.url.startsWith('http') ? site.url : 'https://' + site.url).hostname;
            return hostname === siteHostname || hostname.endsWith('.' + siteHostname);
          } catch {
            return false;
          }
        });
        if (isUserBlocked) return false;
      }

      return true;
    } catch (e) {
      // If it's a relative path that failed URL parsing, it's likely internal and safe
      if (!url || !url.startsWith('http')) return true;
      return false;
    }
  }, []);

  // Fullscreen management
  useEffect(() => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.log(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    };
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {
            console.warn(`Fullscreen request failed: ${err.message}`);
          });
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.warn(`Fullscreen exit failed: ${err.message}`);
          });
        }
      }
    } catch (e) {
      console.error("Fullscreen toggle error", e);
    }
  };

  // Reset state when a new session starts
  useEffect(() => {
    if (isCompleted || isSessionCompleted) return;

    if (currentSessionId) {
      const saved = localStorage.getItem('current_session');
      if (!saved) {
        // This is a fresh session start
        const now = Date.now();
        setStartTime(now);
        setSessionTimeLeft(currentSessionDuration * 60);
        setSessionDistractionTime(0);
        setIsSessionDistracted(false);
        setOpenTabs([]);
        setActiveTabId(null);
        setExternalWindows({});
        localStorage.removeItem('distraction_start_time');
      }
    }
  }, [currentSessionId, currentSessionDuration, isCompleted, isSessionCompleted]);
  
  const handleSaveAndExit = React.useCallback(async () => {
    if (isSaving || completionCalled.current) return;
    setIsSaving(true);
    
    // Set UI states so the "Session Completed" text shows up (just to be sure)
    setIsCompleted(true);
    setIsSessionCompleted(true);
    setIsSessionDistracted(false);
    
    try {
      const now = Date.now();
      const actualElapsedSeconds = Math.floor((now - startTime) / 1000);
      
      let finalDistractionTime = distractionTimeRef.current;
      if (isDistractedRef.current && distractionStartTimeRef.current) {
        finalDistractionTime += Math.floor((now - distractionStartTimeRef.current) / 1000);
      }
      
      const netFocus = Math.max(0, actualElapsedSeconds - finalDistractionTime);
      const totalAttempted = actualElapsedSeconds;
      
      // We don't rely on openTabs for this if we don't have it, but we can read from localStorage or ref.
      const activeResourceStr = localStorage.getItem('current_session_active_tab') || "N/A";
      let activeResource = "N/A";
      try {
         const t = JSON.parse(activeResourceStr);
         if (t && t.title) activeResource = t.title;
      } catch (e) {}

      // Mark as completed
      completionCalled.current = true;
      
      // 1. Show the success animation immediately
      setSaveSuccess(true);
      setIsSaving(false);
      
      // 2. Wait 1.5 seconds for the user to see the success message
      setTimeout(async () => {
        // 3. Save the session and exit (this instantly unmounts the component)
        setIsManualExit(true);
        await endFocusSession(netFocus, totalAttempted, activeResource);
        cancelFocusSession();
      }, 1500);
      
    } catch (error) {
      console.error("Failed to save session:", error);
      setIsSaving(false);
      setShowSaveError(true);
    }
  }, [isSaving, startTime, endFocusSession, setIsManualExit, cancelFocusSession]);

  // Refs for internal tracking to prevent memory leaks and stale closures
  const timeLeftRef = React.useRef(0);
  const distractionTimeRef = React.useRef(0);
  const distractionStartTimeRef = React.useRef<number | null>(null);
  const isDistractedRef = React.useRef(isSessionDistracted);
  const isCompletedRef = React.useRef(false);
  const activeTabIdRef = React.useRef(activeTabId);
  const externalWindowsRef = React.useRef(externalWindows);
  const resourceStatesRef = React.useRef(resourceStates);
  const workerRef = React.useRef<Worker | null>(null);
  const heartbeatIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const completionCalled = React.useRef(false);

  // Initialize Web Worker
  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../lib/timerWorker.ts', import.meta.url));
      
      workerRef.current.onmessage = (e) => {
        const { type, payload } = e.data;
        if (type === 'TICK') {
          const { timeLeft, distractionTime, totalElapsed } = payload;
          timeLeftRef.current = timeLeft;
          
          // Dispatch high-frequency update for the timer display ONLY
          window.dispatchEvent(new CustomEvent('byd-time-update', { 
            detail: { 
              timeLeft, 
              distractionTime 
            } 
          }));

          // Dynamic Growth & Sync Protection
          const growthIntervalSeconds = currentSessionDuration <= 5 ? 60 : 300;
          const totalDurationSeconds = currentSessionDuration * 60;
          const currentIntervalCount = Math.floor(totalElapsed / growthIntervalSeconds);
          const lastIntervalCount = Math.floor((totalElapsed - 1) / growthIntervalSeconds);

          // Anti-Flicker: Use a 'ShouldUpdate' flag to prevent constant re-renders
          const shouldUpdate = currentIntervalCount > lastIntervalCount || totalElapsed === 0 || timeLeft === 0;

          if (shouldUpdate) {
            // Update global state occasionally to prevent constant re-renders
            setSessionTimeLeft(timeLeft);
            setSessionDistractionTime(distractionTime);

            const growthProgress = Math.min(100, (currentIntervalCount * growthIntervalSeconds / totalDurationSeconds) * 100);
            
            window.dispatchEvent(new CustomEvent('byd-growth-update', {
              detail: {
                progress: growthProgress,
                isCompleted: timeLeft === 0
              }
            }));

            // Sync with database/localStorage at these intervals
            saveSession();
            const netFocus = Math.max(0, totalElapsed - distractionTime);
            saveSessionFragment(netFocus, totalElapsed);
            lastFragmentSaveRef.current = Date.now();
            setLastCheckpoint(Date.now());
          }
        } else if (type === 'COMPLETED') {
          if (currentSessionId && !completionCalled.current) {
            setIsCompleted(true);
            setIsSessionCompleted(true);
            setIsSessionDistracted(false);
            setShowExitConfirm(false);
          }
        }
      };
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [currentSessionDuration, currentSessionId]);

  // Sync distraction state with worker
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'UPDATE_DISTRACTION',
        payload: { isDistracted: isSessionDistracted }
      });
    }
  }, [isSessionDistracted]);

  // Start/Resume worker
  useEffect(() => {
    if (isCompleted || isSessionCompleted) return;
    
    if (workerRef.current && currentSessionId && !isCompleted) {
      workerRef.current.postMessage({
        type: 'START',
        payload: {
          startTime,
          totalDuration: currentSessionDuration * 60,
          distractionTime: distractionTimeRef.current,
          isDistracted: isSessionDistracted
        }
      });
    }
  }, [workerRef.current, currentSessionId, isCompleted, startTime, currentSessionDuration]);

  // Initialize refs from localStorage or context on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('current_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        timeLeftRef.current = typeof parsed.timeLeft === 'number' ? parsed.timeLeft : currentSessionDuration * 60;
        distractionTimeRef.current = typeof parsed.distractionTime === 'number' ? parsed.distractionTime : 0;
        
        // Ensure if localStorage had 0, we explicitly hold it at 0
        if (timeLeftRef.current <= 0) {
           timeLeftRef.current = 0;
        }
      } else {
        if (isCompleted || isSessionCompleted) {
           timeLeftRef.current = 0;
        } else {
           timeLeftRef.current = currentSessionDuration * 60;
           distractionTimeRef.current = 0;
        }
      }
    } catch (e) {
      if (isCompleted || isSessionCompleted) {
         timeLeftRef.current = 0;
      } else {
         timeLeftRef.current = currentSessionDuration * 60;
         distractionTimeRef.current = 0;
      }
    }
  }, [currentSessionDuration, isCompleted, isSessionCompleted]);

  // Sync refs with state
  useEffect(() => { 
    if (isSessionDistracted) {
      if (!distractionStartTimeRef.current) {
        distractionStartTimeRef.current = Date.now();
        localStorage.setItem('distraction_start_time', distractionStartTimeRef.current.toString());
      }
    } else {
      if (distractionStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - distractionStartTimeRef.current) / 1000);
        distractionTimeRef.current += Math.max(0, elapsed);
        distractionStartTimeRef.current = null;
        localStorage.removeItem('distraction_start_time');
      }
    }
    isDistractedRef.current = isSessionDistracted; 
    setIsDistracted(isSessionDistracted); 
  }, [isSessionDistracted]);
  useEffect(() => { isCompletedRef.current = isCompleted; }, [isCompleted]);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
  useEffect(() => { externalWindowsRef.current = externalWindows; }, [externalWindows]);
  useEffect(() => { resourceStatesRef.current = resourceStates; }, [resourceStates]);
  
  // Persist tabs and active tab state
  useEffect(() => {
    localStorage.setItem('current_session_tabs', safeStringify(openTabs));
  }, [openTabs]);

  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem('current_session_active_tab', activeTabId);
    } else {
      localStorage.removeItem('current_session_active_tab');
    }
  }, [activeTabId]);

  const updateResourceState = React.useCallback((id: string, state: any) => {
    setResourceStates(prev => {
      const newState = {
        ...prev,
        [id]: { ...(prev[id] || {}), ...state }
      };
      return newState;
    });
  }, []);

  // Persist session state - Silent Heartbeat (Dynamic Interval)
  const saveSession = (force = false) => {
    try {
      const now = Date.now();
      // Calculate final distraction time for accurate persistence
      let finalDistractionTime = distractionTimeRef.current;
      if (isDistractedRef.current && distractionStartTimeRef.current) {
        finalDistractionTime += Math.floor((now - distractionStartTimeRef.current) / 1000);
      }

      localStorage.setItem('current_session', safeStringify({
        timeLeft: timeLeftRef.current,
        distractionTime: finalDistractionTime,
        isDistracted: isDistractedRef.current,
        startTime,
        duration: currentSessionDuration,
        sessionId: currentSessionId,
        lastUpdate: now
      }));
      localStorage.setItem('current_session_resource_states', safeStringify(resourceStatesRef.current));
      setLastCheckpoint(now);
    } catch (e) {
      // Silently fail if localStorage is full or restricted
    }
  };

  // Handle page visibility/unload for emergency checkpointing
  useEffect(() => {
    const handleUnload = () => saveSession(true);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      saveSession(true); // Final save on unmount
    };
  }, [startTime, currentSessionDuration, currentSessionId]);

  // Handle Session Completion - Manual Exit Only
  useEffect(() => {
    if (currentSessionId) {
      completionCalled.current = false;
    }
  }, [currentSessionId]);

  // Monitor external windows
  useEffect(() => {
    const interval = setInterval(() => {
      const stillOpen: Record<string, Window> = {};
      let changed = false;

      Object.entries(externalWindows).forEach(([id, win]) => {
        const w = win as Window | null;
        if (w && !w.closed) {
          stillOpen[id] = w;
        } else {
          changed = true;
        }
      });

      if (changed) {
        setExternalWindows(stillOpen);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [externalWindows]);

  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
  const [tabRetries, setTabRetries] = useState<Record<string, number>>({});

  // Resource Optimization: Revoke all blob URLs on unmount
  useEffect(() => {
    return () => {
      (Object.values(blobUrls) as string[]).forEach(url => {
        URL.revokeObjectURL(url);
      });
      // Also revoke session-wide local blob URLs
      sessionBlobUrls.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      sessionBlobUrls.current.clear();
    };
  }, [blobUrls]);

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const downloadSessionData = () => {
    if (!failedSessionData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(safeStringify(failedSessionData, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `byd_session_backup_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCancelSession = () => {
    setShowExitConfirm(true);
  };

  const confirmCancel = () => {
    setIsManualExit(true);
    cancelFocusSession();
    setShowExitConfirm(false);
  };

  const handleForceExit = async () => {
    setIsSaving(true);
    try {
      // 1. Calculate final stats using absolute math
      const now = Date.now();
      const actualElapsedSeconds = Math.floor((now - startTime) / 1000);
      
      let finalDistractionTime = distractionTimeRef.current;
      if (isDistractedRef.current && distractionStartTimeRef.current) {
        finalDistractionTime += Math.floor((now - distractionStartTimeRef.current) / 1000);
      }
      
      const netFocus = Math.max(0, actualElapsedSeconds - finalDistractionTime);
      const totalAttempted = actualElapsedSeconds;
      const activeResource = openTabs.find(t => t.id === activeTabId)?.title || "Early Exit";

      // 2. Immediate Save Execution: Trigger context save
      setIsManualExit(true);
      await endFocusSession(netFocus, totalAttempted, activeResource);
      
      // 3. Confirmation UI: Show 'Session Secured' message
      setSaveSuccess(true);
      setIsSaving(false);
      
      // 4. Force state cleanup and redirect
      setTimeout(() => {
        cancelFocusSession();
      }, 1500);

    } catch (error) {
      console.error("Failed to save early exit session:", error);
      setIsSaving(false);
      cancelFocusSession(); // Exit anyway if save fails during force exit
    }
  };

  const handleAddResource = (customRes?: any) => {
    if (customRes) {
      addResource({
        id: generateId(),
        ...customRes
      });
      setIsAddingResource(false);
      return;
    }

    if (!newResource.title || !newResource.url) return;
    addResource({
      id: generateId(),
      ...newResource
    });
    setIsAddingResource(false);
    setNewResource({ title: '', url: '', type: 'YOUTUBE' });
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('Resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Resources')
        .getPublicUrl(filePath);

      const newRes: Resource = {
        id: generateId(),
        title: file.name,
        url: publicUrl,
        type: 'PDF'
      };
      
      addResource(newRes);
      handleResourceClick(newRes);
    } catch (err: any) {
      console.error("Error uploading to Supabase:", err);
      let userMessage = `Upload failed: ${err.message || "Unknown error"}.`;
      
      if (err.message?.includes("Bucket not found")) {
        userMessage = "Error: 'Resources' bucket not found in Supabase. Please create a PUBLIC bucket named 'Resources' in your Supabase Storage dashboard.";
      } else if (err.message?.includes("violates row-level security policy")) {
        userMessage = "Error: Supabase RLS Policy violation. Please go to Supabase SQL Editor and run the policy script to allow public uploads to 'Resources' bucket.";
      }
      
      alert(userMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReupload = async (id: string, file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${generateId()}.${fileExt}`;
      const filePath = `pdfs/${fileName}`;

      const { data, error } = await supabase.storage
        .from('Resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Resources')
        .getPublicUrl(filePath);
      
      // Update global resources
      updateResource(id, { url: publicUrl });
      
      // Update local openTabs
      setOpenTabs(prev => prev.map(t => t.id === id ? { ...t, url: publicUrl } : t));
    } catch (err: any) {
      console.error("Error re-uploading to Supabase:", err);
      let userMessage = `Upload failed: ${err.message || "Unknown error"}.`;
      
      if (err.message?.includes("Bucket not found")) {
        userMessage = "Error: 'Resources' bucket not found in Supabase. Please create a PUBLIC bucket named 'Resources' in your Supabase Storage dashboard.";
      } else if (err.message?.includes("violates row-level security policy")) {
        userMessage = "Error: Supabase RLS Policy violation. Please go to Supabase SQL Editor and run the policy script to allow public uploads to 'Resources' bucket.";
      }
      
      alert(userMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Blob URL logic for PDFs to bypass Chrome security restrictions
  useEffect(() => {
    let isMounted = true;
    const generateBlobUrls = async () => {
      const currentTabIds = new Set(openTabs.map(t => t.id));
      
      // Cleanup revoked URLs (only for those created via fetch)
      setBlobUrls(prev => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach(id => {
          if (!currentTabIds.has(id)) {
            const resource = resources.find(r => r.id === id);
            // Only revoke if it's a blob we created that isn't the original resource URL
            if (updated[id] && (!resource || updated[id] !== resource.url)) {
              URL.revokeObjectURL(updated[id]);
            }
            delete updated[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });

      // Generate new URLs for remote PDFs (Only if needed for other components, 
      // but PDFViewer handles its own fetching now)
      // We'll keep this logic but make it more resilient or skip for remote PDFs if they fail once
      for (const tab of openTabs) {
        if (tab.type === 'PDF' && isMounted) {
          // If it's already a blob URL (local upload), skip processing
          if (tab.url && (tab.url.startsWith('blob:') || tab.url.startsWith('data:'))) continue;

          // Check if we already have a generated blob for this remote PDF
          let exists = false;
          setBlobUrls(prev => {
            if (prev[tab.id]) exists = true;
            return prev;
          });

          // Skip remote PDF blob generation to avoid redundant CORS errors in console
          // PDFViewer handles its own rendering and error reporting
          continue;
        }
      }
    };

    generateBlobUrls();
    return () => { isMounted = false; };
  }, [openTabs, resources]);

  const handleResourceClick = React.useCallback((res: Resource) => {
    // Persistence Check: Ensure we use the latest cloud link from the resources state
    const latestRes = resources.find(r => r.id === res.id) || res;
    
    // Set flag to prevent distraction stopwatch from triggering
    localStorage.setItem('isInteractingWithSafeResource', 'true');
    
    setOpenTabs(prev => {
      if (!prev.find(t => t.id === latestRes.id)) {
        return [...prev, latestRes];
      }
      return prev;
    });
    setActiveTabId(latestRes.id);

    // If it's not iframe safe, open in a new window
    if (!isIframeSafe(latestRes.url)) {
      const currentWin = externalWindowsRef.current[latestRes.id];
      if (!currentWin || currentWin.closed) {
        // Security: Use safeOpen to prevent reverse tabnabbing and validate URL
        const win = safeOpen(latestRes.url, `byd_resource_${latestRes.id}`, 'width=1000,height=800');
        if (win) {
          setExternalWindows(prev => ({ ...prev, [latestRes.id]: win }));
        }
      } else {
        currentWin.focus();
      }
    }
  }, [isIframeSafe, resources]);

  // Force reload logic for PDFs
  useEffect(() => {
    if (activeTabId) {
      const activeTab = openTabs.find(t => t.id === activeTabId);
      if (activeTab && activeTab.type === 'PDF' && (tabRetries[activeTabId] || 0) < 1) {
        // If we don't have a blob URL yet, or if the previous attempt failed
        if (!blobUrls[activeTabId] && activeTab.url) {
          const absoluteUrl = activeTab.url.startsWith('http') ? activeTab.url : window.location.origin + (activeTab.url.startsWith('/') ? '' : '/') + activeTab.url;
          
          fetch(absoluteUrl, { method: 'HEAD', mode: 'no-cors' })
            .then(() => {
              // If we get here, the resource is at least reachable (even if opaque)
              setTabRetries(prev => ({ ...prev, [activeTabId]: (prev[activeTabId] || 0) + 1 }));
            })
            .catch((err) => {
              console.warn(`PDF load check failed for ${activeTab.title}:`, err);
              setTabRetries(prev => ({ ...prev, [activeTabId]: (prev[activeTabId] || 0) + 1 }));
            });
        }
      }
    }
  }, [activeTabId, openTabs, blobUrls]);

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Close external window if it exists
    if (externalWindows[id]) {
      externalWindows[id]?.close();
      const newWindows = { ...externalWindows };
      delete newWindows[id];
      setExternalWindows(newWindows);
    }

    const newTabs = openTabs.filter(t => t.id !== id);
    setOpenTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col overflow-hidden"
      style={{ 
        willChange: 'transform, opacity',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Header */}
      <header 
        className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 relative backdrop-blur-md"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Left side empty to balance flex layout */}
        <div className="flex-1"></div>

        {/* Center Logo & Text */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center mt-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-neon-green rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(57,255,20,0.4)]">
              <TrendingUp className="text-black w-5 h-5" strokeWidth={2.5} />
            </div>
            <h1 
              className="text-2xl font-modern font-bold tracking-tight text-neon-green uppercase italic leading-none"
            >
              Detox
            </h1>
          </div>
          <p className="text-white/20 text-[8px] font-bold uppercase tracking-[0.5em] ml-1">
            {activeSubjectName ? `Focusing on ${activeSubjectName}` : "Concentration Mode"}
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex-1 flex items-center justify-end gap-8">
          {/* Main Timer */}
          <div className="flex flex-col items-center">
            <div className={`text-2xl font-mono font-bold tracking-wider flex items-center gap-2 transition-all duration-500 ${isCompleted ? 'text-neon-green drop-shadow-[0_0_10px_#39ff14]' : 'text-neon-green'}`}>
              <TimerText initialTime={timeLeftRef.current} isCompleted={isCompleted} />
              {Date.now() - lastCheckpoint < 5000 && !isCompleted && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1 h-1 bg-neon-green rounded-full shadow-[0_0_5px_#39ff14]"
                  title="Session Check-pointed"
                />
              )}
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${isCompleted ? 'text-neon-green' : 'text-white/30'}`}>
              {isCompleted ? 'Session Completed' : 'Session'}
            </span>
          </div>

          {/* Distraction Timer */}
          <div className="flex flex-col items-center">
            <DistractionTimerText initialTime={distractionTimeRef.current} isDistracted={isDistracted} />
            <span className="text-[8px] font-bold uppercase tracking-widest text-red-500/50">Distraction</span>
          </div>

          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

          <button 
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all border border-white/10"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button 
            onClick={isSessionCompleted ? handleSaveAndExit : handleCancelSession}
            disabled={isSaving}
            className={`px-4 h-10 rounded-xl flex items-center gap-2 transition-all group ${
              isSessionCompleted 
                ? 'bg-neon-green text-black font-bold shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:bg-[#2eff0a] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)]' 
                : 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
            }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSessionCompleted ? (
              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            ) : (
              <AlertCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isSaving ? 'SAVING...' : isSessionCompleted ? 'CLAIM SESSION' : 'END SESSION'}
            </span>
          </button>
        </div>
      </header>

          <AnimatePresence>
            {saveSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-neon-green text-black px-8 py-4 rounded-full font-bold shadow-[0_0_50px_#39ff14] flex items-center gap-3"
              >
                <ShieldCheck className="w-6 h-6" />
                <span className="uppercase tracking-widest text-sm">Session Secured</span>
              </motion.div>
            )}
          </AnimatePresence>

      <AnimatePresence>
        {showSaveError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#0A0A0A] border border-red-500/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-sans font-bold mb-2 text-white">Save Failed</h3>
              <p className="text-white/40 mb-8 text-sm leading-relaxed">
                We couldn't sync your session to the cloud. Don't worry, your data is backed up locally and we'll try again when you return to the dashboard.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={downloadSessionData}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Download Session Data
                </button>
                <button
                  onClick={() => {
                    setIsManualExit(true);
                    cancelFocusSession();
                  }}
                  className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Exit Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-[#111] border border-white/10 rounded-3xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-sans font-bold mb-2 text-white">Are you sure you want to leave?</h3>
              <p className="text-white/40 mb-8 text-sm leading-relaxed">
                Your session is not complete yet. Exiting now will discard your current progress and this session will not be saved.
              </p>
              <div className="flex flex-col gap-3 object-center items-center justify-center w-full">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-4 rounded-xl bg-neon-green text-black font-bold uppercase tracking-widest hover:bg-[#2eff0a] transition-all shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                >
                  Stay Focused
                </button>
                <button
                  onClick={confirmCancel}
                  className="w-full py-4 rounded-xl border border-red-500/50 text-red-500 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden h-full">
        <StudyResourcesSidebar 
          resources={resources}
          activeTabId={activeTabId}
          onResourceClick={handleResourceClick}
          onRemoveResource={(id) => {
            removeResource(id);
            const newTabs = openTabs.filter(t => t.id !== id);
            setOpenTabs(newTabs);
            if (activeTabId === id) {
              setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
            }
          }}
          onAddResource={handleAddResource}
          onFileUpload={handleFileUpload}
          isAddingResource={isAddingResource}
          setIsAddingResource={setIsAddingResource}
          newResource={newResource}
          setNewResource={setNewResource}
          totalDuration={currentSessionDuration}
          isDistracted={isDistracted}
          isSessionCompleted={isSessionCompleted}
          isUploading={isUploading}
        />

        {/* Central Display */}
        <div className="flex-1 bg-[#0a0a0a] relative flex flex-col h-full overflow-hidden">
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="flex bg-[#111] border-b border-white/10 overflow-x-auto scrollbar-hide shrink-0">
              {openTabs.map(tab => (
                <div 
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 min-w-[140px] max-w-[220px] border-r border-white/10 cursor-pointer transition-colors ${
                    activeTabId === tab.id ? 'bg-[#1a1a1a] text-white border-t-2 border-t-[#00f0ff]' : 'bg-[#0a0a0a] text-white/50 hover:bg-[#151515] border-t-2 border-t-transparent'
                  }`}
                >
                  {tab.type === "YOUTUBE" && <Youtube className="w-4 h-4 text-red-500 shrink-0" />}
                  {tab.type === "PDF" && <FileText className="w-4 h-4 text-blue-500 shrink-0" />}
                  {tab.type === "IMAGE" && <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />}
                  {tab.type === "OTHERS" && <Globe className="w-4 h-4 text-emerald-500 shrink-0" />}
                  <span className="text-sm font-medium truncate flex-1">{tab.title}</span>
                  
                  {tab.type === 'PDF' && (
                    <a 
                      href={tab.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-white/10 rounded-md text-white/40 hover:text-neon-green transition-colors"
                      title="Open in Secure Tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button 
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="p-1 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 relative overflow-hidden">
            {openTabs.length > 0 ? (
              openTabs.map(tab => (
                <div 
                  key={tab.id} 
                  className="absolute inset-0"
                  style={{ display: activeTabId === tab.id ? 'block' : 'none' }}
                >
                  <ResourceViewer 
                    tab={tab}
                    isSafe={isIframeSafe(tab.url)}
                    blobUrl={blobUrls[tab.id]}
                    retryCount={tabRetries[tab.id] || 0}
                    onReopen={handleResourceClick}
                    isExternalOpen={!!(externalWindows[tab.id] && !(externalWindows[tab.id] as Window).closed)}
                    isActive={activeTabId === tab.id}
                    onStateUpdate={updateResourceState}
                    initialState={resourceStates[tab.id]}
                    onReupload={handleReupload}
                  />
                </div>
              ))
            ) : (
              <DetoxActivatedView />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
