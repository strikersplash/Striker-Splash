const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function testCorrectApproach() {
  const client = await pool.connect();

  try {
    console.log("Testing the correct transaction creation approach...\n");

    // Get current Belize date for filtering
    const dateQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as belize_date`;
    const dateResult = await client.query(dateQuery);
    const belizeDate = dateResult.rows[0].belize_date
      .toISOString()
      .split("T")[0];

    console.log("Belize date for filtering:", belizeDate);

    // Check the filtering range in UTC
    const filterRangeQuery = `
            SELECT 
                timezone('UTC', $1::date::timestamp) as filter_start_utc,
                timezone('UTC', ($1::date + interval '1 day')::timestamp) as filter_end_utc
        `;
    const filterResult = await client.query(filterRangeQuery, [belizeDate]);
    console.log("Filter range (UTC):");
    console.log("- Start:", filterResult.rows[0].filter_start_utc);
    console.log("- End:", filterResult.rows[0].filter_end_utc);

    // Get test player
    const playerResult = await client.query(
      "SELECT id, name FROM players LIMIT 1"
    );
    const testPlayer = playerResult.rows[0];

    console.log("\nTesting different creation methods:");

    // Method 1: Our current approach (NOT WORKING)
    console.log("\n1. Current method: NOW() AT TIME ZONE 'America/Belize'");
    const method1Result = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, 1, 1, NOW() AT TIME ZONE 'America/Belize', false, 1)
            RETURNING id, created_at
        `,
      [testPlayer.id]
    );

    const transaction1 = method1Result.rows[0];
    const inFilter1 = await client.query(
      `
            SELECT CASE 
                WHEN $2 >= timezone('UTC', $3::date::timestamp) 
                 AND $2 < timezone('UTC', ($3::date + interval '1 day')::timestamp)
                THEN true ELSE false 
            END as in_filter
        `,
      [transaction1.id, transaction1.created_at, belizeDate]
    );

    console.log("- Created at:", transaction1.created_at);
    console.log(
      "- Appears in filter:",
      inFilter1.rows[0].in_filter ? "✅ YES" : "❌ NO"
    );

    // Method 2: Convert to UTC properly
    console.log(
      "\n2. Better method: timezone('UTC', NOW() AT TIME ZONE 'America/Belize')"
    );
    const method2Result = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, 2, 2, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'), false, 1)
            RETURNING id, created_at
        `,
      [testPlayer.id]
    );

    const transaction2 = method2Result.rows[0];
    const inFilter2 = await client.query(
      `
            SELECT CASE 
                WHEN $2 >= timezone('UTC', $3::date::timestamp) 
                 AND $2 < timezone('UTC', ($3::date + interval '1 day')::timestamp)
                THEN true ELSE false 
            END as in_filter
        `,
      [transaction2.id, transaction2.created_at, belizeDate]
    );

    console.log("- Created at:", transaction2.created_at);
    console.log(
      "- Appears in filter:",
      inFilter2.rows[0].in_filter ? "✅ YES" : "❌ NO"
    );

    // Method 3: Use NOW() - INTERVAL '6 hours' (simpler)
    console.log("\n3. Simple method: NOW() - INTERVAL '6 hours'");
    const method3Result = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, 3, 3, NOW() - INTERVAL '6 hours', false, 1)
            RETURNING id, created_at
        `,
      [testPlayer.id]
    );

    const transaction3 = method3Result.rows[0];
    const inFilter3 = await client.query(
      `
            SELECT CASE 
                WHEN $2 >= timezone('UTC', $3::date::timestamp) 
                 AND $2 < timezone('UTC', ($3::date + interval '1 day')::timestamp)
                THEN true ELSE false 
            END as in_filter
        `,
      [transaction3.id, transaction3.created_at, belizeDate]
    );

    console.log("- Created at:", transaction3.created_at);
    console.log(
      "- Appears in filter:",
      inFilter3.rows[0].in_filter ? "✅ YES" : "❌ NO"
    );

    // Test the actual filtering query
    console.log("\nActual filtering query results:");
    const actualFilterQuery = `
            SELECT t.id, t.kicks, t.amount, t.created_at,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time
            FROM transactions t 
            WHERE t.id IN ($1, $2, $3)
              AND t.created_at >= timezone('UTC', $4::date::timestamp)
              AND t.created_at < timezone('UTC', ($4::date + interval '1 day')::timestamp)
            ORDER BY t.id
        `;

    const actualResult = await client.query(actualFilterQuery, [
      transaction1.id,
      transaction2.id,
      transaction3.id,
      belizeDate,
    ]);

    console.log("Transactions that appear in filter:");
    actualResult.rows.forEach((row) => {
      console.log(
        `- ID ${row.id}: ${row.kicks} kicks, created at ${row.created_at} (Belize: ${row.belize_time})`
      );
    });

    // Cleanup
    await client.query("DELETE FROM transactions WHERE id IN ($1, $2, $3)", [
      transaction1.id,
      transaction2.id,
      transaction3.id,
    ]);
    console.log("\nTest transactions cleaned up.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

testCorrectApproach();
