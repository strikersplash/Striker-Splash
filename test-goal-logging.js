const { pool } = require("./dist/config/db");

async function testGoalLogging() {
  try {
    console.log("Testing goal logging and UI updates...");

    // Check current state of participant 1 in competition 71
    const beforeResult = await pool.query(`
      SELECT cp.*, p.name 
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.id = 1 AND cp.competition_id = 71
    `);

    console.log("Before state:", beforeResult.rows[0]);

    // Test the leaderboard endpoint
    console.log("\nTesting leaderboard endpoint...");
    const leaderboardResult = await pool.query(`
      SELECT 
        cp.*,
        p.name,
        p.age_group,
        p.residence,
        COALESCE(cp.goals, 0) as goals,
        COALESCE(cp.kicks_taken, 0) as kicks_taken,
        CASE 
          WHEN COALESCE(cp.kicks_taken, 0) > 0 
          THEN ROUND((COALESCE(cp.goals, 0)::numeric / cp.kicks_taken::numeric) * 100, 1)
          ELSE 0 
        END as accuracy
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      WHERE cp.competition_id = 71
      ORDER BY COALESCE(cp.goals, 0) DESC, COALESCE(cp.kicks_taken, 0) ASC, p.name ASC
    `);

    console.log("Leaderboard data:");
    leaderboardResult.rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.name}: ${row.goals} goals, ${
          row.kicks_taken
        } kicks, ${row.accuracy}% accuracy`
      );
    });

    // Check activity logging would work
    console.log("\nTesting activity logging...");
    const testActivityResult = await pool.query(`
      SELECT COUNT(*) as count FROM custom_competition_activity 
      WHERE competition_id = 71
    `);

    console.log(
      "Current activity records for competition 71:",
      testActivityResult.rows[0].count
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testGoalLogging();
