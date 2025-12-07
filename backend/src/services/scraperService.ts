import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import type { CreateDrawInput } from '../types/index.js';

export interface ScrapedDraw {
  drawDate: string;
  lottoType: string;
  winningNumbers: number[];
  machineNumbers: number[];
  source: string;
  metadata?: Record<string, unknown>;
}

export class ScraperService {
  private readonly requestDelay = 1000; // 1 second delay between requests
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  private readonly baseUrl = 'https://www.theb2blotto.com/ajax/get_latest_results.php';
  private readonly timeout = 30000; // 30 seconds

  /**
   * Rate limiting helper
   */
  private async delay(ms: number = this.requestDelay): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Fetch HTML content from theb2b.com AJAX endpoint
   */
  private async fetchPage(page: number): Promise<string | null> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: { pn: page },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: this.timeout,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch page ${page}`, error);
      return null;
    }
  }

  /**
   * Parse a table row into a ScrapedDraw object
   */
  private parseDrawRow(row: cheerio.Element, $: cheerio.CheerioAPI): ScrapedDraw | null {
    try {
      const cols = $(row).find('td');
      if (cols.length < 3) {
        return null;
      }

      // Extract lotto type
      const nameSpan = $(cols[0]).find('span.name');
      if (nameSpan.length === 0) {
        return null;
      }
      const lottoType = nameSpan.text().trim();
      if (!lottoType) {
        return null;
      }

      // Extract draw date
      const dateSpan = $(cols[1]).find('span.date');
      if (dateSpan.length === 0) {
        return null;
      }
      const drawDate = dateSpan.text().trim();
      if (!drawDate) {
        return null;
      }

      // Extract winning numbers
      const winningUl = $(cols[2]).find('ul.lottery-number-list');
      const winningNumbers: number[] = [];
      if (winningUl.length > 0) {
        winningUl.find('li').each((_, li) => {
          const text = $(li).text().trim();
          if (text && /^\d+$/.test(text)) {
            const num = parseInt(text, 10);
            if (!isNaN(num)) {
              winningNumbers.push(num);
            }
          }
        });
      }

      // Extract machine numbers
      const machineUl = $(cols[2]).find('ul.machine-numbers');
      const machineNumbers: number[] = [];
      if (machineUl.length > 0) {
        machineUl.find('li').each((_, li) => {
          const text = $(li).text().trim();
          if (text && /^\d+$/.test(text)) {
            const num = parseInt(text, 10);
            if (!isNaN(num)) {
              machineNumbers.push(num);
            }
          }
        });
      }

      // Validate that we have meaningful data
      if (winningNumbers.length === 0 && machineNumbers.length === 0) {
        return null;
      }

      return {
        drawDate: this.parseDate(drawDate),
        lottoType,
        winningNumbers,
        machineNumbers,
        source: 'theb2b.com',
        metadata: {
          scrapedAt: new Date().toISOString(),
          originalDate: drawDate,
        },
      };
    } catch (error) {
      logger.warn('Error parsing draw row', error);
      return null;
    }
  }

  /**
   * Scrape theb2b.com lottery results using pagination
   * This matches the Python scraper.py implementation
   */
  async scrapeB2B(startPage: number = 1, maxPages?: number): Promise<ScrapedDraw[]> {
    const draws: ScrapedDraw[] = [];
    let page = startPage;
    let consecutiveEmptyPages = 0;
    const maxEmptyPages = 3; // Stop after 3 consecutive empty pages

    logger.info(`Starting scrape from page ${startPage}...`);

    try {
      while (true) {
        if (maxPages && page > startPage + maxPages - 1) {
          logger.info(`Reached maximum page limit (${maxPages}).`);
          break;
        }

        logger.info(`Fetching page ${page}...`);
        const html = await this.fetchPage(page);

        if (!html) {
          consecutiveEmptyPages++;
          if (consecutiveEmptyPages >= maxEmptyPages) {
            logger.info('Too many consecutive errors. Stopping.');
            break;
          }
          page++;
          await this.delay();
          continue;
        }

        const $ = cheerio.load(html);
        const rows = $('tr').toArray();

        if (rows.length === 0) {
          consecutiveEmptyPages++;
          if (consecutiveEmptyPages >= maxEmptyPages) {
            logger.info('No more results found. Stopping.');
            break;
          }
          page++;
          await this.delay();
          continue;
        }

        // Reset consecutive empty pages counter
        consecutiveEmptyPages = 0;

        let pageDraws = 0;
        for (const row of rows) {
          const draw = this.parseDrawRow(row, $);
          if (draw) {
            draws.push(draw);
            pageDraws++;
          }
        }

        if (pageDraws > 0) {
          logger.info(`  ✓ Found ${pageDraws} draw(s) on page ${page} (Total: ${draws.length})`);
        } else {
          logger.info(`  - No valid draws on page ${page} (Total: ${draws.length})`);
        }

        page++;
        await this.delay();
      }
    } catch (error) {
      logger.error('Error scraping theb2b.com', error);
    }

    logger.info(`Scraping completed. Total draws found: ${draws.length}`);
    return draws;
  }

  /**
   * Scrape from theb2b.com (main entry point)
   * For backward compatibility, accepts date parameter but ignores it
   * since theb2b.com uses pagination instead of date-based queries
   */
  async scrapeAll(date?: string, startPage: number = 1, maxPages?: number): Promise<ScrapedDraw[]> {
    if (date) {
      logger.warn('Date parameter is ignored. theb2b.com uses pagination instead of date-based queries.');
    }
    
    try {
      return await this.scrapeB2B(startPage, maxPages);
    } catch (error) {
      logger.error('Error scraping from theb2b.com', error);
      return [];
    }
  }


  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Try various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Fallback: try common formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // MM-DD-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return dateStr; // Already in YYYY-MM-DD
        } else if (format === formats[1]) {
          // MM/DD/YYYY
          const [, month, day, year] = match;
          return `${year}-${month}-${day}`;
        } else if (format === formats[2]) {
          // MM-DD-YYYY
          const [, month, day, year] = match;
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    logger.warn(`Could not parse date: ${dateStr}, using today's date`);
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Deduplicate draws by date and lotto type
   */
  private deduplicateDraws(draws: ScrapedDraw[]): ScrapedDraw[] {
    const seen = new Map<string, ScrapedDraw>();
    
    for (const draw of draws) {
      const key = `${draw.drawDate}-${draw.lottoType}`;
      if (!seen.has(key)) {
        seen.set(key, draw);
      } else {
        // If duplicate, prefer the one with more complete data
        const existing = seen.get(key)!;
        if (draw.source && !existing.source) {
          seen.set(key, draw);
        }
      }
    }
    
    return Array.from(seen.values());
  }

  /**
   * Convert ScrapedDraw to CreateDrawInput
   */
  toCreateDrawInput(scraped: ScrapedDraw): CreateDrawInput {
    return {
      drawDate: scraped.drawDate,
      lottoType: scraped.lottoType,
      winningNumbers: scraped.winningNumbers,
      machineNumbers: scraped.machineNumbers,
      source: scraped.source,
      metadata: scraped.metadata,
    };
  }
}

export const scraperService = new ScraperService();