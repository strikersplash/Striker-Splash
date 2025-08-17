const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function addTestTeamGames() {
  const client = await pool.connect();
  try {
    console.log("Adding test team game data...");

    // Check database connection
    const testResult = await client.query("SELECT NOW()");
    console.log("Database connected at:", testResult.rows[0].now);

    // Get team members
    const membersResult = await client.query(`
      SELECT tm.player_id, p.name 
      FROM team_members tm 
      JOIN players p ON tm.player_id = p.id 
      WHERE tm.team_id = 1
    `);

    const members = membersResult.rows;
    console.log(
      `Found ${members.length} team members:`,
      members.map((m) => m.name)
    );

    // Get a staff member to assign as referee
    const staffResult = await client.query("SELECT id FROM staff LIMIT 1");
    const staffId = staffResult.rows[0]?.id || 1;
    console.log(`Using staff ID: ${staffId}`);

    // Create test team games for each member
    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      // Create a queue ticket for team play
      const ticketNumber = `TEAM-${Date.now()}-${i}`;
      console.log(`Creating ticket ${ticketNumber} for ${member.name}`);

      const ticketResult = await client.query(
        `
        INSERT INTO queue_tickets (player_id, ticket_number, status, official, team_play) 
        VALUES ($1, $2, 'played', true, true) 
        RETURNING id
      `,
        [member.player_id, ticketNumber]
      );

      const ticketId = ticketResult.rows[0].id;
      console.log(`Created ticket ID: ${ticketId}`);

      // Create game stats with some test goals (2-4 goals out of 5 attempts)
      const goals = Math.floor(Math.random() * 3) + 2; // 2-4 goals

      await client.query(
        `
        INSERT INTO game_stats (player_id, staff_id, goals, queue_ticket_id, team_play) 
        VALUES ($1, $2, $3, $4, true)
      `,
        [member.player_id, staffId, goals, ticketId]
      );

      console.log(`Added team game for ${member.name}: ${goals}/5 goals`);
    }

    console.log("Test team game data added successfully!");
    console.log("Team dashboard should now show team-specific goals.");
  } catch (error) {
    console.error("Error adding test team games:", error);
  } finally {
    client.release();
  }
}

addTestTeamGames();
