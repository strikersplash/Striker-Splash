// Verify the goal tracking system is working
const { pool } = require("./dist/config/db.js");

async function verifyGoalTracking() {
  try {
    console.log("Verifying goal tracking system...");

    // Check current participants with their goal data
    const participantsQuery = `
      SELECT 
        cp.id,
        cp.competition_id,
        cp.player_id,
        cp.goals,
        cp.kicks_taken,
        p.name as player_name,
        c.name as competition_name
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      JOIN competitions c ON cp.competition_id = c.id
      WHERE c.status = 'active'
      ORDER BY c.id, p.name;
    `;

    const result = await pool.query(participantsQuery);

    console.log("Current participants with goal tracking:");
    console.log("Comp ID | Player Name    | Goals | Kicks | Competition");
    console.log("-".repeat(60));

    result.rows.forEach((row) => {
      console.log(
        `${row.competition_id.toString().padEnd(7)} | ` +
          `${row.player_name.padEnd(14)} | ` +
          `${row.goals.toString().padEnd(5)} | ` +
          `${row.kicks_taken.toString().padEnd(5)} | ` +
          `${row.competition_name}`
      );
    });

    if (result.rows.length === 0) {
      console.log("No active competitions with participants found.");
    } else {
      console.log(
        `\n✅ Found ${result.rows.length} participants ready for goal tracking!`
      );
    }

    pool.end();
  } catch (error) {
    console.error("Error verifying goal tracking:", error);
    pool.end();
  }
}

verifyGoalTracking();
