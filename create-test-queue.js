// Create test queue data to demonstrate the queue dropdown
const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function createTestQueue() {
  try {
    console.log("🎯 Creating test queue data...");

    // Get some test players
    const playersResult = await pool.query(`
      SELECT id, name, age_group 
      FROM players 
      ORDER BY id 
      LIMIT 5
    `);

    if (playersResult.rows.length === 0) {
      console.log("No players found. Creating test players first...");

      // Create test players
      const testPlayers = [
        { name: "Alice Johnson", age_group: "6-8" },
        { name: "Bob Smith", age_group: "9-11" },
        { name: "Charlie Brown", age_group: "12-14" },
        { name: "Diana Wilson", age_group: "15-17" },
        { name: "Ethan Davis", age_group: "Adult" },
      ];

      for (const player of testPlayers) {
        await pool.query(
          "INSERT INTO players (name, age_group, phone_number, kicks_balance) VALUES ($1, $2, $3, $4)",
          [
            player.name,
            player.age_group,
            `555-000${Math.random().toString().slice(-4)}`,
            10,
          ]
        );
      }

      const newPlayersResult = await pool.query(`
        SELECT id, name, age_group 
        FROM players 
        WHERE name IN ('Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Wilson', 'Ethan Davis')
        ORDER BY id
      `);

      console.log("Created test players:", newPlayersResult.rows.length);
    }

    // Get fresh player list
    const freshPlayersResult = await pool.query(`
      SELECT id, name, age_group 
      FROM players 
      ORDER BY id 
      LIMIT 5
    `);

    console.log(
      "Using players:",
      freshPlayersResult.rows.map((p) => `${p.name} (${p.age_group})`)
    );

    // Clear existing queue tickets
    await pool.query("DELETE FROM queue_tickets WHERE status = 'in-queue'");
    console.log("Cleared existing queue");

    // Get current next ticket number
    let nextTicketResult = await pool.query(
      "SELECT value FROM global_counters WHERE id = 'next_queue_number'"
    );

    let nextTicket = 1000;
    if (nextTicketResult.rows.length === 0) {
      await pool.query(
        "INSERT INTO global_counters (id, value) VALUES ('next_queue_number', $1)",
        [nextTicket]
      );
    } else {
      nextTicket = nextTicketResult.rows[0].value;
    }

    console.log("Starting ticket number:", nextTicket);

    // Create test queue tickets
    const queueData = [
      {
        player: freshPlayersResult.rows[0],
        team_play: false,
        competition_type: "individual",
      },
      {
        player: freshPlayersResult.rows[1],
        team_play: true,
        competition_type: "team",
      },
      {
        player: freshPlayersResult.rows[2],
        team_play: false,
        competition_type: "individual",
      },
      {
        player: freshPlayersResult.rows[3],
        team_play: false,
        competition_type: "individual",
      },
      {
        player: freshPlayersResult.rows[4],
        team_play: true,
        competition_type: "team",
      },
    ];

    console.log("Creating queue tickets...");
    for (let i = 0; i < queueData.length; i++) {
      const { player, team_play, competition_type } = queueData[i];
      const ticketNumber = nextTicket + i;

      await pool.query(
        `
        INSERT INTO queue_tickets (ticket_number, player_id, status, competition_type, official, team_play, created_at)
        VALUES ($1, $2, 'in-queue', $3, true, $4, NOW())
      `,
        [ticketNumber, player.id, competition_type, team_play]
      );

      console.log(
        `  Ticket #${ticketNumber}: ${player.name} (${player.age_group}) - ${
          team_play ? "Team" : "Individual"
        }`
      );
    }

    // Update the global counter
    await pool.query(
      "UPDATE global_counters SET value = $1 WHERE id = 'next_queue_number'",
      [nextTicket + queueData.length]
    );

    console.log("\n✅ Test queue created successfully!");
    console.log(`Queue now has ${queueData.length} tickets`);
    console.log(`Next ticket number will be: ${nextTicket + queueData.length}`);

    // Show current queue status
    const currentQueue = await pool.query(`
      SELECT 
        qt.ticket_number,
        p.name as player_name,
        p.age_group,
        qt.team_play,
        qt.competition_type
      FROM queue_tickets qt
      JOIN players p ON qt.player_id = p.id
      WHERE qt.status = 'in-queue'
      ORDER BY qt.ticket_number
    `);

    console.log("\n📋 Current Queue:");
    currentQueue.rows.forEach((ticket, index) => {
      const status = index === 0 ? " (NOW SERVING)" : "";
      console.log(
        `  #${ticket.ticket_number}: ${ticket.player_name} (${
          ticket.age_group
        }) - ${ticket.team_play ? "Team" : "Individual"}${status}`
      );
    });

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await pool.end();
  }
}

createTestQueue();
