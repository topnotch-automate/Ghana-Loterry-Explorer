import React, { useState } from 'react';
import type { SearchMode } from '../types';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  isLoading?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading = false }) => {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('partial');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, mode);
  };

  const parseQuery = (input: string): number[] => {
    return input
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 90)
      .slice(0, 10);
  };

  const queryNumbers = parseQuery(query);

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Numbers (comma or space separated)
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. 3, 12, 19, 24, 37"
            className="input-field"
            disabled={isLoading}
          />
          <div className="mt-2 text-xs text-gray-500">
            Only integers 1–90 are accepted. Max 10 numbers. Leave empty to show all draws.
            {mode === 'group' && (
              <span className="block mt-1 text-primary-600 font-medium">
                Group mode: All entered numbers must appear together in a draw.
              </span>
            )}
          </div>
          {queryNumbers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {queryNumbers.map((num) => (
                <span
                  key={num}
                  className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
                >
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SearchMode)}
              className="input-field"
              disabled={isLoading}
            >
              <option value="partial">Partial Match (Any Panel)</option>
              <option value="exact">Exact 10-Number Match</option>
              <option value="winning-only">Winning Panel Only</option>
              <option value="machine-only">Machine Panel Only</option>
              <option value="group">Group Match (All numbers together)</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

