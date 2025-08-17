const { pool } = require("./dist/config/db");

async function checkLatestCompetition() {
  try {
    console.log("Checking latest competitions...");

    // Get the latest competitions
    const competitionsResult = await pool.query(`
      SELECT * FROM competitions 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    console.log("Latest competitions:");
    competitionsResult.rows.forEach((comp, index) => {
      console.log(
        `${index + 1}. ID: ${comp.id}, Name: "${comp.name}", Status: ${
          comp.status
        }, Type: ${comp.type}`
      );
    });

    // Check if there's a competition with "4 players" in the name
    const newCompResult = await pool.query(`
      SELECT * FROM competitions 
      WHERE name ILIKE '%4 players%'
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (newCompResult.rows.length > 0) {
      const newComp = newCompResult.rows[0];
      console.log("\nFound new competition with 4 players:");
      console.log("- ID:", newComp.id);
      console.log("- Name:", newComp.name);
      console.log("- Status:", newComp.status);
      console.log("- Created at:", newComp.created_at);

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
      participantsResult.rows.forEach((participant, index) => {
        console.log(
          `${index + 1}. ${participant.name} (Player ID: ${
            participant.player_id
          }, Participant ID: ${participant.id})`
        );
      });

      if (participantsResult.rows.length === 0) {
        console.log(
          "\n❌ ISSUE: No participants found in the new competition!"
        );
        console.log(
          "This means the competition creation didn't properly add participants."
        );
      }
    } else {
      console.log('\nNo competition with "4 players" found in the name.');
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkLatestCompetition();
