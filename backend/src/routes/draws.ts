import { Router } from 'express';
import { drawService } from '../services/drawService.js';
import { validate, createDrawSchema, searchQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import type { CreateDrawInput, SearchQuery } from '../types/index.js';

const router = Router();

// GET /api/draws - Get all draws with optional filters
router.get('/', async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      lottoType,
      limit,
      offset,
    } = req.query;

    const draws = await drawService.getDraws({
      startDate: startDate as string,
      endDate: endDate as string,
      lottoType: lottoType as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });

    res.json({ success: true, data: draws, count: draws.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/draws/latest - Get latest draw
router.get('/latest', async (req, res, next) => {
  try {
    const { lottoType } = req.query;
    const draw = await drawService.getLatestDraw(lottoType as string);

    if (!draw) {
      throw new NotFoundError('Draw');
    }

    res.json({ success: true, data: draw });
  } catch (error) {
    next(error);
  }
});

// GET /api/draws/search - Search draws by numbers
router.get('/search', async (req, res, next) => {
  try {
    const {
      numbers,
      mode,
      startDate,
      endDate,
      lottoType,
      minMatches,
    } = req.query;

    // Build search query object
    const rawQuery: Partial<SearchQuery> = {
      mode: (mode as SearchQuery['mode']) || 'partial',
      startDate: startDate as string,
      endDate: endDate as string,
      lottoType: lottoType as string,
      minMatches: minMatches ? parseInt(minMatches as string, 10) : 1,
    };

    // Parse numbers if provided
    if (numbers) {
      rawQuery.numbers = (numbers as string)
        .split(',')
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => !isNaN(n));
    }

    // Validate search query
    const searchQuery = validate(searchQuerySchema, rawQuery);

    const results = await drawService.searchDraws(searchQuery);
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
});

// GET /api/draws/export - Export draws as CSV or JSON
// IMPORTANT: This route must be defined BEFORE /:id to prevent "export" from being parsed as an ID
router.get('/export', async (req, res, next) => {
  try {
    const format = (req.query.format as string) || 'json';
    const {
      startDate,
      endDate,
      lottoType,
      limit,
    } = req.query;

    // Get draws with filters
    const draws = await drawService.getDraws({
      startDate: startDate as string,
      endDate: endDate as string,
      lottoType: lottoType as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Draw Date',
        'Lotto Type',
        'Winning Numbers',
        'Machine Numbers',
        'Source',
        'Published At',
      ];
      const rows = draws.map((draw) => [
        draw.id,
        draw.drawDate,
        draw.lottoType,
        draw.winningNumbers.join(','),
        draw.machineNumbers.join(','),
        draw.source || '',
        draw.publishedAt || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=draws-export.csv');
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=draws-export.json');
      res.json({ success: true, data: draws, count: draws.length });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/draws/types - Get all available lotto types
// IMPORTANT: This route must be defined BEFORE /:id to prevent "types" from being parsed as an ID
router.get('/types', async (req, res, next) => {
  try {
    const lottoTypes = await drawService.getAvailableLottoTypes();
    logger.info(`Returning ${lottoTypes.length} lotto types: ${lottoTypes.join(', ')}`);
    res.json({ success: true, data: lottoTypes, count: lottoTypes.length });
  } catch (error) {
    logger.error('Error fetching lotto types', error);
    next(error);
  }
});

// GET /api/draws/:id - Get draw by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const draw = await drawService.getDrawById(id);

    if (!draw) {
      throw new NotFoundError('Draw', id);
    }

    res.json({ success: true, data: draw });
  } catch (error) {
    next(error);
  }
});

// POST /api/draws - Create new draw
router.post('/', async (req, res, next) => {
  try {
    // Validate input using Zod schema
    const input = validate(createDrawSchema, req.body) as CreateDrawInput;

    const draw = await drawService.createDraw(input);
    res.status(201).json({ success: true, data: draw });
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return next(new ConflictError('Draw with this date and type already exists'));
    }
    next(error);
  }
});

// GET /api/draws/:id/similar - Find similar draws (previous occurrences)
router.get('/:id/similar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const minMatches = req.query.minMatches
      ? parseInt(req.query.minMatches as string, 10)
      : 3;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const similarDraws = await drawService.findSimilarDraws(id, minMatches, limit);
    res.json({ success: true, data: similarDraws, count: similarDraws.length });
  } catch (error) {
    next(error);
  }
});

// POST /api/draws/import - Import draws from CSV
router.post('/import', async (req, res, next) => {
  try {
    const { csvContent, format } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'CSV content is required in request body as "csvContent"',
      });
    }

    // Parse CSV
    const { parseCSV } = await import('../utils/csvParser.js');
    const { draws, errors } = parseCSV(csvContent);

    if (draws.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid draws found in CSV',
        errors,
      });
    }

    // Batch insert draws
    const result = await drawService.batchInsertDraws(draws);

    // Log import results
    logger.info(`CSV Import: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors} errors`);

    res.json({
      success: true,
      message: 'Import completed',
      data: {
        inserted: result.inserted,
        skipped: result.skipped,
        errors: result.errors,
        parseErrors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

