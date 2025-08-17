const { pool } = require("./dist/config/db");

async function addParticipantsToCompetition() {
  try {
    console.log("Adding participants to competition 74...");

    // Get some players to add
    const playersResult = await pool.query(`
      SELECT id, name FROM players 
      ORDER BY name 
      LIMIT 4
    `);

    console.log("Available players:");
    playersResult.rows.forEach((player) => {
      console.log(`- ${player.name} (ID: ${player.id})`);
    });

    // Add these players to competition 74
    for (const player of playersResult.rows) {
      try {
        const insertResult = await pool.query(
          `
          INSERT INTO competition_players (competition_id, player_id, goals, kicks_taken)
          VALUES ($1, $2, 0, 0)
          RETURNING *
        `,
          [74, player.id]
        );

        console.log(`✓ Added ${player.name} to competition 74`);
      } catch (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          console.log(`- ${player.name} already in competition 74`);
        } else {
          console.error(`Error adding ${player.name}:`, error.message);
        }
      }
    }

    // Verify participants were added
    const verifyResult = await pool.query(`
      SELECT cp.*, p.name 
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.competition_id = 74
    `);

    console.log("\nParticipants in competition 74:");
    verifyResult.rows.forEach((participant, index) => {
      console.log(
        `${index + 1}. ${participant.name} (Participant ID: ${
          participant.id
        }, Goals: ${participant.goals}, Kicks: ${participant.kicks_taken})`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

addParticipantsToCompetition();
