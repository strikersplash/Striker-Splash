const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: process.env.DB_HOST?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : false,
});

async function runMigration() {
  try {
    console.log("Adding active column to staff table...");
    await pool.query(
      "ALTER TABLE staff ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true"
    );

    console.log("Setting existing staff as active...");
    const result = await pool.query(
      "UPDATE staff SET active = true WHERE active IS NULL"
    );
    console.log("Updated", result.rowCount, "staff records");

    console.log("Migration completed successfully!");

    // Verify the column was added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'staff' AND column_name = 'active'
    `);

    if (verifyResult.rows.length > 0) {
      console.log("Active column verified:", verifyResult.rows[0]);
    } else {
      console.log("Warning: Active column not found after migration");
    }

    // Check current staff status
    console.log("\nCurrent staff status:");
    const staffResult = await pool.query(
      "SELECT id, name, username, role, active FROM staff ORDER BY active DESC, name"
    );
    console.table(staffResult.rows);

    await pool.end();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
