const { pool } = require("./dist/config/db");

async function checkTransactionSchema() {
  try {
    console.log("Checking transaction table schema...");

    // Check table structure
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `);

    console.log("Transaction table columns:");
    console.table(schema.rows);

    // Get a sample transaction to see the actual field names
    const sample = await pool.query("SELECT * FROM transactions LIMIT 1");
    console.log("\nSample transaction:");
    if (sample.rows.length > 0) {
      console.log(sample.rows[0]);
    } else {
      console.log("No transactions found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkTransactionSchema();
