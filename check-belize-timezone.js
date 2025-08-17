const { pool } = require("./dist/config/db");

async function checkBelizeTimezone() {
  try {
    console.log("=== CHECKING BELIZE TIMEZONE ===");

    const timezoneQuery = `
      SELECT 
        NOW() as utc_now,
        NOW() AT TIME ZONE 'America/Chicago' as chicago_time,
        NOW() AT TIME ZONE 'America/Belize' as belize_time,
        timezone('America/Chicago', NOW()) as chicago_tz_func,
        timezone('America/Belize', NOW()) as belize_tz_func,
        (NOW() AT TIME ZONE 'America/Chicago')::date as chicago_date,
        (NOW() AT TIME ZONE 'America/Belize')::date as belize_date
    `;

    const result = await pool.query(timezoneQuery);
    const data = result.rows[0];

    console.log("Timezone comparison:");
    console.log(`  UTC Now: ${data.utc_now}`);
    console.log(`  Chicago Time: ${data.chicago_time}`);
    console.log(`  Belize Time: ${data.belize_time}`);
    console.log(`  Chicago Date: ${data.chicago_date}`);
    console.log(`  Belize Date: ${data.belize_date}`);

    // Check if they're the same or different
    const sameTime = data.chicago_time.getTime() === data.belize_time.getTime();
    const sameDate =
      data.chicago_date.toISOString().split("T")[0] ===
      data.belize_date.toISOString().split("T")[0];

    console.log(`\nComparison:`);
    console.log(`  Same time: ${sameTime ? "YES" : "NO"}`);
    console.log(`  Same date: ${sameDate ? "YES" : "NO"}`);

    if (!sameTime) {
      const diffMs = Math.abs(
        data.chicago_time.getTime() - data.belize_time.getTime()
      );
      const diffHours = diffMs / (1000 * 60 * 60);
      console.log(`  Time difference: ${diffHours} hours`);
    }

    // Test with the current transaction issue
    console.log("\n=== TESTING WITH RECENT TRANSACTION ===");
    const transactionQuery = `
      SELECT 
        t.id,
        t.created_at as utc_time,
        t.created_at AT TIME ZONE 'America/Chicago' as chicago_time,
        t.created_at AT TIME ZONE 'America/Belize' as belize_time,
        (t.created_at AT TIME ZONE 'America/Chicago')::date as chicago_date,
        (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date
      FROM transactions t
      WHERE t.id = 2930
    `;

    const transResult = await pool.query(transactionQuery);
    if (transResult.rows.length > 0) {
      const trans = transResult.rows[0];
      console.log(`Transaction 2930 analysis:`);
      console.log(`  UTC: ${trans.utc_time}`);
      console.log(
        `  Chicago: ${trans.chicago_time} (Date: ${
          trans.chicago_date.toISOString().split("T")[0]
        })`
      );
      console.log(
        `  Belize: ${trans.belize_time} (Date: ${
          trans.belize_date.toISOString().split("T")[0]
        })`
      );

      // Check which timezone gives the correct "today" date
      const belizeToday = data.belize_date.toISOString().split("T")[0];
      const chicagoToday = data.chicago_date.toISOString().split("T")[0];
      const transactionBelizeDate = trans.belize_date
        .toISOString()
        .split("T")[0];
      const transactionChicagoDate = trans.chicago_date
        .toISOString()
        .split("T")[0];

      console.log(`\nDate matching:`);
      console.log(`  Belize Today: ${belizeToday}`);
      console.log(`  Chicago Today: ${chicagoToday}`);
      console.log(
        `  Transaction matches Belize today: ${
          transactionBelizeDate === belizeToday ? "YES" : "NO"
        }`
      );
      console.log(
        `  Transaction matches Chicago today: ${
          transactionChicagoDate === chicagoToday ? "YES" : "NO"
        }`
      );
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkBelizeTimezone();
