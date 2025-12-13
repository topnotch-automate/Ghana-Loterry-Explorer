import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Error',
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="text-center max-w-md card border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-red-800 mb-2 font-bold text-xl">{title}</h3>
        <p className="text-red-700 mb-6 text-sm">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry} 
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

