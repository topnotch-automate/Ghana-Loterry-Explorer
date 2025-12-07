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
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="text-center mb-4">
        <div className="text-sm text-gray-500 mb-1">
          {formatDate(draw.drawDate)}
        </div>
        <div className="text-lg font-semibold text-gray-900">{draw.lottoType}</div>
        {searchResult.matchCount !== undefined && (
          <div className="mt-2">
            <div className="text-xs text-gray-500">Matches</div>
            <div className="text-2xl font-bold text-primary-600">
              {searchResult.matchCount}
            </div>
            {searchResult.matchCountWinning !== undefined && (
              <div className="text-xs text-gray-400 mt-1">
                W:{searchResult.matchCountWinning} • M:{searchResult.matchCountMachine}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-500 mb-2 text-center">Winning Numbers</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {draw.winningNumbers.map((num, i) => (
              <div
                key={`w-${i}`}
                className={`number-chip number-chip-winning ${
                  isHighlighted(num) ? 'number-chip-highlight' : ''
                }`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2 text-center">Machine Numbers</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {draw.machineNumbers.map((num, i) => (
              <div
                key={`m-${i}`}
                className={`number-chip number-chip-machine ${
                  isHighlighted(num) ? 'number-chip-highlight' : ''
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

