const { Pool } = require("pg");

// Use the same connection config as in the app
const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function testDB() {
  try {
    console.log("Testing database connection...");
    const result = await pool.query("SELECT NOW() as current_time");
    console.log(
      "Database connected successfully. Current time:",
      result.rows[0].current_time
    );

    // Test timezone comparison
    const timezoneTest = await pool.query(`
            SELECT 
                NOW() as utc_now,
                NOW() AT TIME ZONE 'America/Belize' as belize_now,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date
        `);

    console.log("Timezone test results:", timezoneTest.rows[0]);
  } catch (error) {
    console.error("Database connection error:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testDB();
