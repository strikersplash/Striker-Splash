const { pool } = require("./dist/config/db");

async function createTodayRaffleTickets() {
  try {
    console.log("🎫 Creating raffle tickets for July 28, 2025...");

    // Get existing players
    const playersResult = await pool.query(`
      SELECT id, name FROM players ORDER BY id LIMIT 5
    `);

    if (playersResult.rows.length === 0) {
      console.log("❌ No players found in database");
      return;
    }

    const players = playersResult.rows;
    console.log(`Found ${players.length} existing players`);

    // Create tickets for TODAY (July 28, 2025)
    let ticketNumber = 4000; // Start from 4000

    for (const player of players) {
      // Create 2 tickets per player
      for (let i = 0; i < 2; i++) {
        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at)
          VALUES ($1, $2, 'played', NOW())
          RETURNING id, ticket_number
        `,
          [player.id, ticketNumber++]
        );

        console.log(
          `✓ Created ticket #${result.rows[0].ticket_number} for ${player.name}`
        );
      }
    }

    // Check results for TODAY
    const ticketCount = await pool.query(`
      SELECT COUNT(*) as count FROM queue_tickets 
      WHERE DATE(created_at) = CURRENT_DATE AND status = 'played'
    `);

    console.log(
      `✅ Total eligible raffle tickets for TODAY: ${ticketCount.rows[0].count}`
    );

    // Show today's tickets
    const todaysTickets = await pool.query(`
      SELECT qt.ticket_number, p.name
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE DATE(qt.created_at) = CURRENT_DATE AND qt.status = 'played'
      ORDER BY qt.ticket_number
    `);

    console.log("\n🎟️ Today's Raffle Tickets:");
    todaysTickets.rows.forEach((ticket) => {
      console.log(`  Ticket #${ticket.ticket_number}: ${ticket.name}`);
    });
  } catch (error) {
    console.error("❌ Error creating raffle tickets:", error);
  } finally {
    await pool.end();
  }
}

createTodayRaffleTickets();
