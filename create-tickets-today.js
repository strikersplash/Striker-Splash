const { pool } = require("./dist/config/db");

async function createTicketsForToday() {
  try {
    console.log("🎫 Creating tickets for TODAY (July 29, 2025)...");

    // Get existing players
    const playersResult = await pool.query(`
      SELECT id, name FROM players ORDER BY id LIMIT 5
    `);

    if (playersResult.rows.length === 0) {
      console.log("❌ No players found");
      return;
    }

    const players = playersResult.rows;
    console.log(`Found ${players.length} players`);

    // Create tickets for RIGHT NOW (which should be July 29, 2025)
    let ticketNumber = 5000; // Start from 5000

    for (const player of players) {
      // Create 2 tickets per player
      for (let i = 0; i < 2; i++) {
        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at)
          VALUES ($1, $2, 'played', NOW())
          RETURNING id, ticket_number, created_at
        `,
          [player.id, ticketNumber++]
        );

        const createdDate = new Date(result.rows[0].created_at)
          .toISOString()
          .split("T")[0];
        console.log(
          `✓ Created ticket #${result.rows[0].ticket_number} for ${player.name} on ${createdDate}`
        );
      }
    }

    // Check what we created
    const checkResult = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM queue_tickets 
      WHERE status = 'played' AND ticket_number >= 5000 
      GROUP BY DATE(created_at) 
      ORDER BY date DESC
    `);

    console.log("\n📊 Tickets by date:");
    checkResult.rows.forEach((row) => {
      console.log(`  ${row.date}: ${row.count} tickets`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

createTicketsForToday();
