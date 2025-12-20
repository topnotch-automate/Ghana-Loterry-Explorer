import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { drawsApi } from '../api/client';
import type { SearchResult, SearchMode } from '../types';

interface UseSearchParams {
  numbers: number[];
  mode: SearchMode;
  enabled?: boolean;
}

export const useSearch = (
  params: UseSearchParams,
  options?: Omit<UseQueryOptions<SearchResult[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['search', params.numbers, params.mode],
    queryFn: () => drawsApi.search({
      numbers: params.numbers,
      mode: params.mode,
    }),
    enabled: params.enabled !== false && params.numbers.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - search results don't change often
    ...options,
  });
};

export const useAllDraws = (
  limit?: number,
  options?: Omit<UseQueryOptions<SearchResult[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['draws', 'all', limit],
    queryFn: () => drawsApi.getAll({ limit }) as Promise<SearchResult[]>,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};
