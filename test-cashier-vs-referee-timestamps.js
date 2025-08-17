// Test cashier timestamp behavior vs referee timestamp behavior
const { pool } = require("./dist/config/db.js");

async function compareTimestampMethods() {
  try {
    console.log("=== COMPARING CASHIER VS REFEREE TIMESTAMP METHODS ===");

    // 1. Test cashier method (used for transactions)
    console.log("\n1. Cashier method test:");
    const cashierQuery = `SELECT timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as cashier_timestamp`;
    const cashierResult = await pool.query(cashierQuery);
    console.log("Cashier timestamp:", cashierResult.rows[0].cashier_timestamp);

    // 2. Test referee method (same as cashier, should be identical)
    console.log("\n2. Referee method test:");
    const refereeQuery = `SELECT timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as referee_timestamp`;
    const refereeResult = await pool.query(refereeQuery);
    console.log("Referee timestamp:", refereeResult.rows[0].referee_timestamp);

    // 3. Check recent transactions vs recent game stats
    console.log("\n3. Recent transactions timestamp check:");
    const transactionQuery = `
      SELECT 
        p.name,
        t.kicks,
        t.created_at,
        t.created_at AT TIME ZONE 'America/Belize' as belize_display,
        EXTRACT(HOUR FROM t.created_at AT TIME ZONE 'America/Belize') as belize_hour
      FROM transactions t
      JOIN players p ON t.player_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 3
    `;

    const transactionResult = await pool.query(transactionQuery);
    console.log("Recent transactions:");
    transactionResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} - ${row.kicks} kicks`);
      console.log(`   Stored: ${row.created_at}`);
      console.log(`   Belize display: ${row.belize_display}`);
      console.log(`   Belize hour: ${row.belize_hour}`);
      console.log("");
    });

    console.log("4. Recent game stats (for comparison):");
    const gameStatQuery = `
      SELECT 
        p.name,
        gs.goals,
        gs.timestamp,
        gs.timestamp AT TIME ZONE 'America/Belize' as belize_display,
        EXTRACT(HOUR FROM gs.timestamp AT TIME ZONE 'America/Belize') as belize_hour
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      ORDER BY gs.timestamp DESC
      LIMIT 3
    `;

    const gameStatResult = await pool.query(gameStatQuery);
    console.log("Recent game stats:");
    gameStatResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} - ${row.goals} goals`);
      console.log(`   Stored: ${row.timestamp}`);
      console.log(`   Belize display: ${row.belize_display}`);
      console.log(`   Belize hour: ${row.belize_hour}`);
      console.log("");
    });

    // 5. Test the exact formula that should work
    console.log("5. Testing correct UTC storage method:");

    // This should store current Belize time as proper UTC
    const correctQuery = `
      SELECT 
        NOW() as server_now,
        NOW() AT TIME ZONE 'America/Belize' as belize_now,
        (NOW() AT TIME ZONE 'America/Belize') AT TIME ZONE 'UTC' as proper_utc_storage,
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as current_method
    `;

    const correctResult = await pool.query(correctQuery);
    console.log("Comparison of methods:", correctResult.rows[0]);

    console.log("\n=== COMPARISON COMPLETE ===");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await pool.end();
  }
}

compareTimestampMethods();
