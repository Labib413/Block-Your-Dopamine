import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { db, collection, getDocs, syncItemToFirestore } from '../lib/firebase';

// ১. এই হুকটি Firebase Firestore এবং Supabase থেকে ডাটা ফেচ ও সিঙ্ক করবে
export const useBYDData = (tableName: string) => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  // ডাটা রিড করার জন্য (Fetch from Firestore + Supabase fallback)
  const query = useQuery({
    queryKey: [tableName, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      let remoteDocs: any[] = [];
      try {
        const colRef = collection(db, 'users', user.id, tableName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          remoteDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn(`[Firestore] Fetch failed for ${tableName}:`, err);
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