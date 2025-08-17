// Check participants for a competition
const { pool } = require("./dist/config/db.js");

async function checkParticipants(competitionId) {
  try {
    console.log(`Checking participants for competition ${competitionId}...`);

    // Check competition details
    const competitionQuery = `SELECT * FROM competitions WHERE id = $1`;
    const competitionResult = await pool.query(competitionQuery, [
      competitionId,
    ]);

    if (competitionResult.rows.length === 0) {
      console.log("Competition not found!");
      return;
    }

    const competition = competitionResult.rows[0];
    console.log("Competition:", {
      id: competition.id,
      name: competition.name,
      type: competition.type,
      status: competition.status,
    });

    // Check participants in competition_players table
    const participantsQuery = `
      SELECT 
        cp.*,
        p.name,
        p.age_group,
        p.residence
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.competition_id = $1
      ORDER BY p.name ASC
    `;
    const participantsResult = await pool.query(participantsQuery, [
      competitionId,
    ]);

    console.log(`Found ${participantsResult.rows.length} participants:`);
    participantsResult.rows.forEach((participant) => {
      console.log(`- ${participant.name} (ID: ${participant.player_id})`);
    });

    if (participantsResult.rows.length === 0) {
      console.log(
        "No participants found! Need to add some participants to the competition."
      );

      // Check if there are any players in the database at all
      const allPlayersQuery = `SELECT id, name FROM players ORDER BY name LIMIT 5`;
      const allPlayersResult = await pool.query(allPlayersQuery);

      console.log("Available players in database:");
      allPlayersResult.rows.forEach((player) => {
        console.log(`- ${player.name} (ID: ${player.id})`);
      });

      if (allPlayersResult.rows.length > 0) {
        console.log("Would you like me to add some test participants?");
      }
    }

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

// Get competition ID from command line or use default
const competitionId = process.argv[2] || 71;
checkParticipants(competitionId);
