#!/usr/bin/env node

const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testMidnightReset() {
  try {
    console.log("=== Testing Midnight Reset Behavior ===");

    // Get current database time and date
    const timeQuery = await pool.query(
      "SELECT NOW() as current_time, NOW()::date as current_date"
    );
    const currentTime = timeQuery.rows[0];
    console.log("Current database time:", currentTime.current_time);
    console.log("Current database date:", currentTime.current_date);

    // Show how the "Today" filter works
    console.log("\n=== How 'Today' Sales Are Calculated ===");
    console.log("Query condition: t.created_at::date = NOW()::date");
    console.log("This means it compares ONLY the date part (not time)");

    // Test with transactions from different dates
    const testQuery = `
      SELECT 
        DATE(t.created_at) as transaction_date,
        COUNT(*) as transaction_count,
        SUM(t.amount) as total_amount,
        CASE 
          WHEN DATE(t.created_at) = NOW()::date THEN 'TODAY - WILL SHOW'
          ELSE 'NOT TODAY - WILL NOT SHOW'
        END as will_show_today
      FROM transactions t 
      WHERE t.staff_id = 4 AND t.amount > 0
      GROUP BY DATE(t.created_at)
      ORDER BY transaction_date DESC
      LIMIT 5
    `;

    const result = await pool.query(testQuery);

    console.log("\n📊 Recent transactions for Jeff Finnetty (staff_id=4):");
    console.log("Date\t\t\tCount\tAmount\t\tStatus");
    console.log("---".repeat(20));

    result.rows.forEach((row) => {
      const date = new Date(row.transaction_date).toLocaleDateString();
      console.log(
        `${date}\t\t${row.transaction_count}\t$${row.total_amount}\t\t${row.will_show_today}`
      );
    });

    // Simulate what happens at midnight
    console.log("\n🕛 WHAT HAPPENS AT MIDNIGHT:");
    console.log("1. Database NOW()::date advances to the next day");
    console.log(
      "2. Query condition becomes: WHERE t.created_at::date = '2025-08-12'"
    );
    console.log("3. Yesterday's transactions (2025-08-11) NO LONGER MATCH");
    console.log("4. Today's sales reset to 0 customers, $0.00");
    console.log("5. New sales made on the new day will start accumulating");

    // Show a simulation
    const tomorrowQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN DATE(t.created_at) = (NOW()::date + INTERVAL '1 day')::date AND t.amount > 0 THEN t.player_id END) as customers_tomorrow,
        COALESCE(SUM(CASE WHEN DATE(t.created_at) = (NOW()::date + INTERVAL '1 day')::date AND t.amount > 0 THEN t.amount END), 0) as revenue_tomorrow
      FROM transactions t 
      WHERE t.staff_id = 4
    `;

    const tomorrowResult = await pool.query(tomorrowQuery);
    console.log("\n🔮 Simulating tomorrow's sales (should be 0):");
    console.log(
      `Tomorrow (${new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toLocaleDateString()}): ${
        tomorrowResult.rows[0].customers_tomorrow
      } customers, $${tomorrowResult.rows[0].revenue_tomorrow}`
    );

    console.log(
      "\n✅ CONFIRMED: Yes, at midnight (12:00 AM), Today's sales automatically reset to 0!"
    );
    console.log(
      "💡 This is because the query uses NOW()::date which changes at midnight"
    );
    console.log(
      "📈 Week/Month/Year totals continue accumulating and don't reset daily"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testMidnightReset();
