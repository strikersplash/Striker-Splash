const { pool } = require("./dist/config/db");

async function testBelizeTimezone() {
  try {
    console.log("=== TESTING BELIZE TIMEZONE FIX ===");

    // Check current time in Belize timezone
    const timeQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Belize' as belize_now,
        (NOW() AT TIME ZONE 'America/Belize')::date as belize_today
    `;

    const timeResult = await pool.query(timeQuery);
    const timeData = timeResult.rows[0];

    console.log("Current time in Belize:");
    console.log(`  UTC: ${timeData.utc_now}`);
    console.log(`  Belize: ${timeData.belize_now}`);
    console.log(`  Belize Today: ${timeData.belize_today}`);

    // Create a new test transaction
    console.log("\n=== CREATING TEST TRANSACTION ===");
    const playerQuery = `SELECT id, name FROM players LIMIT 1`;
    const playerResult = await pool.query(playerQuery);
    const player = playerResult.rows[0];

    const staffId = 2; // Staff user that was failing

    console.log(`Creating transaction: ${player.name} by staff ${staffId}`);

    const insertResult = await pool.query(
      `INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) VALUES ($1, $2, $3, NOW(), false, $4) RETURNING id, created_at`,
      [player.id, 3, 15.0, staffId]
    );

    const newTransaction = insertResult.rows[0];
    console.log(
      `✅ Created transaction ID: ${newTransaction.id} at ${newTransaction.created_at}`
    );

    // Test the updated filtering logic
    console.log("\n=== TESTING UPDATED FILTERING LOGIC ===");
    const today = timeData.belize_today.toISOString().split("T")[0];

    const filterQuery = `
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
      LIMIT 10
    `;

    const filterResult = await pool.query(filterQuery, [today, staffId]);

    console.log(
      `Found ${filterResult.rows.length} transactions for staff ${staffId} today (${today}):`
    );
    filterResult.rows.forEach((row, index) => {
      const isNew = row.id === newTransaction.id;
      console.log(
        `  ${index + 1}. ID ${row.id}: ${row.player_name} - $${row.amount} at ${
          row.timestamp
        }${isNew ? " ← NEW" : ""}`
      );
    });

    const foundNewTransaction = filterResult.rows.some(
      (row) => row.id === newTransaction.id
    );
    console.log(
      `\n🔍 New transaction found: ${foundNewTransaction ? "✅ YES" : "❌ NO"}`
    );

    if (foundNewTransaction) {
      console.log("\n🎉 SUCCESS! The Belize timezone fix is working!");
      console.log(
        "New transactions should now appear in the interface immediately."
      );
    } else {
      console.log("\n❌ Still not working. Let me debug further...");

      // Debug the timezone range
      const debugQuery = `
        SELECT 
          timezone('UTC', ($1::date)::timestamp) as range_start,
          timezone('UTC', ($1::date + interval '1 day')::timestamp) as range_end,
          $2 as transaction_timestamp,
          CASE 
            WHEN $2 >= timezone('UTC', ($1::date)::timestamp) 
                 AND $2 < timezone('UTC', ($1::date + interval '1 day')::timestamp)
            THEN 'IN RANGE'
            ELSE 'OUT OF RANGE'
          END as filter_result
      `;

      const debugResult = await pool.query(debugQuery, [
        today,
        newTransaction.created_at,
      ]);
      const debug = debugResult.rows[0];

      console.log("\nDEBUG INFO:");
      console.log(`  Range start: ${debug.range_start}`);
      console.log(`  Range end: ${debug.range_end}`);
      console.log(`  Transaction time: ${debug.transaction_timestamp}`);
      console.log(`  Filter result: ${debug.filter_result}`);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

testBelizeTimezone();
