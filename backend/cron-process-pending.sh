#!/bin/bash

# Cron job script to process pending NFTs every 5 minutes
# Add this to your crontab with: crontab -e
# */5 * * * * /path/to/memento/backend/cron-process-pending.sh

# Set the working directory to project root
cd /path/to/memento

# Log file location
LOG_FILE="/var/log/memento-pending-processor.log"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S'
}

# Run the pending processor
echo "$(timestamp) - Starting pending NFT processor" >> "$LOG_FILE"

# Run the script using npm script from root
npm run backend:process-pending >> "$LOG_FILE" 2>&1

# Log completion
echo "$(timestamp) - Pending NFT processor completed" >> "$LOG_FILE"
echo "----------------------------------------" >> "$LOG_FILE" 