#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Database connection parameters
DB_USER="${DB_USER:-striker_splash}"
DB_PASSWORD="${DB_PASSWORD:-striker_splash}"
DB_NAME="${DB_NAME:-striker_splash}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Running competitions tables migration..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f $DIR/src/migrations/create-competitions-tables.sql

# Check if the migration was successful
if [ $? -eq 0 ]; then
    echo "Competitions tables migration completed successfully!"
else
    echo "Error: Competitions tables migration failed!"
    exit 1
fi
