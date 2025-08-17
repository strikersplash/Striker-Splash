const { pool } = require("./dist/config/db");

async function checkTransactionsTable() {
  try {
    console.log("Checking transactions table structure...");

    // Get table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'transactions' 
      ORDER BY ordinal_position
    `;
    const structureResult = await pool.query(structureQuery);

    console.log("Transactions table columns:");
    structureResult.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // Check if kicks_transaction_log exists
    const kicksLogQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'kicks_transaction_log' 
      ORDER BY ordinal_position
    `;
    const kicksLogResult = await pool.query(kicksLogQuery);

    if (kicksLogResult.rows.length > 0) {
      console.log("\nkicks_transaction_log table columns:");
      kicksLogResult.rows.forEach((col) => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log("\nkicks_transaction_log table does NOT exist");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkTransactionsTable();
