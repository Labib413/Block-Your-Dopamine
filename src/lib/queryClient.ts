import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
    },
  },
});

const localStoragePersister = typeof window !== 'undefined'
  ? createSyncStoragePersister({
      storage: window.localStorage,
    })
  : undefined;

if (typeof window !== 'undefined' && localStoragePersister) {
  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
  });
}
