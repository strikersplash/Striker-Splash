const { pool } = require("./dist/config/db");

async function checkQueueStatus() {
  try {
    console.log("=== QUEUE STATUS DEBUG ===");

    // Check all queue tickets
    const ticketsResult = await pool.query(`
      SELECT id, ticket_number, player_id, status, created_at
      FROM queue_tickets 
      ORDER BY ticket_number DESC 
      LIMIT 10
    `);

    console.log("Recent queue tickets:");
    ticketsResult.rows.forEach((ticket) => {
      console.log(
        `  Ticket #${ticket.ticket_number} - Player ${ticket.player_id} - Status: ${ticket.status} - Created: ${ticket.created_at}`
      );
    });

    // Check current queue position
    const currentResult = await pool.query(`
      SELECT MIN(ticket_number) as current_number 
      FROM queue_tickets 
      WHERE status = 'in-queue'
    `);

    console.log("\nCurrent queue position (in-queue tickets):");
    console.log(
      "  Current number:",
      currentResult.rows[0]?.current_number || "None"
    );

    // Check next ticket counter
    const nextResult = await pool.query(`
      SELECT value as next_ticket
      FROM global_counters
      WHERE id = 'next_queue_number'
    `);

    console.log("\nNext ticket counter:");
    console.log(
      "  Next ticket:",
      nextResult.rows[0]?.next_ticket || "Not found"
    );

    // Check in-queue tickets specifically
    const inQueueResult = await pool.query(`
      SELECT ticket_number, player_id, status
      FROM queue_tickets 
      WHERE status = 'in-queue'
      ORDER BY ticket_number
    `);

    console.log("\nTickets currently in queue:");
    if (inQueueResult.rows.length === 0) {
      console.log("  No tickets in queue");
    } else {
      inQueueResult.rows.forEach((ticket) => {
        console.log(
          `  Ticket #${ticket.ticket_number} - Player ${ticket.player_id}`
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkQueueStatus();
