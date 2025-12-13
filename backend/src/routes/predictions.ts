import { Router } from 'express';
import { drawService } from '../services/drawService.js';
import { predictionService } from '../services/predictionService.js';
import { requireAuth, requirePro, optionalAuth } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import pool from '../database/db.js';

const router = Router();

/**
 * GET /api/predictions/health
 * Check if prediction service is available
 */
router.get('/health', async (req, res, next) => {
  try {
    const isHealthy = await predictionService.healthCheck();
    res.json({
      success: true,
      data: {
        available: isHealthy,
        message: isHealthy
          ? 'Prediction service is available'
          : 'Prediction service is not available',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/predictions/generate
 * Generate predictions (Pro users only)
 * 
 * Query params:
 * - strategy: 'ensemble' | 'ml' | 'genetic' | 'pattern' (default: 'ensemble')
 * - limit: number of historical draws to use (default: all)
 * - lottoType: filter by lotto type
 * - useTypeSpecificTable: 'true' to use type-specific table for better accuracy (default: 'false')
 */
router.post('/generate', requireAuth, requirePro, async (req, res, next) => {
  try {
    const { strategy = 'ensemble', limit, lottoType, useTypeSpecificTable } = req.query;
    const userId = req.user!.id;

    // Determine if we should use type-specific table
    const useTypeTable = useTypeSpecificTable === 'true' && lottoType;

    // Get historical draws
    const draws = await drawService.getDraws({
      lottoType: lottoType as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      useTypeSpecificTable: useTypeTable as boolean,
    });

    if (draws.length < 60) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data',
        message: `Need at least 60 draws for predictions. Found ${draws.length} draws.`,
        minimum_required: 60,
      });
    }

    // Generate predictions
    const predictions = await predictionService.generatePredictions(
      draws,
      strategy as 'ensemble' | 'ml' | 'genetic' | 'pattern'
    );

    // Save to prediction history
    try {
      await pool.query(
        `INSERT INTO prediction_history (user_id, strategy, prediction_data)
         VALUES ($1, $2, $3)`,
        [userId, strategy, JSON.stringify(predictions)]
      );
    } catch (error) {
      // Log but don't fail the request
      logger.warn('Failed to save prediction history', error);
    }

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/predictions/analyze
 * Analyze patterns without generating predictions (Pro users only)
 * 
 * Query params:
 * - limit: number of historical draws to use (default: all)
 * - lottoType: filter by lotto type
 * - useTypeSpecificTable: 'true' to use type-specific table for better accuracy (default: 'false')
 */
router.post('/analyze', requireAuth, requirePro, async (req, res, next) => {
  try {
    const { limit, lottoType, useTypeSpecificTable } = req.query;

    // Determine if we should use type-specific table
    const useTypeTable = useTypeSpecificTable === 'true' && lottoType;

    const draws = await drawService.getDraws({
      lottoType: lottoType as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      useTypeSpecificTable: useTypeTable as boolean,
    });

    if (draws.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient data',
        message: `Need at least 50 draws for analysis. Found ${draws.length} draws.`,
        minimum_required: 50,
      });
    }

    const analysis = await predictionService.analyzePatterns(draws);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/predictions/history
 * Get user's prediction history (authenticated users)
 */
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const result = await pool.query(
      `SELECT id, strategy, prediction_data, created_at
       FROM prediction_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/predictions/subscription-status
 * Get current user's subscription status
 */
router.get('/subscription-status', optionalAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      return res.json({
        success: true,
        data: {
          authenticated: false,
          tier: 'free',
          isPro: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        authenticated: true,
        tier: req.user.subscriptionTier,
        isPro: req.user.isPro,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/predictions/lotto-types
 * Get all available lotto types for prediction selection
 */
router.get('/lotto-types', async (req, res, next) => {
  try {
    const lottoTypes = await drawService.getAvailableLottoTypes();
    res.json({
      success: true,
      data: lottoTypes,
      count: lottoTypes.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

