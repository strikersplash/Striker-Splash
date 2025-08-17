// Script to run SQL migration files
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Create a PostgreSQL connection
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

// Get migration files
const migrationsDir = path.join(__dirname, "..");
const migrationFiles = [
  "notifications-migration.sql",
  "alter-event-registrations-add-reg-number.sql",
  "alter-event-registrations-add-queue-ticket.sql",
];

// Function to run a migration file
async function runMigration(filePath) {
  console.log(`Running migration: ${filePath}`);
  try {
    const sql = fs.readFileSync(filePath, "utf8");
    await pool.query(sql);
    console.log(
      `✓ Migration ${path.basename(filePath)} completed successfully`
    );
    return true;
  } catch (error) {
    console.error(
      `✗ Migration ${path.basename(filePath)} failed:`,
      error.message
    );
    return false;
  }
}

// Run all migrations
async function runAllMigrations() {
  console.log("=== Running Event Registration System Migrations ===");

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        const success = await runMigration(filePath);
        if (!success) {
          console.log(`Stopping migrations due to error in ${file}`);
          process.exit(1);
        }
      } else {
        console.error(`Migration file not found: ${file}`);
        process.exit(1);
      }
    }

    console.log("=== All migrations completed successfully ===");
    console.log("Event registration system is now ready!");
  } catch (error) {
    console.error("Error running migrations:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runAllMigrations();
