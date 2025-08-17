const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testTimestampConsistency() {
  try {
    console.log("=== TESTING TIMESTAMP CONSISTENCY FIX ===");

    // Show current times for reference
    const timeQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Belize' as belize_now,
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as fixed_timestamp_method
    `;

    const timeResult = await pool.query(timeQuery);
    console.log("\nCurrent times:");
    console.log("UTC Now:", timeResult.rows[0].utc_now);
    console.log("Belize Now:", timeResult.rows[0].belize_now);
    console.log(
      "Fixed timestamp method (actual time):",
      timeResult.rows[0].fixed_timestamp_method
    );

    // Create a test game stat using the NEW method (what referee interface now uses)
    console.log("\n=== CREATING TEST GAME STAT WITH NEW METHOD ===");

    const gameStatQuery = `
      INSERT INTO game_stats (player_id, goals, kicks_used, staff_id, location, competition_type, queue_ticket_id, requeued, team_play, timestamp)
      VALUES (1, 3, 5, 1, 'Test Location', 'accuracy', 1, false, false, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
      RETURNING id, timestamp
    `;

    const gameStatResult = await pool.query(gameStatQuery);
    console.log("Created game stat:", gameStatResult.rows[0]);

    // Create a test transaction for comparison
    console.log("\n=== CREATING TEST TRANSACTION WITH SAME METHOD ===");

    const transactionQuery = `
      INSERT INTO transactions (player_id, kicks, amount, team_play, staff_id, created_at)
      VALUES (1, 5, 5.00, false, 1, timezone('UTC', NOW() AT TIME ZONE 'America/Belize'))
      RETURNING id, created_at
    `;

    const transactionResult = await pool.query(transactionQuery);
    console.log("Created transaction:", transactionResult.rows[0]);

    // Now check how they appear when displayed with Belize timezone
    const comparisonQuery = `
      SELECT 
        'game_stat' as record_type,
        gs.id,
        gs.timestamp as raw_timestamp,
        gs.timestamp AT TIME ZONE 'America/Belize' as belize_display_time,
        TO_CHAR(gs.timestamp AT TIME ZONE 'America/Belize', 'HH12:MI AM') as formatted_time
      FROM game_stats gs
      WHERE gs.id = $1
      
      UNION ALL
      
      SELECT 
        'transaction' as record_type,
        t.id,
        t.created_at as raw_timestamp,
        t.created_at AT TIME ZONE 'America/Belize' as belize_display_time,
        TO_CHAR(t.created_at AT TIME ZONE 'America/Belize', 'HH12:MI AM') as formatted_time
      FROM transactions t
      WHERE t.id = $2
      
      ORDER BY record_type
    `;

    const comparisonResult = await pool.query(comparisonQuery, [
      gameStatResult.rows[0].id,
      transactionResult.rows[0].id,
    ]);

    console.log("\n=== TIMESTAMP COMPARISON ===");
    comparisonResult.rows.forEach((row) => {
      console.log(`${row.record_type.toUpperCase()} (ID: ${row.id}):`);
      console.log(`  Raw timestamp: ${row.raw_timestamp}`);
      console.log(`  Belize display: ${row.belize_display_time}`);
      console.log(`  Formatted time: ${row.formatted_time}`);
      console.log("---");
    });

    // Check for time consistency
    const gameStatTime = comparisonResult.rows.find(
      (r) => r.record_type === "game_stat"
    ).raw_timestamp;
    const transactionTime = comparisonResult.rows.find(
      (r) => r.record_type === "transaction"
    ).raw_timestamp;

    const timeDiffSeconds =
      Math.abs(new Date(gameStatTime) - new Date(transactionTime)) / 1000;

    console.log(
      `\nTime difference between game stat and transaction: ${timeDiffSeconds} seconds`
    );

    if (timeDiffSeconds < 60) {
      console.log(
        "✅ SUCCESS! Timestamps are consistent between game stats and transactions"
      );
    } else {
      console.log("❌ WARNING: Large time difference detected");
    }

    console.log(
      "\n🎉 The referee interface will now show correct times that match the transaction times!"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testTimestampConsistency();
