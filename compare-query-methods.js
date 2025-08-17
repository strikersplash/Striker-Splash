const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function compareQueryMethods() {
  try {
    console.log("🔍 COMPARING QUERY METHODS\n");

    // Get current Belize date
    const dateQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as today`;
    const dateResult = await pool.query(dateQuery);
    const today = dateResult.rows[0].today;
    const todayStr = today.toISOString().split("T")[0];

    console.log("📅 Today (Belize):", todayStr);

    // Method 1: Working "today's transactions" approach
    console.log('\n✅ Method 1: Working "today\'s transactions" query');
    const method1Query = `
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
            FROM transactions t
            WHERE t.created_at >= timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date)
              AND t.created_at < timezone('UTC', (NOW() AT TIME ZONE 'America/Belize')::date + interval '1 day')
              AND t.amount > 0
        `;

    const method1Result = await pool.query(method1Query);
    console.log(
      `   Found: ${method1Result.rows[0].count} transactions, $${method1Result.rows[0].total_amount} total`
    );

    // Method 2: Sales tracking approach (not working)
    console.log("\n❌ Method 2: Sales tracking query");
    const method2Query = `
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
            FROM transactions t
            WHERE (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date
              AND t.amount > 0
        `;

    const method2Result = await pool.query(method2Query, [today]);
    console.log(
      `   Found: ${method2Result.rows[0].count} transactions, $${method2Result.rows[0].total_amount} total`
    );

    // Method 3: Sales tracking with string date
    console.log("\n🔧 Method 3: Sales tracking with string date");
    const method3Query = `
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
            FROM transactions t
            WHERE (t.created_at AT TIME ZONE 'America/Belize')::date = $1
              AND t.amount > 0
        `;

    const method3Result = await pool.query(method3Query, [todayStr]);
    console.log(
      `   Found: ${method3Result.rows[0].count} transactions, $${method3Result.rows[0].total_amount} total`
    );

    // Show actual timestamps for debugging
    console.log("\n🕐 Recent transaction timestamps:");
    const timestampQuery = `
            SELECT id, created_at, 
                   created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                   amount
            FROM transactions
            WHERE amount > 0
            ORDER BY id DESC
            LIMIT 5
        `;

    const timestampResult = await pool.query(timestampQuery);
    timestampResult.rows.forEach((row) => {
      const isToday = row.belize_date.toISOString().split("T")[0] === todayStr;
      console.log(
        `   ID ${row.id}: ${row.belize_time} → ${
          row.belize_date.toISOString().split("T")[0]
        } (${isToday ? "TODAY" : "NOT TODAY"}), $${row.amount}`
      );
    });

    // Test the timezone conversion ranges
    console.log("\n🌍 Timezone conversion ranges:");
    const rangeQuery = `
            SELECT 
                timezone('UTC', $1::date::timestamp) as utc_start,
                timezone('UTC', ($1::date + interval '1 day')::timestamp) as utc_end,
                $1::date as input_date
        `;

    const rangeResult = await pool.query(rangeQuery, [today]);
    console.log(`   Input: ${rangeResult.rows[0].input_date}`);
    console.log(
      `   UTC range: ${rangeResult.rows[0].utc_start} to ${rangeResult.rows[0].utc_end}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

compareQueryMethods();
