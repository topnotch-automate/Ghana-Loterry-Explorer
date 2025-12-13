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
    <div className="card border-2 border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-800">Search Draws</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Numbers (comma or space separated)
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 3, 12, 19, 24, 37"
              className="input-field pl-10"
              disabled={isLoading}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {queryNumbers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {queryNumbers.map((num) => (
                <span
                  key={num}
                  className="px-3 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-semibold shadow-md"
                >
                  {num}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 Only integers 1–90 are accepted. Max 10 numbers. Leave empty to show all draws.
            </p>
            {mode === 'group' && (
              <p className="text-xs text-blue-700 mt-1 font-medium">
                Group mode: At least 2 of the entered numbers must appear together in a draw.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-end gap-4 pt-4 border-t border-gray-200">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Mode
            </label>
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as SearchMode)}
                className="input-field appearance-none pr-10"
                disabled={isLoading}
              >
                <option value="partial">Partial Match (Any Panel)</option>
                <option value="exact">Exact 10-Number Match</option>
                <option value="winning-only">Winning Panel Only</option>
                <option value="machine-only">Machine Panel Only</option>
                <option value="group">Group Match (2+ numbers together)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

