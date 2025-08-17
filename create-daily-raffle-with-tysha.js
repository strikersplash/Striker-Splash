#!/usr/bin/env node

const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function createDailyRaffleData() {
  console.log("🎫 Creating daily raffle data with existing players...");

  try {
    // Get existing players including Tysha Daniels, John Doe, etc.
    const playersResult = await pool.query(`
      SELECT id, name FROM players 
      WHERE name IN ('Tysha Daniels', 'John Doe', 'Sarah Johnson', 'Maria Lopez', 'Carlos Hernandez', 'Miguel Santos', 'Ana Rodriguez', 'David Chen', 'Lisa Williams', 'Roberto Garcia')
      OR name ILIKE '%john%' 
      OR name ILIKE '%tysha%'
      ORDER BY name
    `);

    if (playersResult.rows.length === 0) {
      console.log("❌ No matching players found");

      // Show what players we do have
      const allPlayers = await pool.query(
        "SELECT id, name FROM players ORDER BY name LIMIT 10"
      );
      console.log("Available players:");
      allPlayers.rows.forEach((p) =>
        console.log(`  - ${p.name} (ID: ${p.id})`)
      );
      return;
    }

    console.log(`\n✅ Found ${playersResult.rows.length} players:`);
    playersResult.rows.forEach((p) =>
      console.log(`  - ${p.name} (ID: ${p.id})`)
    );

    // Clear today's tickets
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    console.log(`\n🗑️ Clearing existing tickets for ${todayStr}...`);

    await pool.query(
      `DELETE FROM queue_tickets WHERE DATE(created_at) = CURRENT_DATE`
    );

    // Create tickets for today
    console.log("\n🎟️ Creating new tickets...");
    let ticketNumber = 2000;
    const tickets = [];

    for (const player of playersResult.rows) {
      // Create 2-3 tickets per player
      const numTickets = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < numTickets; i++) {
        // Random time today between 8 AM and 8 PM
        const hour = Math.floor(Math.random() * 12) + 8;
        const minute = Math.floor(Math.random() * 60);

        const ticketTime = new Date();
        ticketTime.setHours(hour, minute, 0, 0);

        const result = await pool.query(
          `
          INSERT INTO queue_tickets (player_id, ticket_number, status, created_at)
          VALUES ($1, $2, 'played', $3)
          RETURNING id, ticket_number
        `,
          [player.id, ticketNumber, ticketTime]
        );

        tickets.push({
          number: result.rows[0].ticket_number,
          player: player.name,
          time: ticketTime.toLocaleTimeString("en-US", { hour12: true }),
        });

        ticketNumber++;
      }
    }

    console.log(`\n✅ Created ${tickets.length} raffle tickets for today!`);
    console.log("\n🎯 Eligible for Daily Raffle:");
    tickets.forEach((ticket) => {
      console.log(
        `  Ticket #${ticket.number}: ${ticket.player} (${ticket.time})`
      );
    });

    console.log(`\n🎲 Ready to test daily raffle draw!`);
    console.log("Next: Run the raffle draw script to select a winner");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

createDailyRaffleData();
