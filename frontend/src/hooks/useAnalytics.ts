import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { analyticsApi } from '../api/client';
import type { FrequencyStats, CoOccurrenceData } from '../types';

export const useFrequencyStats = (
  days: number,
  options?: Omit<UseQueryOptions<FrequencyStats[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analytics', 'frequency', days],
    queryFn: () => analyticsApi.getFrequency({ days }),
    staleTime: 10 * 60 * 1000, // 10 minutes - frequency stats don't change often
    ...options,
  });
};

export const useHotNumbers = (
  days: number = 30,
  options?: Omit<UseQueryOptions<FrequencyStats[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analytics', 'hot', days],
    queryFn: () => analyticsApi.getHot(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useColdNumbers = (
  days: number = 30,
  options?: Omit<UseQueryOptions<FrequencyStats[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analytics', 'cold', days],
    queryFn: () => analyticsApi.getCold(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useSleepingNumbers = (
  days: number = 30,
  options?: Omit<UseQueryOptions<number[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analytics', 'sleeping', days],
    queryFn: () => analyticsApi.getSleeping(days),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useCoOccurrence = (
  params: { limit?: number; minCount?: number; days?: number },
  options?: Omit<UseQueryOptions<CoOccurrenceData[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['analytics', 'co-occurrence', params.limit, params.minCount, params.days],
    queryFn: () => analyticsApi.getCoOccurrence(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};
