const { pool } = require("./dist/config/db");

async function createTodayRaffleTickets() {
  try {
    console.log("🎫 Creating raffle tickets for the server's 'today' date...");

    // Get what the server thinks is today
    const serverToday = new Date().toISOString().split("T")[0];
    console.log(`Server today: ${serverToday}`);

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

    // Create tickets for the server's TODAY date
    let ticketNumber = 5000; // Start from 5000

    for (const player of players) {
      // Create 3 tickets per player for more raffle entries
      for (let i = 0; i < 3; i++) {
        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at)
          VALUES ($1, $2, 'played', $3)
          RETURNING id, ticket_number
        `,
          [player.id, ticketNumber++, serverToday + " 12:00:00"]
        );

        console.log(
          `✓ Created ticket #${result.rows[0].ticket_number} for ${player.name}`
        );
      }
    }

    // Check results for the server's TODAY
    const ticketCount = await pool.query(
      `
      SELECT COUNT(*) as count FROM queue_tickets 
      WHERE DATE(created_at) = $1 AND status = 'played'
    `,
      [serverToday]
    );

    console.log(
      `✅ Total eligible raffle tickets for server today (${serverToday}): ${ticketCount.rows[0].count}`
    );

    // Show today's tickets
    const todaysTickets = await pool.query(
      `
      SELECT qt.ticket_number, p.name
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE DATE(qt.created_at) = $1 AND qt.status = 'played'
      ORDER BY qt.ticket_number
    `,
      [serverToday]
    );

    console.log(`\n🎟️ Raffle Tickets for ${serverToday}:`);
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
