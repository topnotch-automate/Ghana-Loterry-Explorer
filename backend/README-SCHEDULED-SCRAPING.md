# Scheduled Scraping Setup

This document explains how to set up automated scraping of lottery draws.

## Overview

The scheduled scraping system automatically fetches new lottery draws from theb2b.com on a regular schedule. This ensures your database stays up-to-date without manual intervention.

## Quick Setup

### Linux/macOS (using cron)

1. Make the setup script executable:
   ```bash
   chmod +x scripts/setup-cron.sh
   ```

2. Run the setup script:
   ```bash
   ./scripts/setup-cron.sh
   ```

This will create a cron job that runs daily at 2:00 AM.

### Windows (using Task Scheduler)

1. Open PowerShell as Administrator

2. Run the setup script:
   ```powershell
   .\scripts\setup-cron.ps1
   ```

This will create a Windows Scheduled Task that runs daily at 2:00 AM.

## Manual Setup

### Linux/macOS (cron)

1. Open your crontab:
   ```bash
   crontab -e
   ```

2. Add this line (adjust the path as needed):
   ```bash
   0 2 * * * cd /path/to/backend && npm run scrape:scheduled -- --max-pages 5 >> logs/scrape.log 2>&1
   ```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Set the trigger to "Daily at 2:00 AM"
4. Set the action to run:
   ```
   npm run scrape:scheduled -- --max-pages 5
   ```
5. Set the working directory to your backend folder

## Command Options

The `scrape:scheduled` command supports the following options:

- `--max-pages N`: Maximum number of pages to scrape (default: 5)
- `--dry-run`: Preview what would be scraped without inserting into database

Example:
```bash
npm run scrape:scheduled -- --max-pages 10
npm run scrape:scheduled -- --dry-run
```

## Monitoring

### Logs

Scraping logs are written to:
- `backend/logs/scrape.log` (when run via cron/scheduled task)

### Application Logs

The scraper also logs to the application logger, which you can monitor through your logging system.

## Troubleshooting

### Cron job not running

1. Check if cron is running:
   ```bash
   systemctl status cron  # Linux
   ```

2. Check cron logs:
   ```bash
   grep CRON /var/log/syslog  # Linux
   ```

3. Verify the cron job is listed:
   ```bash
   crontab -l
   ```

### Task Scheduler not running (Windows)

1. Open Task Scheduler
2. Check the task history for errors
3. Verify the task is enabled
4. Check that npm is in the system PATH

### No new draws being inserted

- The scraper skips duplicates automatically
- Check the logs to see how many draws were skipped vs inserted
- Verify the source website is accessible
- Check network connectivity

## Customizing the Schedule

### Change the time (cron)

Edit your crontab and modify the time:
```bash
# Run at 3:00 AM instead of 2:00 AM
0 3 * * * cd /path/to/backend && npm run scrape:scheduled
```

### Change the frequency (cron)

```bash
# Run every 6 hours
0 */6 * * * cd /path/to/backend && npm run scrape:scheduled

# Run twice daily (2 AM and 2 PM)
0 2,14 * * * cd /path/to/backend && npm run scrape:scheduled
```

### Change the schedule (Windows Task Scheduler)

1. Open Task Scheduler
2. Find your task
3. Right-click → Properties
4. Go to Triggers tab
5. Edit the trigger to change time/frequency

## Disabling Scheduled Scraping

### Linux/macOS

Remove the cron job:
```bash
crontab -e
# Delete the line with scrape:scheduled
```

### Windows

1. Open Task Scheduler
2. Find "GhanaLotteryScraper" task
3. Right-click → Disable (or Delete)

## Testing

Test the scheduled scraper manually:
```bash
npm run scrape:scheduled -- --max-pages 2 --dry-run
```

This will show what would be scraped without actually inserting data.

