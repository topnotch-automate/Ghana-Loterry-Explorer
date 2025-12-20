import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { drawsApi } from '../api/client';
import type { Draw } from '../types';

interface UseDrawsParams {
  lottoType?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export const useDraws = (
  params?: UseDrawsParams,
  options?: Omit<UseQueryOptions<Draw[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['draws', params?.lottoType, params?.startDate, params?.endDate],
    queryFn: () => drawsApi.getAll({
      lottoType: params?.lottoType,
      startDate: params?.startDate,
      endDate: params?.endDate,
    }),
    enabled: params?.enabled !== false,
    ...options,
  });
};

export const useLatestDraw = (
  lottoType?: string,
  options?: Omit<UseQueryOptions<Draw | null, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['draws', 'latest', lottoType],
    queryFn: () => drawsApi.getLatest(lottoType),
    ...options,
  });
};
