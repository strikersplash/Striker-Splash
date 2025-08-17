// Quick check of latest competition
const { Pool } = require("pg");
const { pool } = require("./dist/config/db");

async function checkLatest() {
  try {
    const result = await pool.query(
      "SELECT id, name, status FROM competitions ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length > 0) {
      console.log("Latest competition:", result.rows[0]);
      console.log(
        "Live page URL: http://localhost:3000/staff/competition-live/" +
          result.rows[0].id
      );
    } else {
      console.log("No competitions found");
    }
    await pool.end();
  } catch (error) {
    console.error("Error:", error.message);
  }
}

checkLatest();
