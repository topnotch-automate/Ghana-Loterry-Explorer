import React, { useState } from 'react';
import { drawsApi } from '../api/client';
import { SearchBar } from '../components/SearchBar';
import { DrawCard } from '../components/DrawCard';
import { DrawModal } from '../components/DrawModal';
import { handleApiError } from '../utils/errors';
import { LOTTERY, UI } from '../utils/constants';
import type { SearchResult, SearchMode } from '../types';

export const Search: React.FC = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedDraw, setSelectedDraw] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryNumbers, setQueryNumbers] = useState<number[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string, mode: SearchMode) => {
    setError(null);
    
    if (!query.trim()) {
      // If empty query, show all draws
      try {
        setLoading(true);
        const allDraws = await drawsApi.getAll({ limit: UI.ITEMS_PER_PAGE });
        setResults(allDraws as SearchResult[]);
        setQueryNumbers([]);
        setHasSearched(true);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    const numbers = query
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= LOTTERY.MIN_NUMBER && n <= LOTTERY.MAX_NUMBER)
      .slice(0, UI.MAX_SEARCH_NUMBERS);

    if (numbers.length === 0) {
      setError(`Please enter valid numbers between ${LOTTERY.MIN_NUMBER} and ${LOTTERY.MAX_NUMBER}`);
      return;
    }

    try {
      setLoading(true);
      setQueryNumbers(numbers);
      const searchResults = await drawsApi.search({
        numbers,
        mode,
      });
      setResults(searchResults);
      setHasSearched(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await drawsApi.export('csv', {
        limit: results.length,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `draws-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleExportJSON = async () => {
    try {
      const blob = await drawsApi.export('json', {
        limit: results.length,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `draws-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Draws</h1>
        <p className="text-gray-600">
          Search for draws by numbers. Each draw contains 5 winning numbers and 5 machine numbers (all from 1-90).
        </p>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={loading} />

      {error && (
        <div className="card bg-red-50 border border-red-200">
          <div className="text-red-800 font-medium mb-1">Error</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {hasSearched && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Results ({results.length})
            </h2>
            {results.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportCSV}
                  className="btn-secondary text-sm"
                  disabled={loading}
                >
                  Export CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="btn-secondary text-sm"
                  disabled={loading}
                >
                  Export JSON
                </button>
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-gray-500 mb-2 font-medium">No draws found</div>
              <div className="text-sm text-gray-400">
                Try adjusting your search numbers or mode
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((draw) => (
                <DrawCard
                  key={draw.id}
                  draw={draw}
                  queryNumbers={queryNumbers}
                  onClick={() => setSelectedDraw(draw)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <DrawModal
        draw={selectedDraw}
        onClose={() => setSelectedDraw(null)}
      />
    </div>
  );
};

