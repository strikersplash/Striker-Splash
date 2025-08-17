const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function logGoalForHitMakers() {
  try {
    console.log("Logging goals for Hit Makers team...");

    // Log 2 goals for Jane Doe (player 9) on Hit Makers (team 7)
    const playerId = 9;
    const teamId = 7;
    const goals = 2;
    const kicks = 2;

    await pool.query("BEGIN");

    try {
      // Update competition_players stats
      await pool.query(
        `
        UPDATE competition_players 
        SET goals = goals + $1, kicks_taken = kicks_taken + $2
        WHERE competition_id = $3 AND player_id = $4
      `,
        [goals, kicks, 78, playerId]
      );

      console.log("Updated competition_players for Jane Doe");

      // Update or insert team_stats
      const existingTeamStats = await pool.query(
        `
        SELECT * FROM team_stats WHERE team_id = $1 AND competition_id = $2
      `,
        [teamId, 78]
      );

      if (existingTeamStats.rows.length > 0) {
        await pool.query(
          `
          UPDATE team_stats 
          SET total_goals = total_goals + $1, total_attempts = total_attempts + $2, last_updated = NOW()
          WHERE team_id = $3 AND competition_id = $4
        `,
          [goals, kicks, teamId, 78]
        );
      } else {
        await pool.query(
          `
          INSERT INTO team_stats (team_id, competition_id, total_goals, total_attempts, last_updated)
          VALUES ($1, $2, $3, $4, NOW())
        `,
          [teamId, 78, goals, kicks]
        );
      }

      console.log("Updated team_stats for Hit Makers");
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

    // Check final standings
    console.log("\n=== FINAL TEAM STANDINGS ===");
    const standingsQuery = `
      SELECT ts.*, t.name as team_name
      FROM team_stats ts
      JOIN teams t ON ts.team_id = t.id  
      WHERE ts.competition_id = 78
      ORDER BY ts.total_goals DESC, ts.total_attempts ASC;
    `;

    const standingsResult = await pool.query(standingsQuery);
    console.log("Team standings:");
    standingsResult.rows.forEach((team, index) => {
      const accuracy =
        team.total_attempts > 0
          ? ((team.total_goals / team.total_attempts) * 100).toFixed(1)
          : "0.0";
      console.log(
        `${index + 1}. ${team.team_name}: ${team.total_goals} goals, ${
          team.total_attempts
        } attempts (${accuracy}% accuracy)`
      );
    });
  } catch (error) {
    console.error("Error logging goals for Hit Makers:", error);
  } finally {
    await pool.end();
  }
}

logGoalForHitMakers();
