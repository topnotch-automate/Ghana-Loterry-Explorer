# Data Population Summary

## Overview

This document summarizes the data population system for the Ghana Lottery Explorer application. The system is designed to scrape lottery results from multiple sources (NLA, b2b.com) and populate a PostgreSQL database with historical data spanning 2010-2025.

## Architecture

### Components

1. **ScraperService** (`src/services/scraperService.ts`)
   - Handles web scraping from multiple sources
   - Supports both static HTML (Cheerio) and JavaScript-rendered content (Puppeteer)
   - Includes rate limiting and error handling
   - Deduplicates draws automatically

2. **DrawService** (`src/services/drawService.ts`)
   - Extended with `batchInsertDraws()` method
   - Handles duplicate detection using database constraints
   - Efficient batch processing with transactions

3. **Populate Script** (`src/scripts/populate.ts`)
   - Main script for historical data population
   - Processes dates in configurable batches
   - Provides progress tracking and error reporting
   - Supports resumable execution (skips duplicates)

4. **Test Scrape Script** (`src/scripts/scrape.ts`)
   - Quick testing tool for debugging scrapers
   - Useful for verifying selectors and data extraction

5. **Date Utilities** (`src/utils/dateUtils.ts`)
   - Helper functions for date range generation
   - Date formatting and validation

## Data Flow

```
Website (NLA/b2b.com)
    ↓
ScraperService (scrapes HTML/JS)
    ↓
Parse & Validate Data
    ↓
Batch Insert (DrawService)
    ↓
PostgreSQL Database
```

## Usage

### Basic Population

```bash
# Populate all data from 2010-2025
cd backend
npm run populate
```

### Custom Options

```bash
# Specific date range
npm run populate -- --start 2020-01-01 --end 2024-12-31

# Single source
npm run populate -- --source nla

# Custom batch settings
npm run populate -- --batch-size 50 --delay 2000
```

### Testing

```bash
# Test scraper with latest data
npm run scrape

# Test specific date
npm run scrape -- --date 2024-01-15

# Test specific source
npm run scrape -- --source nla
```

## Configuration

### Required Setup

1. **Dependencies**: Install scraping libraries
   ```bash
   npm install
   ```

2. **Database**: Ensure PostgreSQL is running and schema is created
   ```bash
   psql -U username -d ghana_lottery -f src/database/schema.sql
   ```

3. **Environment**: Set `DATABASE_URL` in `.env`

### Scraper Customization

The scrapers use CSS selectors to extract data. You **must** update these selectors based on the actual website structure:

1. Inspect the target website HTML
2. Identify where draw data is located
3. Update selectors in `scraperService.ts`:
   - `scrapeNLA()` - For NLA website
   - `scrapeB2B()` - For b2b.com website

See `SCRAPING_GUIDE.md` for detailed instructions.

## Features

### Automatic Deduplication
- Uses database unique constraint on `(draw_date, lotto_type)`
- Skips existing draws automatically
- Safe to rerun if interrupted

### Rate Limiting
- Configurable delays between requests
- Respectful of website servers
- Prevents IP blocking

### Error Handling
- Network errors are logged but don't stop the process
- Parse errors are logged per draw
- Database errors are handled gracefully
- Progress is preserved (duplicates skipped on retry)

### Progress Tracking
- Real-time logging of progress
- Summary statistics at completion
- Error counts and warnings

## Data Structure

Each scraped draw contains:
- `drawDate`: ISO date string (YYYY-MM-DD)
- `lottoType`: String (e.g., "Daily", "Monday Special")
- `winningNumbers`: Array of 5 numbers (1-90)
- `machineNumbers`: Array of 5 numbers (1-90)
- `source`: String ("NLA" or "b2b.com")
- `metadata`: JSON object with scrape timestamp and URL

## Performance Considerations

### Batch Size
- Default: 50 dates per batch
- Larger batches = faster but more memory
- Smaller batches = slower but safer

### Delays
- Default: 2 seconds between batches
- 500ms between individual date requests
- Adjust based on website response times

### Estimated Time
For 15 years of data (2010-2025):
- ~5,475 dates (assuming daily draws)
- At 50 dates/batch with 2s delay: ~4-6 hours
- Actual time depends on website response and data availability

## Troubleshooting

### No Data Found
- **Cause**: Selectors don't match website structure
- **Solution**: Inspect website HTML and update selectors

### Slow Scraping
- **Cause**: Large date ranges or slow website
- **Solution**: Reduce batch size, increase delays, process smaller ranges

### Database Errors
- **Cause**: Connection issues or constraint violations
- **Solution**: Check database connection, verify schema

### Missing Dates
- **Cause**: No draws on certain dates (weekends, holidays)
- **Solution**: Normal - script logs warnings but continues

## Next Steps

1. **Update Selectors**: Inspect actual websites and update CSS selectors
2. **Test Scraping**: Run `npm run scrape` to verify data extraction
3. **Small Test**: Populate a small date range first (e.g., 1 month)
4. **Full Population**: Once verified, run full 2010-2025 population
5. **Monitor**: Watch logs for errors and adjust as needed

## Maintenance

### Keeping Data Current
After initial population, set up a scheduled job to:
- Scrape latest results daily
- Update database with new draws
- Refresh materialized views

### Selector Updates
Websites may change structure. When scraping fails:
1. Check if website structure changed
2. Update selectors in `scraperService.ts`
3. Test with `npm run scrape`
4. Rerun population for affected dates

## Security & Ethics

- **Respect robots.txt**: Check website's scraping policy
- **Rate Limiting**: Don't overload servers
- **Terms of Service**: Ensure compliance with website terms
- **Data Usage**: Use scraped data responsibly

## Support

For issues or questions:
- Check `SCRAPING_GUIDE.md` for detailed instructions
- Review error logs for specific issues
- Update selectors if website structure changes
- Consider alternative data sources if scraping is not feasible

