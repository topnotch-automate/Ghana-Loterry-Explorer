import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { predictionsApi } from '../api/client';
import type { SavedPrediction, StrategyPerformance } from '../types';

export const useSavedPredictions = (
  options?: Omit<UseQueryOptions<SavedPrediction[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['predictions', 'saved'],
    queryFn: () => predictionsApi.getHistory(10), // Get last 10 predictions
    ...options,
  });
};

export const useStrategyPerformance = (
  options?: Omit<UseQueryOptions<StrategyPerformance, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['predictions', 'strategy-performance'],
    queryFn: () => predictionsApi.getStrategyPerformance(),
    staleTime: 2 * 60 * 1000, // 2 minutes - strategy performance doesn't change often
    ...options,
  });
};

export const useCheckPredictions = (
  options?: UseMutationOptions<any, Error, void>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => predictionsApi.checkAllPredictions(),
    onSuccess: () => {
      // Invalidate saved predictions and strategy performance to refetch
      queryClient.invalidateQueries({ queryKey: ['predictions', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'strategy-performance'] });
    },
    ...options,
  });
};

export const useSavePrediction = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (prediction: any) => predictionsApi.savePrediction(prediction),
    onSuccess: () => {
      // Invalidate saved predictions to refetch
      queryClient.invalidateQueries({ queryKey: ['predictions', 'saved'] });
      queryClient.invalidateQueries({ queryKey: ['predictions', 'strategy-performance'] });
    },
    ...options,
  });
};
