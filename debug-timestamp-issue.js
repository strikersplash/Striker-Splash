const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function debugTimestampIssue() {
  try {
    console.log("🐛 DEBUGGING TIMESTAMP ISSUE\n");

    // Check the actual transaction 2919
    const txQuery = `
            SELECT id, created_at,
                   created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (created_at AT TIME ZONE 'America/Belize')::date as belize_date
            FROM transactions 
            WHERE id = 2919
        `;

    const txResult = await pool.query(txQuery);
    if (txResult.rows.length > 0) {
      const tx = txResult.rows[0];
      console.log("📊 Transaction 2919 details:");
      console.log(`   UTC stored: ${tx.created_at}`);
      console.log(`   Belize time: ${tx.belize_time}`);
      console.log(`   Belize date: ${tx.belize_date}`);
    }

    // Test what our current creation method produces
    console.log("\n🔧 Testing current creation method:");
    const creationTest = `
            SELECT 
                NOW() as utc_now,
                NOW() - INTERVAL '6 hours' as our_method,
                NOW() AT TIME ZONE 'America/Belize' as belize_local,
                (NOW() AT TIME ZONE 'America/Belize')::date as belize_date
        `;

    const createResult = await pool.query(creationTest);
    const times = createResult.rows[0];
    console.log(`   UTC NOW(): ${times.utc_now}`);
    console.log(`   Our method (NOW() - 6h): ${times.our_method}`);
    console.log(`   Belize local: ${times.belize_local}`);
    console.log(`   Belize date: ${times.belize_date}`);

    // Test the filtering ranges
    console.log("\n🎯 Testing filtering ranges:");
    const today = times.belize_date;
    const rangeQuery = `
            SELECT 
                timezone('UTC', $1::date::timestamp) as filter_start,
                timezone('UTC', ($1::date + interval '1 day')::timestamp) as filter_end,
                $2 >= timezone('UTC', $1::date::timestamp) AND $2 < timezone('UTC', ($1::date + interval '1 day')::timestamp) as our_method_in_range,
                $3 >= timezone('UTC', $1::date::timestamp) AND $3 < timezone('UTC', ($1::date + interval '1 day')::timestamp) as tx_2919_in_range
        `;

    const rangeResult = await pool.query(rangeQuery, [
      today,
      times.our_method,
      txResult.rows[0].created_at,
    ]);
    const ranges = rangeResult.rows[0];

    console.log(
      `   Filter range: ${ranges.filter_start} to ${ranges.filter_end}`
    );
    console.log(
      `   Our method in range: ${
        ranges.our_method_in_range ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `   Transaction 2919 in range: ${
        ranges.tx_2919_in_range ? "✅ YES" : "❌ NO"
      }`
    );

    // The real solution: We need to create timestamps that will be in the Belize date range
    console.log(
      "\n💡 SOLUTION: Need to create timestamps in the correct UTC range"
    );
    console.log(
      "The issue is our transaction creation method needs to store UTC timestamps"
    );
    console.log("that when converted to Belize time fall on the correct date.");

    // Test the correct approach
    const correctTest = `
            SELECT 
                timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date::timestamp + interval '12 hours') as correct_method,
                timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date::timestamp + interval '12 hours') >= timezone('UTC', $1::date::timestamp) 
                AND timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date::timestamp + interval '12 hours') < timezone('UTC', ($1::date + interval '1 day')::timestamp) as correct_in_range
        `;

    const correctResult = await pool.query(correctTest, [today]);
    const correct = correctResult.rows[0];

    console.log("\n✅ CORRECT METHOD TEST:");
    console.log(`   Correct timestamp: ${correct.correct_method}`);
    console.log(
      `   Would be in range: ${correct.correct_in_range ? "✅ YES" : "❌ NO"}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

debugTimestampIssue();
