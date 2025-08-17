/**
 * Script to check player table structure and data
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

async function checkPlayerTable() {
  try {
    // Get player table structure
    console.log("--- PLAYER TABLE STRUCTURE ---");
    const tableStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'players'
    `);
    console.log(tableStructure.rows);

    // Get player data
    console.log("\n--- PLAYER DATA ---");
    const playerData = await pool.query(`
      SELECT id, name, phone, photo_path, profile_picture
      FROM players
    `);
    console.log(playerData.rows);

    // Get list of files in uploads directory
    console.log("\n--- AVAILABLE PROFILE PICTURES ---");
    // We'll use JavaScript to list the files in the uploads directory
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "public", "uploads");

    try {
      const files = fs.readdirSync(uploadsDir);
      const imageFiles = files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".gif"].includes(ext);
      });
      console.log(imageFiles);
    } catch (err) {
      console.error("Error reading uploads directory:", err);
    }
  } catch (error) {
    console.error("Error checking player table:", error);
  } finally {
    await pool.end();
  }
}

checkPlayerTable();
