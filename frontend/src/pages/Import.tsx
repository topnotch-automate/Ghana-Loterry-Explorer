import React, { useState } from 'react';
import api from '../api/client';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { handleApiError } from '../utils/errors';

interface ImportResult {
  inserted: number;
  skipped: number;
  errors: number;
  parseErrors?: string[];
}

export const Import: React.FC = () => {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please provide CSV content or upload a file');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Use the API client
      const response = await api.post('/draws/import', { csvContent });
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Import failed');
      }

      setResult(response.data.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCsvContent('');
    setError(null);
    setResult(null);
  };

  const csvExample = `Draw Date,Lotto Type,Winning Numbers,Machine Numbers,Source
2024-01-01,5/90,"1,2,3,4,5","6,7,8,9,10",theb2b.com
2024-01-02,5/90,"11,12,13,14,15","16,17,18,19,20",theb2b.com`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Draws</h1>
        <p className="text-gray-600">
          Import lottery draws from a CSV file. Duplicate draws (same date and type) will be skipped.
        </p>
      </div>

      {/* CSV Format Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">CSV Format</h2>
        <p className="text-sm text-gray-600 mb-4">
          The CSV file should have the following columns:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <code className="text-sm">
            Draw Date, Lotto Type, Winning Numbers, Machine Numbers, Source
          </code>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700">
            View Example CSV
          </summary>
          <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
            {csvExample}
          </pre>
        </details>
      </div>

      {/* File Upload */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Upload CSV File</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste CSV Content
            </label>
            <textarea
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder="Paste CSV content here..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={loading || !csvContent.trim()}
              className="btn-primary"
            >
              {loading ? 'Importing...' : 'Import Draws'}
            </button>
            <button
              onClick={handleClear}
              disabled={loading}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={() => setError(null)}
          title="Import Error"
        />
      )}

      {/* Loading */}
      {loading && <LoadingSpinner message="Importing draws..." />}

      {/* Result Display */}
      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Import Results</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{result.inserted}</div>
                <div className="text-sm text-gray-600">Inserted</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
                <div className="text-sm text-gray-600">Skipped (Duplicates)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {result.parseErrors && result.parseErrors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Parse Errors:</h3>
                <div className="max-h-48 overflow-y-auto bg-red-50 p-3 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-xs text-red-700">
                    {result.parseErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

