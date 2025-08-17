const { pool } = require("./dist/config/db");

async function createRaffleWithTysha() {
  try {
    console.log("🎫 Creating raffle tickets for TODAY with real players...");

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    console.log(`📅 Creating tickets for: ${today.toDateString()}`);

    // Get specific players including Tysha Daniels and John Doe
    const players = await pool.query(`
      SELECT id, name FROM players 
      WHERE name ILIKE '%tysha%' OR name ILIKE '%john%' OR name ILIKE '%sarah%' OR name ILIKE '%maria%'
      ORDER BY name
      LIMIT 10
    `);

    console.log(`Found ${players.rows.length} players:`);
    players.rows.forEach((p) => console.log(`  - ${p.name} (ID: ${p.id})`));

    // Delete today's tickets first
    await pool.query(
      `DELETE FROM queue_tickets WHERE DATE(created_at) = CURRENT_DATE`
    );
    console.log("🗑️ Cleared existing tickets for today");

    let ticketNum = 1000;
    const createdTickets = [];

    // Create 2-3 tickets per player
    for (const player of players.rows) {
      const numTickets = Math.floor(Math.random() * 2) + 2; // 2-3 tickets

      for (let i = 0; i < numTickets; i++) {
        const randomHour = Math.floor(Math.random() * 12) + 8; // 8 AM to 8 PM
        const randomMinute = Math.floor(Math.random() * 60);
        const ticketTime = new Date();
        ticketTime.setHours(randomHour, randomMinute, 0, 0);

        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at, updated_at)
          VALUES ($1, $2, 'played', $3, $3)
          RETURNING id, ticket_number
        `,
          [player.id, ticketNum, ticketTime]
        );

        createdTickets.push({
          ticketId: result.rows[0].id,
          ticketNumber: result.rows[0].ticket_number,
          playerName: player.name,
          time: ticketTime.toLocaleTimeString(),
        });

        ticketNum++;
      }
    }

    console.log(`\n✅ Created ${createdTickets.length} tickets for today!`);
    console.log(`\n🎟️ Today's Eligible Tickets:`);
    createdTickets.forEach((ticket) => {
      console.log(
        `  Ticket #${ticket.ticketNumber}: ${ticket.playerName} (${ticket.time})`
      );
    });

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
    process.exit(1);
  }
}

createRaffleWithTysha();
