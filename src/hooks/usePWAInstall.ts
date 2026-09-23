import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  
  // Instant check for standalone / PC shortcut window / installed flag
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');

      const isStoredInstalled = localStorage.getItem('byd_pwa_installed') === 'true';
      return isStandalone || isStoredInstalled;
    } catch {
      return false;
    }
  });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (PC shortcut or installed app)
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('byd_pwa_installed') === 'true';
      
      if (isStandalone) {
        setIsInstalled(true);
      }
    };

    checkStandalone();

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    if (standaloneQuery.addEventListener) {
      standaloneQuery.addEventListener('change', handleMediaChange);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem('byd_pwa_installed', 'true');
      } catch (err) {
        console.warn('[PWA] Storage access failed:', err);
      }
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (standaloneQuery.removeEventListener) {
        standaloneQuery.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem('byd_pwa_installed', 'true');
          } catch (err) {
            console.warn('[PWA] Storage access failed:', err);
          }
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowModal(false);
          return true;
        }
      } catch (err) {
        console.error('[PWA] Native prompt error:', err);
      }
    }
    // If native prompt is not available (e.g. inside iframe or iOS or Safari), open the guide modal
    setShowModal(true);
    return false;
  };

  return { 
    isInstallable: true, // Always allow user to view install instructions / install
    isInstalled, 
    hasNativePrompt: !!deferredPrompt,
    triggerInstall,
    showModal,
    setShowModal
  };
}

