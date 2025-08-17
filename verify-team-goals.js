const { pool } = require("./dist/config/db");

async function main() {
  try {
    // Check the custom_competition_activity data for team 1
    console.log("\n--- Team 1 activity details ---");
    const team1ActivityQuery = `
      SELECT player_id, goals, kicks_used
      FROM custom_competition_activity 
      WHERE team_id = 1
      ORDER BY logged_at
    `;
    const team1Result = await pool.query(team1ActivityQuery);
    console.log(JSON.stringify(team1Result.rows, null, 2));

    // Calculate totals for verification
    const team1Goals = team1Result.rows.reduce(
      (sum, entry) => sum + parseInt(entry.goals || 0),
      0
    );
    const team1Attempts = team1Result.rows.reduce(
      (sum, entry) => sum + parseInt(entry.kicks_used || 0),
      0
    );

    console.log(`Team 1 total goals: ${team1Goals}`);
    console.log(`Team 1 total attempts: ${team1Attempts}`);

    // Check the custom_competition_activity data for team 7
    console.log("\n--- Team 7 activity details ---");
    const team7ActivityQuery = `
      SELECT player_id, goals, kicks_used
      FROM custom_competition_activity 
      WHERE team_id = 7
      ORDER BY logged_at
    `;
    const team7Result = await pool.query(team7ActivityQuery);
    console.log(JSON.stringify(team7Result.rows, null, 2));

    // Calculate totals for verification
    const team7Goals = team7Result.rows.reduce(
      (sum, entry) => sum + parseInt(entry.goals || 0),
      0
    );
    const team7Attempts = team7Result.rows.reduce(
      (sum, entry) => sum + parseInt(entry.kicks_used || 0),
      0
    );

    console.log(`Team 7 total goals: ${team7Goals}`);
    console.log(`Team 7 total attempts: ${team7Attempts}`);

    // Get the team leaderboard data
    console.log("\n--- Simplified team leaderboard ---");
    const leaderboardQuery = `
      WITH team_activity AS (
        SELECT
          cca.team_id,
          SUM(cca.goals) as goals,
          SUM(cca.kicks_used) as attempts,
          MAX(cca.logged_at) as last_activity
        FROM custom_competition_activity cca
        WHERE cca.team_id IS NOT NULL
        GROUP BY cca.team_id
      )
      
      SELECT 
        t.id,
        t.name,
        COALESCE(ta.goals, 0) as total_goals,
        COALESCE(ta.attempts, 0) as total_attempts
      FROM teams t
      LEFT JOIN team_activity ta ON ta.team_id = t.id
      WHERE t.id IN (1, 7)
      ORDER BY total_goals DESC
    `;

    const leaderboardResult = await pool.query(leaderboardQuery);
    console.log(JSON.stringify(leaderboardResult.rows, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
