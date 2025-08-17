const { pool } = require("./dist/config/db");

async function debugTimezoneOffset() {
  try {
    console.log("=== DEBUGGING TIMEZONE OFFSET ===");

    const query = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Belize' as belize_now,
        timezone('America/Belize', NOW()) as belize_timezone_func,
        NOW() - INTERVAL '6 hours' as utc_minus_6,
        NOW() - INTERVAL '5 hours' as utc_minus_5
    `;

    const result = await pool.query(query);
    const data = result.rows[0];

    console.log("Timezone analysis:");
    console.log(`  UTC Now: ${data.utc_now}`);
    console.log(`  Belize (AT TIME ZONE): ${data.belize_now}`);
    console.log(`  Belize (timezone func): ${data.belize_timezone_func}`);
    console.log(`  UTC - 6 hours: ${data.utc_minus_6}`);
    console.log(`  UTC - 5 hours: ${data.utc_minus_5}`);

    // Test which one matches Belize time
    const belizeMatches6 =
      data.belize_now.getTime() === data.utc_minus_6.getTime();
    const belizeMatches5 =
      data.belize_now.getTime() === data.utc_minus_5.getTime();

    console.log(`\nComparison:`);
    console.log(
      `  Belize time matches UTC-6: ${belizeMatches6 ? "YES" : "NO"}`
    );
    console.log(
      `  Belize time matches UTC-5: ${belizeMatches5 ? "YES" : "NO"}`
    );

    // Test transaction creation with different approaches
    console.log("\n=== TESTING TRANSACTION CREATION APPROACHES ===");

    const testQueries = [
      "SELECT NOW() as timestamp, 'NOW()' as method",
      "SELECT (NOW() AT TIME ZONE 'America/Belize') as timestamp, 'NOW() AT TIME ZONE Belize' as method",
      "SELECT timezone('America/Belize', NOW()) as timestamp, 'timezone(Belize, NOW())' as method",
      "SELECT (NOW() - INTERVAL '6 hours') as timestamp, 'NOW() - 6 hours' as method",
    ];

    for (const testQuery of testQueries) {
      const testResult = await pool.query(testQuery);
      const test = testResult.rows[0];
      const date = test.timestamp.toISOString().split("T")[0];
      console.log(`  ${test.method}: ${test.timestamp} (Date: ${date})`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

debugTimezoneOffset();
