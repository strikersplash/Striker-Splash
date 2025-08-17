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

async function testSalesDataUpdate() {
  try {
    // Get Jeff Finnetty's staff ID
    const staffResult = await pool.query(
      "SELECT id FROM staff WHERE name = 'Jeff Finnetty' OR username = 'Jeff Finnetty'"
    );

    if (staffResult.rows.length === 0) {
      console.log("Jeff Finnetty not found, creating staff record...");
      const createStaffResult = await pool.query(
        "INSERT INTO staff (username, name, role) VALUES ($1, $2, $3) RETURNING id",
        ["jeff.finnetty", "Jeff Finnetty", "sales"]
      );
      console.log("Created staff:", createStaffResult.rows[0]);
    }

    const jeffId =
      staffResult.rows.length > 0
        ? staffResult.rows[0].id
        : createStaffResult.rows[0].id;
    console.log("Jeff Finnetty staff ID:", jeffId);

    // Create a test transaction for today
    const insertResult = await pool.query(
      `INSERT INTO transactions (player_id, staff_id, amount, kicks, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [1, jeffId, 5.0, 5]
    );

    console.log("Created transaction:", insertResult.rows[0]);

    // Now test all the sales tracking queries to see if they pick up the new transaction

    // 1. Test the sales tracking API query
    console.log("\n=== Testing Sales Tracking API Query ===");
    const currentDateResult = await pool.query("SELECT NOW()::date as today");
    const today = currentDateResult.rows[0].today;

    const weekStartResult = await pool.query(`
      SELECT (DATE_TRUNC('week', NOW()) + INTERVAL '1 day')::date as week_start
    `);
    const weekStart = weekStartResult.rows[0].week_start;

    const monthStartResult = await pool.query(`
      SELECT DATE_TRUNC('month', NOW())::date as month_start
    `);
    const monthStart = monthStartResult.rows[0].month_start;

    console.log(
      `Dates - Today: ${today}, Week: ${weekStart}, Month: ${monthStart}`
    );

    const salesTrackingQuery = `
      SELECT 
        s.id as staff_id,
        COALESCE(s.name, s.username) as staff_name,
        s.role,
        -- Today's data
        COUNT(DISTINCT CASE WHEN t.created_at::date = $1::date AND t.amount > 0 THEN t.player_id END) as customers_today,
        COALESCE(SUM(CASE WHEN t.created_at::date = $1::date AND t.amount > 0 THEN t.amount END), 0) as revenue_today,
        -- This week's data
        COUNT(DISTINCT CASE WHEN t.created_at::date >= $2::date AND t.amount > 0 THEN t.player_id END) as customers_week,
        COALESCE(SUM(CASE WHEN t.created_at::date >= $2::date AND t.amount > 0 THEN t.amount END), 0) as revenue_week,
        -- This month's data
        COUNT(DISTINCT CASE WHEN t.created_at::date >= $3::date AND t.amount > 0 THEN t.player_id END) as customers_month,
        COALESCE(SUM(CASE WHEN t.created_at::date >= $3::date AND t.amount > 0 THEN t.amount END), 0) as revenue_month
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales') AND s.id = $4
      GROUP BY s.id, s.name, s.username, s.role
      ORDER BY revenue_today DESC, revenue_week DESC, staff_name ASC
    `;

    const salesTrackingResult = await pool.query(salesTrackingQuery, [
      today,
      weekStart,
      monthStart,
      jeffId,
    ]);

    console.log(
      "Sales Tracking Results for Jeff:",
      salesTrackingResult.rows[0]
    );

    // 2. Test the yearly query
    console.log("\n=== Testing Yearly Sales Query ===");
    const currentYear = new Date().getFullYear();
    const yearlyQuery = `
      SELECT 
        s.id as staff_id,
        COALESCE(s.name, s.username) as staff_name,
        s.role,
        -- Year totals
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.kicks END), 0) as kicks_year,
        COUNT(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN 1 END) as transactions_year
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales') AND s.id = $2
      GROUP BY s.id, s.name, s.username, s.role
    `;

    const yearlyResult = await pool.query(yearlyQuery, [currentYear, jeffId]);
    console.log("Yearly Results for Jeff:", yearlyResult.rows[0]);

    console.log(
      "\n✅ Test completed! All queries should now reflect the new transaction."
    );
  } catch (error) {
    console.error("Error testing sales data update:", error);
  } finally {
    await pool.end();
  }
}

testSalesDataUpdate();
