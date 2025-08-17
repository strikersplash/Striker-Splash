/**
 * Script to update photo_path values for players in the database
 *
 * This script:
 * 1. Gets a list of existing profile images from the uploads directory
 * 2. Gets a list of players from the database
 * 3. Updates a random selection of players to use available profile images
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Database connection configuration
const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

// Path to the uploads directory
const uploadsDir = path.join(__dirname, "public", "uploads");

// Get a list of image files from the uploads directory
async function getImageFiles() {
  try {
    const files = await fs.promises.readdir(uploadsDir);
    return files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif"].includes(ext);
    });
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    return [];
  }
}

// Get players from the database
async function getPlayers() {
  try {
    const result = await pool.query("SELECT id, name FROM players");
    return result.rows;
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
}

// Update player photo paths
async function updatePhotoPath(playerId, photoPath) {
  try {
    const result = await pool.query(
      "UPDATE players SET photo_path = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name",
      [`uploads/${photoPath}`, playerId]
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating player ${playerId}:`, error);
    return null;
  }
}

// Main function to run the script
async function main() {
  try {
    // Get available image files
    const imageFiles = await getImageFiles();
    if (imageFiles.length === 0) {
      console.error("No image files found in uploads directory");
      return;
    }
    console.log(`Found ${imageFiles.length} image files in uploads directory`);

    // Get players from database
    const players = await getPlayers();
    if (players.length === 0) {
      console.error("No players found in database");
      return;
    }
    console.log(`Found ${players.length} players in database`);

    // Update a selection of players with random images
    // Determine how many players to update (up to 10 or however many we have)
    const numToUpdate = Math.min(10, players.length);
    const selectedPlayers = players
      .sort(() => 0.5 - Math.random())
      .slice(0, numToUpdate);

    console.log(`Updating ${numToUpdate} players with profile images...`);

    for (let i = 0; i < selectedPlayers.length; i++) {
      const player = selectedPlayers[i];
      // Select a random image
      const randomImage = imageFiles[i % imageFiles.length];

      // Update player's photo_path
      const updated = await updatePhotoPath(player.id, randomImage);

      if (updated) {
        console.log(
          `Updated player ${updated.name} (ID: ${updated.id}) with photo_path: uploads/${randomImage}`
        );
      }
    }

    console.log("Photo path update complete!");
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
main();
