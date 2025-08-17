const { Pool } = require("pg");

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "striker_splash",
  password: "postgres",
  port: 5432,
});

async function debugTransactions() {
  try {
    console.log("=== DEBUG: Today's Transactions ===");

    // Check current date/time
    const now = new Date();
    console.log("Current time:", now.toISOString());
    console.log("Current date (local):", now.toLocaleDateString());
    console.log("Current date (ISO split):", now.toISOString().split("T")[0]);

    // Get today's date string like the function does
    const today = new Date().toISOString().split("T")[0];
    console.log("Today string used in query:", today);

    // Check all transactions from today
    const allTodayQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.player_id,
        t.staff_id,
        t.kicks,
        t.amount,
        p.name as player_name,
        s.name as staff_name,
        s.role as staff_role
      FROM transactions t
      LEFT JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      WHERE t.created_at >= $1::date
        AND t.created_at < ($1::date + interval '1 day')
      ORDER BY t.created_at DESC
    `;

    const allResult = await pool.query(allTodayQuery, [today]);
    console.log(
      `\nFound ${allResult.rows.length} total transactions for today:`
    );

    allResult.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ID: ${row.id}, Player: ${row.player_name} (ID: ${
          row.player_id
        }), Staff: ${row.staff_name} (ID: ${row.staff_id}), Kicks: ${
          row.kicks
        }, Amount: ${row.amount}, Time: ${row.created_at}`
      );
    });

    // Check transactions for staff ID 2 (George Smith)
    const staffTransactionsQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.player_id,
        t.staff_id,
        t.kicks,
        t.amount,
        p.name as player_name
      FROM transactions t
      LEFT JOIN players p ON t.player_id = p.id
      WHERE t.staff_id = $2
        AND t.created_at >= $1::date
        AND t.created_at < ($1::date + interval '1 day')
      ORDER BY t.created_at DESC
    `;

    const staffResult = await pool.query(staffTransactionsQuery, [today, 2]);
    console.log(
      `\nFound ${staffResult.rows.length} transactions for staff ID 2 (George Smith):`
    );

    staffResult.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ID: ${row.id}, Player: ${row.player_name} (ID: ${
          row.player_id
        }), Kicks: ${row.kicks}, Amount: ${row.amount}, Time: ${row.created_at}`
      );
    });

    // Check the most recent transactions
    const recentQuery = `
      SELECT 
        t.id,
        t.created_at,
        t.player_id,
        t.staff_id,
        t.kicks,
        t.amount,
        p.name as player_name,
        s.name as staff_name
      FROM transactions t
      LEFT JOIN players p ON t.player_id = p.id
      LEFT JOIN staff s ON t.staff_id = s.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `;

    const recentResult = await pool.query(recentQuery);
    console.log(`\nMost recent 10 transactions (regardless of date):`);

    recentResult.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ID: ${row.id}, Player: ${row.player_name} (ID: ${
          row.player_id
        }), Staff: ${row.staff_name} (ID: ${row.staff_id}), Kicks: ${
          row.kicks
        }, Amount: ${row.amount}, Time: ${row.created_at}`
      );
    });
  } catch (error) {
    console.error("Debug error:", error);
  } finally {
    await pool.end();
  }
}

debugTransactions();
