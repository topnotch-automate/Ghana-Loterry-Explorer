import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { FrequencyStats } from '../types';

interface FrequencyChartProps {
  data: FrequencyStats[];
  title?: string;
  maxItems?: number;
}

const FrequencyChartComponent: React.FC<FrequencyChartProps> = ({
  data,
  title = 'Number Frequency',
  maxItems = 20,
}) => {
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, maxItems)
      .map((item) => ({
        number: item.number.toString(),
        total: item.totalCount,
        winning: item.winningCount,
        machine: item.machineCount,
      }));
  }, [data, maxItems]);

  if (sortedData.length === 0) {
    return (
      <div className="card">
        <div className="text-center text-gray-500 py-8">No data available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sortedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="number" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#7c3aed" name="Total" />
          <Bar dataKey="winning" fill="#06b6d4" name="Winning" />
          <Bar dataKey="machine" fill="#94a3b8" name="Machine" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const FrequencyChart = React.memo(FrequencyChartComponent, (prevProps, nextProps) => {
  // Only re-render if data, title, or maxItems change
  return (
    prevProps.title === nextProps.title &&
    prevProps.maxItems === nextProps.maxItems &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

