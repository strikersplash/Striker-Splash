/**
 * Final verification test for team goal logging functionality
 * This script will create a test team competition and verify the key functionality
 */
const { Pool } = require("pg");
const fs = require("fs");

// Configure database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "striker_splash",
  password: "postgres",
  port: 5432,
});

// Test configuration
const config = {
  competitionName: "Final Test - Team Goal Logging",
  teams: [
    { name: "Small Team FC", memberCount: 8 },
    { name: "Large Team United", memberCount: 15 },
  ],
  logFile: "final-verification-test.log",
};

// Utility to log messages both to console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(config.logFile, logMessage + "\n");
}

// Clear previous log file
fs.writeFileSync(config.logFile, "");
log("Starting final verification test");

async function runTest() {
  let competitionId = null;
  let client = null;

  try {
    log("Connecting to database...");
    client = await pool.connect();
    log("Database connection established");

    // Create test competition
    log("Creating test team competition");
    const compResult = await client.query(
      `
      INSERT INTO competitions (name, type, format, cost, kicks_per_player, status, created_at)
      VALUES ($1, 'team', 'league', 5.00, 5, 'active', NOW())
      RETURNING id
    `,
      [config.competitionName]
    );

    competitionId = compResult.rows[0].id;
    log(`Created competition with ID: ${competitionId}`);

    // Create test teams
    for (const team of config.teams) {
      log(`Creating team: ${team.name}`);

      // Create team in teams table
      const teamResult = await client.query(
        `
        INSERT INTO teams (name, photo, slug, created_at, category)
        VALUES ($1, '/placeholder.jpg', $2, NOW(), 'test')
        RETURNING id
      `,
        [team.name, team.name.toLowerCase().replace(/\s+/g, "-")]
      );

      const teamId = teamResult.rows[0].id;
      log(`Created team with ID: ${teamId}`);

      // Add team to competition
      await client.query(
        `
        INSERT INTO competition_teams (competition_id, team_id, joined_at)
        VALUES ($1, $2, NOW())
      `,
        [competitionId, teamId]
      );
      log(`Added team ${teamId} to competition ${competitionId}`);

      // Create team members
      for (let i = 1; i <= team.memberCount; i++) {
        const memberName = `Player ${i} (${team.name})`;
        const playerResult = await client.query(
          `
          INSERT INTO players (name, age_group, residence, photo, created_at)
          VALUES ($1, 'U12', 'Local Area', '/placeholder.jpg', NOW())
          RETURNING id
        `,
          [memberName]
        );

        const playerId = playerResult.rows[0].id;

        // Add player to team
        await client.query(
          `
          INSERT INTO team_players (team_id, player_id, joined_at)
          VALUES ($1, $2, NOW())
        `,
          [teamId, playerId]
        );

        log(`Added player ${memberName} (ID: ${playerId}) to team ${teamId}`);
      }
    }

    log(`\n===== TEST COMPETITION CREATED =====`);
    log(`Competition ID: ${competitionId}`);
    log(`Type: Team competition`);
    log(`Teams created: ${config.teams.map((t) => t.name).join(", ")}`);
    log(
      `\nTest URL: http://localhost:3000/staff/competition-live/${competitionId}`
    );
    log(`\nVerification steps:`);
    log(`1. Open the URL in your browser`);
    log(`2. For Small Team FC: Verify all members can log goals immediately`);
    log(`3. For Large Team United: Verify you must select 11 players first`);
    log(`4. Log goals for team members and verify UI updates`);
    log(`5. Check leaderboard updates after refreshing`);

    return competitionId;
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
  } finally {
    if (client) client.release();
  }
}

// Run the test
runTest()
  .then((competitionId) => {
    log(`\nTest completed. Competition ID: ${competitionId}`);
    pool.end();
  })
  .catch((error) => {
    log(`Test failed: ${error.message}`);
    pool.end();
  });
