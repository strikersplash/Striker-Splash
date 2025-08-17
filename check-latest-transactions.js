const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function checkLatestTransactions() {
  try {
    console.log(
      "🔍 Checking the absolute latest transactions from the live server...\n"
    );

    // Get current Belize date
    const dateQuery = `SELECT (NOW() AT TIME ZONE 'America/Belize')::date as today`;
    const dateResult = await pool.query(dateQuery);
    const today = dateResult.rows[0].today.toISOString().split("T")[0];

    console.log("📅 Today (Belize):", today);

    // Get the very latest transactions (by ID)
    const latestQuery = `
            SELECT t.id, t.created_at, t.amount, t.kicks, t.staff_id,
                   t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                   (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                   p.name as player_name, s.name as staff_name
            FROM transactions t 
            LEFT JOIN players p ON t.player_id = p.id
            LEFT JOIN staff s ON t.staff_id = s.id
            ORDER BY t.id DESC
            LIMIT 10
        `;

    const result = await pool.query(latestQuery);

    console.log("📊 Latest 10 transactions (by ID):");
    result.rows.forEach((row, index) => {
      const isToday = row.belize_date.toISOString().split("T")[0] === today;
      console.log(
        `${index + 1}. ID ${row.id}: $${row.amount}, ${row.kicks} kicks by ${
          row.staff_name || "Unknown"
        } (Staff ID: ${row.staff_id})`
      );
      console.log(
        `   Player: ${row.player_name}, ${
          isToday ? "✅ TODAY" : "❌ NOT TODAY"
        }`
      );
      console.log(
        `   Created: ${row.belize_time} (Belize date: ${
          row.belize_date.toISOString().split("T")[0]
        })`
      );
      console.log("");
    });

    // Now test the sales tracking query specifically for today
    console.log("🎯 Testing sales tracking query for today only...");
    const salesQuery = `
            SELECT 
                s.id as staff_id,
                COALESCE(s.name, s.username) as staff_name,
                s.role,
                COUNT(DISTINCT CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN t.player_id END) as customers_today,
                COALESCE(SUM(CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today,
                -- Show transaction IDs for debugging
                STRING_AGG(
                    CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 
                    THEN t.id::text END, ',' 
                    ORDER BY t.id DESC
                ) as transaction_ids_today
            FROM staff s
            LEFT JOIN transactions t ON s.id = t.staff_id
            WHERE s.role IN ('staff', 'admin', 'sales')
            GROUP BY s.id, s.name, s.username, s.role
            HAVING COUNT(CASE WHEN (t.created_at AT TIME ZONE 'America/Belize')::date = $1::date AND t.amount > 0 THEN 1 END) > 0
            ORDER BY revenue_today DESC
        `;

    const salesResult = await pool.query(salesQuery, [today]);

    console.log("Sales tracking results for staff with sales today:");
    salesResult.rows.forEach((row) => {
      console.log(
        `   - ${row.staff_name} (ID: ${row.staff_id}, ${row.role}): ${row.customers_today} customers, $${row.revenue_today}`
      );
      console.log(
        `     Transaction IDs: ${row.transaction_ids_today || "none"}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

checkLatestTransactions();
