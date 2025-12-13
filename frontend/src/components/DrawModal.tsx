import React, { useState, useEffect } from 'react';
import { drawsApi } from '../api/client';
import { formatDate } from '../utils/format';
import { DrawCard } from './DrawCard';
import { LoadingSpinner } from './LoadingSpinner';
import type { Draw, SearchResult } from '../types';

interface DrawModalProps {
  draw: Draw | null;
  onClose: () => void;
}

export const DrawModal: React.FC<DrawModalProps> = ({ draw, onClose }) => {
  const [similarDraws, setSimilarDraws] = useState<SearchResult[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    if (draw) {
      loadSimilarDraws();
    } else {
      setSimilarDraws([]);
    }
  }, [draw]);

  const loadSimilarDraws = async () => {
    if (!draw) return;
    try {
      setLoadingSimilar(true);
      const similar = await drawsApi.getSimilar(draw.id, 3, 5);
      setSimilarDraws(similar);
    } catch (error) {
      console.error('Error loading similar draws:', error);
      setSimilarDraws([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  if (!draw) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border-2 border-gray-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Draw Date</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDate(draw.drawDate)}
                </div>
                <div className="text-sm text-primary-600 font-semibold mt-1">{draw.lottoType}</div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Winning Numbers
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {draw.winningNumbers.map((num, i) => (
                <div
                  key={`w-${i}`}
                  className="number-chip number-chip-winning text-xl font-bold w-14 h-14 flex items-center justify-center shadow-lg"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                Machine Numbers
              </div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {draw.machineNumbers.map((num, i) => (
                <div
                  key={`m-${i}`}
                  className="number-chip number-chip-machine text-xl font-bold w-14 h-14 flex items-center justify-center shadow-md"
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>

        {draw.source && (
          <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Source</div>
            <div className="text-sm font-semibold text-gray-700">{draw.source}</div>
          </div>
        )}

        <div className="border-t-2 border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">Previous Occurrences</h3>
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
              Similar Draws
            </span>
          </div>
          {loadingSimilar ? (
            <div className="text-center py-4">
              <LoadingSpinner message="Loading similar draws..." />
            </div>
          ) : similarDraws.length > 0 ? (
            <div className="space-y-3">
              {similarDraws.map((similarDraw) => {
                const winningMatches = similarDraw.matchCountWinning || 0;
                const machineMatches = similarDraw.matchCountMachine || 0;
                const hasWinningMatches = winningMatches > 0;
                const hasMachineMatches = machineMatches > 0;
                
                return (
                  <div
                    key={similarDraw.id}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:shadow-lg hover:border-primary-300 transition-all bg-white"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-700">{formatDate(similarDraw.drawDate)}</div>
                        <div className="text-xs text-primary-600 font-medium mt-0.5">{similarDraw.lottoType}</div>
                      </div>
                      <div className="flex gap-3">
                        {hasWinningMatches && (
                          <div className="text-center px-3 py-2 bg-green-100 rounded-lg">
                            <div className="text-xs text-green-700 font-medium mb-1">Winning</div>
                            <div className="text-xl font-bold text-green-600">
                              {winningMatches}
                            </div>
                          </div>
                        )}
                        {hasMachineMatches && (
                          <div className="text-center px-3 py-2 bg-blue-100 rounded-lg">
                            <div className="text-xs text-blue-700 font-medium mb-1">Machine</div>
                            <div className="text-xl font-bold text-blue-600">
                              {machineMatches}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {hasWinningMatches && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Winning Numbers:</div>
                        <div className="flex flex-wrap gap-2">
                          {similarDraw.winningNumbers.map((num, i) => (
                            <div
                              key={`win-${i}`}
                              className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                draw.winningNumbers.includes(num) || draw.machineNumbers.includes(num)
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                              }`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasMachineMatches && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Machine Numbers:</div>
                        <div className="flex flex-wrap gap-2">
                          {similarDraw.machineNumbers.map((num, i) => (
                            <div
                              key={`mac-${i}`}
                              className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                draw.winningNumbers.includes(num) || draw.machineNumbers.includes(num)
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-300'
                                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                              }`}
                            >
                              {num}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No similar draws found</p>
              <p className="text-sm text-gray-500 mt-1">Minimum 3 matching numbers required</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

