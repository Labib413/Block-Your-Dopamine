import { useState, useEffect, useCallback, useRef } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

// In-memory cache for ultra-fast hydration
const memoryCache = new Map<string, any>();

export function useSupabaseFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
) {
  const [state, setState] = useState<FetchState<T>>(() => ({
    // Hydrate from memory cache if available for 0ms flicker
    data: memoryCache.get(cacheKey) || null,
    isLoading: !memoryCache.has(cacheKey),
    error: null,
  }));

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const refetch = useCallback(async () => {
    if (!state.data) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }
    try {
      const data = await fetchFn();
      if (isMounted.current) {
        memoryCache.set(cacheKey, data);
        setState({ data, isLoading: false, error: null });
      }
    } catch (error) {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: false, error: error as Error }));
      }
    }
  }, [cacheKey, fetchFn, state.data]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
