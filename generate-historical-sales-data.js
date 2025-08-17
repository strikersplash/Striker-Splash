const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

// Helper function to generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random decimal between min and max
function randomDecimal(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Helper function to get random date within a month
function getRandomDateInMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = randomBetween(1, daysInMonth);
  const hour = randomBetween(9, 21); // Business hours
  const minute = randomBetween(0, 59);
  return new Date(year, month - 1, day, hour, minute);
}

// Helper function to get player IDs
async function getPlayerIds() {
  const result = await pool.query(
    "SELECT id FROM players ORDER BY id LIMIT 50"
  );
  return result.rows.map((row) => row.id);
}

// Helper function to get staff IDs
async function getStaffIds() {
  const result = await pool.query(
    "SELECT id FROM staff WHERE role IN ('staff', 'admin', 'sales') ORDER BY id"
  );
  return result.rows.map((row) => row.id);
}

async function generateHistoricalSalesData() {
  try {
    console.log("Starting historical sales data generation...");

    // Get existing player and staff IDs
    const playerIds = await getPlayerIds();
    const staffIds = await getStaffIds();

    console.log(
      `Found ${playerIds.length} players and ${staffIds.length} staff members`
    );

    if (playerIds.length === 0 || staffIds.length === 0) {
      console.log(
        "No players or staff found. Please ensure your database has players and staff."
      );
      return;
    }

    // Generate data for 2023 and 2024
    const years = [2023, 2024];

    for (const year of years) {
      console.log(`\nGenerating sales data for ${year}...`);

      // Generate monthly patterns (some months busier than others)
      const monthlyMultipliers = {
        1: 0.8, // January - slower after holidays
        2: 0.9, // February
        3: 1.1, // March - spring pickup
        4: 1.2, // April
        5: 1.3, // May - getting busier
        6: 1.5, // June - summer season
        7: 1.6, // July - peak summer
        8: 1.4, // August - still busy
        9: 1.1, // September - back to school
        10: 1.0, // October
        11: 0.9, // November
        12: 1.2, // December - holiday events
      };

      for (let month = 1; month <= 12; month++) {
        const multiplier = monthlyMultipliers[month];
        const baseTransactions = randomBetween(80, 120);
        const monthTransactions = Math.round(baseTransactions * multiplier);

        console.log(
          `  Month ${month}: Generating ${monthTransactions} transactions`
        );

        for (let i = 0; i < monthTransactions; i++) {
          // Random staff member
          const staffId = staffIds[randomBetween(0, staffIds.length - 1)];

          // Random player
          const playerId = playerIds[randomBetween(0, playerIds.length - 1)];

          // Random transaction details
          const kicks = randomBetween(1, 10);
          const amount = kicks * randomDecimal(4.5, 6.0); // Price per kick varies

          // Random date in the month
          const createdAt = getRandomDateInMonth(year, month);

          // Insert transaction
          await pool.query(
            `
            INSERT INTO transactions (player_id, staff_id, kicks, amount, created_at)
            VALUES ($1, $2, $3, $4, $5)
          `,
            [playerId, staffId, kicks, amount, createdAt]
          );
        }
      }

      console.log(`✅ Generated sales data for ${year}`);
    }

    // Generate summary statistics
    console.log("\n📊 Historical Data Summary:");

    for (const year of years) {
      const yearStats = await pool.query(
        `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(DISTINCT player_id) as unique_customers,
          SUM(amount) as total_revenue,
          SUM(kicks) as total_kicks
        FROM transactions 
        WHERE EXTRACT(year FROM created_at) = $1
      `,
        [year]
      );

      const stats = yearStats.rows[0];
      console.log(`\n${year}:`);
      console.log(`  Total Transactions: ${stats.total_transactions}`);
      console.log(`  Unique Customers: ${stats.unique_customers}`);
      console.log(
        `  Total Revenue: $${parseFloat(stats.total_revenue).toFixed(2)}`
      );
      console.log(`  Total Kicks: ${stats.total_kicks}`);

      // Monthly breakdown for the year
      const monthlyStats = await pool.query(
        `
        SELECT 
          EXTRACT(month FROM created_at) as month,
          COUNT(*) as transactions,
          SUM(amount) as revenue
        FROM transactions 
        WHERE EXTRACT(year FROM created_at) = $1
        GROUP BY EXTRACT(month FROM created_at)
        ORDER BY month
      `,
        [year]
      );

      console.log(`  Monthly breakdown:`);
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
      monthlyStats.rows.forEach((row) => {
        const monthName = monthNames[row.month - 1];
        console.log(
          `    ${monthName}: ${row.transactions} transactions, $${parseFloat(
            row.revenue
          ).toFixed(2)}`
        );
      });
    }

    console.log(
      "\n✅ Historical sales data generation completed successfully!"
    );
    console.log(
      "You can now test the yearly sales tracking with data from 2023 and 2024."
    );
  } catch (error) {
    console.error("Error generating historical sales data:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
generateHistoricalSalesData();
