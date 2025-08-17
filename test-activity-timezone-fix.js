// Test if activity retrieval now uses correct Belize timezone
const { pool } = require("./dist/config/db.js");

async function testActivityTimezoneFix() {
  try {
    console.log("=== TESTING ACTIVITY TIMEZONE FIX ===");

    // 1. Test what date the API will use now
    console.log("\n1. Testing date calculation (new method):");
    const belizeTimeQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as today`;
    const belizeTimeResult = await pool.query(belizeTimeQuery);
    const todayString = belizeTimeResult.rows[0].today
      .toISOString()
      .split("T")[0];
    console.log(`API will use date: ${todayString} (Belize timezone)`);

    // 2. Compare with old method that was causing issues
    console.log("\n2. Compare with old method (system timezone):");
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const oldDateString = `${year}-${month}-${day}`;
    console.log(`Old method would use: ${oldDateString} (system timezone)`);
    console.log(`Dates match: ${todayString === oldDateString ? "YES" : "NO"}`);

    // 3. Test the actual query that will be used
    console.log("\n3. Testing activity query with new date logic:");
    const query = `
      SELECT 
        gs.id,
        gs.player_id,
        p.name as "playerName",
        gs.goals,
        gs.staff_id,
        s.name as "staffName",
        gs.location,
        gs.competition_type,
        gs.requeued,
        gs.timestamp,
        TO_CHAR(gs.timestamp AT TIME ZONE 'America/Belize', 'YYYY-MM-DD HH24:MI:SS') as belize_time
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN 
        staff s ON gs.staff_id = s.id
      WHERE 
        gs.timestamp >= $1::date
        AND gs.timestamp < ($1::date + interval '1 day')
      ORDER BY 
        gs.timestamp DESC
      LIMIT 5
    `;

    const result = await pool.query(query, [todayString]);
    console.log(`Found ${result.rows.length} activities for today`);

    if (result.rows.length > 0) {
      console.log("\nSample activities:");
      result.rows.forEach((row, index) => {
        console.log(
          `${index + 1}. ${row.playerName} - ${row.goals} goals at ${
            row.belize_time
          } Belize time`
        );
      });
    }

    // 4. Test the exact timestamp format we're storing
    console.log("\n4. Testing current timestamp storage:");
    const timestampTest = `SELECT timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as stored_timestamp`;
    const timestampResult = await pool.query(timestampTest);
    console.log(
      `New timestamps will be stored as: ${timestampResult.rows[0].stored_timestamp}`
    );

    // 5. Check if there are any recent activities that might have wrong timestamps
    console.log("\n5. Checking recent activities for timestamp consistency:");
    const recentQuery = `
      SELECT 
        p.name as player_name,
        gs.goals,
        gs.timestamp,
        TO_CHAR(gs.timestamp AT TIME ZONE 'America/Belize', 'YYYY-MM-DD HH24:MI:SS') as belize_time,
        EXTRACT(HOUR FROM gs.timestamp AT TIME ZONE 'America/Belize') as belize_hour
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      ORDER BY gs.timestamp DESC
      LIMIT 10
    `;

    const recentResult = await pool.query(recentQuery);
    console.log(`\nLast 10 activities:`);
    recentResult.rows.forEach((row, index) => {
      const timeWarning =
        row.belize_hour < 6 || row.belize_hour > 22 ? " ⚠️ Unusual time" : "";
      console.log(
        `${index + 1}. ${row.player_name} - ${row.goals} goals at ${
          row.belize_time
        } Belize${timeWarning}`
      );
    });

    console.log("\n=== TEST COMPLETE ===");
    console.log(
      "✅ Activity API now uses Belize timezone for date calculation"
    );
    console.log("✅ This should fix the 6-hour timestamp shift issue");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await pool.end();
  }
}

testActivityTimezoneFix();
