import axios from 'axios';
import { logger } from '../utils/logger.ts';
import { config } from '../config/index.ts';
import type { Draw } from '../types/index.ts';

interface PredictionRequest {
  draws: number[][];
  machine_draws?: number[][]; // Machine numbers for intelligence engine
  strategy: 'ensemble' | 'ml' | 'genetic' | 'pattern' | 'intelligence';
  n_predictions?: number;
}

interface PredictionResponse {
  success: boolean;
  predictions: {
    [key: string]: Array<{
      numbers: number[];
      sum: number;
      evens: number;
      highs: number;
    }>;
    // Explicitly include intelligence for type safety
    intelligence?: Array<{
      numbers: number[];
      sum: number;
      evens: number;
      highs: number;
    }>;
  };
  strategy: string;
  regime_change?: {
    detected: boolean;
    confidence: number;
    details?: Record<string, string>;
  };
  data_points_used: number;
}

export class PredictionService {
  private readonly pythonServiceUrl: string;

  constructor() {
    // Get Python service URL from config
    this.pythonServiceUrl = config.pythonService.url;
    logger.info(`Python service URL: ${this.pythonServiceUrl}`);
  }

  /**
   * Convert database draws to Python format (winning and machine numbers)
   * For intelligence strategy, filters to only include draws with valid machine numbers
   */
  private convertDrawsToPythonFormat(
    draws: Draw[], 
    strategy?: 'ensemble' | 'ml' | 'genetic' | 'pattern' | 'intelligence'
  ): { 
    winning: number[][]; 
    machine: number[][];
    filteredCount?: number;
  } {
    // For intelligence strategy, filter to only include draws with valid machine numbers
    if (strategy === 'intelligence') {
      const filtered = draws.filter(draw => 
        draw.machineNumbers && 
        Array.isArray(draw.machineNumbers) && 
        draw.machineNumbers.length === 5 &&
        draw.machineNumbers.every(n => typeof n === 'number' && n >= 1 && n <= 90)
      );
      
      if (filtered.length < 50) {
        logger.warn(
          `Only ${filtered.length} draws have valid machine numbers (need at least 50 for intelligence strategy). ` +
          `Original draw count: ${draws.length}`
        );
      } else {
        logger.info(
          `Filtered to ${filtered.length} draws with valid machine numbers (from ${draws.length} total)`
        );
      }
      
      return {
        winning: filtered.map((draw) => [...draw.winningNumbers].sort((a, b) => a - b)),
        machine: filtered.map((draw) => [...draw.machineNumbers].sort((a, b) => a - b)),
        filteredCount: filtered.length,
      };
    }
    
    // For other strategies, include all draws (machine numbers optional)
    return {
      winning: draws.map((draw) => [...draw.winningNumbers].sort((a, b) => a - b)),
      machine: draws.map((draw) => 
        draw.machineNumbers && draw.machineNumbers.length === 5
          ? [...draw.machineNumbers].sort((a, b) => a - b)
          : [] // Empty array for draws without machine numbers
      ),
    };
  }

  /**
   * Calculate adaptive timeout based on number of draws and strategy
   * More draws = more processing time needed
   * Ensemble strategy takes longer than single strategies
   */
  private calculateTimeout(drawCount: number, strategy: string): number {
    // Base timeout: 30 seconds for minimum 60 draws
    const baseTimeout = 30000; // 30 seconds
    
    // Additional time per draw above 60
    // Roughly 0.5 seconds per additional draw
    const additionalTimePerDraw = 500; // 0.5 seconds
    const drawsAboveMinimum = Math.max(0, drawCount - 60);
    const additionalTime = drawsAboveMinimum * additionalTimePerDraw;
    
    // Strategy multiplier
    // Ensemble uses multiple methods, so it takes longer
    const strategyMultiplier = strategy === 'ensemble' ? 1.5 : 1.0;
    
    // Calculate total timeout
    const calculatedTimeout = (baseTimeout + additionalTime) * strategyMultiplier;
    
    // Cap at maximum 5 minutes (300 seconds) to prevent extremely long waits
    const maxTimeout = 300000; // 5 minutes
    const minTimeout = 30000; // Minimum 30 seconds
    
    const timeout = Math.min(Math.max(calculatedTimeout, minTimeout), maxTimeout);
    
    logger.info(`Calculated timeout: ${timeout}ms for ${drawCount} draws with strategy: ${strategy}`);
    
    return timeout;
  }

