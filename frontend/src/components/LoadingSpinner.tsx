import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const containerClass = fullScreen
    ? 'min-h-[60vh] flex items-center justify-center'
    : 'flex items-center justify-center py-8';

  return (
    <div className={containerClass}>
      <div className="text-center">
        <div className="relative inline-block">
          <div
            className={`animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto ${sizeClasses[size]}`}
          ></div>
          {size === 'lg' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-1/2 h-1/2 bg-primary-100 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        {message && (
          <div className="mt-6">
            <p className="text-gray-700 font-medium">{message}</p>
            <div className="mt-2 flex justify-center gap-1">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

