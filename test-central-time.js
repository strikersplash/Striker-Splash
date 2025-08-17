const { pool } = require("./dist/config/db");

async function testCentralTimeLogic() {
  try {
    console.log("Testing Central Time logic...");

    // Get today's date in Central timezone (same logic as the fixed functions)
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    console.log(`Today in Central Time: ${today}`);

    // Test the transaction query logic
    const testQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM transactions 
      WHERE created_at AT TIME ZONE 'America/Chicago' >= ($1::date)::timestamp
        AND created_at AT TIME ZONE 'America/Chicago' < ($1::date + interval '1 day')::timestamp
    `;

    const result = await pool.query(testQuery, [today]);

    console.log("Today's transactions (Central Time filter):");
    console.log(`- Total: ${result.rows[0].total_transactions}`);
    console.log(`- Earliest: ${result.rows[0].earliest}`);
    console.log(`- Latest: ${result.rows[0].latest}`);

    // Compare with previous approach (UTC-based)
    const utcQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM transactions 
      WHERE created_at >= $1::date
        AND created_at < ($1::date + interval '1 day')
    `;

    const utcResult = await pool.query(utcQuery, [today]);

    console.log("\nToday's transactions (UTC filter for comparison):");
    console.log(`- Total: ${utcResult.rows[0].total_transactions}`);
    console.log(`- Earliest: ${utcResult.rows[0].earliest}`);
    console.log(`- Latest: ${utcResult.rows[0].latest}`);

    // Test preloaded transactions query (same as in getCashierInterface)
    console.log("\nTesting preloaded transactions query...");

    const preloadedQuery = `
      SELECT 
        t.id,
        t.created_at as timestamp,
        p.name as player_name,
        CASE WHEN t.official_entry = true THEN 'requeue' ELSE 'sale' END as transaction_type,
        t.kicks as kicks_count,
        t.amount,
        COALESCE(s.name, s.username, 'Staff') as staff_name,
        COALESCE(qt.ticket_number, 0) as ticket_number
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      LEFT JOIN (
        SELECT player_id, ticket_number, created_at 
        FROM queue_tickets 
        WHERE created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
      ) qt ON t.player_id = qt.player_id 
        AND t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND t.created_at AT Time ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
        AND t.team_play = false
      WHERE t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND t.created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
      ORDER BY t.created_at DESC
      LIMIT 5
    `;

    const preloadedResult = await pool.query(preloadedQuery);
    console.log(
      `Found ${preloadedResult.rows.length} transactions for today (preloaded query)`
    );

    if (preloadedResult.rows.length > 0) {
      console.log("Sample transactions:");
      preloadedResult.rows.forEach((row, index) => {
        console.log(
          `  ${index + 1}. ${row.player_name} - $${row.amount} (${
            row.transaction_type
          }) at ${row.timestamp}`
        );
      });
    }
  } catch (error) {
    console.error("Error testing Central Time logic:", error);
  } finally {
    await pool.end();
  }
}

testCentralTimeLogic();
