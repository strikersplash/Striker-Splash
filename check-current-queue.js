// Quick check of current queue status
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkCurrentQueueStatus() {
  try {
    console.log("🎯 Current Queue Status Check:");

    // Check next_queue_number
    const counterResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );
    console.log("Next Queue Number:", counterResult.rows[0]?.value);

    // Check current ticket being served
    const currentResult = await pool.query(
      "SELECT MIN(ticket_number) as current_number FROM queue_tickets WHERE status = 'in-queue'"
    );
    console.log(
      "Now Serving (Current Ticket):",
      currentResult.rows[0]?.current_number || "None"
    );

    // Check all active tickets
    const activeResult = await pool.query(`
      SELECT ticket_number, p.name as player_name, qt.status
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status = 'in-queue'
      ORDER BY qt.ticket_number
    `);

    console.log("\nActive Tickets:");
    if (activeResult.rows.length > 0) {
      activeResult.rows.forEach((ticket) => {
        console.log(
          `  Ticket #${ticket.ticket_number} - ${ticket.player_name} - ${ticket.status}`
        );
      });
    } else {
      console.log("  No active tickets");
    }

    console.log("\n✅ Summary:");
    console.log(
      `  Now Serving: ${currentResult.rows[0]?.current_number || "None"}`
    );
    console.log(`  Next Ticket: ${counterResult.rows[0]?.value || "Unknown"}`);

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
  }
}

checkCurrentQueueStatus();
