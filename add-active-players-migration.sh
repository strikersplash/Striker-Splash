#!/bin/bash

# Run the SQL migration to add active players table
echo "Running migration to add active players table for team competitions..."
psql -U striker_splash -d striker_splash -f src/add-competition-active-players.sql

echo "Migration completed."
