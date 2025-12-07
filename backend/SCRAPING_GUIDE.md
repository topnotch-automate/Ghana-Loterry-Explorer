# Web Scraping Guide

This guide explains how to populate the database with historical lottery data by scraping websites like NLA (National Lottery Authority) and b2b.com.

## Overview

The scraping system consists of:
- **ScraperService** (`src/services/scraperService.ts`) - Handles web scraping from multiple sources
- **Populate Script** (`src/scripts/populate.ts`) - Batch processes historical dates and populates the database
- **Test Scrape Script** (`src/scripts/scrape.ts`) - Quick testing tool to preview scraped data

## Prerequisites

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Database Setup**
   - Ensure PostgreSQL is running
   - Database schema is created (run `schema.sql`)
   - `DATABASE_URL` is set in `.env`

## Quick Start

### 1. Test the Scraper

First, test if the scraper can fetch data from the websites:

```bash
npm run scrape
```

This will attempt to scrape the latest results. If no data is found, you'll need to update the CSS selectors in `scraperService.ts` based on the actual website structure.

### 2. Populate Historical Data

To populate data from 2010-2025:

```bash
npm run populate
```

**Options:**
```bash
# Specific date range
npm run populate -- --start 2020-01-01 --end 2024-12-31

# Single source only
npm run populate -- --source nla
npm run populate -- --source b2b

# Custom batch size and delay
npm run populate -- --batch-size 100 --delay 3000
```

## Customizing Scrapers

The scraper service uses CSS selectors to extract data from HTML. You'll need to inspect the actual websites and update the selectors.

### Finding the Right Selectors

1. **Open the website** (e.g., https://www.nla.com.gh/results)
2. **Inspect the HTML** (Right-click → Inspect)
3. **Identify the structure**:
   - Where are the draw dates?
   - Where are the winning numbers?
   - Where are the machine numbers?
   - What is the lotto type?

4. **Update `scraperService.ts`** with the correct selectors:

```typescript
// Example: Update these selectors based on actual HTML structure
$('.draw-result, .lottery-result, [class*="result"]').each((_, element) => {
  const drawDate = $(element).find('.date, [class*="date"]').text().trim();
  const lottoType = $(element).find('.type, [class*="type"]').text().trim();
  // ... etc
});
```

### Common Patterns

- **Date extraction**: Look for date elements, data attributes, or text patterns
- **Number extraction**: Numbers might be in spans, divs, or text content
- **Lotto type**: Could be in headers, labels, or data attributes

## Data Sources

### NLA (National Lottery Authority)
- Base URL: `https://www.nla.com.gh`
- May require JavaScript rendering (Puppeteer)
- Update selectors in `scrapeNLA()` method

### b2b.com
- Base URL: `https://www.b2b.com.gh`
- May require JavaScript rendering (Puppeteer)
- Update selectors in `scrapeB2B()` method

## Rate Limiting

The scraper includes built-in rate limiting:
- **Request delay**: 1 second between requests (configurable)
- **Batch delay**: 2 seconds between batches (configurable)
- **Respectful scraping**: Always follow website terms of service

## Error Handling

- **Network errors**: Retried automatically
- **Parse errors**: Logged but don't stop the process
- **Duplicate draws**: Automatically skipped (unique constraint on date + type)
- **Missing data**: Logged as warnings

## Troubleshooting

### No data found
1. **Check website structure**: Inspect the HTML to verify selectors
2. **Check if JavaScript is needed**: Some sites require Puppeteer
3. **Check for anti-bot protection**: May need to add delays or headers
4. **Verify date format**: Ensure dates match website's expected format

### Scraping is slow
- Reduce batch size: `--batch-size 25`
- Increase delay: `--delay 5000`
- Process smaller date ranges

### Database errors
- Check database connection
- Verify schema is created
- Check for constraint violations

## Best Practices

1. **Start small**: Test with a single date before processing years
2. **Monitor progress**: Watch logs for errors and warnings
3. **Respect websites**: Don't overload servers with requests
4. **Update selectors**: Websites change, keep selectors current
5. **Backup data**: Export database before large imports

## Alternative Data Sources

If scraping is not feasible, consider:
- **CSV/JSON imports**: Create import scripts for manual data files
- **API access**: Contact lottery authorities for official APIs
- **Data providers**: Use third-party lottery data services

## Example Workflow

```bash
# 1. Test scraper with latest data
npm run scrape -- --date 2024-12-01

# 2. If successful, populate a small range first
npm run populate -- --start 2024-12-01 --end 2024-12-31

# 3. Verify data in database
# (Check via API or database client)

# 4. If everything looks good, populate full range
npm run populate -- --start 2010-01-01 --end 2025-12-31
```

## Notes

- The scraper is designed to be **resumable** - if interrupted, you can rerun and it will skip duplicates
- **Deduplication** happens automatically based on `draw_date` + `lotto_type`
- **Metadata** is stored for each draw, including source URL and scrape timestamp

