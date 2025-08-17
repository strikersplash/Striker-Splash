require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function updatePhoto() {
  try {
    console.log("Updating Lil Johnny photo path...");
    await pool.query("UPDATE players SET photo_path = $1 WHERE id = $2", [
      "/uploads/1748844098408-profile.jpeg",
      5,
    ]);
    console.log("✓ Updated successfully");

    const result = await pool.query(
      "SELECT name, photo_path FROM players WHERE id = 5"
    );
    console.log("Verification:", result.rows[0]);

    await pool.end();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updatePhoto();
