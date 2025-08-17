// Test actual timestamp behavior
const { pool } = require("./dist/config/db.js");

async function testTimestampIssue() {
  try {
    console.log("=== TESTING TIMESTAMP STORAGE BEHAVIOR ===");

    // 1. Test what timestamp would be generated right now
    console.log("\n1. Current time test:");
    console.log("System time:", new Date().toISOString());

    const currentTimeQuery = `
      SELECT 
        NOW() as system_utc,
        NOW() AT TIME ZONE 'America/Belize' as belize_time,
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as stored_format,
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') AT TIME ZONE 'America/Belize' as displayed_belize
    `;

    const timeResult = await pool.query(currentTimeQuery);
    const times = timeResult.rows[0];

    console.log("System UTC time:", times.system_utc);
    console.log("Belize local time:", times.belize_time);
    console.log("Stored format (what gets saved):", times.stored_format);
    console.log("Displayed Belize time:", times.displayed_belize);

    // 2. Check a recent game stat to see the actual stored vs displayed time
    console.log("\n2. Recent game stat timestamp analysis:");
    const recentStatQuery = `
      SELECT 
        gs.id,
        p.name,
        gs.goals,
        gs.timestamp as stored_timestamp,
        gs.timestamp AT TIME ZONE 'America/Belize' as belize_display,
        EXTRACT(HOUR FROM gs.timestamp AT TIME ZONE 'America/Belize') as belize_hour,
        gs.timestamp AT TIME ZONE 'UTC' as utc_display
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      ORDER BY gs.timestamp DESC
      LIMIT 3
    `;

    const statResult = await pool.query(recentStatQuery);
    console.log("Recent game stats:");
    statResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} - ${row.goals} goals`);
      console.log(`   Stored: ${row.stored_timestamp}`);
      console.log(`   Belize display: ${row.belize_display}`);
      console.log(`   UTC display: ${row.utc_display}`);
      console.log(`   Belize hour: ${row.belize_hour}`);
      console.log("");
    });

    // 3. Test if there's a problem with the timezone conversion itself
    console.log("3. Testing timezone conversion logic:");
    const testQuery = `
      SELECT 
        '2025-08-15 18:58:00'::timestamp AT TIME ZONE 'America/Belize' as from_belize,
        timezone('UTC', '2025-08-15 18:58:00'::timestamp AT TIME ZONE 'America/Belize') as converted_to_utc
    `;

    const testResult = await pool.query(testQuery);
    console.log("Test conversion for 6:58 PM Belize time:");
    console.log("From Belize:", testResult.rows[0].from_belize);
    console.log("Converted to UTC:", testResult.rows[0].converted_to_utc);

    // 4. Check what the activity API date range would catch
    console.log("\n4. Testing activity API date range:");
    const belizeTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as today`;
    const belizeTimeResult = await pool.query(belizeTimeQuery);
    const todayString = belizeTimeResult.rows[0].today
      .toISOString()
      .split("T")[0];

    const rangeQuery = `
      SELECT 
        $1::date as start_date,
        ($1::date + interval '1 day') as end_date,
        $1::date AT TIME ZONE 'America/Belize' as start_belize,
        ($1::date + interval '1 day') AT TIME ZONE 'America/Belize' as end_belize
    `;

    const rangeResult = await pool.query(rangeQuery, [todayString]);
    console.log("Date range used by API:");
    console.log("Start:", rangeResult.rows[0].start_date);
    console.log("End:", rangeResult.rows[0].end_date);
    console.log("Start Belize:", rangeResult.rows[0].start_belize);
    console.log("End Belize:", rangeResult.rows[0].end_belize);

    console.log("\n=== DIAGNOSIS COMPLETE ===");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await pool.end();
  }
}

testTimestampIssue();
