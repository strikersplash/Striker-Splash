// Add a single new queue entry to test real-time updates
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function addNewQueueEntry() {
  try {
    console.log("🎯 Adding new queue entry...");

    // Get a random existing player
    const playerResult = await pool.query(`
      SELECT id, name, age_group 
      FROM players 
      WHERE name NOT IN (
        SELECT p.name 
        FROM players p
        JOIN queue_tickets qt ON p.id = qt.player_id
        WHERE qt.status = 'in-queue'
      )
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (playerResult.rows.length === 0) {
      console.log("No available players found");
      return;
    }

    const player = playerResult.rows[0];

    // Get next ticket number
    const nextTicketResult = await pool.query(
      "UPDATE global_counters SET value = value + 1 WHERE id = 'next_queue_number' RETURNING value"
    );

    const ticketNumber = nextTicketResult.rows[0].value;

    // Add to queue
    await pool.query(
      `
      INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play, created_at)
      VALUES ($1, $2, 'in-queue', 'individual', true, false, NOW())
    `,
      [ticketNumber, player.id]
    );

    console.log(
      `✅ Added ticket #${ticketNumber}: ${player.name} (${player.age_group}) - Individual`
    );

    // Show current queue count
    const queueCount = await pool.query(
      "SELECT COUNT(*) as count FROM queue_tickets WHERE status = 'in-queue'"
    );

    console.log(`Queue now has ${queueCount.rows[0].count} tickets`);

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
  }
}

addNewQueueEntry();
