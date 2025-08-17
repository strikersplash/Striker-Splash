const { pool } = require("./dist/config/db");

async function checkDatabaseSchema() {
  console.log("=== CHECKING DATABASE SCHEMA ===");

  try {
    // Check the current schema of game_stats table
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'game_stats' 
      AND column_name = 'timestamp'
      ORDER BY ordinal_position
    `;

    const schemaResult = await pool.query(schemaQuery);
    console.log("game_stats.timestamp column definition:");
    console.log(schemaResult.rows[0]);

    // Test what the default value actually produces
    if (schemaResult.rows[0]?.column_default) {
      console.log("\n=== TESTING DEFAULT VALUE ===");

      await pool.query(`
        CREATE TEMP TABLE test_default_timestamp (
          id SERIAL PRIMARY KEY,
          test_timestamp TIMESTAMP DEFAULT now()
        )
      `);

      await pool.query(`INSERT INTO test_default_timestamp DEFAULT VALUES`);

      const defaultTest = await pool.query(`
        SELECT 
          test_timestamp,
          test_timestamp AT TIME ZONE 'America/Belize' as belize_time
        FROM test_default_timestamp
      `);

      console.log(
        "Default now() produces:",
        defaultTest.rows[0].test_timestamp
      );
      console.log("In Belize timezone:", defaultTest.rows[0].belize_time);
    }

    // Test our correct formula
    console.log("\n=== TESTING CORRECT FORMULA ===");
    const correctTest = await pool.query(`
      SELECT 
        NOW() AT TIME ZONE 'America/Belize' as correct_timestamp
    `);
    console.log(
      'NOW() AT TIME ZONE "America/Belize" produces:',
      correctTest.rows[0].correct_timestamp
    );

    // Check if any recent inserts are using the default
    console.log("\n=== CHECKING RECENT GAME_STATS INSERTS ===");
    const recentQuery = `
      SELECT 
        id,
        player_id,
        goals,
        timestamp,
        timestamp AT TIME ZONE 'America/Belize' as belize_display
      FROM game_stats 
      WHERE timestamp >= NOW() - interval '1 hour'
      ORDER BY timestamp DESC
      LIMIT 5
    `;

    const recentResult = await pool.query(recentQuery);
    console.log(`Found ${recentResult.rows.length} recent game stats:`);
    recentResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ID ${row.id}: ${row.goals} goals`);
      console.log(`   Timestamp: ${row.timestamp}`);
      console.log(`   Belize: ${row.belize_display}`);
    });
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    process.exit(0);
  }
}

checkDatabaseSchema();
