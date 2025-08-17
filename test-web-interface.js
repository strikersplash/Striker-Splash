const { pool } = require("./dist/config/db");

async function testWebInterface() {
  try {
    console.log("=== TESTING ACTUAL WEB INTERFACE LOGIC ===");

    // Exactly simulate what happens when a sales user loads the cashier interface
    const userId = 4; // Sales user

    console.log(
      `Sales user preloading transactions for today (Central timezone)`
    );

    const timestamp = Date.now();

    // This is the EXACT query from getCashierInterface
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
        WHERE created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
        AND created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
      ) qt ON t.player_id = qt.player_id 
        AND t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
        AND t.team_play = false
      WHERE t.staff_id = $1
        AND t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
        AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    const result = await pool.query(transactionsQuery, [userId]);

    console.log(
      `${timestamp} - Fresh transactions loaded for sales user ${userId}, count: ${result.rows.length}`
    );

    console.log("Sample preloaded transactions:");
    result.rows.slice(0, 5).forEach((row, index) => {
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} (${
          row.transaction_type
        }) at ${row.timestamp}`
      );
    });

    // Check if the transactions from your original sales (2922, 2923) are there
    const hasOriginalSales = result.rows.some(
      (row) => row.id === 2922 || row.id === 2923
    );
    console.log(
      `\n🔍 Original sales transactions (2922, 2923) are included: ${
        hasOriginalSales ? "✅ YES" : "❌ NO"
      }`
    );

    if (hasOriginalSales) {
      console.log(
        "\n🎉 SUCCESS! The sales transactions you made ARE showing up in the system now!"
      );
      console.log(
        "The issue was that we moved to a new day (August 14th) in Central Time,"
      );
      console.log(
        "so the system correctly started showing August 14th transactions instead of August 13th."
      );
    }

    // Test the API endpoint too
    console.log("\n=== TESTING API ENDPOINT LOGIC ===");
    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    console.log(`API would use today: ${today}`);

    const apiQuery = `
      SELECT 
        t.id,
        t.created_at as timestamp,
        p.name as player_name,
        CASE 
          WHEN t.kicks < 0 THEN 'requeue'
          ELSE 'sale'
        END as transaction_type,
        t.kicks as kicks_count,
        t.amount,
        COALESCE(s.name, s.username, 'Staff') as staff_name
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = $2
        AND t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    const apiResult = await pool.query(apiQuery, [today, userId]);
    console.log(
      `API endpoint would return ${apiResult.rows.length} transactions`
    );

    const apiHasOriginal = apiResult.rows.some(
      (row) => row.id === 2922 || row.id === 2923
    );
    console.log(
      `API includes original sales: ${apiHasOriginal ? "✅ YES" : "❌ NO"}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

testWebInterface();
