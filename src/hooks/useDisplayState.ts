import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_GUEST_STATE } from '../constants';

export const useDisplayState = () => {
  const context = useApp();
  
  return useMemo(() => {
    if (context.user || !context.isAuthReady) return context;
    return { ...context, ...SAMPLE_GUEST_STATE };
  }, [context]);
};
