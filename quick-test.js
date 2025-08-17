const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function quickTest() {
  try {
    console.log("Quick timezone fix verification...");

    const result = await pool.query(`
            SELECT 
                NOW() as utc_now,
                NOW() - INTERVAL '6 hours' as belize_timestamp,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date
        `);

    console.log("Current time info:", result.rows[0]);
    console.log("✅ Database connection working");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

quickTest();
