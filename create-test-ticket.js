const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function createTestTicket() {
  try {
    // Get or create a test player
    let result = await pool.query("SELECT id FROM players LIMIT 1");
    let playerId;

    if (result.rows.length === 0) {
      // Create a test player
      const playerResult = await pool.query(
        "INSERT INTO players (name, phone, dob, residence, qr_hash, age_group) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          "Test Player",
          "1234567890",
          "2000-01-01",
          "Test City",
          "test_hash_" + Date.now(),
          "adult",
        ]
      );
      playerId = playerResult.rows[0].id;
      console.log("Created test player with ID:", playerId);
    } else {
      playerId = result.rows[0].id;
      console.log("Using existing player ID:", playerId);
    }

    // Create a transaction
    const transactionResult = await pool.query(
      "INSERT INTO transactions (player_id, kicks, amount) VALUES ($1, $2, $3) RETURNING id",
      [playerId, 5, 5.0]
    );

    const transactionId = transactionResult.rows[0].id;
    console.log("Created transaction with ID:", transactionId);

    // Get next ticket number
    const ticketNumberResult = await pool.query(
      "UPDATE global_counters SET value = value + 1 WHERE id = $1 RETURNING value",
      ["next_queue_number"]
    );
    const ticketNumber = ticketNumberResult.rows[0].value;

    // Create a queue ticket with random competition type (standard or practice)
    const competitionType = Math.random() > 0.5 ? "standard" : "practice";
    const ticketResult = await pool.query(
      "INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [ticketNumber, playerId, "in-queue", competitionType]
    );

    console.log("Created queue ticket:", ticketResult.rows[0]);

    // Check current queue status
    const queueStatus = await pool.query(
      "SELECT MIN(ticket_number) as now_serving FROM queue_tickets WHERE status = $1",
      ["in-queue"]
    );

    console.log(
      "Current queue status - Now serving:",
      queueStatus.rows[0].now_serving
    );
  } catch (error) {
    console.error("Error creating test ticket:", error);
  } finally {
    await pool.end();
  }
}

createTestTicket();
