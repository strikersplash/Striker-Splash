const { pool } = require("./dist/config/db");

async function findMissingTransactions() {
  try {
    console.log("=== FINDING MISSING TRANSACTIONS 2922 & 2923 ===");

    const query = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Chicago' as central_time,
        (t.created_at AT TIME ZONE 'America/Chicago')::date as central_date,
        p.name as player_name,
        t.amount,
        t.staff_id,
        s.name as staff_name
      FROM transactions t
      LEFT JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.id IN (2922, 2923)
      ORDER BY t.id
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log("❌ Transactions 2922 and 2923 not found in database!");
      return;
    }

    console.log(`Found ${result.rows.length} missing transactions:`);
    result.rows.forEach((row) => {
      console.log(`\nTransaction ${row.id}:`);
      console.log(`  Player: ${row.player_name}`);
      console.log(`  Amount: $${row.amount}`);
      console.log(`  Staff ID: ${row.staff_id} (${row.staff_name})`);
      console.log(`  UTC Time: ${row.created_at}`);
      console.log(`  Central Time: ${row.central_time}`);
      console.log(`  Central Date: ${row.central_date}`);
    });

    // Check if they would match today's Central Time filter
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    console.log(`\nCentral Time Today: ${today}`);

    result.rows.forEach((row) => {
      const transactionDate = row.central_date.toISOString().split("T")[0];
      const matches = transactionDate === today;
      console.log(
        `Transaction ${
          row.id
        } Central Date: ${transactionDate} - Matches today: ${
          matches ? "YES" : "NO"
        }`
      );
    });

    // Test the actual filtering queries
    console.log("\n=== TESTING FILTERING QUERIES ON THESE TRANSACTIONS ===");

    const oldFilterQuery = `
      SELECT COUNT(*) as count
      FROM transactions t
      WHERE t.id IN (2922, 2923)
        AND t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND t.created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
    `;

    const newFilterQuery = `
      SELECT COUNT(*) as count
      FROM transactions t
      WHERE t.id IN (2922, 2923)
        AND t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
    `;

    const oldResult = await pool.query(oldFilterQuery);
    const newResult = await pool.query(newFilterQuery);

    console.log(
      `Old filtering approach: ${oldResult.rows[0].count} transactions`
    );
    console.log(
      `New filtering approach: ${newResult.rows[0].count} transactions`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

findMissingTransactions();
