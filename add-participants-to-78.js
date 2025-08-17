const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function addParticipantsToTeamCompetition() {
  try {
    console.log("Adding participants to team competition 78...");

    // Check available teams
    const teamsQuery = `SELECT id, name FROM teams ORDER BY id LIMIT 10;`;
    const teamsResult = await pool.query(teamsQuery);
    console.log("Available teams:");
    console.log(teamsResult.rows);

    if (teamsResult.rows.length < 2) {
      console.log("Need at least 2 teams for team competition!");
      return;
    }

    // Get players for the first two teams
    const team1Id = teamsResult.rows[0].id;
    const team2Id = teamsResult.rows[1].id;

    console.log(
      `Using teams: ${team1Id} (${teamsResult.rows[0].name}) and ${team2Id} (${teamsResult.rows[1].name})`
    );

    // Get players for these teams
    const playersQuery = `
      SELECT p.id, p.name, tm.team_id
      FROM players p
      JOIN team_members tm ON p.id = tm.player_id
      WHERE tm.team_id IN ($1, $2)
      ORDER BY tm.team_id, p.id;
    `;

    const playersResult = await pool.query(playersQuery, [team1Id, team2Id]);
    console.log("\nAvailable players:");
    console.log(playersResult.rows);

    if (playersResult.rows.length === 0) {
      console.log("No players found for these teams!");
      return;
    }

    // Add players to competition
    for (const player of playersResult.rows) {
      try {
        await pool.query(
          `
          INSERT INTO competition_players (competition_id, player_id, team_id, goals, kicks_taken, percentage, last_updated)
          VALUES ($1, $2, $3, 0, 0, 0.0, NOW())
          ON CONFLICT (competition_id, player_id) DO NOTHING
        `,
          [78, player.id, player.team_id]
        );

        console.log(
          `Added player ${player.id} (${player.name}) from team ${player.team_id}`
        );
      } catch (error) {
        console.error(`Error adding player ${player.id}:`, error.message);
      }
    }

    // Initialize team_stats for both teams
    for (const teamId of [team1Id, team2Id]) {
      try {
        await pool.query(
          `
          INSERT INTO team_stats (team_id, competition_id, total_goals, total_attempts, last_updated)
          VALUES ($1, $2, 0, 0, NOW())
          ON CONFLICT (team_id, competition_id) DO NOTHING
        `,
          [teamId, 78]
        );

        console.log(`Initialized team_stats for team ${teamId}`);
      } catch (error) {
        console.error(
          `Error initializing team_stats for team ${teamId}:`,
          error.message
        );
      }
    }

    // Verify participants were added
    const checkQuery = `
      SELECT cp.*, p.name as player_name, t.name as team_name
      FROM competition_players cp
      JOIN players p ON cp.player_id = p.id
      LEFT JOIN teams t ON cp.team_id = t.id
      WHERE cp.competition_id = 78
      ORDER BY cp.team_id, cp.id;
    `;

    const checkResult = await pool.query(checkQuery);
    console.log("\nFinal participants in competition 78:");
    console.log(checkResult.rows);
  } catch (error) {
    console.error("Error adding participants:", error);
  } finally {
    await pool.end();
  }
}

addParticipantsToTeamCompetition();
