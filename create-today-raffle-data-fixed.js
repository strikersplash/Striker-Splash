const { pool } = require("./dist/config/db");

async function createTodayRaffleData() {
  try {
    console.log("🎫 Creating raffle data for TODAY...");

    // Get today's actual date
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    console.log(`Today's date: ${today.toISOString()}`);
    console.log(`Today's date string: ${todayString}`);

    // First create some test players if they don't exist
    const players = [
      {
        name: "Raffle Player 1",
        phone: "501-2001",
        email: "raffle1@example.com",
      },
      {
        name: "Raffle Player 2",
        phone: "501-2002",
        email: "raffle2@example.com",
      },
      {
        name: "Raffle Player 3",
        phone: "501-2003",
        email: "raffle3@example.com",
      },
      {
        name: "Raffle Player 4",
        phone: "501-2004",
        email: "raffle4@example.com",
      },
      {
        name: "Raffle Player 5",
        phone: "501-2005",
        email: "raffle5@example.com",
      },
    ];

    console.log("Creating test players...");
    for (const player of players) {
      const result = await pool.query(
        `
        INSERT INTO players (name, phone, email, password_hash, created_at)
        VALUES ($1, $2, $3, '$2b$10$K8gF5X.8yQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ', NOW())
        ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `,
        [player.name, player.phone, player.email]
      );

      if (result.rows.length > 0) {
        console.log(
          `✓ Player created/updated: ${result.rows[0].name} (ID: ${result.rows[0].id})`
        );
      }
    }

    console.log("Creating raffle tickets for today...");

    // Get the raffle player IDs
    const playersResult = await pool.query(`
      SELECT id, name FROM players WHERE phone LIKE '501-200%' ORDER BY phone LIMIT 5
    `);

    const playerIds = playersResult.rows;
    console.log(`Found ${playerIds.length} raffle players`);

    // Create tickets for TODAY
    let ticketNumber = 2000; // Start from 2000 to avoid conflicts

    for (const player of playerIds) {
      // Create 2 tickets per player
      for (let i = 0; i < 2; i++) {
        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at, updated_at)
          VALUES ($1, $2, 'played', NOW(), NOW())
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

    // Also show all tickets created today
    const todaysTickets = await pool.query(`
      SELECT qt.ticket_number, p.name, qt.created_at
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
    console.error("❌ Error creating raffle data:", error);
  } finally {
    await pool.end();
  }
}

createTodayRaffleData();
