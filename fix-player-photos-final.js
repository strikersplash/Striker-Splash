/**
 * Script to correctly assign profile pictures to players with specific assignments
 *
 * The goal is to ensure each player has an appropriate profile picture
 * without duplications or incorrect assignments.
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

// Define the FINAL correct mapping of players to profile pictures
// This is deliberate and not random
const FINAL_PLAYER_PHOTO_MAPPING = [
  {
    id: 1,
    name: "John Doe",
    description: "Adult male",
    // Rick Sanchez makes more sense for an adult male
    photo: "1748851001102-rick sanchez.jpg",
  },
  {
    id: 2,
    name: "Joshua Smith",
    description: "Adult male",
    // Second Rick Sanchez for another male
    photo: "1748853818679-rick-sanchez.jpg",
  },
  {
    id: 3,
    name: "Billy Kid",
    description: "Child",
    // Profile.jpeg is for the kid
    photo: "1748844098408-profile.jpeg",
  },
  {
    id: 4,
    name: "Tysha Daniels",
    description: "Adult female",
    // Anime profile picture for female character
    photo: "1748851531487-Black girl anime pfp.jpg",
  },
  {
    id: 5,
    name: "Lil Johnny",
    description: "Child",
    // Second anime profile for another character
    photo: "1748854109834-Black-girl-anime-pfp.jpg",
  },
];

async function updatePlayerPhotos() {
  try {
    console.log("Starting FINAL player profile picture update...");

    // Get current player data
    const beforeUpdate = await pool.query(`
      SELECT id, name, photo_path
      FROM players
      ORDER BY id
    `);
    console.log("Current player photos before FINAL update:");
    console.table(beforeUpdate.rows);

    // Update each player with the FINAL correct photo
    for (const player of FINAL_PLAYER_PHOTO_MAPPING) {
      const photoPath = `uploads/${player.photo}`;

      console.log(
        `Updating ${player.name} (${player.description}) (ID: ${player.id}) with photo: ${photoPath}`
      );

      const result = await pool.query(
        "UPDATE players SET photo_path = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, photo_path",
        [photoPath, player.id]
      );

      if (result.rowCount === 0) {
        console.log(`Warning: No player found with ID ${player.id}`);
      } else {
        console.log(`Successfully updated ${player.name}`);
      }
    }

    // Get updated player data
    const afterUpdate = await pool.query(`
      SELECT id, name, photo_path
      FROM players
      ORDER BY id
    `);
    console.log("\nPlayer photos after FINAL update:");
    console.table(afterUpdate.rows);

    console.log("\nFINAL photo path update complete!");
  } catch (error) {
    console.error("Error updating player photos:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
updatePlayerPhotos().then(() => {
  console.log("FINAL photo assignment script execution completed.");
});
