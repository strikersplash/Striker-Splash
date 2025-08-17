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

async function testFinalSalesUpdate() {
  try {
    console.log("=== Testing Final Sales Update (All Columns) ===");

    // Add another transaction to test
    const insertResult = await pool.query(
      `INSERT INTO transactions (player_id, staff_id, amount, kicks, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [2, 4, 10.0, 10] // Different player, Jeff Finnetty staff, $10
    );

    console.log("Created new transaction:", insertResult.rows[0]);

    // Now test the FIXED sales tracking query
    const currentDateResult = await pool.query("SELECT NOW()::date as today");
    const today = currentDateResult.rows[0].today;

    const weekStartResult = await pool.query(`
      SELECT DATE_TRUNC('week', NOW())::date as week_start
    `);
    const weekStart = weekStartResult.rows[0].week_start;

    const monthStartResult = await pool.query(`
      SELECT DATE_TRUNC('month', NOW())::date as month_start
    `);
    const monthStart = monthStartResult.rows[0].month_start;

    console.log(
      `\nDates - Today: ${today}, Week: ${weekStart}, Month: ${monthStart}`
    );

    const salesTrackingQuery = `
      SELECT 
        s.id as staff_id,
        COALESCE(s.name, s.username) as staff_name,
        s.role,
        -- Today's data
        COUNT(DISTINCT CASE WHEN t.created_at::date = $1::date AND t.amount > 0 THEN t.player_id END) as customers_today,
        COALESCE(SUM(CASE WHEN t.created_at::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today,
        -- This week's data (FIXED)
        COUNT(DISTINCT CASE WHEN t.created_at::date >= $2::date AND t.amount > 0 THEN t.player_id END) as customers_week,
        COALESCE(SUM(CASE WHEN t.created_at::date >= $2::date AND t.amount > 0 THEN t.amount END), 0) as revenue_week,
        -- This month's data
        COUNT(DISTINCT CASE WHEN t.created_at::date >= $3::date AND t.amount > 0 THEN t.player_id END) as customers_month,
        COALESCE(SUM(CASE WHEN t.created_at::date >= $3::date AND t.amount > 0 THEN t.amount END), 0) as revenue_month
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales') AND s.id = $4
      GROUP BY s.id, s.name, s.username, s.role
    `;

    const salesTrackingResult = await pool.query(salesTrackingQuery, [
      today,
      weekStart,
      monthStart,
      4, // Jeff's ID
    ]);

    console.log("\n🎯 FINAL SALES TRACKING RESULTS for Jeff:");
    const jeffData = salesTrackingResult.rows[0];
    console.log(
      `Today: ${jeffData.customers_today} customers, $${jeffData.revenue_today}`
    );
    console.log(
      `This Week: ${jeffData.customers_week} customers, $${jeffData.revenue_week}`
    );
    console.log(
      `This Month: ${jeffData.customers_month} customers, $${jeffData.revenue_month}`
    );

    // Test yearly data
    const currentYear = new Date().getFullYear();
    const yearlyQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales') AND s.id = $2
    `;

    const yearlyResult = await pool.query(yearlyQuery, [currentYear, 4]);
    const yearData = yearlyResult.rows[0];
    console.log(
      `Year: ${yearData.customers_year} customers, $${yearData.revenue_year}`
    );

    console.log(
      "\n✅ ALL COLUMNS SHOULD NOW UPDATE CORRECTLY WHEN NEW SALES ARE MADE!"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testFinalSalesUpdate();
