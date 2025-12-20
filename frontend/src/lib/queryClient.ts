import { QueryClient } from '@tanstack/react-query';

// Configure React Query with retry logic and caching
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache time: keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in v5)
      // Retry failed requests with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (but only if data is stale)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: 'always',
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});
