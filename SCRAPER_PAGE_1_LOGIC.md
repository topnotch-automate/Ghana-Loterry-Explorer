# Scraper Page 1 Logic

## Overview

The scraper has been updated to **always scrape page 1 first** (which contains the most recent draws), then continue from the last saved page. This ensures the most recent data is always refreshed.

## How It Works

### Scraping Strategy

1. **Step 1: Always Scrape Page 1**
   - Page 1 is scraped first, regardless of where the last scrape ended
   - This ensures the most recent draws are always captured
   - Page 1 contains the latest lottery results

2. **Step 2: Continue from Last Page**
   - After scraping page 1, the scraper continues from `lastScrapedPage + 1`
   - If `lastScrapedPage = 5`, it will scrape pages 6, 7, 8...
   - If `lastScrapedPage = 0` (first run), only page 1 is scraped

3. **Deduplication**
   - Draws are deduplicated based on `drawDate` and `lottoType`
   - If page 1 was already scraped, duplicates are removed
   - Ensures no duplicate entries in the database

4. **State Saving**
   - The highest page number scraped is saved as `lastPage`
   - Next scrape will continue from `lastPage + 1`
   - But page 1 will always be scraped again

## Example Scenarios

### Scenario 1: First Scrape
- **Last Page**: 0
- **Action**: Scrape page 1 only
- **Result**: `lastPage = 1`
- **Next Scrape**: Page 1 + Page 2+

### Scenario 2: Subsequent Scrape
- **Last Page**: 5
- **Action**: Scrape page 1, then pages 6, 7, 8...
- **Result**: `lastPage = 8` (highest page scraped)
- **Next Scrape**: Page 1 + Page 9+

### Scenario 3: User Specifies Start Page
- **Last Page**: 10
- **User Command**: `--start-page 3`
- **Action**: Scrape page 1, then pages 3, 4, 5...
- **Result**: `lastPage = 5` (highest page scraped)
- **Next Scrape**: Page 1 + Page 6+

## Benefits

1. **Always Fresh Data**: Page 1 (most recent) is always scraped
2. **Efficient**: Continues from last position, doesn't re-scrape old pages
3. **No Duplicates**: Deduplication ensures clean data
4. **Resumable**: Can stop and resume without losing progress

## Files Updated

- `backend/src/scripts/scrape.ts` - Always scrapes page 1 first
- `backend/src/scripts/populate.ts` - Always scrapes page 1 first
- `backend/src/utils/scraperState.ts` - Updated `getNextPage()` comment

## Usage

```bash
# Normal scrape (page 1 + continue from last)
npm run scrape

# Scrape with max pages (page 1 + continue with limit)
npm run scrape -- --max-pages 5

# Reset and start fresh
npm run populate -- --reset
```

## State File

The state is saved in `.scraper-state.json`:

```json
{
  "lastPage": 10,
  "lastScrapeDate": "2025-12-14T12:00:00.000Z",
  "totalScraped": 1500
}
```

- `lastPage`: Highest page number scraped (used for continuation)
- `lastScrapeDate`: When the last scrape completed
- `totalScraped`: Total number of draws scraped (cumulative)

