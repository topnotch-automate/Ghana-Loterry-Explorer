import React, { useState, useEffect } from 'react';
import { drawsApi, analyticsApi, predictionsApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { DrawCard } from '../components/DrawCard';
import { FrequencyChart } from '../components/FrequencyChart';
import { DrawModal } from '../components/DrawModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { handleApiError } from '../utils/errors';
import type { Draw, FrequencyStats, SavedPrediction, StrategyPerformance } from '../types';

export const Dashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null);
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);
  const [frequencyStats, setFrequencyStats] = useState<FrequencyStats[]>([]);
  const [savedPredictions, setSavedPredictions] = useState<SavedPrediction[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises: Promise<any>[] = [
        drawsApi.getLatest().catch(() => null),
        drawsApi.getAll({ limit: 5 }).catch(() => []),
        analyticsApi.getFrequency({ days: 30 }).catch(() => []),
      ];

      // Load saved predictions and strategy performance if authenticated
      if (isAuthenticated) {
        promises.push(predictionsApi.getHistory(10).catch(() => []));
        promises.push(predictionsApi.getStrategyPerformance().catch(() => null));
      }

      const results = await Promise.all(promises);
      if (results[0]) setLatestDraw(results[0]);
      setRecentDraws(results[1]);
      setFrequencyStats(results[2]);
      if (isAuthenticated) {
        if (results[3]) setSavedPredictions(results[3]);
        if (results[4]) setStrategyPerformance(results[4]);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." fullScreen />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={loadDashboardData}
        title="Error loading dashboard"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur-sm">
            📊
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-white/90 text-sm mt-1">
              Overview of latest draws and analytics
            </p>
          </div>
        </div>
      </div>

      {/* Latest Draw */}
      {latestDraw && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Latest Draw</h2>
              <p className="text-sm text-gray-600">Most recent lottery results</p>
            </div>
          </div>
          <DrawCard
            draw={latestDraw}
            onClick={() => setSelectedDraw(latestDraw)}
          />
        </div>
      )}

      {/* Recent Draws */}
      <div className="card border-2 border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Recent Draws</h2>
          </div>
          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
            {recentDraws.length} draws
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentDraws.map((draw, index) => (
            <div key={draw.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <DrawCard
                draw={draw}
                onClick={() => setSelectedDraw(draw)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Performance (if authenticated) */}
      {isAuthenticated && strategyPerformance && (
        <div className="card border-2 border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Strategy Performance</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Week Performance */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">This Week</h3>
                <span className="text-xs text-gray-500">7 days</span>
              </div>
              {strategyPerformance.week.bestStrategy ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      Best: <span className="capitalize">{strategyPerformance.week.bestStrategy}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                      🏆
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(strategyPerformance.week.strategyBreakdown)
                      .sort((a, b) => b[1].totalMatches - a[1].totalMatches)
                      .map(([strategy, stats]) => (
                        <div
                          key={strategy}
                          className={`p-2 rounded-lg border ${
                            strategy === strategyPerformance.week.bestStrategy
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-800 capitalize">{strategy}</span>
                            {strategy === strategyPerformance.week.bestStrategy && (
                              <span className="text-xs text-blue-600 font-semibold">🏆</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Matches: <span className="font-semibold">{stats.totalMatches}</span></div>
                            <div>Predictions: <span className="font-semibold">{stats.totalPredictions}</span></div>
                            <div>Avg: <span className="font-semibold">{stats.averageMatches.toFixed(1)}</span></div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div>Total Days: <span className="font-semibold">{strategyPerformance.week.daysWithMatches}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No predictions this week</div>
              )}
            </div>

            {/* Month Performance */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">This Month</h3>
                <span className="text-xs text-gray-500">30 days</span>
              </div>
              {strategyPerformance.month.bestStrategy ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-purple-600">
                      Best: <span className="capitalize">{strategyPerformance.month.bestStrategy}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-semibold">
                      🏆
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(strategyPerformance.month.strategyBreakdown)
                      .sort((a, b) => b[1].totalMatches - a[1].totalMatches)
                      .map(([strategy, stats]) => (
                        <div
                          key={strategy}
                          className={`p-2 rounded-lg border ${
                            strategy === strategyPerformance.month.bestStrategy
                              ? 'bg-purple-100 border-purple-300'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-800 capitalize">{strategy}</span>
                            {strategy === strategyPerformance.month.bestStrategy && (
                              <span className="text-xs text-purple-600 font-semibold">🏆</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Matches: <span className="font-semibold">{stats.totalMatches}</span></div>
                            <div>Predictions: <span className="font-semibold">{stats.totalPredictions}</span></div>
                            <div>Avg: <span className="font-semibold">{stats.averageMatches.toFixed(1)}</span></div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div>Total Days: <span className="font-semibold">{strategyPerformance.month.daysWithMatches}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No predictions this month</div>
              )}
            </div>

            {/* Year Performance */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">This Year</h3>
                <span className="text-xs text-gray-500">365 days</span>
              </div>
              {strategyPerformance.year.bestStrategy ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-green-600">
                      Best: <span className="capitalize">{strategyPerformance.year.bestStrategy}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-semibold">
                      🏆
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(strategyPerformance.year.strategyBreakdown)
                      .sort((a, b) => b[1].totalMatches - a[1].totalMatches)
                      .map(([strategy, stats]) => (
                        <div
                          key={strategy}
                          className={`p-2 rounded-lg border ${
                            strategy === strategyPerformance.year.bestStrategy
                              ? 'bg-green-100 border-green-300'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-800 capitalize">{strategy}</span>
                            {strategy === strategyPerformance.year.bestStrategy && (
                              <span className="text-xs text-green-600 font-semibold">🏆</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>Matches: <span className="font-semibold">{stats.totalMatches}</span></div>
                            <div>Predictions: <span className="font-semibold">{stats.totalPredictions}</span></div>
                            <div>Avg: <span className="font-semibold">{stats.averageMatches.toFixed(1)}</span></div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <div>Total Days: <span className="font-semibold">{strategyPerformance.year.daysWithMatches}</span></div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No predictions this year</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved Predictions (if authenticated) */}
      {isAuthenticated && savedPredictions.length > 0 && (
        <div className="card border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-800">My Predictions</h2>
            </div>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {savedPredictions.length} saved
            </span>
          </div>
          <div className="space-y-4">
            {savedPredictions.map((prediction, index) => (
              <div
                key={prediction.id}
                className={`p-4 rounded-lg border-2 transition-all animate-slide-up ${
                  prediction.status === 'win'
                    ? 'bg-green-50 border-green-300'
                    : prediction.status === 'partial'
                    ? 'bg-yellow-50 border-yellow-300'
                    : prediction.status === 'loss'
                    ? 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex gap-1">
                        {prediction.predictedNumbers.map((num) => {
                          // Check if this number matches the actual winning numbers
                          const isMatch = prediction.isChecked && 
                            prediction.actualDraw?.winningNumbers?.includes(num);
                          return (
                            <span
                              key={num}
                              className={`relative w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                                isMatch
                                  ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 scale-110 shadow-lg'
                                  : 'bg-primary-600 text-white'
                              }`}
                              title={isMatch ? 'Match!' : undefined}
                            >
                              {num}
                              {isMatch && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          prediction.status === 'win'
                            ? 'bg-green-500 text-white'
                            : prediction.status === 'partial'
                            ? 'bg-yellow-500 text-white'
                            : prediction.status === 'loss'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-400 text-white'
                        }`}
                      >
                        {prediction.status === 'win'
                          ? '✓ WIN'
                          : prediction.status === 'partial'
                          ? '~ PARTIAL'
                          : prediction.status === 'loss'
                          ? '✗ LOSS'
                          : '⏳ PENDING'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Strategy:</span>
                        <span className="px-2 py-0.5 bg-gray-200 rounded">{prediction.strategy}</span>
                        {prediction.lottoType && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="px-2 py-0.5 bg-gray-200 rounded">{prediction.lottoType}</span>
                          </>
                        )}
                      </div>
                      {prediction.isChecked && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Matches:</span>
                          <span className="font-bold text-primary-600">{prediction.matches}/5</span>
                          {prediction.actualDraw && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">
                                Actual: {prediction.actualDraw.winningNumbers.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(prediction.createdAt).toLocaleDateString()}
                        {prediction.checkedAt && (
                          <> • Checked: {new Date(prediction.checkedAt).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this prediction?')) {
                        try {
                          await predictionsApi.deletePrediction(prediction.id);
                          setSavedPredictions(savedPredictions.filter(p => p.id !== prediction.id));
                        } catch (err) {
                          setError(handleApiError(err));
                        }
                      }
                    }}
                    className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete prediction"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="card border-2 border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800">Analytics (Last 30 Days)</h2>
        </div>
        <FrequencyChart data={frequencyStats} maxItems={20} />
      </div>

      {/* Draw Modal */}
      <DrawModal
        draw={selectedDraw}
        onClose={() => setSelectedDraw(null)}
      />
    </div>
  );
};

