const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function addTestTeamGameStats() {
  try {
    console.log("Adding test team game stats...");

    // Get team members for team ID 1 (Ace Strikers)
    const membersResult = await pool.query(
      "SELECT player_id FROM team_members WHERE team_id = 1"
    );

    if (membersResult.rows.length === 0) {
      console.log("No team members found for team 1");
      return;
    }

    console.log(`Found ${membersResult.rows.length} team members`);

    // Get a staff member to assign to the game stats
    const staffResult = await pool.query("SELECT id FROM staff LIMIT 1");
    if (staffResult.rows.length === 0) {
      console.log("No staff found, cannot create game stats");
      return;
    }

    const staffId = staffResult.rows[0].id;
    console.log(`Using staff ID: ${staffId}`);

    // Add some test team game stats for each member
    for (const member of membersResult.rows) {
      const playerId = member.player_id;

      // Create a queue ticket first
      const ticketNumber = Date.now() + Math.floor(Math.random() * 1000); // Generate unique ticket number
      const ticketResult = await pool.query(
        `INSERT INTO queue_tickets (ticket_number, player_id, status, official, created_at) 
         VALUES ($1, $2, 'played', true, NOW()) RETURNING id`,
        [ticketNumber, playerId]
      );

      const ticketId = ticketResult.rows[0].id;

      // Add some team game stats (3 goals out of 5 attempts = 60% accuracy)
      await pool.query(
        `INSERT INTO game_stats (player_id, staff_id, goals, queue_ticket_id, team_play, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())`,
        [playerId, staffId, 3, ticketId]
      );

      console.log(
        `Added team game stats for player ${playerId}: 3 goals, team_play=true`
      );
    }

    console.log("Test team game stats added successfully!");
    console.log("The team should now show:");
    console.log("- Team total goals: 3 per member");
    console.log("- Team total attempts: 5 per member");
    console.log("- Team accuracy: 60%");
    console.log("- Each member: 3 goals (team games only)");
  } catch (error) {
    console.error("Error adding test team game stats:", error);
  } finally {
    await pool.end();
  }
}

addTestTeamGameStats();
