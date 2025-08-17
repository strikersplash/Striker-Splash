// Check specific ticket #3 status
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkTicket3() {
  try {
    console.log("🔍 Checking ticket #3 specifically...");

    // Get all ticket #3 entries
    const ticket3Result = await pool.query(`
      SELECT 
        qt.id,
        qt.ticket_number, 
        qt.status, 
        qt.player_id,
        p.name as player_name,
        qt.created_at
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.ticket_number = 3
      ORDER BY qt.created_at
    `);

    console.log(`Found ${ticket3Result.rows.length} tickets with number 3:`);

    ticket3Result.rows.forEach((ticket, index) => {
      console.log(
        `  ${index + 1}. ID: ${ticket.id} - Player: ${
          ticket.player_name
        } - Status: ${ticket.status}`
      );
      console.log(`     Created: ${ticket.created_at}`);
      console.log("");
    });

    // Check what the queue system considers "active"
    const activeStatusResult = await pool.query(`
      SELECT DISTINCT status FROM queue_tickets ORDER BY status
    `);

    console.log("All possible ticket statuses in database:");
    activeStatusResult.rows.forEach((row) => {
      console.log(`  - ${row.status}`);
    });

    // Check tickets that should be in queue
    const shouldBeActiveResult = await pool.query(`
      SELECT 
        qt.ticket_number, 
        qt.status, 
        p.name as player_name
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status IN ('waiting', 'in_progress', 'in-queue')
      ORDER BY qt.ticket_number
    `);

    console.log(
      `\nTickets that should be active (waiting/in_progress/in-queue):`
    );
    if (shouldBeActiveResult.rows.length > 0) {
      shouldBeActiveResult.rows.forEach((ticket) => {
        console.log(
          `  Ticket #${ticket.ticket_number} - ${ticket.player_name} - ${ticket.status}`
        );
      });
    } else {
      console.log("  No tickets found with active statuses");
    }

    await pool.end();
  } catch (error) {
    console.error("❌ Error checking ticket #3:", error);
    await pool.end();
  }
}

checkTicket3();
