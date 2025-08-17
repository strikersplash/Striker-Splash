/**
 * Script to check if player photo paths were updated
 */

const { Pool } = require("pg");

// Database connection configuration
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkPhotoPaths() {
  try {
    // Check how many players have photo_path set
    const photoCountResult = await pool.query(
      "SELECT COUNT(*) FROM players WHERE photo_path IS NOT NULL"
    );
    const photoCount = parseInt(photoCountResult.rows[0].count);
    console.log(`Number of players with photo_path set: ${photoCount}`);

    // Get sample of players with photo_path set
    if (photoCount > 0) {
      const playersWithPhotos = await pool.query(
        "SELECT id, name, photo_path FROM players WHERE photo_path IS NOT NULL LIMIT 5"
      );
      console.log("Sample of players with photos:");
      playersWithPhotos.rows.forEach((player) => {
        console.log(
          `- Player ${player.name} (ID: ${player.id}): ${player.photo_path}`
        );
      });
    }

    // Check total number of players
    const totalPlayersResult = await pool.query("SELECT COUNT(*) FROM players");
    const totalPlayers = parseInt(totalPlayersResult.rows[0].count);
    console.log(`Total number of players in database: ${totalPlayers}`);
  } catch (error) {
    console.error("Error checking player photo paths:", error);
  } finally {
    await pool.end();
  }
}

checkPhotoPaths();
