const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "striker_splash",
  user: "striker_splash",
  password: "striker_splash",
});

async function testCompetitionPurchase() {
  try {
    console.log("=== Testing Competition Purchase Fix ===");

    // Get John's player ID
    const playerResult = await pool.query(
      "SELECT id FROM players WHERE name ILIKE '%john doe%'"
    );
    if (playerResult.rows.length === 0) {
      console.log("John Doe not found in database");
      return;
    }
    const playerId = playerResult.rows[0].id;
    console.log("John Doe player ID:", playerId);

    // Check current kicks balance
    const balanceResult = await pool.query(
      "SELECT kicks_balance FROM players WHERE id = $1",
      [playerId]
    );
    const currentBalance = balanceResult.rows[0].kicks_balance || 0;
    console.log("Current kicks balance:", currentBalance);

    // Simulate the backend logic for "balance-and-kick-for-competition" purchase
    console.log("\n=== Simulating processKicksPurchase logic ===");

    const kicksQuantity = 5;
    const purchaseType = "balance-and-kick-for-competition";

    // 1. Add kicks to balance (this would be done by updateKicksBalance)
    await pool.query(
      "UPDATE players SET kicks_balance = kicks_balance + $1 WHERE id = $2",
      [kicksQuantity, playerId]
    );
    console.log("Added", kicksQuantity, "kicks to balance");

    // 2. Check if we should create a ticket (5+ kicks and competition type)
    if (
      kicksQuantity >= 5 &&
      purchaseType === "balance-and-kick-for-competition"
    ) {
      console.log("Creating competition ticket...");

      // 3. Deduct 5 kicks for the ticket
      await pool.query(
        "UPDATE players SET kicks_balance = kicks_balance - 5 WHERE id = $1",
        [playerId]
      );
      console.log("Deducted 5 kicks for queue ticket");

      // 4. Create queue ticket
      const ticketResult = await pool.query(
        "UPDATE global_counters SET value = value + 1 WHERE id = 'next_queue_number' RETURNING value"
      );
      const ticketNumber = ticketResult.rows[0].value;

      await pool.query(
        "INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [ticketNumber, playerId, "in-queue", "standard", true, false]
      );

      console.log("Created queue ticket #", ticketNumber);

      // 5. Verify ticket was created
      const verifyResult = await pool.query(
        "SELECT * FROM queue_tickets WHERE ticket_number = $1",
        [ticketNumber]
      );

      if (verifyResult.rows.length > 0) {
        console.log("✅ Ticket created successfully:", verifyResult.rows[0]);
      } else {
        console.log("❌ Ticket creation failed");
      }
    }

    // Check final balance
    const finalBalanceResult = await pool.query(
      "SELECT kicks_balance FROM players WHERE id = $1",
      [playerId]
    );
    const finalBalance = finalBalanceResult.rows[0].kicks_balance || 0;
    console.log("Final kicks balance:", finalBalance);
    console.log("Net change in balance:", finalBalance - currentBalance);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testCompetitionPurchase();
