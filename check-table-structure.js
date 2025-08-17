const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function checkTableStructure() {
  try {
    console.log("🔍 Checking transactions table structure...\n");

    const structureQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            ORDER BY ordinal_position
        `;

    const structureResult = await pool.query(structureQuery);
    console.log("📋 Transactions table columns:");
    structureResult.rows.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (${
          col.is_nullable === "YES" ? "nullable" : "not null"
        })`
      );
    });

    console.log("\n🔍 Checking recent transactions...");
    const recentQuery = `SELECT * FROM transactions ORDER BY created_at DESC LIMIT 3`;
    const recentResult = await pool.query(recentQuery);

    console.log("📊 Recent transactions:");
    recentResult.rows.forEach((row) => {
      console.log("   Row:", JSON.stringify(row, null, 2));
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
