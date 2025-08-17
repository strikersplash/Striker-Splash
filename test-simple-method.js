const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function testSimple() {
  const client = await pool.connect();

  try {
    console.log("Testing simple approaches...\n");

    // Get current Belize date for filtering
    const dateQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as belize_date`;
    const dateResult = await client.query(dateQuery);
    const belizeDate = dateResult.rows[0].belize_date
      .toISOString()
      .split("T")[0];

    console.log("Belize date for filtering:", belizeDate);

    // Get test player
    const playerResult = await client.query(
      "SELECT id, name FROM players LIMIT 1"
    );
    const testPlayer = playerResult.rows[0];

    console.log("Using player:", testPlayer.name, "(ID:", testPlayer.id + ")");

    // Method: Use NOW() - INTERVAL '6 hours' (simpler and should work)
    console.log("\nCreating transaction with: NOW() - INTERVAL '6 hours'");
    const transactionResult = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, $2, $3, NOW() - INTERVAL '6 hours', false, 1)
            RETURNING id, created_at
        `,
      [testPlayer.id, 5, 5]
    );

    const transaction = transactionResult.rows[0];
    console.log("- Transaction ID:", transaction.id);
    console.log("- Created at (UTC):", transaction.created_at);

    // Check what this looks like in Belize time
    const belizeTimeQuery = `
            SELECT 
                created_at AT TIME ZONE 'America/Belize' as belize_time,
                (created_at AT TIME ZONE 'America/Belize')::date as belize_date
            FROM transactions 
            WHERE id = $1
        `;
    const belizeResult = await client.query(belizeTimeQuery, [transaction.id]);
    console.log("- Belize time:", belizeResult.rows[0].belize_time);
    console.log(
      "- Belize date:",
      belizeResult.rows[0].belize_date.toISOString().split("T")[0]
    );

    // Test if it appears in our filter
    const filterQuery = `
            SELECT COUNT(*) as count
            FROM transactions t
            WHERE t.id = $1
              AND t.created_at >= timezone('UTC', $2::date::timestamp)
              AND t.created_at < timezone('UTC', ($2::date + interval '1 day')::timestamp)
        `;

    const filterResult = await client.query(filterQuery, [
      transaction.id,
      belizeDate,
    ]);
    const appearsInFilter = parseInt(filterResult.rows[0].count) > 0;

    console.log(
      "- Appears in today's filter:",
      appearsInFilter ? "✅ YES" : "❌ NO"
    );

    if (appearsInFilter) {
      console.log("\n🎉 SUCCESS! This method works correctly.");
    } else {
      console.log("\n❌ This method doesn't work.");
    }

    // Cleanup
    await client.query("DELETE FROM transactions WHERE id = $1", [
      transaction.id,
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

testSimple();
