const { pool } = require("./dist/config/db");

async function debugTimezone() {
  try {
    console.log("=== DEBUGGING POSTGRESQL TIMEZONE BEHAVIOR ===");

    const debugQuery = `
      SELECT 
        NOW() as server_now_utc,
        NOW() AT TIME ZONE 'America/Chicago' as central_time,
        timezone('America/Chicago', NOW()) as timezone_func_central,
        (NOW() AT TIME ZONE 'America/Chicago')::date as central_date,
        NOW()::date as utc_date,
        
        -- Test what happens when we create timestamps different ways
        NOW() as method1_utc,
        timezone('UTC', NOW() AT TIME ZONE 'America/Chicago') as method2_store_central_as_utc,
        NOW() - INTERVAL '6 hours' as method3_subtract_offset
    `;

    const result = await pool.query(debugQuery);
    const data = result.rows[0];

    console.log("Time analysis:");
    Object.keys(data).forEach((key) => {
      console.log(`  ${key}: ${data[key]}`);
    });

    // Test what the filtering should find for today's Central Time range
    console.log("\n=== TESTING FILTERING LOGIC ===");

    const filterTestQuery = `
      SELECT 
        -- Method 1: Current approach (filter by Central Time date)
        COUNT(*) FILTER (
          WHERE t.created_at AT TIME ZONE 'America/Chicago' >= (NOW() AT TIME ZONE 'America/Chicago')::date
            AND t.created_at AT TIME ZONE 'America/Chicago' < (NOW() AT TIME ZONE 'America/Chicago')::date + INTERVAL '1 day'
        ) as method1_count,
        
        -- Method 2: Convert Central Time range to UTC and filter UTC timestamps
        COUNT(*) FILTER (
          WHERE t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date)
            AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + INTERVAL '1 day')
        ) as method2_count,
        
        -- Show range boundaries
        timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date) as utc_start_of_central_today,
        timezone('UTC', (NOW() AT TIME ZONE 'America/Chicago')::date + INTERVAL '1 day') as utc_end_of_central_today
      FROM transactions t
      WHERE t.staff_id = 4
        AND t.created_at >= NOW() - INTERVAL '2 days'
    `;

    const filterResult = await pool.query(filterTestQuery);
    const filterData = filterResult.rows[0];

    console.log("\nFiltering results:");
    console.log(
      `  Method 1 (current): ${filterData.method1_count} transactions`
    );
    console.log(
      `  Method 2 (convert range to UTC): ${filterData.method2_count} transactions`
    );
    console.log(`  UTC range start: ${filterData.utc_start_of_central_today}`);
    console.log(`  UTC range end: ${filterData.utc_end_of_central_today}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

debugTimezone();
