import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

// Hook for fetching subjects
export const useSubjects = () => {
  const { user } = useApp();

  return useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

// Hook for fetching chapters
export const useChapters = (subjectId?: string) => {
  const { user } = useApp();

  return useQuery({
    queryKey: ['chapters', user?.id, subjectId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase
        .from('chapters')
        .select('*')
        .eq('user_id', user.id);
      
      if (subjectId) {
        query = query.eq('subject_id', subjectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
