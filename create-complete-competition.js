// Create a complete competition with participants
const { pool } = require("./dist/config/db.js");

async function createCompleteCompetition() {
  try {
    console.log("Creating a complete competition with participants...");

    // Create competition
    const competitionQuery = `
      INSERT INTO competitions (name, type, cost, kicks_per_player, status, created_at)
      VALUES ('Live Demo Competition', 'individual', 10.00, 5, 'active', NOW())
      RETURNING id, name, status
    `;
    const competitionResult = await pool.query(competitionQuery);
    const competition = competitionResult.rows[0];

    console.log("✅ Created competition:", competition);

    // Get players
    const playersQuery = `SELECT id, name FROM players ORDER BY name LIMIT 4`;
    const playersResult = await pool.query(playersQuery);

    // Add participants
    const participants = [];
    for (const player of playersResult.rows) {
      const insertQuery = `
        INSERT INTO competition_players (competition_id, player_id, created_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      await pool.query(insertQuery, [competition.id, player.id]);
      participants.push(player.name);
    }

    // Update competition name with participant count
    const updateQuery = `
      UPDATE competitions 
      SET name = 'Live Demo Competition (' || $1 || ' players)'
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [
      participants.length,
      competition.id,
    ]);

    console.log("✅ Added participants:", participants);
    console.log("✅ Updated competition name:", updateResult.rows[0].name);

    console.log(`\n🎯 Complete competition created!`);
    console.log(`   Competition ID: ${competition.id}`);
    console.log(`   Participants: ${participants.length}`);
    console.log(`   Status: active`);
    console.log(`\n📍 Test URLs:`);
    console.log(
      `   Live page (test): http://localhost:3000/staff/competition-live-test/${competition.id}`
    );
    console.log(
      `   Live page (prod): http://localhost:3000/staff/competition-live/${competition.id}`
    );

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

createCompleteCompetition();
