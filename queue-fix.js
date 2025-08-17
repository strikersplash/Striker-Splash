// Quick fix for queue counter issue
// Run this script to fix the next_queue_number counter

const { Pool } = require("pg");

// Create pool with direct configuration
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function fixQueue() {
  try {
    console.log("🔧 Starting queue counter fix...");

    // Step 1: Get current state
    const currentCounterResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );
    const currentCounter = currentCounterResult.rows[0]?.value || 0;
    console.log(`📊 Current next_queue_number: ${currentCounter}`);

    // Step 2: Get max existing ticket
    const maxTicketResult = await pool.query(
      "SELECT MAX(ticket_number) as max_ticket FROM queue_tickets"
    );
    const maxTicket = maxTicketResult.rows[0]?.max_ticket || 0;
    console.log(`🎫 Highest existing ticket: ${maxTicket}`);

    // Step 3: Calculate correct next ticket number
    const correctNextTicket = maxTicket + 1;
    console.log(`✅ Correct next_queue_number should be: ${correctNextTicket}`);

    // Step 4: Update the counter
    if (currentCounter !== correctNextTicket) {
      console.log(
        `🔄 Updating next_queue_number from ${currentCounter} to ${correctNextTicket}`
      );

      const updateResult = await pool.query(
        "UPDATE global_counters SET value = $1 WHERE id = 'next_queue_number'",
        [correctNextTicket]
      );

      if (updateResult.rowCount === 0) {
        console.log("📝 Counter not found, creating new one...");
        await pool.query(
          "INSERT INTO global_counters (id, value) VALUES ('next_queue_number', $1)",
          [correctNextTicket]
        );
      }

      console.log("✅ Counter updated successfully!");
    } else {
      console.log("✅ Counter is already correct!");
    }

    // Step 5: Show current queue status
    const queueResult = await pool.query(`
      SELECT 
        ticket_number, 
        status, 
        created_at::timestamp::date as date
      FROM queue_tickets 
      WHERE status IN ('waiting', 'in_progress') 
      ORDER BY ticket_number
    `);

    console.log("\n📋 Current Queue Status:");
    if (queueResult.rows.length > 0) {
      queueResult.rows.forEach((ticket) => {
        console.log(
          `   Ticket #${ticket.ticket_number} - ${ticket.status} (${ticket.date})`
        );
      });
    } else {
      console.log("   No active tickets in queue");
    }

    console.log(
      "\n🎉 Queue fix completed! You can now refresh your dashboards."
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing queue:", error);
    await pool.end();
    process.exit(1);
  }
}

// Give the database connection a moment to establish
setTimeout(fixQueue, 1000);
