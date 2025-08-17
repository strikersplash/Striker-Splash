const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function fixQueueCounter() {
  try {
    console.log("=== FIXING QUEUE COUNTER ===");

    // Get the highest existing ticket number
    const maxTicketResult = await pool.query(
      "SELECT MAX(ticket_number) as max_ticket FROM queue_tickets"
    );

    const maxTicket = maxTicketResult.rows[0]?.max_ticket || 0;
    console.log("Current max ticket number:", maxTicket);

    // Set the next_queue_number to be one more than the highest existing ticket
    const nextTicketNumber = maxTicket + 1;

    console.log("Setting next_queue_number to:", nextTicketNumber);

    // Update the counter
    const updateResult = await pool.query(
      "UPDATE global_counters SET value = $1 WHERE id = 'next_queue_number'",
      [nextTicketNumber]
    );

    if (updateResult.rowCount === 0) {
      // If no row was updated, insert the counter
      console.log("Counter not found, inserting new counter...");
      await pool.query(
        "INSERT INTO global_counters (id, value) VALUES ('next_queue_number', $1)",
        [nextTicketNumber]
      );
    }

    // Verify the update
    const verifyResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );

    console.log("Counter updated successfully!");
    console.log("New next_queue_number:", verifyResult.rows[0]?.value);

    // Show current queue status
    const currentResult = await pool.query(
      "SELECT ticket_number, status FROM queue_tickets WHERE status IN ('waiting', 'in_progress') ORDER BY ticket_number"
    );

    console.log("Current active tickets:");
    currentResult.rows.forEach((ticket) => {
      console.log(
        `  Ticket #${ticket.ticket_number} - Status: ${ticket.status}`
      );
    });

    await pool.end();
    console.log("Queue counter fix completed!");
  } catch (error) {
    console.error("Error fixing queue counter:", error);
    await pool.end();
    process.exit(1);
  }
}

fixQueueCounter();
