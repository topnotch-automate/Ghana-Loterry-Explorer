import React from 'react';
import { formatDate } from '../utils/format';
import type { Draw, SearchResult } from '../types';

interface DrawCardProps {
  draw: Draw | SearchResult;
  queryNumbers?: number[];
  onClick?: () => void;
}

export const DrawCard: React.FC<DrawCardProps> = ({ draw, queryNumbers = [], onClick }) => {
  const isHighlighted = (num: number) => queryNumbers.includes(num);
  const searchResult = draw as SearchResult;

  return (
    <div
      className="card border-2 border-gray-100 cursor-pointer hover:shadow-xl hover:border-primary-300 transition-all transform hover:scale-[1.02] group"
      onClick={onClick}
    >
      {/* Header */}
      <div className="text-center mb-5 pb-4 border-b border-gray-200">
        <div className="text-xs text-gray-500 mb-1 font-medium">
          {formatDate(draw.drawDate)}
        </div>
        <div className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
          {draw.lottoType}
        </div>
        {searchResult.matchCount !== undefined && (
          <div className="mt-3 inline-block px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full">
            <div className="text-xs opacity-90 mb-0.5">Matches</div>
            <div className="text-2xl font-bold">
              {searchResult.matchCount}
            </div>
            {searchResult.matchCountWinning !== undefined && (
              <div className="text-xs opacity-75 mt-1">
                W:{searchResult.matchCountWinning} • M:{searchResult.matchCountMachine}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Winning Numbers */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Winning Numbers</div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {draw.winningNumbers.map((num, i) => (
              <div
                key={`w-${i}`}
                className={`number-chip number-chip-winning text-lg font-bold w-12 h-12 flex items-center justify-center shadow-md hover:shadow-lg transform hover:scale-110 transition-all ${
                  isHighlighted(num) ? 'number-chip-highlight ring-4 ring-yellow-400' : ''
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* Machine Numbers */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Machine Numbers</div>
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {draw.machineNumbers.map((num, i) => (
              <div
                key={`m-${i}`}
                className={`number-chip number-chip-machine text-lg font-bold w-12 h-12 flex items-center justify-center shadow-sm hover:shadow-md transform hover:scale-110 transition-all ${
                  isHighlighted(num) ? 'number-chip-highlight ring-4 ring-yellow-400' : ''
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

