/**
 * Script to correctly assign profile pictures to players
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

// Define the correct mapping of players to profile pictures
const playerPhotoMapping = [
  {
    id: 1,
    name: "John Doe",
    photo: "1748853818679-rick-sanchez.jpg", // Assign Rick Sanchez to John Doe
  },
  {
    id: 2,
    name: "Joshua Smith",
    photo: "1748851531487-Black girl anime pfp.jpg", // Assign the anime profile to Joshua
  },
  {
    id: 3,
    name: "Billy Kid",
    photo: "1748844098408-profile.jpeg", // Assign the profile.jpeg to Billy Kid
  },
  {
    id: 4,
    name: "Tysha Daniels",
    photo: "1748851001102-rick sanchez.jpg", // Original Rick Sanchez photo for Tysha
  },
  {
    id: 5,
    name: "Lil Johnny",
    photo: "1748854109834-Black-girl-anime-pfp.jpg", // Second anime pfp for Lil Johnny
  },
];

async function updatePlayerPhotos() {
  try {
    console.log("Starting player profile picture update...");

    // Get current player data
    const beforeUpdate = await pool.query(`
      SELECT id, name, photo_path
      FROM players
      ORDER BY id
    `);
    console.log("Current player photos before update:");
    console.table(beforeUpdate.rows);

    // Update each player with the correct photo
    for (const player of playerPhotoMapping) {
      const photoPath = `uploads/${player.photo}`;

      console.log(
        `Updating ${player.name} (ID: ${player.id}) with photo: ${photoPath}`
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
    console.log("\nPlayer photos after update:");
    console.table(afterUpdate.rows);

    console.log("\nPhoto path update complete!");
  } catch (error) {
    console.error("Error updating player photos:", error);
  } finally {
    await pool.end();
  }
}

// Run the script
updatePlayerPhotos().then(() => {
  console.log("Script execution completed.");
});
