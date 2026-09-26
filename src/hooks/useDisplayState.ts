import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SAMPLE_GUEST_STATE } from '../constants';

export const useDisplayState = () => {
  const context = useApp();

  // গেস্ট এবং রিয়েল-টাইম অথেন্টিকেটেড ইউজারের ডাটার সঠিক সমন্বয়
  const finalState = useMemo(() => {
    // যদি ইউজার লগইন না থাকে
    if (!context.user && context.isAuthReady) {
      return { 
        ...context, 
        ...SAMPLE_GUEST_STATE, 
        isLoading: false 
      };
    }

    // অথেন্টিকেটেড ইউজার: AppContext হলো Firebase ও লোকাল স্টোরেজের সাথে কানেক্টেড প্রাইমারি ট্রুথ
    return {
      ...context,
      isLoading: !context.isAuthReady || context.isDataLoading,
      isError: false,
      error: null
    };
  }, [context]);

  return finalState;
};

