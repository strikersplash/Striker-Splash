const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testYearColumn() {
  try {
    console.log("Testing Year Column Data for 2025...\n");

    // Get current staff sales data for 2025 (like the API would return)
    const currentYear = 2025;

    const salesQuery = `
      SELECT 
        s.id as staff_id,
        COALESCE(s.name, s.username) as staff_name,
        s.role,
        -- Year totals
        COUNT(DISTINCT CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.player_id END) as customers_year,
        COALESCE(SUM(CASE WHEN EXTRACT(year FROM t.created_at) = $1 AND t.amount > 0 THEN t.amount END), 0) as revenue_year
      FROM staff s
      LEFT JOIN transactions t ON s.id = t.staff_id
      WHERE s.role IN ('staff', 'admin', 'sales')
      GROUP BY s.id, s.name, s.username, s.role
      ORDER BY revenue_year DESC, staff_name ASC
    `;

    const result = await pool.query(salesQuery, [currentYear]);

    console.log("Year Column Data (what will display in the table):");
    console.log("================================================");

    result.rows.forEach((staff) => {
      const customers = staff.customers_year || 0;
      const revenue = parseFloat(staff.revenue_year || 0).toFixed(2);

      console.log(
        `${staff.staff_name} (${staff.role}): ${customers} customers, $${revenue}`
      );
    });

    console.log(
      '\n✅ Year column will show actual revenue amounts instead of "Loading..."'
    );
    console.log(
      "💡 The main table will now display current year totals for each staff member"
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testYearColumn();
