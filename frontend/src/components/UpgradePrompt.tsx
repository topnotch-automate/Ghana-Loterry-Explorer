import React from 'react';

interface UpgradePromptProps {
  feature?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature = 'Advanced Predictions' }) => {
  return (
    <div className="card bg-gradient-to-br from-primary-50 via-accent-50 to-purple-50 border-2 border-primary-300 shadow-lg animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-2xl font-bold text-gray-900">
              Upgrade to Pro
            </h3>
            <span className="px-2.5 py-0.5 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
              PRO
            </span>
          </div>
          <p className="text-gray-700 mb-6 leading-relaxed">
            <strong className="text-primary-700">{feature}</strong> is available for Pro subscribers. Unlock advanced ML-based predictions,
            genetic algorithm optimization, and comprehensive pattern analysis.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-500 text-white rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Upgrade Now
            </button>
            <button className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-primary-300 transition-all">
              Learn More
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-primary-200">
            <p className="text-xs text-gray-600">
              ✨ Pro features include: AI predictions, advanced analytics, priority support, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

