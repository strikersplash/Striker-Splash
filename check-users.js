const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkUsers() {
  try {
    console.log("=== Checking Staff Users ===");

    const staffQuery = `
      SELECT id, username, name, role 
      FROM staff 
      ORDER BY id
    `;

    const result = await pool.query(staffQuery);
    console.log("Staff users:");
    result.rows.forEach((user) => {
      console.log(
        `  ID: ${user.id}, Username: ${user.username}, Name: ${user.name}, Role: ${user.role}`
      );
    });

    // Check recent transactions
    console.log("\n=== Recent Transactions ===");
    const transactionQuery = `
      SELECT t.id, t.staff_id, t.player_id, t.kicks, t.amount, t.created_at,
             s.username as staff_username, s.name as staff_name,
             p.name as player_name
      FROM transactions t
      LEFT JOIN staff s ON t.staff_id = s.id
      LEFT JOIN players p ON t.player_id = p.id
      ORDER BY t.created_at DESC
      LIMIT 5
    `;

    const transResult = await pool.query(transactionQuery);
    console.log("Recent transactions:");
    transResult.rows.forEach((trans) => {
      console.log(
        `  ID: ${trans.id}, Staff: ${trans.staff_name} (ID: ${trans.staff_id}), Player: ${trans.player_name}, Kicks: ${trans.kicks}, Amount: ${trans.amount}, Time: ${trans.created_at}`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkUsers();
