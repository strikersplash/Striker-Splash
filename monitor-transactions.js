const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

let lastMaxId = 0;

async function monitorTransactions() {
  try {
    const result = await pool.query(`
            SELECT MAX(id) as max_id, COUNT(*) as total,
                   (SELECT COUNT(*) FROM transactions WHERE (created_at AT TIME ZONE 'America/Belize')::date = (NOW() AT TIME ZONE 'America/Belize')::date) as today_count
        `);

    const { max_id, total, today_count } = result.rows[0];

    if (max_id > lastMaxId) {
      console.log(`🆕 NEW TRANSACTION! Max ID: ${lastMaxId} → ${max_id}`);

      // Get the new transaction details
      const newTxQuery = `
                SELECT t.id, t.created_at, t.amount, t.kicks, t.staff_id,
                       t.created_at AT TIME ZONE 'America/Belize' as belize_time,
                       (t.created_at AT TIME ZONE 'America/Belize')::date as belize_date,
                       p.name as player_name, s.name as staff_name
                FROM transactions t
                LEFT JOIN players p ON t.player_id = p.id
                LEFT JOIN staff s ON t.staff_id = s.id
                WHERE t.id > $1
                ORDER BY t.id DESC
            `;

      const newTxResult = await pool.query(newTxQuery, [lastMaxId]);
      newTxResult.rows.forEach((tx) => {
        const isToday =
          tx.belize_date.toISOString().split("T")[0] ===
          new Date().toISOString().split("T")[0];
        console.log(
          `   ID ${tx.id}: ${tx.player_name} → ${tx.staff_name}, $${tx.amount}, ${tx.kicks} kicks`
        );
        console.log(
          `   Created: ${tx.belize_time} (${isToday ? "TODAY" : "NOT TODAY"})`
        );
      });

      lastMaxId = max_id;
    }

    console.log(
      `📊 Total: ${total}, Today: ${today_count}, Max ID: ${max_id} [${new Date().toLocaleTimeString()}]`
    );
  } catch (error) {
    console.error("❌ Monitor error:", error.message);
  }
}

// Initial setup
pool.query("SELECT MAX(id) as max_id FROM transactions").then((result) => {
  lastMaxId = result.rows[0].max_id || 0;
  console.log(`🏁 Starting monitor from ID: ${lastMaxId}`);
  console.log("📡 Monitoring for new transactions... (Ctrl+C to stop)\n");

  // Monitor every 2 seconds
  setInterval(monitorTransactions, 2000);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Stopping monitor...");
  await pool.end();
  process.exit(0);
});
