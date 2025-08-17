const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  ssl: process.env.DB_HOST?.includes("supabase.com")
    ? { rejectUnauthorized: false }
    : false,
});

async function testCSVGeneration() {
  try {
    const targetYear = 2025;
    console.log("=== Testing CSV Export Logic ===");

    // Use the exact query from the CSV export function
    const salesQuery = `
      SELECT 
        s.id as staff_id,
        CASE 
          WHEN s.active = false THEN CONCAT(COALESCE(s.name, s.username), ' (Account Deleted)')
          ELSE COALESCE(s.name, s.username)
        END as staff_name,
        s.role,
        -- Year totals
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.kicks END), 0) as kicks_year,
        COUNT(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN 1 END) as transactions_year,
        -- Monthly breakdown (Jan-Dec)
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 1 AND t.amount > 0 THEN t.amount END), 0) as jan_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 2 AND t.amount > 0 THEN t.amount END), 0) as feb_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 3 AND t.amount > 0 THEN t.amount END), 0) as mar_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 4 AND t.amount > 0 THEN t.amount END), 0) as apr_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 5 AND t.amount > 0 THEN t.amount END), 0) as may_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 6 AND t.amount > 0 THEN t.amount END), 0) as jun_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 7 AND t.amount > 0 THEN t.amount END), 0) as jul_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 8 AND t.amount > 0 THEN t.amount END), 0) as aug_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 9 AND t.amount > 0 THEN t.amount END), 0) as sep_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 10 AND t.amount > 0 THEN t.amount END), 0) as oct_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 11 AND t.amount > 0 THEN t.amount END), 0) as nov_revenue,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND EXTRACT(month FROM t.created_at) = 12 AND t.amount > 0 THEN t.amount END), 0) as dec_revenue
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role, s.active
      ORDER BY revenue_year DESC, staff_name ASC
    `;

    const salesResult = await pool.query(salesQuery, [targetYear]);
    const salesData = salesResult.rows;

    console.log("Database Query Results:");
    salesData.forEach((row) => {
      console.log(
        `- ${row.staff_name} (${row.role}) - Revenue: $${row.revenue_year}`
      );
    });

    // Generate CSV content
    const csvHeaders = [
      "Staff Name",
      "Role",
      "Year Total Revenue",
      "Year Customers",
      "Year Transactions",
      "Year Kicks",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let csvContent = csvHeaders.join(",") + "\n";

    // Add data rows
    salesData.forEach((row) => {
      const csvRow = [
        `"${row.staff_name}"`,
        `"${row.role}"`,
        `"$${parseFloat(row.revenue_year).toFixed(2)}"`,
        `"${row.customers_year}"`,
        `"${row.transactions_year}"`,
        `"${row.kicks_year}"`,
        `"$${parseFloat(row.jan_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.feb_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.mar_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.apr_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.may_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.jun_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.jul_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.aug_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.sep_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.oct_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.nov_revenue).toFixed(2)}"`,
        `"$${parseFloat(row.dec_revenue).toFixed(2)}"`,
      ];
      csvContent += csvRow.join(",") + "\n";
    });

    console.log("\n=== Generated CSV Content ===");
    console.log(csvContent);

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

testCSVGeneration();
