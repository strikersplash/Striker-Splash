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

async function debugWeekCalculation() {
  try {
    console.log("=== Debugging Week Calculation ===");

    // Test different week calculation methods
    const queries = [
      {
        name: "Current (Incorrect) Method",
        query:
          "SELECT (DATE_TRUNC('week', NOW()) + INTERVAL '1 day')::date as week_start",
      },
      {
        name: "Correct Method - Start of Week (Sunday)",
        query: "SELECT DATE_TRUNC('week', NOW())::date as week_start",
      },
      {
        name: "Monday-based week start",
        query:
          "SELECT (DATE_TRUNC('week', NOW()))::date as week_start, (DATE_TRUNC('week', NOW()) + INTERVAL '1 day')::date as monday_start",
      },
      {
        name: "Current date and day of week",
        query:
          "SELECT NOW()::date as today, EXTRACT(dow FROM NOW()) as day_of_week",
      },
    ];

    for (const q of queries) {
      console.log(`\n${q.name}:`);
      const result = await pool.query(q.query);
      console.log(result.rows[0]);
    }

    // Test with correct week calculation
    console.log("\n=== Testing Sales with Correct Week Logic ===");

    const correctWeekQuery = `
      SELECT 
        s.id as staff_id,
        COALESCE(s.name, s.username) as staff_name,
        -- Today's data
        COUNT(DISTINCT CASE WHEN t.created_at::date = NOW()::date AND t.amount > 0 THEN t.player_id END) as customers_today,
        COALESCE(SUM(CASE WHEN t.created_at::date = NOW()::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today,
        -- This week's data (Sunday to Saturday)
        COUNT(DISTINCT CASE WHEN t.created_at >= DATE_TRUNC('week', NOW()) AND t.amount > 0 THEN t.player_id END) as customers_week,
        COALESCE(SUM(CASE WHEN t.created_at >= DATE_TRUNC('week', NOW()) AND t.amount > 0 THEN t.amount END), 0) as revenue_week
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales') AND s.id = 4
      GROUP BY s.id, s.name, s.username, s.role
    `;

    const result = await pool.query(correctWeekQuery);
    console.log("Jeff's data with correct week calculation:", result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

debugWeekCalculation();
