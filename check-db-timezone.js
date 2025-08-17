const { pool } = require("./dist/config/db");

async function checkDatabaseTimezone() {
  try {
    console.log("=== CHECKING DATABASE TIMEZONE CONFIGURATION ===");

    const timezoneQuery = `
      SELECT 
        current_setting('timezone') as db_timezone,
        NOW() as db_now,
        NOW() AT TIME ZONE 'UTC' as db_utc,
        NOW() AT TIME ZONE 'America/Chicago' as db_central,
        extract(timezone_hour from now()) as tz_offset_hours,
        extract(timezone_minute from now()) as tz_offset_minutes
    `;

    const result = await pool.query(timezoneQuery);
    const data = result.rows[0];

    console.log("Database timezone info:");
    console.log(`  Database timezone setting: ${data.db_timezone}`);
    console.log(`  Database NOW(): ${data.db_now}`);
    console.log(`  Database NOW() AT TIME ZONE 'UTC': ${data.db_utc}`);
    console.log(
      `  Database NOW() AT TIME ZONE 'America/Chicago': ${data.db_central}`
    );
    console.log(`  Timezone offset hours: ${data.tz_offset_hours}`);
    console.log(`  Timezone offset minutes: ${data.tz_offset_minutes}`);

    // Check what Node.js thinks the time is
    console.log("\n=== NODE.JS TIME COMPARISON ===");
    const nodeNow = new Date();
    console.log(`  Node.js Date(): ${nodeNow}`);
    console.log(`  Node.js UTC: ${nodeNow.toISOString()}`);
    console.log(
      `  Node.js Central (estimated): ${new Date(
        nodeNow.getTime() - 6 * 60 * 60 * 1000
      )}`
    );

    // The issue might be that PostgreSQL is running in a different timezone
    // Let's see what happens if we force UTC
    console.log("\n=== TESTING FORCED UTC APPROACH ===");

    const forcedQuery = `
      SELECT 
        NOW() AT TIME ZONE 'UTC' as utc_now,
        (NOW() AT TIME ZONE 'UTC' - interval '6 hours') as central_equivalent,
        (NOW() AT TIME ZONE 'UTC' - interval '6 hours')::date as central_date
    `;

    const forcedResult = await pool.query(forcedQuery);
    const forced = forcedResult.rows[0];

    console.log("Forced UTC calculation:");
    console.log(`  UTC NOW: ${forced.utc_now}`);
    console.log(
      `  Central equivalent (UTC - 6h): ${forced.central_equivalent}`
    );
    console.log(`  Central date: ${forced.central_date}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

checkDatabaseTimezone();
