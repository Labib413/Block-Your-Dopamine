import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { db, collection, getDocs, syncItemToFirestore } from '../lib/firebase';

const TABLE_TO_SUBCOLLECTION: Record<string, string> = {
  sessions: 'sessions',
  focus_logs: 'focus_logs',
  user_streaks: 'streaks',
  user_preferences: 'preferences',
  guarded_websites: 'guarded_websites',
  planner_tasks: 'planner_tasks',
  health_logs: 'health_logs',
  academic_progress: 'academic_progress',
  academic_chapters: 'academic_chapters',
  academic_settings: 'academic_settings',
  academic_routines: 'academic_routines',
  mood_entries: 'mood_entries',
  resources: 'resources',
  macro_data: 'macro_data'
};

// এই হুকটি Firebase Firestore এবং Supabase থেকে ডাটা ফেচ ও সিঙ্ক করবে
export const useBYDData = (tableName: string) => {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const subcollectionName = TABLE_TO_SUBCOLLECTION[tableName] || tableName;

  // ডাটা রিড করার জন্য (Fetch from Firestore + Supabase fallback)
  const query = useQuery({
    queryKey: [tableName, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let remoteDocs: any[] = [];
      try {
        const colRef = collection(db, 'users', user.id, subcollectionName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          remoteDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn(`[Firestore] Fetch failed for ${subcollectionName}:`, err);
      }

      let localDocs: any[] = [];
      try {
        const { data } = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', user.id);
        localDocs = data || [];
      } catch (err) {
        console.warn(`[Supabase] Fetch failed for ${tableName}:`, err);
      }

      // Merge results avoiding duplicate records
      const recordMap = new Map<string, any>();
      localDocs.forEach(item => {
        const key = item.id || item.session_id || item.logId || JSON.stringify(item);
        recordMap.set(key, item);
      });
      remoteDocs.forEach(item => {
        const key = item.id || item.session_id || item.logId || JSON.stringify(item);
        recordMap.set(key, { ...(recordMap.get(key) || {}), ...item });
        // Warm local storage cache with recovered cloud documents
        try {
          supabase.from(tableName).upsert({ ...item, user_id: user.id });
        } catch {}
      });

      return Array.from(recordMap.values());
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  // ডাটা আপডেট করার জন্য (Optimistic Update + Firebase sync)
  const mutation = useMutation({
    mutationFn: async (updatedRow: any) => {
      if (!user?.id) return;
      const payload = { ...updatedRow, user_id: user.id };
      await supabase.from(tableName).upsert(payload);
      await syncItemToFirestore(user.id, tableName, payload, 'upsert');
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [tableName, user?.id] });
      const previousData = queryClient.getQueryData([tableName, user?.id]);
      // ক্লিক করার সাথে সাথে UI আপডেট করে দাও
      queryClient.setQueryData([tableName, user?.id], (old: any) => 
        old ? old.map((item: any) => item.id === newData.id ? { ...item, ...newData } : item) : [newData]
      );
      return { previousData };
    },
    onError: (_err, _newData, context: any) => {
      queryClient.setQueryData([tableName, user?.id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [tableName, user?.id] });
    },
  });

  return { ...query, updateData: mutation.mutate };
};
