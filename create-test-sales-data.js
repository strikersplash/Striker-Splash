#!/usr/bin/env node

const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function createTestSalesData() {
  try {
    console.log("Creating test sales data...");

    // Create test transactions for different staff members
    const today = new Date().toISOString().split("T")[0];
    console.log(`Creating transactions for today: ${today}`);

    const testTransactions = [
      // George Smith (staff) - today
      { player_id: 1, staff_id: 2, kicks: 5, amount: 5.0 },
      { player_id: 3, staff_id: 2, kicks: 3, amount: 3.0 },

      // Jeff Finnetty (sales) - today
      { player_id: 2, staff_id: 4, kicks: 10, amount: 10.0 },
      { player_id: 4, staff_id: 4, kicks: 2, amount: 2.0 },

      // Tyler Williams (staff) - today
      { player_id: 5, staff_id: 3, kicks: 8, amount: 8.0 },
    ];

    for (const transaction of testTransactions) {
      await pool.query(
        `INSERT INTO transactions (player_id, staff_id, kicks, amount, created_at) 
         VALUES ($1, $2, $3, $4, '${today} 10:00:00')`,
        [
          transaction.player_id,
          transaction.staff_id,
          transaction.kicks,
          transaction.amount,
        ]
      );
    }

    console.log("Test sales data created successfully!");
    console.log("- George Smith: 2 transactions, $8.00 revenue");
    console.log("- Jeff Finnetty: 2 transactions, $12.00 revenue");
    console.log("- Tyler Williams: 1 transaction, $8.00 revenue");

    process.exit(0);
  } catch (error) {
    console.error("Error creating test sales data:", error);
    process.exit(1);
  }
}

createTestSalesData();
