const { pool } = require("./dist/config/db");

async function resetParticipantData() {
  try {
    console.log(
      "Resetting participant data for Billy Kid (ID: 1) in competition 71..."
    );

    const result = await pool.query(`
      UPDATE competition_players 
      SET goals = 0, kicks_taken = 0
      WHERE id = 1 AND competition_id = 71
      RETURNING *
    `);

    console.log("Reset result:", result.rows[0]);

    // Also clear any activity records
    await pool.query(`
      DELETE FROM custom_competition_activity 
      WHERE competition_id = 71 AND player_id = 3
    `);

    console.log("Cleared activity records");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

resetParticipantData();
