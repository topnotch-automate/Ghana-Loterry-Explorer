import React from 'react';
import type { PredictionSet } from '../types';

interface PredictionCardProps {
  title: string;
  prediction: PredictionSet;
  strategy: string;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({ title, prediction, strategy }) => {
  const strategyColors: Record<string, string> = {
    ensemble: 'from-purple-500 to-pink-500',
    ml: 'from-blue-500 to-cyan-500',
    genetic: 'from-green-500 to-emerald-500',
    pattern: 'from-orange-500 to-red-500',
  };

  return (
    <div className="card hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-primary-200 group">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <span className={`px-3 py-1 text-xs font-semibold bg-gradient-to-r ${strategyColors[strategy] || 'from-gray-500 to-gray-600'} text-white rounded-full shadow-sm`}>
          {strategy.toUpperCase()}
        </span>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {prediction.numbers.map((num, index) => (
            <div
              key={num}
              className={`number-chip number-chip-winning text-xl font-bold w-12 h-12 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-110 transition-all`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {num}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Sum</div>
            <div className="text-lg font-bold text-gray-800">{prediction.sum}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Evens</div>
            <div className="text-lg font-bold text-gray-800">{prediction.evens}</div>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Highs</div>
            <div className="text-lg font-bold text-gray-800">{prediction.highs}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

