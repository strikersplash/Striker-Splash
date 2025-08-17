const { pool } = require("./dist/config/db");

async function testNewTransactionTimezone() {
  try {
    console.log("=== TESTING NEW TRANSACTION TIMEZONE ===");

    // Get current time info
    const timeQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Chicago' as central_now,
        (NOW() AT TIME ZONE 'America/Chicago')::date as central_today
    `;

    const timeResult = await pool.query(timeQuery);
    const timeData = timeResult.rows[0];

    console.log("Current time:");
    console.log(`  UTC: ${timeData.utc_now}`);
    console.log(`  Central: ${timeData.central_now}`);
    console.log(`  Central Today: ${timeData.central_today}`);

    // Create a test transaction using the new logic
    const playerQuery = `SELECT id, name FROM players LIMIT 1`;
    const playerResult = await pool.query(playerQuery);
    const player = playerResult.rows[0];

    const staffQuery = `SELECT id, name FROM staff WHERE role = 'sales' LIMIT 1`;
    const staffResult = await pool.query(staffQuery);
    const staff = staffResult.rows[0];

    console.log(`\nCreating transaction: ${player.name} by ${staff.name}`);

    // Use the new transaction creation logic
    const insertQuery = `
      INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
      VALUES ($1, $2, $3, timezone('UTC', NOW() AT TIME ZONE 'America/Chicago'), false, $4) 
      RETURNING id, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      player.id,
      3,
      15.0,
      staff.id,
    ]);

    const newTransaction = insertResult.rows[0];
    console.log(`\nCreated transaction ID: ${newTransaction.id}`);
    console.log(`Stored timestamp: ${newTransaction.created_at}`);

    // Now test how it appears in filtering queries
    const filterQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Chicago' as central_time,
        (t.created_at AT TIME ZONE 'America/Chicago')::date as central_date,
        p.name as player_name,
        t.amount
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      WHERE t.id = $1
    `;

    const filterResult = await pool.query(filterQuery, [newTransaction.id]);
    const transaction = filterResult.rows[0];

    console.log("\nTransaction details:");
    console.log(`  Stored UTC: ${transaction.created_at}`);
    console.log(`  Central Time: ${transaction.central_time}`);
    console.log(`  Central Date: ${transaction.central_date}`);
    console.log(
      `  Matches today (${
        timeData.central_today.toISOString().split("T")[0]
      }): ${
        transaction.central_date.toISOString().split("T")[0] ===
        timeData.central_today.toISOString().split("T")[0]
      }`
    );

    // Test if it would be found by the preloaded query
    const centralToday = timeData.central_today.toISOString().split("T")[0];
    const preloadQuery = `
      SELECT COUNT(*) as count
      FROM transactions t
      WHERE t.staff_id = $1
        AND t.created_at AT TIME ZONE 'America/Chicago' >= ($2::date)::timestamp
        AND t.created_at AT TIME ZONE 'America/Chicago' < ($2::date + interval '1 day')::timestamp
        AND t.id = $3
    `;

    const preloadResult = await pool.query(preloadQuery, [
      staff.id,
      centralToday,
      newTransaction.id,
    ]);
    console.log(
      `\nWould be found by preloaded query: ${
        preloadResult.rows[0].count > 0 ? "YES" : "NO"
      }`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testNewTransactionTimezone();
