import pool from '../database/db.js';
import type { FrequencyStats, AnalyticsTimeframe } from '../types/index.js';

export class AnalyticsService {
  // Get frequency statistics for numbers
  async getFrequencyStats(
    timeframe?: AnalyticsTimeframe,
    lottoType?: string
  ): Promise<FrequencyStats[]> {
    let query = `
      SELECT 
        num AS number,
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE panel = 'winning') AS winning_count,
        COUNT(*) FILTER (WHERE panel = 'machine') AS machine_count,
        MAX(draw_date) AS last_seen
      FROM (
        SELECT unnest(winning_numbers) AS num, 'winning' AS panel, draw_date 
        FROM draws
        WHERE 1=1
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (lottoType) {
      query += ` AND lotto_type = $${paramIndex}`;
      params.push(lottoType);
      paramIndex++;
    }

    if (timeframe?.days) {
      query += ` AND draw_date >= CURRENT_DATE - INTERVAL '${timeframe.days} days'`;
    } else if (timeframe?.yearly) {
      query += ` AND draw_date >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (timeframe?.monthly) {
      query += ` AND draw_date >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (timeframe?.weekly) {
      query += ` AND draw_date >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (timeframe?.daily) {
      query += ` AND draw_date = CURRENT_DATE`;
    }

    query += `
        UNION ALL
        SELECT unnest(machine_numbers) AS num, 'machine' AS panel, draw_date 
        FROM draws
        WHERE 1=1
    `;

    if (lottoType) {
      query += ` AND lotto_type = $${paramIndex}`;
      params.push(lottoType);
      paramIndex++;
    }

    if (timeframe?.days) {
      query += ` AND draw_date >= CURRENT_DATE - INTERVAL '${timeframe.days} days'`;
    } else if (timeframe?.yearly) {
      query += ` AND draw_date >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (timeframe?.monthly) {
      query += ` AND draw_date >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (timeframe?.weekly) {
      query += ` AND draw_date >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (timeframe?.daily) {
      query += ` AND draw_date = CURRENT_DATE`;
    }

    query += `
      ) AS all_numbers
      GROUP BY num
      ORDER BY total_count DESC, number ASC
    `;

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      number: parseInt(row.number, 10),
      totalCount: parseInt(row.total_count, 10),
      winningCount: parseInt(row.winning_count, 10),
      machineCount: parseInt(row.machine_count, 10),
      lastSeen: row.last_seen,
    }));
  }

  // Get hot numbers (appearing more than average)
  async getHotNumbers(days: number = 30, lottoType?: string): Promise<FrequencyStats[]> {
    const stats = await this.getFrequencyStats({ days }, lottoType);
    if (stats.length === 0) return [];

    const avgCount = stats.reduce((sum, s) => sum + s.totalCount, 0) / stats.length;
    return stats.filter((s) => s.totalCount > avgCount).slice(0, 10);
  }

  // Get cold numbers (appearing less than average or not at all)
  async getColdNumbers(days: number = 30, lottoType?: string): Promise<FrequencyStats[]> {
    const stats = await this.getFrequencyStats({ days }, lottoType);
    if (stats.length === 0) return [];

    const avgCount = stats.reduce((sum, s) => sum + s.totalCount, 0) / stats.length;
    return stats.filter((s) => s.totalCount < avgCount || s.totalCount === 0).slice(0, 10);
  }

  // Get sleeping numbers (not appeared in X days)
  async getSleepingNumbers(days: number = 30): Promise<number[]> {
    const query = `
      SELECT DISTINCT num AS number
      FROM generate_series(1, 90) AS num
      WHERE num NOT IN (
        SELECT DISTINCT unnest(winning_numbers || machine_numbers) AS num
        FROM draws
        WHERE draw_date >= CURRENT_DATE - INTERVAL '${days} days'
      )
      ORDER BY number
    `;

    const result = await pool.query(query);
    return result.rows.map((row) => parseInt(row.number, 10));
  }

  // Get total draw count
  async getTotalDrawCount(lottoType?: string): Promise<number> {
    let query = 'SELECT COUNT(*) FROM draws';
    const params: unknown[] = [];

    if (lottoType) {
      query += ' WHERE lotto_type = $1';
      params.push(lottoType);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  // Get date range of draws
  async getDateRange(): Promise<{ minDate: string; maxDate: string } | null> {
    const result = await pool.query(
      'SELECT MIN(draw_date) AS min_date, MAX(draw_date) AS max_date FROM draws'
    );
    if (!result.rows[0].min_date) return null;

    return {
      minDate: result.rows[0].min_date,
      maxDate: result.rows[0].max_date,
    };
  }
}

export const analyticsService = new AnalyticsService();

