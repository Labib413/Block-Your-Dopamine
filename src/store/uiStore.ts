import { create } from 'zustand';

interface UIState {
  isLoggingOut: boolean;
  setIsLoggingOut: (loggingOut: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  showBadges: boolean;
  setShowBadges: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isLoggingOut: false,
  setIsLoggingOut: (isLoggingOut) => set({ isLoggingOut }),
  isAuthModalOpen: false,
  setIsAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  showBadges: false,
  setShowBadges: (showBadges) => set({ showBadges }),
}));
