import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase'; // আপনার সুপাবেস ক্লায়েন্ট
import { SAMPLE_GUEST_STATE } from '../constants';

export const useDisplayState = () => {
  const context = useApp();
  const userId = context.user?.id;

  // ১. মেইন ডাটা ফেচিং (TanStack Query)
  const { data: serverData, isLoading, isError, error } = useQuery({
    queryKey: ['userStats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // এখানে আপনার প্রোফাইলের প্রয়োজনীয় সব ডাটা একবারে আনা হচ্ছে
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId, // ইউজার লগইন থাকলে তবেই রান করবে
    staleTime: 1000 * 60 * 5, // ৫ মিনিট পর্যন্ত ডাটা ক্যাশে থাকবে
  });

  // ২. গেস্ট এবং সার্ভার ডাটার সমন্বয় (Memoized)
  const finalState = useMemo(() => {
    // যদি ডাটা লোড হতে থাকে বা ইউজার না থাকে
    if (!context.user || !context.isAuthReady) {
      return { ...context, ...SAMPLE_GUEST_STATE, isLoading: context.isAuthLoading };
    }

    // সার্ভার থেকে আসা ডাটা অ্যাপের স্টেটের সাথে মার্জ করা
    return {
      ...context,
      ...serverData, // ডাটাবেসের ডাটা এখানে আসবে
      isLoading,
      isError,
      error
    };
  }, [context, serverData, isLoading, isError, error]);

  return finalState;
};
