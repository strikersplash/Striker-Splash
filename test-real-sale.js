const { pool } = require("./dist/config/db");

async function createTestSaleAndVerify() {
  try {
    console.log("=== CREATING TEST SALE AND VERIFYING SYSTEM ===");

    // Get current time info
    console.log("Current time analysis:");
    const timeQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Chicago' as central_now,
        (NOW() AT TIME ZONE 'America/Chicago')::date as central_today
    `;
    const timeResult = await pool.query(timeQuery);
    const timeData = timeResult.rows[0];
    console.log(`  UTC Now: ${timeData.utc_now}`);
    console.log(`  Central Now: ${timeData.central_now}`);
    console.log(`  Central Today: ${timeData.central_today}`);

    // Create a new test transaction using the current application logic
    console.log("\n=== CREATING NEW TRANSACTION ===");
    const playerQuery = `SELECT id, name FROM players WHERE name = 'Tysha Daniels' LIMIT 1`;
    const playerResult = await pool.query(playerQuery);
    const player = playerResult.rows[0];

    // Use staff ID 4 (sales user)
    const staffId = 4;

    console.log(
      `Creating transaction: ${player.name} (ID: ${player.id}) by staff ${staffId}`
    );

    // This is the EXACT same query the application uses
    const insertResult = await pool.query(
      `INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) VALUES ($1, $2, $3, NOW(), false, $4) RETURNING id, created_at`,
      [player.id, 3, 15.0, staffId]
    );

    const newTransaction = insertResult.rows[0];
    console.log(
      `✅ Created transaction ID: ${newTransaction.id} at ${newTransaction.created_at}`
    );

    // Now test if the CURRENT preloaded query finds it
    console.log("\n=== TESTING PRELOADED QUERY (CURRENT LOGIC) ===");
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

    const preloadedResult = await pool.query(preloadedQuery, [staffId]);

    console.log(
      `Found ${preloadedResult.rows.length} transactions with current preloaded logic:`
    );
    preloadedResult.rows.forEach((row, index) => {
      const isNew = row.id === newTransaction.id;
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} at ${
          row.timestamp
        }${isNew ? " ← NEW TRANSACTION" : ""}`
      );
    });

    const foundNewTransaction = preloadedResult.rows.some(
      (row) => row.id === newTransaction.id
    );
    console.log(
      `\n🔍 New transaction (${newTransaction.id}) found by preloaded query: ${
        foundNewTransaction ? "✅ YES" : "❌ NO"
      }`
    );

    // Test the getTodaysTransactions query too
    console.log("\n=== TESTING getTodaysTransactions QUERY ===");
    const today = timeData.central_today.toISOString().split("T")[0];

    const getTodayQuery = `
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
        COALESCE(s.name, s.username, 'Staff') as staff_name,
        COALESCE(
          (SELECT qt.ticket_number 
           FROM queue_tickets qt 
           WHERE qt.player_id = t.player_id 
             AND qt.created_at >= timezone('UTC', ($1::date)::timestamp)
             AND qt.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
           ORDER BY qt.created_at DESC 
           LIMIT 1), 
          0
        ) as ticket_number
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.staff_id = $2
        AND t.created_at >= timezone('UTC', ($1::date)::timestamp)
        AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
      ORDER BY t.created_at DESC
      LIMIT 200
    `;

    const getTodayResult = await pool.query(getTodayQuery, [today, staffId]);

    console.log(
      `Found ${getTodayResult.rows.length} transactions with getTodaysTransactions logic:`
    );
    getTodayResult.rows.forEach((row, index) => {
      const isNew = row.id === newTransaction.id;
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} at ${
          row.timestamp
        }${isNew ? " ← NEW TRANSACTION" : ""}`
      );
    });

    const foundByGetToday = getTodayResult.rows.some(
      (row) => row.id === newTransaction.id
    );
    console.log(
      `\n🔍 New transaction (${
        newTransaction.id
      }) found by getTodaysTransactions: ${
        foundByGetToday ? "✅ YES" : "❌ NO"
      }`
    );

    if (!foundNewTransaction || !foundByGetToday) {
      console.log("\n❌ PROBLEM IDENTIFIED:");
      console.log(
        "The new transaction is not being found by the current filtering logic."
      );
      console.log("This means the timezone fixes are not working correctly.");

      // Debug the timezone conversion
      const debugQuery = `
        SELECT 
          t.id,
          t.created_at as utc_time,
          t.created_at AT TIME ZONE 'America/Chicago' as central_time,
          (t.created_at AT TIME ZONE 'America/Chicago')::date as central_date,
          timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date) as range_start,
          timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day') as range_end,
          CASE 
            WHEN t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date) 
                 AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day')
            THEN 'IN RANGE'
            ELSE 'OUT OF RANGE'
          END as filter_result
        FROM transactions t
        WHERE t.id = $1
      `;

      const debugResult = await pool.query(debugQuery, [newTransaction.id]);
      const debug = debugResult.rows[0];

      console.log("\nDEBUG INFO:");
      console.log(`  Transaction UTC time: ${debug.utc_time}`);
      console.log(`  Transaction Central time: ${debug.central_time}`);
      console.log(`  Transaction Central date: ${debug.central_date}`);
      console.log(`  Filter range start (UTC): ${debug.range_start}`);
      console.log(`  Filter range end (UTC): ${debug.range_end}`);
      console.log(`  Filter result: ${debug.filter_result}`);
    } else {
      console.log(
        "\n✅ SUCCESS: Both queries find the new transaction correctly!"
      );
      console.log("The timezone fixes are working.");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

createTestSaleAndVerify();
