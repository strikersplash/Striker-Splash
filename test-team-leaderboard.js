const { pool } = require("./dist/config/db");

async function main() {
  try {
    const query = `
      WITH team_activity AS (
        -- Calculate team totals from custom_competition_activity
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
        t.slug,
        t.team_size,
        COUNT(DISTINCT tm.player_id) as member_count,
        COALESCE(ta.goals, 0) as total_goals,
        COALESCE(ta.attempts, 0) as total_attempts,
        ta.last_activity
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      LEFT JOIN team_activity ta ON ta.team_id = t.id
      GROUP BY t.id, t.name, t.slug, t.team_size, ta.goals, ta.attempts, ta.last_activity
      HAVING COUNT(DISTINCT tm.player_id) > 0
      ORDER BY total_goals DESC
      LIMIT 5
    `;

    console.log("Running team leaderboard query...");
    const result = await pool.query(query);
    console.log("Results:", JSON.stringify(result.rows, null, 2));

    // Calculate totals for verification
    const totalGoals = result.rows.reduce(
      (sum, team) => sum + parseInt(team.total_goals || 0),
      0
    );
    const totalAttempts = result.rows.reduce(
      (sum, team) => sum + parseInt(team.total_attempts || 0),
      0
    );

    console.log(`Total goals across all teams: ${totalGoals}`);
    console.log(`Total attempts across all teams: ${totalAttempts}`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

main();
