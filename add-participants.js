// Add participants to a competition
const { pool } = require("./dist/config/db.js");

async function addParticipants(competitionId) {
  try {
    console.log(`Adding participants to competition ${competitionId}...`);

    // Get some players from the database
    const playersQuery = `SELECT id, name FROM players ORDER BY name LIMIT 4`;
    const playersResult = await pool.query(playersQuery);

    if (playersResult.rows.length === 0) {
      console.log("No players found in database!");
      return;
    }

    console.log("Available players:", playersResult.rows);

    // Add the first 3 players to the competition
    const playersToAdd = playersResult.rows.slice(0, 3);

    for (const player of playersToAdd) {
      // Check if player is already in competition
      const existingQuery = `
        SELECT * FROM competition_players 
        WHERE competition_id = $1 AND player_id = $2
      `;
      const existingResult = await pool.query(existingQuery, [
        competitionId,
        player.id,
      ]);

      if (existingResult.rows.length === 0) {
        // Add player to competition
        const insertQuery = `
          INSERT INTO competition_players (competition_id, player_id, created_at)
          VALUES ($1, $2, NOW())
          RETURNING *
        `;
        const insertResult = await pool.query(insertQuery, [
          competitionId,
          player.id,
        ]);
        console.log(`✅ Added ${player.name} to competition`);
      } else {
        console.log(`⚠️ ${player.name} already in competition`);
      }
    }

    // Update competition name to reflect participant count
    const updateNameQuery = `
      UPDATE competitions 
      SET name = 'Individual Competition (' || $1 || ' players)',
          status = 'active'
      WHERE id = $2
      RETURNING *
    `;
    const updateResult = await pool.query(updateNameQuery, [
      playersToAdd.length,
      competitionId,
    ]);
    console.log("✅ Updated competition name:", updateResult.rows[0].name);

    console.log(
      `\n🎯 Competition ${competitionId} now has ${playersToAdd.length} participants!`
    );
    console.log(
      `📍 View at: http://localhost:3000/staff/competition-live-test/${competitionId}`
    );

    pool.end();
  } catch (error) {
    console.error("Error:", error);
    pool.end();
  }
}

// Get competition ID from command line or use default
const competitionId = process.argv[2] || 71;
addParticipants(competitionId);
