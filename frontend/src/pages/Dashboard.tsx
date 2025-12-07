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
    <div className="space-y-6">
      {/* Latest Draw */}
      {latestDraw && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Latest Draw</h2>
          <DrawCard
            draw={latestDraw}
            onClick={() => setSelectedDraw(latestDraw)}
          />
        </div>
      )}

      {/* Recent Draws */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Draws</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentDraws.map((draw) => (
            <DrawCard
              key={draw.id}
              draw={draw}
              onClick={() => setSelectedDraw(draw)}
            />
          ))}
        </div>
      </div>

      {/* Analytics */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Analytics (Last 30 Days)</h2>
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

