// Script to retrieve all players and their phone numbers from database
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// Create a new pool for database connection
const pool = new Pool({
  host: "localhost",
  user: "striker_splash",
  password: "striker_splash",
  database: "striker_splash",
  port: 5432,
});

async function getAllPlayerPhones() {
  try {
    // Connect to the database
    const client = await pool.connect();

    // Query to get all players with their phone numbers
    const query = `
      SELECT id, name, phone, is_child_account, parent_phone, created_at
      FROM players
      ORDER BY name ASC
    `;

    const result = await client.query(query);

    // Log the player information
    console.log("\n===== PLAYER PHONE NUMBERS =====\n");
    console.log("Total players found:", result.rows.length);
    console.log("\n");

    // Format and display the player information
    result.rows.forEach((player) => {
      const phoneDisplay = player.is_child_account
        ? `${player.phone} (ID Number) | Parent: ${
            player.parent_phone || "None provided"
          }`
        : player.phone || "No phone number";

      console.log(`${player.name}`);
      console.log(`Phone: ${phoneDisplay}`);
      console.log(`Created: ${new Date(player.created_at).toLocaleString()}`);
      console.log(`ID: ${player.id}`);
      console.log("------------------------------");
    });

    client.release();
  } catch (err) {
    console.error("Error executing query", err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Execute the function
getAllPlayerPhones();
