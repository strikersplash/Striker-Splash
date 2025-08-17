const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function testFinalFix() {
  const client = await pool.connect();

  try {
    console.log("🎯 TESTING THE FINAL TIMEZONE FIX\n");

    // Get test player
    const playerResult = await client.query(
      "SELECT id, name FROM players LIMIT 1"
    );
    const testPlayer = playerResult.rows[0];
    console.log(
      "👤 Using test player:",
      testPlayer.name,
      `(ID: ${testPlayer.id})`
    );

    // Count transactions before
    const beforeCountQuery = `
            SELECT 
                (SELECT COUNT(*) FROM transactions WHERE (created_at AT TIME ZONE 'America/Belize')::date = (NOW() AT TIME ZONE 'America/Belize')::date) as sales_tracking_count,
                (SELECT COUNT(*) FROM transactions WHERE created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date) AND created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')) as todays_transactions_count
        `;
    const beforeResult = await client.query(beforeCountQuery);
    const before = beforeResult.rows[0];

    console.log("📊 Transaction counts before test:");
    console.log(`   Sales tracking query: ${before.sales_tracking_count}`);
    console.log(
      `   Today's transactions query: ${before.todays_transactions_count}`
    );

    // Create test transaction using our new correct method
    console.log("\n💰 Creating test transaction with corrected timestamp...");
    const insertResult = await client.query(
      `
            INSERT INTO transactions (player_id, kicks, amount, created_at, team_play, staff_id) 
            VALUES ($1, $2, $3, timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date::timestamp + interval '12 hours'), false, 1)
            RETURNING id, created_at, (created_at AT TIME ZONE 'America/Belize') as belize_time,
                     (created_at AT TIME ZONE 'America/Belize')::date as belize_date
        `,
      [testPlayer.id, 7, 7]
    );

    const newTransaction = insertResult.rows[0];
    console.log("✅ Test transaction created:");
    console.log(`   ID: ${newTransaction.id}`);
    console.log(`   UTC timestamp: ${newTransaction.created_at}`);
    console.log(`   Belize time: ${newTransaction.belize_time}`);
    console.log(
      `   Belize date: ${
        newTransaction.belize_date.toISOString().split("T")[0]
      }`
    );

    // Count transactions after
    const afterResult = await client.query(beforeCountQuery);
    const after = afterResult.rows[0];

    console.log("\n📊 Transaction counts after test:");
    console.log(
      `   Sales tracking query: ${after.sales_tracking_count} (${
        after.sales_tracking_count > before.sales_tracking_count
          ? "✅ +1"
          : "❌ same"
      })`
    );
    console.log(
      `   Today's transactions query: ${after.todays_transactions_count} (${
        after.todays_transactions_count > before.todays_transactions_count
          ? "✅ +1"
          : "❌ same"
      })`
    );

    // Test both query methods directly
    console.log("\n🔍 Testing both query methods on the new transaction:");

    // Method 1: Sales tracking approach
    const salesTrackingTest = await client.query(
      `
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE id = $1 AND (created_at AT TIME ZONE 'America/Belize')::date = (NOW() AT TIME ZONE 'America/Belize')::date
        `,
      [newTransaction.id]
    );

    // Method 2: Today's transactions approach
    const todaysTransactionsTest = await client.query(
      `
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE id = $1 
              AND created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date)
              AND created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
        `,
      [newTransaction.id]
    );

    console.log(
      `   Sales tracking finds it: ${
        salesTrackingTest.rows[0].count > 0 ? "✅ YES" : "❌ NO"
      }`
    );
    console.log(
      `   Today's transactions finds it: ${
        todaysTransactionsTest.rows[0].count > 0 ? "✅ YES" : "❌ NO"
      }`
    );

    // Success check
    const bothWork =
      salesTrackingTest.rows[0].count > 0 &&
      todaysTransactionsTest.rows[0].count > 0;

    if (bothWork) {
      console.log(
        "\n🎉 SUCCESS! Both query methods now find the new transaction!"
      );
      console.log("✅ Sales tracking page will now update in real-time");
      console.log(
        "✅ Today's transactions table will show new sales immediately"
      );
      console.log(
        "✅ All admin dashboards will reflect current Belize date sales"
      );
    } else {
      console.log("\n❌ Issue persists - need further debugging");
    }

    // Cleanup
    await client.query("DELETE FROM transactions WHERE id = $1", [
      newTransaction.id,
    ]);
    console.log("\n🧹 Test transaction cleaned up");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

testFinalFix();
