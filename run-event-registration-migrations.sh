#!/bin/bash

# Script to run all event registration migrations

echo "=== Running Event Registration System Migrations ==="

# Paths
MIGRATIONS_DIR="./src"
DB_USER="striker_splash"
DB_NAME="striker_splash"

# List of migration files in order
MIGRATIONS=(
  "notifications-migration.sql"
  "alter-event-registrations-add-reg-number.sql"
  "alter-event-registrations-add-queue-ticket.sql"
)

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
  echo "Running migration: $migration"
  psql -U $DB_USER -d $DB_NAME -f "$MIGRATIONS_DIR/$migration"
  
  # Check if migration was successful
  if [ $? -eq 0 ]; then
    echo "✓ Migration $migration completed successfully"
  else
    echo "✗ Migration $migration failed"
    exit 1
  fi
  
  echo ""
done

echo "=== All migrations completed successfully ==="
echo "Event registration system is now ready!"
