const { pool } = require("./dist/config/db");

async function checkTransactions() {
  try {
    console.log("Checking all recent transactions...");

    const result = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.transaction_date,
        t.sales_staff_id,
        s.name as staff_name,
        p.name as player_name
      FROM transactions t
      LEFT JOIN staff s ON t.sales_staff_id = s.id
      LEFT JOIN players p ON t.player_id = p.id
      WHERE t.transaction_date >= CURRENT_DATE - INTERVAL '2 days'
      ORDER BY t.transaction_date DESC, t.id DESC
    `);

    console.log("Found", result.rows.length, "recent transactions:");
    result.rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, Staff: ${row.staff_name}, Player: ${row.player_name}, Amount: $${row.amount}, Date: ${row.transaction_date}`
      );
    });

    // Also check staff aggregates
    console.log("\nStaff sales aggregates for today:");
    const today = await pool.query(`
      SELECT 
        s.name as staff_name,
        COUNT(t.id) as customer_count,
        COALESCE(SUM(t.amount), 0) as total_revenue
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.sales_staff_id 
        AND DATE(t.transaction_date) = CURRENT_DATE
      GROUP BY s.id, s.name
      ORDER BY total_revenue DESC
    `);

    today.rows.forEach((row) => {
      console.log(
        `${row.staff_name}: ${row.customer_count} customers, $${row.total_revenue}`
      );
    });
  } catch (error) {
    console.error("Error checking transactions:", error);
  } finally {
    await pool.end();
  }
}

checkTransactions();
