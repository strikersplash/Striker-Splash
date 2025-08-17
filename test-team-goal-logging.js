const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function testTeamGoalLogging() {
  try {
    console.log("Testing team goal logging after foreign key fix...");

    // Check current team stats for competition 78
    console.log("\n=== BEFORE GOAL LOGGING ===");
    const beforeQuery = `
      SELECT ts.*, t.name as team_name, c.name as competition_name, c.type as competition_type
      FROM team_stats ts
      JOIN teams t ON ts.team_id = t.id  
      JOIN competitions c ON ts.competition_id = c.id
      WHERE ts.competition_id = 78
      ORDER BY ts.team_id;
    `;

    const beforeResult = await pool.query(beforeQuery);
    console.log("Team stats before:");
    console.log(beforeResult.rows);

    // Check competition players for this team competition
    const playersQuery = `
      SELECT cp.*, p.name as player_name, t.name as team_name
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      LEFT JOIN teams t ON cp.team_id = t.id
      WHERE cp.competition_id = 78
      ORDER BY cp.team_id, cp.id;
    `;

    const playersResult = await pool.query(playersQuery);
    console.log("\nCompetition players:");
    console.log(playersResult.rows);

    if (playersResult.rows.length === 0) {
      console.log("No players found for competition 78!");
      return;
    }

    // Get the first player from the first team
    const firstPlayer = playersResult.rows[0];
    const playerId = firstPlayer.player_id;
    const teamId = firstPlayer.team_id;

    console.log(
      `\nSimulating goal for player ${playerId} (${firstPlayer.player_name}) on team ${teamId} (${firstPlayer.team_name})`
    );

    // Simulate logging a goal by directly updating the database like the controller would
    await pool.query("BEGIN");

    try {
      // Update competition_players stats
      await pool.query(
        `
        UPDATE competition_players 
        SET goals = goals + 1, kicks_taken = kicks_taken + 1
        WHERE competition_id = $1 AND player_id = $2
      `,
        [78, playerId]
      );

      console.log("Updated competition_players table");

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
          SET total_goals = total_goals + 1, total_attempts = total_attempts + 1, last_updated = NOW()
          WHERE team_id = $1 AND competition_id = $2
        `,
          [teamId, 78]
        );
      } else {
        await pool.query(
          `
          INSERT INTO team_stats (team_id, competition_id, total_goals, total_attempts, last_updated)
          VALUES ($1, $2, 1, 1, NOW())
        `,
          [teamId, 78]
        );
      }

      console.log("Updated team_stats table");

      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }

    // Check team stats after logging goal
    console.log("\n=== AFTER GOAL LOGGING ===");
    const afterResult = await pool.query(beforeQuery);
    console.log("Team stats after:");
    console.log(afterResult.rows);

    // Check updated competition_players
    const updatedPlayersQuery = `
      SELECT cp.*, p.name as player_name, t.name as team_name
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      LEFT JOIN teams t ON cp.team_id = t.id
      WHERE cp.competition_id = 78 AND cp.player_id = $1;
    `;

    const updatedPlayerResult = await pool.query(updatedPlayersQuery, [
      playerId,
    ]);
    console.log("\nUpdated player stats:");
    console.log(updatedPlayerResult.rows);
  } catch (error) {
    console.error("Error testing team goal logging:", error);
  } finally {
    await pool.end();
  }
}

testTeamGoalLogging();
