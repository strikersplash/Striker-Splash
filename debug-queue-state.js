const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkQueueState() {
  try {
    console.log("=== QUEUE STATE DEBUG ===");

    // Check current counter
    const counterResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );
    console.log("Current next_queue_number:", counterResult.rows[0]?.value);

    // Check existing tickets
    const ticketsResult = await pool.query(
      "SELECT ticket_number, player_id, status, created_at FROM queue_tickets ORDER BY ticket_number"
    );
    console.log("Existing tickets:");
    ticketsResult.rows.forEach((ticket) => {
      console.log(
        `  Ticket #${ticket.ticket_number} - Player ${ticket.player_id} - Status: ${ticket.status} - Created: ${ticket.created_at}`
      );
    });

    // Check max ticket number
    const maxTicketResult = await pool.query(
      "SELECT MAX(ticket_number) as max_ticket FROM queue_tickets"
    );
    console.log("Max ticket number:", maxTicketResult.rows[0]?.max_ticket);

    // Check ticket ranges
    const rangesResult = await pool.query(
      "SELECT * FROM ticket_ranges ORDER BY created_at DESC LIMIT 5"
    );
    console.log("Recent ticket ranges:");
    rangesResult.rows.forEach((range) => {
      console.log(
        `  Range: ${range.start_ticket}-${range.end_ticket} - Created: ${range.created_at}`
      );
    });

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    await pool.end();
  }
}

checkQueueState();
