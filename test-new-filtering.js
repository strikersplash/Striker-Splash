const { pool } = require("./dist/config/db");

async function testNewFiltering() {
  try {
    console.log("=== TESTING NEW FILTERING LOGIC ===");

    // Get current Central Time date
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    console.log(`Central Time Today: ${today}`);

    // Test the new preloaded query (same as in getCashierInterface)
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
        AND t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    const preloadedResult = await pool.query(preloadedQuery);
    console.log(
      `\nFound ${preloadedResult.rows.length} transactions for staff 4 with new filtering:`
    );
    preloadedResult.rows.forEach((row, index) => {
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} at ${
          row.timestamp
        }`
      );
    });

    // Show which specific transactions these are
    if (preloadedResult.rows.length > 0) {
      const transactionIds = preloadedResult.rows.map((r) => r.id);
      console.log(`\nTransaction IDs found: ${transactionIds.join(", ")}`);

      // Check if the missing transactions (2922, 2923) are now included
      const hasMissing =
        transactionIds.includes(2922) || transactionIds.includes(2923);
      console.log(
        `Missing transactions (2922, 2923) now included: ${
          hasMissing ? "YES ✅" : "NO ❌"
        }`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testNewFiltering();
