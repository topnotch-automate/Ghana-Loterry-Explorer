import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { predictionsApi } from '../api/client';

export const useLottoTypes = (
  options?: Omit<UseQueryOptions<string[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['lotto-types'],
    queryFn: () => predictionsApi.getLottoTypes(),
    staleTime: 30 * 60 * 1000, // 30 minutes - lotto types don't change often
    ...options,
  });
};
