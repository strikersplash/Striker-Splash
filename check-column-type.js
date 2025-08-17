// Check the actual column definition
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function checkColumnType() {
  try {
    const query = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'game_stats' 
        AND column_name = 'timestamp'
    `;

    const result = await pool.query(query);
    console.log("Column definition:", result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkColumnType();
