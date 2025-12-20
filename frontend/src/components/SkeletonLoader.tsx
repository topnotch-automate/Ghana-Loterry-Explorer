import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem' 
}) => {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export const DrawCardSkeleton: React.FC = () => {
  return (
    <div className="card border-2 border-gray-100 animate-pulse">
      <div className="text-center mb-5 pb-4 border-b border-gray-200">
        <Skeleton width="120px" height="0.75rem" className="mx-auto mb-2" />
        <Skeleton width="150px" height="1.25rem" className="mx-auto" />
      </div>
      <div className="space-y-4">
        <div>
          <Skeleton width="100px" height="0.75rem" className="mx-auto mb-3" />
          <div className="flex flex-wrap gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="48px" height="48px" className="rounded-full" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton width="100px" height="0.75rem" className="mx-auto mb-3" />
          <div className="flex flex-wrap gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="48px" height="48px" className="rounded-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PredictionCardSkeleton: React.FC = () => {
  return (
    <div className="card border-2 border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <Skeleton width="150px" height="1.25rem" />
        <Skeleton width="80px" height="1.5rem" className="rounded-full" />
      </div>
      <div className="mb-5">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} width="48px" height="48px" className="rounded-full" />
          ))}
        </div>
      </div>
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg">
              <Skeleton width="40px" height="0.75rem" className="mx-auto mb-1" />
              <Skeleton width="30px" height="1.25rem" className="mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StrategyPerformanceSkeleton: React.FC = () => {
  return (
    <div className="card border-2 border-gray-100">
      <Skeleton width="200px" height="1.5rem" className="mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Skeleton width="80px" height="1rem" />
              <Skeleton width="50px" height="0.75rem" />
            </div>
            <Skeleton width="120px" height="1.25rem" className="mb-3" />
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="p-2 bg-white rounded-lg border border-gray-200">
                  <Skeleton width="100px" height="0.875rem" className="mb-1" />
                  <Skeleton width="80px" height="0.75rem" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Latest Draw Skeleton */}
      <div className="card border-2 border-gray-100 animate-pulse">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <DrawCardSkeleton />
      </div>
      
      {/* Recent Draws Skeleton */}
      <div className="card border-2 border-gray-100">
        <Skeleton width="150px" height="1.5rem" className="mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <DrawCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Strategy Performance Skeleton */}
      <StrategyPerformanceSkeleton />
    </div>
  );
};