  /**
   * Check if Python service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.pythonServiceUrl}/health`, {
        timeout: 5000,
      });
      const isHealthy = response.data.status === 'healthy';
      if (!isHealthy) {
        logger.warn(`Python service health check returned unhealthy status: ${JSON.stringify(response.data)}`);
      }
      return isHealthy;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          logger.error(`Python service connection refused at ${this.pythonServiceUrl}. Is the service running?`);
        } else if (error.code === 'ETIMEDOUT') {
          logger.error(`Python service timeout at ${this.pythonServiceUrl}. Service may be slow or unreachable.`);
        } else {
          logger.error(`Python service health check failed: ${error.message}`, {
            url: this.pythonServiceUrl,
            code: error.code,
            status: error.response?.status,
          });
        }
      } else {
        logger.error('Python service health check failed', error);
      }
      return false;
    }
  }

  /**
   * Generate predictions using the Python oracle service
   */
  async generatePredictions(
    draws: Draw[],
    strategy: 'ensemble' | 'ml' | 'genetic' | 'pattern' | 'intelligence' = 'ensemble',
    n_predictions: number = 3
  ): Promise<PredictionResponse> {
    try {
      // Check minimum data requirement
      if (draws.length < 60) {
        throw new Error(
          `Insufficient data: Need at least 60 draws for predictions. Got ${draws.length}`
        );
      }

      // Convert to Python format (filters for intelligence strategy)
      const { winning, machine, filteredCount } = this.convertDrawsToPythonFormat(draws, strategy);

      // Check minimum data requirement after filtering (for intelligence strategy)
      if (strategy === 'intelligence' && filteredCount !== undefined && filteredCount < 50) {
        throw new Error(
          `Insufficient data with machine numbers: Need at least 50 draws with valid machine numbers. ` +
          `Found ${filteredCount} draws with machine numbers out of ${draws.length} total draws.`
        );
      }

      // Call Python service
      const request: PredictionRequest = {
        draws: winning,
        machine_draws: machine, // Include machine numbers for intelligence engine
        strategy,
        n_predictions,
      };

      logger.info(`Calling Python prediction service with ${draws.length} draws, strategy: ${strategy}`);

      // Calculate adaptive timeout based on number of draws and strategy
      const timeout = this.calculateTimeout(draws.length, strategy);

      const response = await axios.post<PredictionResponse>(
        `${this.pythonServiceUrl}/predict`,
        request,
        {
          timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.success) {
        throw new Error('Prediction service returned unsuccessful response');
      }

      return response.data;
    } catch (error: any) {
      logger.error('Prediction generation failed', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Python service returned an error
          throw new Error(
            error.response.data?.message || error.response.data?.error || 'Prediction service error'
          );
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          // Request timed out
          const timeout = this.calculateTimeout(draws.length, strategy);
          throw new Error(
            `Prediction request timed out after ${Math.round(timeout / 1000)} seconds. ` +
            `With ${draws.length} draws, predictions may take longer. ` +
            `Try reducing the number of draws or using a simpler strategy.`
          );
        } else if (error.request) {
          // Request was made but no response
          throw new Error('Prediction service is not available. Please try again later.');
        }
      }

      throw error instanceof Error ? error : new Error('Unknown prediction error');
    }
  }

  /**
   * Analyze patterns without generating predictions
   */
  async analyzePatterns(draws: Draw[]): Promise<any> {
    try {
      if (draws.length < 50) {
        throw new Error(`Need at least 50 draws for analysis. Got ${draws.length}`);
      }

      const pythonDraws = this.convertDrawsToPythonFormat(draws);

      const response = await axios.post(
        `${this.pythonServiceUrl}/analyze`,
        { draws: pythonDraws },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Pattern analysis failed', error);
      
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data?.message || error.response.data?.error || 'Analysis failed'
        );
      }

      throw error instanceof Error ? error : new Error('Unknown analysis error');
    }
  }
}

export const predictionService = new PredictionService();

