import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { predictionsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { PredictionCard } from '../components/PredictionCard';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { handleApiError } from '../utils/errors';
import { useLottoTypes } from '../hooks/useLottoTypes';
import type { PredictionResponse, PredictionStrategy } from '../types';

// Strategy icons and descriptions
const strategyInfo: Record<PredictionStrategy, { icon: string; description: string; color: string }> = {
  ensemble: {
    icon: '🎯',
    description: 'Combines all methods using weighted voting for the most reliable predictions',
    color: 'from-purple-500 to-pink-500',
  },
  ml: {
    icon: '🤖',
    description: 'Machine learning models trained on historical patterns and number frequencies',
    color: 'from-blue-500 to-cyan-500',
  },
  genetic: {
    icon: '🧬',
    description: 'Evolutionary algorithm that optimizes number selection based on constraints',
    color: 'from-green-500 to-emerald-500',
  },
  pattern: {
    icon: '🔍',
    description: 'Pattern matching analysis identifying hot numbers, cold numbers, and trends',
    color: 'from-orange-500 to-red-500',
  },
  intelligence: {
    icon: '🧠',
    description: 'Advanced intelligence engine using machine numbers, temporal memory, lag signatures, and relationship analysis',
    color: 'from-indigo-500 to-purple-500',
  },
  yearly: {
    icon: '📅',
    description: 'Cross-year pattern analysis using Law of Large Numbers - detects recurring patterns across years',
    color: 'from-amber-500 to-yellow-500',
  },
  transfer: {
    icon: '🔄',
    description: 'Detects when patterns from one context (lotto type, year, month) repeat in another - cross-context pattern matching',
    color: 'from-teal-500 to-cyan-500',
  },
};

// Interface for saved special predictions (matching Dashboard)
interface SavedSpecialPrediction {
  id: string;
  type: 'two_sure' | 'three_direct';
  numbers: number[];
  lottoType?: string;
  createdAt: string;
}

export const Predictions: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<PredictionStrategy>('ensemble');
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [selectedLottoType, setSelectedLottoType] = useState<string>('');
  const [useTypeSpecificTable, setUseTypeSpecificTable] = useState<boolean>(true);
  
  // React Query hook for lotto types
  const { 
    data: lottoTypes = [], 
    isLoading: loadingTypes,
    error: lottoTypesError 
  } = useLottoTypes();
  
  // Log lotto types for debugging
  useEffect(() => {
    if (lottoTypes.length > 0) {
      console.log('Lotto types loaded:', lottoTypes);
    }
    if (lottoTypesError) {
      console.error('Error loading lotto types:', lottoTypesError);
    }
  }, [lottoTypes, lottoTypesError]);
  const [savingPrediction, setSavingPrediction] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // State for saving Two Sure / Three Direct to Dashboard
  const [savingTwoSure, setSavingTwoSure] = useState(false);
  const [savingThreeDirect, setSavingThreeDirect] = useState(false);
  const [specialSaveSuccess, setSpecialSaveSuccess] = useState<string | null>(null);
  
  // State for check-and-balance prediction
  const [checkBalancePrediction, setCheckBalancePrediction] = useState<PredictionResponse | null>(null);
  const [loadingCheckBalance, setLoadingCheckBalance] = useState(false);
  const [checkBalanceError, setCheckBalanceError] = useState<string | null>(null);
  const [recommendedStrategy, setRecommendedStrategy] = useState<string | null>(null);
  const [strategyConfidence, setStrategyConfidence] = useState<number | null>(null);
  const [winningPredictionsCount, setWinningPredictionsCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    checkServiceHealth();
  }, [isAuthenticated, navigate]);

  // Set default lotto type when types are loaded
  useEffect(() => {
    if (lottoTypes.length > 0 && !selectedLottoType) {
      setSelectedLottoType(lottoTypes[0]); // Select first type by default
    }
  }, [lottoTypes, selectedLottoType]);

  const checkServiceHealth = async () => {
    try {
      const health = await predictionsApi.getHealth();
      setServiceAvailable(health.available);
    } catch (error) {
      setServiceAvailable(false);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!subscription?.isPro) {
      setError('Pro subscription required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      const result = await predictionsApi.generate({
        strategy,
        lottoType: selectedLottoType || undefined,
        useTypeSpecificTable: useTypeSpecificTable && selectedLottoType ? true : undefined,
      });
      setPredictions(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [strategy, selectedLottoType, useTypeSpecificTable, subscription?.isPro]);

  const handleGenerateCheckBalance = useCallback(async () => {
    if (!subscription?.isPro) {
      setCheckBalanceError('Pro subscription required');
      return;
    }

    try {
      setLoadingCheckBalance(true);
      setCheckBalanceError(null);
      setCheckBalancePrediction(null);
      setRecommendedStrategy(null);
      setStrategyConfidence(null);
      setWinningPredictionsCount(null);
      
      const result = await predictionsApi.generateCheckBalance({
        lottoType: selectedLottoType || undefined,
        useTypeSpecificTable: useTypeSpecificTable && selectedLottoType ? true : undefined,
      });
      
      setCheckBalancePrediction(result);
      
      // Extract metadata if available (from the response object)
      const metadata = result as any;
      if (metadata.recommendedStrategy) {
        setRecommendedStrategy(metadata.recommendedStrategy);
        setStrategyConfidence(metadata.strategyConfidence || null);
        setWinningPredictionsCount(metadata.winningPredictionsAnalyzed || null);
      } else {
        // Reset if no metadata
        setRecommendedStrategy(null);
        setStrategyConfidence(null);
        setWinningPredictionsCount(null);
      }
    } catch (err: any) {
      // Handle NO_WINNING_PREDICTIONS error specially
      if (err.code === 'NO_WINNING_PREDICTIONS' || err.message?.includes('NO_WINNING_PREDICTIONS')) {
        setCheckBalanceError('NO_WINNING_PREDICTIONS');
      } else {
        setCheckBalanceError(handleApiError(err));
      }
      setCheckBalancePrediction(null);
      setRecommendedStrategy(null);
      setStrategyConfidence(null);
      setWinningPredictionsCount(null);
    } finally {
      setLoadingCheckBalance(false);
    }
  }, [selectedLottoType, useTypeSpecificTable, subscription?.isPro]);

  const handleSavePrediction = async () => {
    if (!predictions) return;

    // Get the primary prediction (ensemble or first available)
    const primaryPrediction = predictions.predictions.ensemble?.[0] 
      || predictions.predictions[strategy]?.[0]
      || Object.values(predictions.predictions).flat()[0];

    if (!primaryPrediction?.numbers) {
      setError('No prediction to save');
      return;
    }

    try {
      setSavingPrediction(true);
      setError(null);
      await predictionsApi.savePrediction({
        numbers: primaryPrediction.numbers,
        strategy,
        lottoType: selectedLottoType || undefined,
        targetDrawDate: new Date().toISOString().split('T')[0],
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSavingPrediction(false);
    }
  };

  // Helper function to save to localStorage (for Dashboard display)
  const saveToLocalStorage = (type: 'two_sure' | 'three_direct', numbers: number[]) => {
    const newPrediction: SavedSpecialPrediction = {
      id: `${type}-${Date.now()}`,
      type,
      numbers,
      lottoType: selectedLottoType || undefined,
      createdAt: new Date().toISOString(),
    };
    
    // Load existing saved predictions
    const existing = localStorage.getItem('savedSpecialPredictions');
    const parsed: SavedSpecialPrediction[] = existing ? JSON.parse(existing) : [];
    
    // Add new prediction and keep max 20
    const updated = [newPrediction, ...parsed].slice(0, 20);
    localStorage.setItem('savedSpecialPredictions', JSON.stringify(updated));
  };

  // Save Two Sure to Dashboard (both API and localStorage)
  const handleSaveTwoSureToDashboard = async () => {
    if (!predictions?.predictions.two_sure) return;
    
    setSavingTwoSure(true);
    try {
      const numbers = predictions.predictions.two_sure.numbers;
      
      // Save to backend API (like regular predictions)
      await predictionsApi.savePrediction({
        numbers,
        strategy: 'two_sure',
        lottoType: selectedLottoType || undefined,
        targetDrawDate: new Date().toISOString().split('T')[0],
      });
      
      // Also save to localStorage for Dashboard display
      saveToLocalStorage('two_sure', numbers);
      
      setSpecialSaveSuccess('Two Sure saved to Dashboard!');
      setTimeout(() => setSpecialSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save Two Sure:', err);
      setError(handleApiError(err));
    } finally {
      setSavingTwoSure(false);
    }
  };

  // Save Three Direct to Dashboard (both API and localStorage)
  const handleSaveThreeDirectToDashboard = async () => {
    if (!predictions?.predictions.three_direct) return;
    
    setSavingThreeDirect(true);
    try {
      const numbers = predictions.predictions.three_direct.numbers;
      
      // Save to backend API (like regular predictions)
      await predictionsApi.savePrediction({
        numbers,
        strategy: 'three_direct',
        lottoType: selectedLottoType || undefined,
        targetDrawDate: new Date().toISOString().split('T')[0],
      });
      
      // Also save to localStorage for Dashboard display
      saveToLocalStorage('three_direct', numbers);
      
      setSpecialSaveSuccess('Three Direct saved to Dashboard!');
      setTimeout(() => setSpecialSaveSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save Three Direct:', err);
      setError(handleApiError(err));
    } finally {
      setSavingThreeDirect(false);
    }
  };

  if (subscriptionLoading || !isAuthenticated) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!subscription?.isPro && !user?.isPro) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
              🔮
            </div>
            <div>
              <h1 className="text-3xl font-bold">Advanced Predictions</h1>
              <p className="text-white/90 text-sm mt-1">
                AI-powered lottery number predictions
              </p>
            </div>
          </div>
        </div>
        <UpgradePrompt feature="Advanced Predictions" />
        <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-accent-50">
          <div className="text-center py-6">
            <Link
              to="/subscription"
              className="inline-block px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Upgrade to Pro Now
            </Link>
            <p className="mt-3 text-sm text-gray-600">
              Unlock AI-powered predictions, machine learning models, and advanced pattern analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
            🔮
          </div>
          <div>
            <h1 className="text-3xl font-bold">Advanced Predictions</h1>
            <p className="text-white/90 text-sm mt-1">
              AI-powered lottery number predictions
            </p>
          </div>
        </div>
        <p className="text-white/80 mt-3 text-sm">
          Generate predictions using machine learning, genetic algorithms, and advanced pattern analysis.
        </p>
      </div>

      {serviceAvailable === false && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-yellow-800 font-medium">Prediction service unavailable</p>
              <p className="text-yellow-600 text-sm">
                The prediction service is currently not available. Please try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Section */}
      <div className="card border-2 border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Configuration</h2>
        </div>

        <div className="space-y-6">
          {/* Lotto Type Selection */}
          <div>
            <label htmlFor="lottoType" className="block text-sm font-medium text-gray-700 mb-2">
              Draw Type <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <select
                id="lottoType"
                value={selectedLottoType}
                onChange={(e) => setSelectedLottoType(e.target.value)}
                disabled={loadingTypes}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none bg-white cursor-pointer hover:border-gray-400 transition-all shadow-sm"
              >
                <option value="">All Types (Mixed Predictions)</option>
                {loadingTypes ? (
                  <option disabled>Loading types...</option>
                ) : lottoTypes.length === 0 ? (
                  <option disabled>No lotto types found. Please run the scraper first.</option>
                ) : (
                  lottoTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {lottoTypes.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-gray-500">
                  {lottoTypes.length} type{lottoTypes.length !== 1 ? 's' : ''} available
                </span>
                {selectedLottoType && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                      {selectedLottoType}
                    </span>
                  </>
                )}
              </div>
            )}
            {selectedLottoType && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="useTypeSpecificTable"
                    checked={useTypeSpecificTable}
                    onChange={(e) => setUseTypeSpecificTable(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                  />
                  <label htmlFor="useTypeSpecificTable" className="ml-2 text-sm text-gray-700">
                    <span className="font-medium">Use type-specific analysis</span>
                    <span className="block text-xs text-gray-600 mt-0.5">
                      Recommended for better accuracy. Uses only {selectedLottoType} historical data.
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800">Prediction Strategy</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(['ensemble', 'ml', 'genetic', 'pattern', 'intelligence', 'yearly', 'transfer'] as PredictionStrategy[]).map((strat) => {
            const info = strategyInfo[strat];
            const isSelected = strategy === strat;
            return (
              <button
                key={strat}
                onClick={() => setStrategy(strat)}
                className={`relative p-5 sm:p-4 rounded-xl border-2 transition-all text-left group active:scale-95 min-h-[80px] sm:min-h-0 ${
                  isSelected
                    ? `border-primary-500 bg-gradient-to-br ${info.color} text-white shadow-lg transform scale-105`
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {strat.charAt(0).toUpperCase() + strat.slice(1)}
                      </h3>
                      {isSelected && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                      {info.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generate Buttons */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleGenerate}
            disabled={loading || serviceAvailable === false}
            className="relative px-8 py-4 sm:px-10 sm:py-4 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg w-full sm:w-auto sm:min-w-[200px] min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Predictions
              </span>
            )}
          </button>

          <button
            onClick={handleGenerateCheckBalance}
            disabled={loadingCheckBalance || serviceAvailable === false}
            className="relative px-8 py-4 sm:px-10 sm:py-4 text-base sm:text-lg font-semibold rounded-xl bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-lg hover:shadow-xl active:scale-95 transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg w-full sm:w-auto sm:min-w-[200px] min-h-[44px]"
          >
            {loadingCheckBalance ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Check & Balance
              </span>
            )}
          </button>
        </div>
        {(loading || loadingCheckBalance) && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
            This may take a few moments...
          </div>
        )}
      </div>

      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleGenerate}
          title="Prediction Error"
        />
      )}

      {checkBalanceError && (
        <div className="card border-2 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Check & Balance Not Available</h3>
              {checkBalanceError === 'NO_WINNING_PREDICTIONS' ? (
                <div className="space-y-3">
                  <p className="text-amber-800">
                    The Check & Balance algorithm requires past winning or partial predictions to analyze and recommend the best strategy.
                  </p>
                  <p className="text-amber-800 font-medium">
                    Currently, there are no winning or partial predictions in your history.
                  </p>
                  <div className="mt-4 p-4 bg-white rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-900 font-semibold mb-2">What you can do:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                      <li>Try other prediction strategies above (Ensemble, ML, Genetic, Pattern, Intelligence, Yearly, or Transfer)</li>
                      <li>Generate and save predictions using any strategy</li>
                      <li>Once you have some successful predictions (wins or partials), Check & Balance will be available</li>
                      <li>Check back later after your predictions have been evaluated against actual draws</li>
                    </ul>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => {
                        setCheckBalanceError(null);
                        setStrategy('ensemble');
                        handleGenerate();
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                    >
                      Try Ensemble Strategy
                    </button>
                    <button
                      onClick={() => setCheckBalanceError(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-amber-800 mb-4">{checkBalanceError}</p>
                  <button
                    onClick={handleGenerateCheckBalance}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {predictions && (
        <div className="space-y-6 animate-fade-in">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Predictions Generated Successfully!</h3>
                  <p className="text-sm text-green-700">
                    Based on {predictions.data_points_used} historical draws • {strategy.charAt(0).toUpperCase() + strategy.slice(1)} strategy
                    {selectedLottoType && ` • ${selectedLottoType}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSavePrediction}
                disabled={savingPrediction}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingPrediction ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save Prediction
                  </>
                )}
              </button>
            </div>
            {saveSuccess && (
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg text-sm text-green-800">
                ✓ Prediction saved successfully! View it on your dashboard.
              </div>
            )}
          </div>

          {/* Regime Change Alert */}
          {predictions.regime_change?.detected && (
            <div className="card bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 animate-pulse-once">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-orange-800 font-semibold mb-1">Regime Change Detected</p>
                  <p className="text-orange-700 text-sm">
                    Statistical properties have changed significantly. Confidence: <strong>{(predictions.regime_change.confidence * 100).toFixed(1)}%</strong>
                  </p>
                  {predictions.regime_change.details && (
                    <div className="mt-2 text-xs text-orange-600">
                      {Object.entries(predictions.regime_change.details).map(([key, value]) => (
                        <span key={key} className="inline-block mr-3">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Two Sure and Three Direct - Featured Section */}
          {(predictions.predictions.two_sure || predictions.predictions.three_direct) && (
            <div className="card bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-amber-300 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Ghana Lottery Special Features</h2>
                </div>
                {selectedLottoType && (
                  <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium">
                    {selectedLottoType}
                  </span>
                )}
              </div>

              {/* Save success message */}
              {specialSaveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {specialSaveSuccess}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Two Sure */}
                {predictions.predictions.two_sure && (
                  <div className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          2
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Two Sure</h3>
                          <p className="text-sm text-gray-600">2 most likely numbers to play</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveTwoSureToDashboard}
                        disabled={savingTwoSure}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200 transition-colors flex items-center gap-1"
                        title="Save to Dashboard"
                      >
                        {savingTwoSure ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        Save
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {predictions.predictions.two_sure.numbers.map((num, index) => (
                        <div
                          key={num}
                          className="number-chip number-chip-winning text-2xl font-bold w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-full"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 italic">
                        Based on consensus across all prediction strategies
                      </p>
                    </div>
                  </div>
                )}

                {/* Three Direct */}
                {predictions.predictions.three_direct && (
                  <div className="bg-white rounded-xl p-6 border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          3
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Three Direct</h3>
                          <p className="text-sm text-gray-600">3 most likely numbers to play</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSaveThreeDirectToDashboard}
                        disabled={savingThreeDirect}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
                        title="Save to Dashboard"
                      >
                        {savingThreeDirect ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                        Save
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {predictions.predictions.three_direct.numbers.map((num, index) => (
                        <div
                          key={num}
                          className="number-chip number-chip-winning text-2xl font-bold w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-full"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 italic">
                        Based on consensus across all prediction strategies
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prediction Cards */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Predictions</h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                {Object.values(predictions.predictions).filter((p) => Array.isArray(p)).flat().length} set{Object.values(predictions.predictions).filter((p) => Array.isArray(p)).flat().length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {predictions.predictions.ensemble && predictions.predictions.ensemble.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '0ms' }}>
                  <PredictionCard
                    title="Ensemble Prediction"
                    prediction={predictions.predictions.ensemble[0]}
                    strategy="ensemble"
                    confidence={predictions.confidence?.ensemble}
                  />
                </div>
              )}
              {predictions.predictions.ml && predictions.predictions.ml.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <PredictionCard
                    title="ML Prediction"
                    prediction={predictions.predictions.ml[0]}
                    strategy="ml"
                    confidence={predictions.confidence?.ml}
                  />
                </div>
              )}
              {predictions.predictions.genetic && predictions.predictions.genetic.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                  <PredictionCard
                    title="Genetic Prediction"
                    prediction={predictions.predictions.genetic[0]}
                    strategy="genetic"
                    confidence={predictions.confidence?.genetic}
                  />
                </div>
              )}
              {predictions.predictions.pattern && predictions.predictions.pattern.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <PredictionCard
                    title="Pattern Prediction"
                    prediction={predictions.predictions.pattern[0]}
                    strategy="pattern"
                    confidence={predictions.confidence?.pattern}
                  />
                </div>
              )}
              {predictions.predictions.intelligence && predictions.predictions.intelligence.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <PredictionCard
                    title="Intelligence Prediction"
                    prediction={predictions.predictions.intelligence[0]}
                    strategy="intelligence"
                    confidence={predictions.confidence?.intelligence}
                  />
                </div>
              )}
              {predictions.predictions.yearly && predictions.predictions.yearly.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
                  <PredictionCard
                    title="Yearly Pattern Prediction"
                    prediction={predictions.predictions.yearly[0]}
                    strategy="yearly"
                    confidence={predictions.confidence?.yearly}
                  />
                </div>
              )}

              {predictions.predictions.transfer && predictions.predictions.transfer.length > 0 && (
                <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
                  <PredictionCard
                    title="Transfer Pattern Prediction"
                    prediction={predictions.predictions.transfer[0]}
                    strategy="transfer"
                    confidence={predictions.confidence?.transfer}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Check & Balance Prediction Results */}
      {checkBalancePrediction && (
        <div className="space-y-6 animate-fade-in">
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-800">Check & Balance Prediction</h2>
            </div>

            {/* Strategy Recommendation Info - Only show if we have winning predictions */}
            {recommendedStrategy && winningPredictionsCount && winningPredictionsCount > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-teal-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-semibold text-teal-900 mb-1">Recommended Strategy</h3>
                    <p className="text-sm text-teal-700 mb-2">
                      Based on analysis of <strong>{winningPredictionsCount}</strong> past winning predictions, 
                      the <strong className="capitalize">{recommendedStrategy}</strong> strategy has shown the best performance.
                    </p>
                    {strategyConfidence !== null && strategyConfidence > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-teal-600 font-medium">Confidence:</span>
                        <div className="flex-1 bg-teal-200 rounded-full h-2">
                          <div 
                            className="bg-teal-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(strategyConfidence * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-teal-600 font-medium">
                          {(strategyConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Prediction Card */}
            {checkBalancePrediction.predictions.check_balance && 
             checkBalancePrediction.predictions.check_balance.length > 0 && (
              <div className="animate-slide-up">
                <PredictionCard
                  title="Check & Balance Prediction"
                  prediction={checkBalancePrediction.predictions.check_balance[0]}
                  strategy="check_balance"
                />
              </div>
            )}

            {/* Save Button */}
            {checkBalancePrediction.predictions.check_balance && 
             checkBalancePrediction.predictions.check_balance.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    if (!checkBalancePrediction.predictions.check_balance?.[0]?.numbers) return;
                    try {
                      setSavingPrediction(true);
                      await predictionsApi.savePrediction({
                        numbers: checkBalancePrediction.predictions.check_balance[0].numbers,
                        strategy: 'check_balance',
                        lottoType: selectedLottoType || undefined,
                        targetDrawDate: new Date().toISOString().split('T')[0],
                      });
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 3000);
                    } catch (err) {
                      setCheckBalanceError(handleApiError(err));
                    } finally {
                      setSavingPrediction(false);
                    }
                  }}
                  disabled={savingPrediction}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingPrediction ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save Prediction
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

