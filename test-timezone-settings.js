// Check PostgreSQL timezone settings
const { pool } = require("./dist/config/db.js");

async function checkTimezoneSettings() {
  try {
    console.log("=== CHECKING POSTGRESQL TIMEZONE SETTINGS ===");

    // 1. Check server timezone
    const timezoneQuery = `SHOW timezone`;
    const timezoneResult = await pool.query(timezoneQuery);
    console.log("PostgreSQL server timezone:", timezoneResult.rows[0].timezone);

    // 2. Check what happens with explicit UTC storage
    console.log("\n=== TESTING EXPLICIT UTC STORAGE ===");

    // Test current approach
    const currentApproachQuery = `
      SELECT 
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') as current_approach,
        NOW() AT TIME ZONE 'America/Belize' as belize_time,
        NOW() as server_time
    `;

    const currentResult = await pool.query(currentApproachQuery);
    console.log("Current approach result:", currentResult.rows[0]);

    // 3. Test alternative approach - proper UTC storage
    console.log("\n=== TESTING PROPER UTC STORAGE ===");

    const properApproachQuery = `
      SELECT 
        (NOW() AT TIME ZONE 'America/Belize') AT TIME ZONE 'UTC' as proper_utc,
        NOW() AT TIME ZONE 'America/Belize' as belize_local,
        NOW() as server_utc
    `;

    const properResult = await pool.query(properApproachQuery);
    console.log("Proper approach result:", properResult.rows[0]);

    // 4. Compare how they display back in Belize time
    console.log("\n=== TESTING DISPLAY CONVERSION ===");

    const displayQuery = `
      SELECT 
        timezone('UTC', NOW() AT TIME ZONE 'America/Belize') AT TIME ZONE 'America/Belize' as current_display,
        ((NOW() AT TIME ZONE 'America/Belize') AT TIME ZONE 'UTC') AT TIME ZONE 'America/Belize' as proper_display,
        NOW() AT TIME ZONE 'America/Belize' as original_belize
    `;

    const displayResult = await pool.query(displayQuery);
    console.log("Display comparison:", displayResult.rows[0]);

    // 5. Test what happens with a manual timestamp
    console.log("\n=== TESTING MANUAL TIMESTAMP ===");

    // Simulate what should happen at 6:58 PM Belize time
    const manualQuery = `
      SELECT 
        '2025-08-15 18:58:00'::timestamp as input_time,
        ('2025-08-15 18:58:00'::timestamp AT TIME ZONE 'America/Belize') as interpreted_as_belize,
        ('2025-08-15 18:58:00'::timestamp AT TIME ZONE 'America/Belize') AT TIME ZONE 'UTC' as converted_to_utc,
        timezone('UTC', '2025-08-15 18:58:00'::timestamp AT TIME ZONE 'America/Belize') as current_method
    `;

    const manualResult = await pool.query(manualQuery);
    console.log("Manual timestamp test:", manualResult.rows[0]);

    console.log("\n=== DIAGNOSIS COMPLETE ===");
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await pool.end();
  }
}

checkTimezoneSettings();
