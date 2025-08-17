const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function debugSalesTracking() {
  const client = await pool.connect();

  try {
    console.log("🔍 DEBUGGING SALES TRACKING ISSUE\n");

    // Check current Belize date
    const dateQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as today`;
    const dateResult = await client.query(dateQuery);
    const today = dateResult.rows[0].today;
    console.log("📅 Current Belize date:", today.toISOString().split("T")[0]);

    // Test the exact query from the sales tracking API
    console.log("\n🔄 Testing sales tracking query (same as API uses)...");
    const salesQuery = `
            SELECT 
                s.id as staff_id,
                COALESCE(s.name, s.username) as staff_name,
                s.role,
                -- Today's data (using Belize timezone)
                COUNT(DISTINCT CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN t.player_id END) as customers_today,
                COALESCE(SUM(CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today
            FROM staff s
            LEFT JOIN transactions t ON s.id = t.staff_id
            WHERE s.role IN ('staff', 'admin', 'sales')
            GROUP BY s.id, s.name, s.username, s.role
            ORDER BY revenue_today DESC, staff_name ASC
        `;

    const salesResult = await client.query(salesQuery, [today]);

    console.log("📊 Sales tracking results:");
    salesResult.rows.forEach((row) => {
      if (row.revenue_today > 0) {
        console.log(
          `   - ${row.staff_name} (${row.role}): ${row.customers_today} customers, $${row.revenue_today} revenue today`
        );
      }
    });

    // Now test what the today's transactions query shows (this one is working)
    console.log("\n✅ Testing working today's transactions query...");
    const workingQuery = `
            SELECT t.id, t.player_id, t.kicks, t.amount, t.created_at,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                   p.name as player_name, s.name as staff_name
            FROM transactions t 
            LEFT JOIN players p ON t.player_id = p.id
            LEFT JOIN staff s ON t.staff_id = s.id
            WHERE t.created_at >= timezone('UTC', $1::date::timestamp)
              AND t.created_at < timezone('UTC', ($1::date + interval '1 day')::timestamp)
              AND t.amount > 0
            ORDER BY t.created_at DESC
            LIMIT 10
        `;

    const workingResult = await client.query(workingQuery, [today]);

    console.log("📋 Today's transactions (this query works):");
    workingResult.rows.forEach((row) => {
      console.log(
        `   - ID ${row.id}: ${row.player_name} → ${row.staff_name}, $${row.amount}, ${row.kicks} kicks`
      );
      console.log(
        `     Belize time: ${row.belize_time}, Date: ${
          row.belize_date.toISOString().split("T")[0]
        }`
      );
    });

    // Check if there's a timing/caching issue
    console.log("\n🕒 Checking latest transactions (raw)...");
    const latestQuery = `
            SELECT t.id, t.created_at, t.amount, t.kicks,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                   p.name as player_name, s.name as staff_name
            FROM transactions t 
            LEFT JOIN players p ON t.player_id = p.id
            LEFT JOIN staff s ON t.staff_id = s.id
            WHERE t.amount > 0
            ORDER BY t.id DESC
            LIMIT 5
        `;

    const latestResult = await client.query(latestQuery);
    console.log("Latest transactions (by ID):");
    latestResult.rows.forEach((row) => {
      const isToday =
        row.belize_date.toISOString().split("T")[0] ===
        today.toISOString().split("T")[0];
      console.log(
        `   - ID ${row.id}: $${row.amount} by ${row.staff_name}, ${
          isToday ? "✅ TODAY" : "❌ NOT TODAY"
        }`
      );
      console.log(
        `     Belize date: ${
          row.belize_date.toISOString().split("T")[0]
        }, Created: ${row.belize_time}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

debugSalesTracking();
