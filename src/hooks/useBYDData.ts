import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

// ১. এই হুকটি আপনার সব ডাটাবেস টেবিল থেকে ডাটা আনবে
export const useBYDData = (tableName: string) => {
  const { user } = useApp();
  const queryClient = useQueryClient();

  // ডাটা রিড করার জন্য (Fetch)
  const query = useQuery({
    queryKey: [tableName, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // ৫ মিনিট ক্যাশ
  });

  // ডাটা আপডেট করার জন্য (Optimistic Update)
  const mutation = useMutation({
    mutationFn: async (updatedRow: any) => {
      const { error } = await supabase
        .from(tableName)
        .upsert({ ...updatedRow, user_id: user?.id });
      if (error) throw error;
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
    onError: (err, newData, context: any) => {
      queryClient.setQueryData([tableName, user?.id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [tableName, user?.id] });
    },
  });

  // ডাটা ডিলিট করার জন্য
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [tableName, user?.id] });
      const previousData = queryClient.getQueryData([tableName, user?.id]);
      queryClient.setQueryData([tableName, user?.id], (old: any) =>
        old ? old.filter((item: any) => item.id !== id) : []
      );
      return { previousData };
    },
    onError: (err, id, context: any) => {
      queryClient.setQueryData([tableName, user?.id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [tableName, user?.id] });
    },
  });

  return {
    ...query,
    updateData: mutation.mutate,
    deleteData: deleteMutation.mutate
  };
};