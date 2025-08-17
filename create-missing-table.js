// Create missing table for custom_competition_active_players
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function createMissingTable() {
  const pool = new Pool({
    user: process.env.DB_USER || "striker_splash",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "striker_splash",
    password: process.env.DB_PASSWORD || "striker_splash",
    port: parseInt(process.env.DB_PORT || "5432"),
  });

  try {
    console.log(
      "🔧 Creating missing custom_competition_active_players table..."
    );

    const sqlFile = path.join(
      __dirname,
      "src",
      "add-competition-active-players.sql"
    );
    const sql = fs.readFileSync(sqlFile, "utf8");

    await pool.query(sql);
    console.log("✅ Table created successfully!");

    // Verify table exists
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'custom_competition_active_players'
      ORDER BY ordinal_position
    `);

    console.log("📋 Table columns:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
  } catch (error) {
    console.error("❌ Error creating table:", error.message);
  } finally {
    await pool.end();
  }
}

createMissingTable();
