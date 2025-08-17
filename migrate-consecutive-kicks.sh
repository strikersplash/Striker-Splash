#!/bin/bash
# Migration script to add consecutive_kicks column
# Run this with admin database privileges

echo "Adding consecutive_kicks column to game_stats table..."

# You can run this manually with admin credentials:
# psql -h localhost -U [admin_user] -d striker_splash -c "ALTER TABLE game_stats ADD COLUMN IF NOT EXISTS consecutive_kicks INTEGER DEFAULT NULL;"

echo "Manual migration required:"
echo "ALTER TABLE game_stats ADD COLUMN IF NOT EXISTS consecutive_kicks INTEGER DEFAULT NULL;"
echo ""
echo "The application will work without this column (it will fallback gracefully)."
echo "To add the column, run the above SQL statement with database admin privileges."
