// Debug competition participant counts
const { Pool } = require("pg");
const { pool } = require("./dist/config/db");

async function debugParticipantCounts() {
  try {
    console.log("🔍 Debugging participant counts...");

    // Check the actual data in the tables
    console.log("\n=== COMPETITIONS TABLE ===");
    const competitions = await pool.query(`
      SELECT id, name, type, status, created_at 
      FROM competitions 
      WHERE status IN ('waiting', 'active')
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    competitions.rows.forEach((comp) => {
      console.log(
        `Competition ${comp.id}: ${comp.name} (${comp.type}, ${comp.status})`
      );
    });

    console.log("\n=== COMPETITION_PLAYERS TABLE ===");
    const players = await pool.query(`
      SELECT competition_id, COUNT(*) as player_count
      FROM competition_players 
      GROUP BY competition_id
      ORDER BY competition_id DESC
    `);

    players.rows.forEach((p) => {
      console.log(`Competition ${p.competition_id}: ${p.player_count} players`);
    });

    console.log("\n=== COMPETITION_TEAMS TABLE ===");
    const teams = await pool.query(`
      SELECT competition_id, COUNT(*) as team_count
      FROM competition_teams 
      GROUP BY competition_id
      ORDER BY competition_id DESC
    `);

    teams.rows.forEach((t) => {
      console.log(`Competition ${t.competition_id}: ${t.team_count} teams`);
    });

    console.log("\n=== QUEUE QUERY RESULT ===");
    const queueQuery = `
      SELECT 
        c.*,
        COUNT(DISTINCT cp.player_id) as participant_count,
        COUNT(DISTINCT ct.team_id) as team_count
      FROM competitions c
      LEFT JOIN competition_players cp ON c.id = cp.competition_id
      LEFT JOIN competition_teams ct ON c.id = ct.competition_id
      WHERE c.status IN ('waiting', 'active')
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 3
    `;

    const queueResult = await pool.query(queueQuery);
    queueResult.rows.forEach((comp) => {
      console.log(`${comp.name}:`);
      console.log(`  Type: ${comp.type}`);
      console.log(`  Participant Count: ${comp.participant_count}`);
      console.log(`  Team Count: ${comp.team_count}`);
      console.log("");
    });

    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

debugParticipantCounts();
