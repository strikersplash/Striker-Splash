const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function testTransactionCreation() {
  const client = await pool.connect();

  try {
    console.log("Testing transaction creation with Belize timezone...");

    // First, check current time info
    const timeQuery = `
            SELECT 
                NOW() as utc_now,
                NOW() AT TIME ZONE 'America/Belize' as belize_now,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date,
                NOW()::date as utc_date
        `;

    const timeResult = await client.query(timeQuery);
    console.log("Current time info:", timeResult.rows[0]);

    const belizeDate = timeResult.rows[0].belize_date;
    console.log(
      "\nBelize date for filtering:",
      belizeDate.toISOString().split("T")[0]
    );

    // Get a test player (first one from the database)
    const playerResult = await client.query(
      "SELECT id, name FROM players LIMIT 1"
    );
    if (playerResult.rows.length === 0) {
      console.log("No players found in database");
      return;
    }

    const testPlayer = playerResult.rows[0];
    console.log(
      "Using test player:",
      testPlayer.name,
      "(ID:",
      testPlayer.id + ")"
    );

    // Get count of transactions before
    const beforeQuery = `
            SELECT COUNT(*) as count
            FROM transactions t
            WHERE t.created_at >= timezone('UTC', $1::date::timestamp)
              AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
        `;

    const beforeResult = await client.query(beforeQuery, [belizeDate]);
    const beforeCount = parseInt(beforeResult.rows[0].count);
    console.log("\nTransactions before test:", beforeCount);

    // Create a test transaction using our new Belize timestamp approach
    console.log("\nCreating test transaction...");
    const insertResult = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, $2, $3, NOW() AT TIME ZONE 'America/Belize', false, 1)
            RETURNING id, created_at, (created_at AT TIME ZONE 'America/Belize') as belize_time,
                     (created_at AT TIME ZONE 'America/Belize')::date as belize_date
        `,
      [testPlayer.id, 5, 5]
    );

    const newTransaction = insertResult.rows[0];
    console.log("Created transaction:", {
      id: newTransaction.id,
      created_at_utc: newTransaction.created_at,
      created_at_belize: newTransaction.belize_time,
      belize_date: newTransaction.belize_date,
    });

    // Check count after
    const afterResult = await client.query(beforeQuery, [belizeDate]);
    const afterCount = parseInt(afterResult.rows[0].count);
    console.log("\nTransactions after test:", afterCount);
    console.log(
      "New transaction appeared in today's filter:",
      afterCount > beforeCount ? "✅ YES" : "❌ NO"
    );

    // Test the filtering query that the app uses
    const appFilterQuery = `
            SELECT t.id, t.player_id, t.kicks, t.amount, t.created_at,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                   p.name as player_name
            FROM transactions t 
            LEFT JOIN players p ON t.player_id = p.id
            WHERE t.created_at >= timezone('UTC', $1::date::timestamp)
              AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
            ORDER BY t.created_at DESC
            LIMIT 5
        `;

    const appResult = await client.query(appFilterQuery, [belizeDate]);
    console.log("\nRecent transactions (app filter):");
    appResult.rows.forEach((row) => {
      console.log(
        `- ID ${row.id}: ${row.player_name}, $${row.amount}, ${row.kicks} kicks`
      );
      console.log(
        `  Belize time: ${row.belize_time}, Date: ${
          row.belize_date.toISOString().split("T")[0]
        }`
      );
    });

    // Clean up - delete the test transaction
    await client.query("DELETE FROM transactions WHERE id = $1", [
      newTransaction.id,
    ]);
    console.log("\nTest transaction cleaned up.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

testTransactionCreation();
