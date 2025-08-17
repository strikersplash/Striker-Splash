const { pool } = require("./dist/config/db");

async function debugTransactionFiltering() {
  try {
    console.log("=== DEBUGGING TRANSACTION FILTERING ===");

    // Get current Central Time date (same as preloaded query)
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    console.log(`Central Time Today: ${today}`);

    // Check the most recent transactions
    console.log("\n=== RECENT TRANSACTIONS ===");
    const recentQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Chicago' as central_time,
        (t.created_at AT TIME ZONE 'America/Chicago')::date as central_date,
        p.name as player_name,
        t.amount,
        t.staff_id
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      WHERE t.id >= 2922
      ORDER BY t.id DESC
    `;

    const recentResult = await pool.query(recentQuery);
    recentResult.rows.forEach((row) => {
      console.log(
        `ID ${row.id}: ${row.player_name} - $${row.amount} - Staff ${row.staff_id}`
      );
      console.log(`  UTC: ${row.created_at}`);
      console.log(`  Central: ${row.central_time}`);
      console.log(`  Central Date: ${row.central_date}`);
      console.log(
        `  Matches today (${today}): ${
          row.central_date.toISOString().split("T")[0] === today
        }`
      );
      console.log("");
    });

    // Test the preloaded query logic
    console.log("\n=== TESTING PRELOADED QUERY FOR STAFF 4 ===");
    const preloadedQuery = `
      SELECT 
        t.id,
        t.created_at as timestamp,
        p.name as player_name,
        CASE WHEN t.official_entry = true THEN 'requeue' ELSE 'sale' END as transaction_type,
        t.kicks as kicks_count,
        t.amount,
        COALESCE(s.name, s.username, 'Staff') as staff_name
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = 4
        AND t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND t.created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    const preloadedResult = await pool.query(preloadedQuery);
    console.log(
      `Found ${preloadedResult.rows.length} transactions for staff 4 today:`
    );
    preloadedResult.rows.forEach((row, index) => {
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} at ${
          row.timestamp
        }`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

debugTransactionFiltering();
