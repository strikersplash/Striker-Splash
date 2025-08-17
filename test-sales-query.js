const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testSalesQuery() {
  try {
    // Use the same date calculation as the sales user preload
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const today = `${year}-${month}-${day}`;
    const userId = 4; // Sales user ID

    console.log(
      `Testing sales user preload query for today: ${today}, userId: ${userId}`
    );

    // The exact query from the sales user preload
    const transactionsQuery = `
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
        WHERE DATE(created_at) = CURRENT_DATE
      ) qt ON t.player_id = qt.player_id 
        AND DATE(t.created_at) = DATE(qt.created_at)
        AND t.team_play = false
      WHERE t.staff_id = $2
        AND t.created_at >= $1::date
        AND t.created_at < ($1::date + interval '1 day')
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    const result = await pool.query(transactionsQuery, [today, userId]);
    console.log(`Query result: Found ${result.rows.length} transactions`);

    result.rows.forEach((trans, index) => {
      console.log(
        `  ${index + 1}. ID: ${trans.id}, Player: ${trans.player_name}, Type: ${
          trans.transaction_type
        }, Kicks: ${trans.kicks_count}, Amount: $${trans.amount}, Time: ${
          trans.timestamp
        }`
      );
    });

    if (result.rows.length === 0) {
      console.log("\n=== Debugging why no results ===");

      // Test just the date filter
      const dateOnlyQuery = `
        SELECT t.id, t.created_at, t.staff_id, p.name as player_name
        FROM transactions t
        JOIN players p ON t.player_id = p.id
        WHERE t.staff_id = $2
        ORDER BY t.created_at DESC
        LIMIT 10
      `;

      const allResult = await pool.query(dateOnlyQuery, [userId]);
      console.log(`All transactions for staff_id ${userId}:`);
      allResult.rows.forEach((trans) => {
        console.log(
          `  ID: ${trans.id}, Player: ${trans.player_name}, Staff: ${trans.staff_id}, Time: ${trans.created_at}`
        );
      });

      // Test the date range specifically
      console.log(
        `\nTesting date range: ${today}::date to ${today}::date + interval '1 day'`
      );
      const dateTestQuery = `
        SELECT 
          t.id, 
          t.created_at,
          t.created_at >= $1::date as date_gte,
          t.created_at < ($1::date + interval '1 day') as date_lt
        FROM transactions t
        WHERE t.staff_id = $2
        ORDER BY t.created_at DESC
        LIMIT 5
      `;

      const dateTestResult = await pool.query(dateTestQuery, [today, userId]);
      console.log("Date range test:");
      dateTestResult.rows.forEach((trans) => {
        console.log(
          `  ID: ${trans.id}, Time: ${trans.created_at}, >= today: ${trans.date_gte}, < tomorrow: ${trans.date_lt}`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testSalesQuery();
