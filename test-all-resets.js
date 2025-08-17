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

async function testAllTimePeriodResets() {
  try {
    console.log("=== Testing All Time Period Reset Behaviors ===");

    // Get current database time and calculate all boundaries
    const boundariesQuery = `
      SELECT 
        NOW() as current_time,
        NOW()::date as current_date,
        EXTRACT(dow FROM NOW()) as current_day_of_week,
        
        -- Today boundaries
        NOW()::date as today_start,
        (NOW()::date + INTERVAL '1 day') as tomorrow_start,
        
        -- Week boundaries (Sunday = 0, Monday = 1, etc.)
        DATE_TRUNC('week', NOW())::date as this_week_start,
        (DATE_TRUNC('week', NOW()) + INTERVAL '1 week')::date as next_week_start,
        
        -- Month boundaries  
        DATE_TRUNC('month', NOW())::date as this_month_start,
        DATE_TRUNC('month', NOW() + INTERVAL '1 month')::date as next_month_start,
        
        -- Year boundaries
        DATE_TRUNC('year', NOW())::date as this_year_start,
        DATE_TRUNC('year', NOW() + INTERVAL '1 year')::date as next_year_start
    `;

    const boundaries = await pool.query(boundariesQuery);
    const b = boundaries.rows[0];

    console.log("📅 CURRENT TIME BOUNDARIES:");
    console.log(`Current Time: ${new Date(b.current_time).toLocaleString()}`);
    console.log(
      `Day of Week: ${b.current_day_of_week} (0=Sunday, 1=Monday, etc.)`
    );

    console.log("\n🕛 WHEN EACH COLUMN RESETS TO ZERO:");

    // TODAY RESET
    console.log(`\n1️⃣ TODAY Column:`);
    console.log(
      `   ✅ Resets at: ${new Date(b.tomorrow_start).toLocaleString()}`
    );
    console.log(
      `   ⏰ Query changes from: t.created_at::date = '${
        b.current_date.toISOString().split("T")[0]
      }'`
    );
    console.log(
      `   ⏰ Query changes to:   t.created_at::date = '${
        new Date(b.tomorrow_start).toISOString().split("T")[0]
      }'`
    );

    // WEEK RESET
    const daysUntilSunday = (7 - b.current_day_of_week) % 7;
    const nextSunday = new Date(b.next_week_start);
    console.log(`\n2️⃣ THIS WEEK Column:`);
    console.log(
      `   ✅ Resets at: ${nextSunday.toLocaleString()} (Next Sunday at midnight)`
    );
    console.log(
      `   📆 Days until reset: ${
        daysUntilSunday === 0 ? 7 : daysUntilSunday
      } days`
    );
    console.log(
      `   ⏰ Query changes from: t.created_at::date >= '${
        b.this_week_start.toISOString().split("T")[0]
      }'`
    );
    console.log(
      `   ⏰ Query changes to:   t.created_at::date >= '${
        b.next_week_start.toISOString().split("T")[0]
      }'`
    );

    // MONTH RESET
    const nextMonth = new Date(b.next_month_start);
    const daysUntilMonthEnd = Math.ceil(
      (nextMonth - new Date(b.current_time)) / (24 * 60 * 60 * 1000)
    );
    console.log(`\n3️⃣ THIS MONTH Column:`);
    console.log(
      `   ✅ Resets at: ${nextMonth.toLocaleString()} (1st of next month at midnight)`
    );
    console.log(`   📆 Days until reset: ${daysUntilMonthEnd} days`);
    console.log(
      `   ⏰ Query changes from: t.created_at::date >= '${
        b.this_month_start.toISOString().split("T")[0]
      }'`
    );
    console.log(
      `   ⏰ Query changes to:   t.created_at::date >= '${
        b.next_month_start.toISOString().split("T")[0]
      }'`
    );

    // YEAR RESET
    const nextYear = new Date(b.next_year_start);
    const daysUntilYearEnd = Math.ceil(
      (nextYear - new Date(b.current_time)) / (24 * 60 * 60 * 1000)
    );
    console.log(`\n4️⃣ YEAR Column:`);
    console.log(
      `   ✅ Resets at: ${nextYear.toLocaleString()} (January 1st at midnight)`
    );
    console.log(`   📆 Days until reset: ${daysUntilYearEnd} days`);
    console.log(
      `   ⏰ Query changes from: EXTRACT(year FROM t.created_at) = ${new Date(
        b.current_time
      ).getFullYear()}`
    );
    console.log(
      `   ⏰ Query changes to:   EXTRACT(year FROM t.created_at) = ${
        new Date(b.current_time).getFullYear() + 1
      }`
    );

    console.log("\n🔄 RESET SUMMARY:");
    console.log("• TODAY: Resets every day at midnight (24 hours)");
    console.log("• THIS WEEK: Resets every Sunday at midnight (7 days)");
    console.log(
      "• THIS MONTH: Resets on 1st of each month at midnight (~30 days)"
    );
    console.log("• YEAR: Resets on January 1st at midnight (365 days)");

    console.log("\n💡 KEY POINTS:");
    console.log(
      "✅ All resets happen automatically - no manual intervention needed"
    );
    console.log("✅ Resets happen exactly at midnight (server timezone)");
    console.log(
      "✅ Previous period data is preserved in database - just filtered out"
    );
    console.log(
      "✅ Real-time dashboard updates every 10 seconds to show current values"
    );

    // Show a practical example
    console.log("\n🎯 PRACTICAL EXAMPLE:");
    console.log("If Jeff makes sales throughout this week:");
    console.log("• Monday-Saturday: 'This Week' accumulates all sales");
    console.log(
      `• ${nextSunday.toLocaleDateString()} 12:00 AM: 'This Week' resets to $0.00`
    );
    console.log(
      "• Sunday onwards: 'This Week' starts fresh with new week's sales"
    );
    console.log(
      "• BUT 'This Month' and 'Year' continue to include the previous week's sales!"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testAllTimePeriodResets();
