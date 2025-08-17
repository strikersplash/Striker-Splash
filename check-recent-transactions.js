const { pool } = require("./dist/config/db");

async function checkRecentTransactions() {
  try {
    console.log("Current database date:", new Date().toISOString());

    // Check what dates we have transactions for
    const dates = await pool.query(`
      SELECT 
        DATE(created_at) as transaction_date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions 
      WHERE created_at >= CURRENT_DATE - INTERVAL '10 days'
      GROUP BY DATE(created_at)
      ORDER BY transaction_date DESC
    `);

    console.log("\nTransactions by date (last 10 days):");
    console.table(dates.rows);

    // Check today's transactions specifically
    const today = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.created_at,
        t.staff_id,
        s.name as staff_name,
        p.name as player_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.id
      LEFT JOIN players p ON t.player_id = p.id
      WHERE DATE(t.created_at) = CURRENT_DATE
      ORDER BY t.created_at DESC
    `);

    console.log(`\nToday's transactions (${today.rows.length} found):`);
    if (today.rows.length > 0) {
      console.table(today.rows);
    } else {
      console.log("No transactions found for today");
    }

    // Check what the current date is in the database
    const dbDate = await pool.query("SELECT CURRENT_DATE, NOW()");
    console.log("\nDatabase current date/time:");
    console.log(dbDate.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkRecentTransactions();
