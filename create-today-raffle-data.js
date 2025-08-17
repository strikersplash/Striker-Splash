const { pool } = require("./dist/config/db");

async function createTodayRaffleData() {
  try {
    console.log("Creating raffle data for today...");

    // Get today's date (July 27, 2025)
    const today = new Date("2025-07-27");

    // First create some test players if they don't exist
    const players = [
      { name: "Test Player 1", phone: "501-1001", email: "test1@example.com" },
      { name: "Test Player 2", phone: "501-1002", email: "test2@example.com" },
      { name: "Test Player 3", phone: "501-1003", email: "test3@example.com" },
      { name: "Test Player 4", phone: "501-1004", email: "test4@example.com" },
      { name: "Test Player 5", phone: "501-1005", email: "test5@example.com" },
    ];

    console.log("Creating test players...");
    for (const player of players) {
      await pool.query(
        `
        INSERT INTO players (name, phone, email, password_hash, created_at)
        VALUES ($1, $2, $3, '$2b$10$K8gF5X.8yQ2ZJQ2ZJQ2ZJuO8X2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ2ZJQ', NOW())
        ON CONFLICT (phone) DO NOTHING
      `,
        [player.name, player.phone, player.email]
      );
    }

    console.log("Creating raffle tickets for today...");

    // Get player IDs
    const playersResult = await pool.query(`
      SELECT id, name FROM players WHERE phone LIKE '501-100%' ORDER BY phone LIMIT 5
    `);

    const playerIds = playersResult.rows;

    // Create tickets for today
    let ticketNumber = 1000; // Start from 1000

    for (const player of playerIds) {
      // Create 2 tickets per player
      for (let i = 0; i < 2; i++) {
        await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at, updated_at)
          VALUES ($1, $2, 'played', $3, $3)
        `,
          [player.id, ticketNumber++, today]
        );
      }
      console.log(`Created 2 tickets for ${player.name}`);
    }

    // Check results
    const ticketCount = await pool.query(`
      SELECT COUNT(*) as count FROM queue_tickets 
      WHERE DATE(created_at) = '2025-07-27' AND status = 'played'
    `);

    console.log(
      `✅ Created ${ticketCount.rows[0].count} eligible raffle tickets for today!`
    );
  } catch (error) {
    console.error("Error creating raffle data:", error);
  } finally {
    await pool.end();
  }
}

createTodayRaffleData();
