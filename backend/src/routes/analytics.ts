import { Router } from 'express';
import { analyticsService } from '../services/analyticsService.js';
import { validate, analyticsTimeframeSchema } from '../utils/validation.js';

const router = Router();

// GET /api/analytics/frequency - Get frequency statistics
router.get('/frequency', async (req, res, next) => {
  try {
    const {
      daily,
      weekly,
      monthly,
      yearly,
      days,
      lottoType,
    } = req.query;

    const timeframe = validate(analyticsTimeframeSchema, {
      daily: daily === 'true',
      weekly: weekly === 'true',
      monthly: monthly === 'true',
      yearly: yearly === 'true',
      days: days ? parseInt(days as string, 10) : undefined,
    });

    const stats = await analyticsService.getFrequencyStats(
      timeframe,
      lottoType as string
    );

    res.json({ success: true, data: stats, count: stats.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/hot - Get hot numbers
router.get('/hot', async (req, res, next) => {
  try {
    const { days = '30', lottoType } = req.query;
    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter',
      });
    }

    const hotNumbers = await analyticsService.getHotNumbers(
      daysNum,
      lottoType as string
    );

    res.json({ success: true, data: hotNumbers, count: hotNumbers.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/cold - Get cold numbers
router.get('/cold', async (req, res, next) => {
  try {
    const { days = '30', lottoType } = req.query;
    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter',
      });
    }

    const coldNumbers = await analyticsService.getColdNumbers(
      daysNum,
      lottoType as string
    );

    res.json({ success: true, data: coldNumbers, count: coldNumbers.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/sleeping - Get sleeping numbers
router.get('/sleeping', async (req, res, next) => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid days parameter',
      });
    }

    const sleepingNumbers = await analyticsService.getSleepingNumbers(daysNum);

    res.json({ success: true, data: sleepingNumbers, count: sleepingNumbers.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/stats - Get general statistics
router.get('/stats', async (req, res, next) => {
  try {
    const { lottoType } = req.query;
    const [totalDraws, dateRange] = await Promise.all([
      analyticsService.getTotalDrawCount(lottoType as string),
      analyticsService.getDateRange(),
    ]);

    res.json({
      success: true,
      data: {
        totalDraws,
        dateRange,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

