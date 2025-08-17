/**
 * Script to verify that all player photo paths actually exist in the uploads directory
 * This helps diagnose any issues with profile pictures not displaying
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

async function verifyPlayerPhotos() {
  try {
    console.log("Starting player photo verification...");
    console.log("Uploads directory:", uploadsDir);

    // Get list of files in uploads directory
    const files = fs.readdirSync(uploadsDir);
    console.log("Files in uploads directory:", files);

    // Get current player data
    const players = await pool.query(`
      SELECT id, name, photo_path
      FROM players
      ORDER BY id
    `);

    console.log("\nChecking player photo paths against actual files:");
    console.log("=================================================");

    // Check each player's photo path
    for (const player of players.rows) {
      // Extract just the filename from photo_path
      const pathParts = player.photo_path ? player.photo_path.split("/") : [];
      const filename =
        pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;

      if (!filename) {
        console.log(`❌ ${player.name} (ID: ${player.id}): No photo_path set`);
        continue;
      }

      // Check if file exists in uploads directory
      const exists = files.includes(filename);
      if (exists) {
        console.log(
          `✅ ${player.name} (ID: ${player.id}): ${filename} - File exists`
        );
      } else {
        console.log(
          `❌ ${player.name} (ID: ${player.id}): ${filename} - FILE MISSING`
        );
      }
    }

    console.log("\nPhoto path verification complete!");
  } catch (error) {
    console.error("Error verifying player photos:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
verifyPlayerPhotos();
