const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function debugTimezone() {
  const client = await pool.connect();

  try {
    console.log("=== TIMEZONE DEBUGGING ===\n");

    // Check database timezone settings
    const tzQuery = `
            SELECT 
                name, setting, unit, short_desc
            FROM pg_settings 
            WHERE name IN ('timezone', 'log_timezone')
        `;
    const tzResult = await client.query(tzQuery);
    console.log("Database timezone settings:");
    tzResult.rows.forEach((row) => {
      console.log(`- ${row.name}: ${row.setting} (${row.short_desc})`);
    });

    console.log("\n=== TIME COMPARISONS ===");
    const timeCompareQuery = `
            SELECT 
                NOW() as utc_now,
                NOW() AT TIME ZONE 'America/Belize' as belize_local,
                timezone('America/Belize', NOW()) as belize_via_timezone_func,
                (NOW() - INTERVAL '6 hours') as utc_minus_6h,
                NOW()::date as utc_date,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date,
                (NOW() - INTERVAL '6 hours')::date as utc_minus_6h_date
        `;

    const timeResult = await client.query(timeCompareQuery);
    const times = timeResult.rows[0];

    console.log("NOW():", times.utc_now);
    console.log("NOW() AT TIME ZONE 'America/Belize':", times.belize_local);
    console.log(
      "timezone('America/Belize', NOW()):",
      times.belize_via_timezone_func
    );
    console.log("NOW() - INTERVAL '6 hours':", times.utc_minus_6h);
    console.log("UTC Date:", times.utc_date);
    console.log("Belize Date (AT TIME ZONE):", times.belize_date);
    console.log("UTC-6h Date:", times.utc_minus_6h_date);

    console.log("\n=== FILTERING TEST ===");

    // The issue might be that we need to use the local time for creation
    // but convert it properly for storage. Let's test different approaches:

    const belizeDate = times.belize_date.toISOString().split("T")[0];
    console.log("Filter date (Belize):", belizeDate);

    // Test what timezone('UTC', date) does
    const utcConversionTest = `
            SELECT 
                '${belizeDate}'::date as input_date,
                timezone('UTC', '${belizeDate}'::date::timestamp) as utc_start,
                timezone('UTC', '${belizeDate}'::date::timestamp + interval '1 day') as utc_end
        `;

    const utcResult = await client.query(utcConversionTest);
    console.log("UTC conversion for filtering:");
    console.log("- Start:", utcResult.rows[0].utc_start);
    console.log("- End:", utcResult.rows[0].utc_end);

    console.log("\n=== TRANSACTION CREATION TEST ===");

    // Test different ways to create a transaction timestamp that will work with our filter
    const creationTest = `
            SELECT 
                NOW() AT TIME ZONE 'America/Belize' as method1,
                timezone('America/Belize', NOW()) as method2,
                NOW() - INTERVAL '6 hours' as method3,
                (timezone('America/Belize', '${belizeDate} 12:00:00'::timestamp)) as method4_noon,
                (timezone('UTC', '${belizeDate} 12:00:00'::timestamp)) as method5_noon_utc
        `;

    const createResult = await client.query(creationTest);
    console.log("Creation timestamp options:");
    Object.entries(createResult.rows[0]).forEach(([method, timestamp]) => {
      console.log(`- ${method}: ${timestamp}`);
    });

    // The correct approach might be to use timezone('UTC', belize_local_time)
    console.log("\n=== CORRECT APPROACH TEST ===");
    const correctTest = `
            SELECT 
                timezone('UTC', ('${belizeDate} ' || EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Belize') || ':' || 
                                 EXTRACT(MINUTE FROM NOW() AT TIME ZONE 'America/Belize') || ':' || 
                                 EXTRACT(SECOND FROM NOW() AT TIME ZONE 'America/Belize'))::timestamp) as correct_utc_from_belize
        `;

    const correctResult = await client.query(correctTest);
    console.log(
      "Correct UTC from current Belize time:",
      correctResult.rows[0].correct_utc_from_belize
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

debugTimezone();
