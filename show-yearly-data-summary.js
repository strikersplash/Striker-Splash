const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function showYearlyDataSummary() {
  try {
    console.log("🎯 Striker Splash - Historical Sales Data Summary\n");

    const years = [2023, 2024, 2025];

    for (const year of years) {
      console.log(`📅 ${year}:`);

      // Overall stats for the year
      const yearStats = await pool.query(
        `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(DISTINCT player_id) as unique_customers,
          ROUND(SUM(amount)::numeric, 2) as total_revenue,
          SUM(kicks) as total_kicks,
          COUNT(DISTINCT staff_id) as active_staff
        FROM transactions 
        WHERE EXTRACT(year FROM created_at) = $1
      `,
        [year]
      );

      const stats = yearStats.rows[0];

      if (stats.total_transactions > 0) {
        console.log(`  💰 Total Revenue: $${stats.total_revenue}`);
        console.log(`  🛒 Total Transactions: ${stats.total_transactions}`);
        console.log(`  👥 Unique Customers: ${stats.unique_customers}`);
        console.log(`  ⚽ Total Kicks Sold: ${stats.total_kicks}`);
        console.log(`  👔 Active Staff: ${stats.active_staff}`);

        // Top performing staff for the year
        const topStaff = await pool.query(
          `
          SELECT 
            s.name as staff_name,
            s.role,
            ROUND(SUM(t.amount)::numeric, 2) as revenue,
            COUNT(t.id) as transactions
          FROM staff s
          JOIN transactions t ON s.id = t.staff_id
          WHERE EXTRACT(year FROM t.created_at) = $1
          GROUP BY s.id, s.name, s.role
          ORDER BY SUM(t.amount) DESC
          LIMIT 3
        `,
          [year]
        );

        console.log("  🏆 Top Staff:");
        topStaff.rows.forEach((staff, index) => {
          const medal = ["🥇", "🥈", "🥉"][index] || "🏅";
          console.log(
            `    ${medal} ${staff.staff_name} (${staff.role}): $${staff.revenue} (${staff.transactions} transactions)`
          );
        });

        // Best month
        const bestMonth = await pool.query(
          `
          SELECT 
            EXTRACT(month FROM created_at) as month,
            ROUND(SUM(amount)::numeric, 2) as revenue
          FROM transactions 
          WHERE EXTRACT(year FROM created_at) = $1
          GROUP BY EXTRACT(month FROM created_at)
          ORDER BY SUM(amount) DESC
          LIMIT 1
        `,
          [year]
        );

        if (bestMonth.rows.length > 0) {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const bestMonthData = bestMonth.rows[0];
          console.log(
            `  📈 Best Month: ${monthNames[bestMonthData.month - 1]} ($${
              bestMonthData.revenue
            })`
          );
        }
      } else {
        console.log("  📊 No transactions found for this year");
      }

      console.log("");
    }

    console.log("✅ You can now test the yearly sales tracking feature!");
    console.log("📊 Visit: http://localhost:3000/admin/sales-reports");
    console.log(
      "🎯 Try changing the year dropdown to see 2023, 2024, and 2025 data"
    );
    console.log("💾 Test the CSV download for each year");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

showYearlyDataSummary();
