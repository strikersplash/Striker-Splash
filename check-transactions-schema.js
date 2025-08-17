// Check transactions table schema
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function checkTransactionsSchema() {
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
        table_name = 'transactions'
      ORDER BY ordinal_position
    `;

    const result = await pool.query(query);
    console.log("Transactions table columns:");
    result.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkTransactionsSchema();
