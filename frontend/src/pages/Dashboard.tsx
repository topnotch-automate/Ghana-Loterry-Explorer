import React, { useState, useEffect } from 'react';
import { drawsApi, analyticsApi } from '../api/client';
import { DrawCard } from '../components/DrawCard';
import { FrequencyChart } from '../components/FrequencyChart';
import { DrawModal } from '../components/DrawModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { handleApiError } from '../utils/errors';
import type { Draw, FrequencyStats } from '../types';

export const Dashboard: React.FC = () => {
  const [latestDraw, setLatestDraw] = useState<Draw | null>(null);
  const [recentDraws, setRecentDraws] = useState<Draw[]>([]);
  const [frequencyStats, setFrequencyStats] = useState<FrequencyStats[]>([]);
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

      const [latest, recent, frequency] = await Promise.all([
        drawsApi.getLatest().catch(() => null),
        drawsApi.getAll({ limit: 5 }).catch(() => []),
        analyticsApi.getFrequency({ days: 30 }).catch(() => []),
      ]);

      if (latest) setLatestDraw(latest);
      setRecentDraws(recent);
      setFrequencyStats(frequency);
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

