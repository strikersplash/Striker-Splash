const { pool } = require("./dist/config/db");

async function createTestTransaction() {
  try {
    console.log("Creating a test transaction...");

    // Get a player ID to use
    const playerQuery = `SELECT id, name FROM players LIMIT 1`;
    const playerResult = await pool.query(playerQuery);

    if (playerResult.rows.length === 0) {
      console.log("No players found in database");
      return;
    }

    const player = playerResult.rows[0];
    console.log(`Using player: ${player.name} (ID: ${player.id})`);

    // Get a staff ID to use
    const staffQuery = `SELECT id, name FROM staff WHERE role = 'sales' LIMIT 1`;
    const staffResult = await pool.query(staffQuery);

    if (staffResult.rows.length === 0) {
      console.log("No sales staff found in database");
      return;
    }

    const staff = staffResult.rows[0];
    console.log(`Using staff: ${staff.name} (ID: ${staff.id})`);

    // Create a new transaction
    const insertQuery = `
      INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
      VALUES ($1, $2, $3, NOW(), false, $4) 
      RETURNING id, created_at
    `;

    const insertResult = await pool.query(insertQuery, [
      player.id,
      3, // 3 kicks
      15.0, // $15
      staff.id,
    ]);

    const newTransaction = insertResult.rows[0];
    console.log(
      `Created transaction ID: ${newTransaction.id} at ${newTransaction.created_at}`
    );

    // Now test that today's query finds it
    console.log(
      "\nTesting that the new transaction appears in today's results..."
    );

    const centralTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Chicago')::date as today`;
    const centralTimeResult = await pool.query(centralTimeQuery);
    const today = centralTimeResult.rows[0].today.toISOString().split("T")[0];

    const todayQuery = `
      SELECT 
        t.id,
        t.created_at as timestamp,
        p.name as player_name,
        t.kicks as kicks_count,
        t.amount,
        s.name as staff_name
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
        AND t.created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + interval '1 day'
      ORDER BY t.created_at DESC
      LIMIT 5
    `;

    const todayResult = await pool.query(todayQuery);

    console.log(
      `Found ${todayResult.rows.length} total transactions for today:`
    );
    todayResult.rows.forEach((row, index) => {
      const isNew = row.id === newTransaction.id;
      console.log(
        `  ${index + 1}. ${row.player_name} - $${row.amount} (${
          row.kicks_count
        } kicks) by ${row.staff_name} at ${row.timestamp}${
          isNew ? " <- NEW" : ""
        }`
      );
    });
  } catch (error) {
    console.error("Error creating test transaction:", error);
  } finally {
    await pool.end();
  }
}

createTestTransaction();
