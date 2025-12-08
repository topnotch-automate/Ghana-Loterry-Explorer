#!/bin/bash
# Setup script for scheduled scraping using cron
# 
# This script helps set up a cron job to run the scraper automatically
# 
# Usage:
#   chmod +x scripts/setup-cron.sh
#   ./scripts/setup-cron.sh

echo "Setting up scheduled scraping with cron..."
echo ""
echo "This will add a cron job to scrape lottery draws every day at 2:00 AM"
echo ""

# Get the absolute path to the project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_COMMAND="cd $PROJECT_DIR/backend && npm run scrape:scheduled -- --max-pages 5"

# Create cron job entry
CRON_JOB="0 2 * * * $CRON_COMMAND >> $PROJECT_DIR/backend/logs/scrape.log 2>&1"

echo "Cron job to be added:"
echo "$CRON_JOB"
echo ""

read -p "Do you want to add this cron job? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create logs directory if it doesn't exist
    mkdir -p "$PROJECT_DIR/backend/logs"
    
    # Add cron job (this will add it to the current user's crontab)
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    echo "✓ Cron job added successfully!"
    echo ""
    echo "To view your cron jobs, run: crontab -l"
    echo "To remove this cron job, run: crontab -e"
    echo ""
    echo "The scraper will run daily at 2:00 AM"
else
    echo "Cron job not added. You can manually add it later using:"
    echo "crontab -e"
    echo ""
    echo "Then add this line:"
    echo "$CRON_JOB"
fi

