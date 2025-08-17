const { pool } = require("./dist/config/db");

async function checkNewCompetition() {
  try {
    console.log("Checking latest competitions...");

    // Get the latest competitions with "2 players" in the name
    const competitionsResult = await pool.query(`
      SELECT * FROM competitions 
      WHERE name ILIKE '%2 players%'
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (competitionsResult.rows.length > 0) {
      const newComp = competitionsResult.rows[0];
      console.log("\nFound new competition:");
      console.log("- ID:", newComp.id);
      console.log("- Name:", newComp.name);
      console.log("- Status:", newComp.status);
      console.log("- Created at:", newComp.created_at);
      console.log("- Type:", newComp.type);

      // Check participants in this competition
      const participantsResult = await pool.query(
        `
        SELECT cp.*, p.name 
        FROM competition_players cp
        JOIN players p ON cp.player_id = p.id
        WHERE cp.competition_id = $1
      `,
        [newComp.id]
      );

      console.log(
        "\nParticipants in this competition:",
        participantsResult.rows.length
      );

      if (participantsResult.rows.length === 0) {
        console.log("\n❌ CONFIRMED: No participants in the new competition!");
        console.log(
          "Competition creation is not adding participants to the database."
        );
      } else {
        participantsResult.rows.forEach((participant, index) => {
          console.log(
            `${index + 1}. ${participant.name} (Player ID: ${
              participant.player_id
            })`
          );
        });
      }
    } else {
      console.log('\nNo competition with "2 players" found.');
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkNewCompetition();
