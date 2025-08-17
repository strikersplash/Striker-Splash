// Test what timestamp format we're getting from the API now
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

async function testNewTimestamp() {
  try {
    // Insert a test record with the new timestamp format
    console.log("Testing new timestamp format...");

    const insertQuery = `
      INSERT INTO game_stats (player_id, goals, kicks_used, staff_id, location, competition_type, queue_ticket_id, requeued, team_play, timestamp)
      VALUES (1, 1, 1, 1, 'test', 'practice', null, false, false, (NOW() AT TIME ZONE 'America/Belize')::timestamp)
      RETURNING id, timestamp
    `;

    const insertResult = await pool.query(insertQuery);
    console.log("New timestamp stored:", insertResult.rows[0]);

    // Now check what the API query returns for this record
    const apiQuery = `
      SELECT 
        gs.id,
        gs.timestamp
      FROM 
        game_stats gs
      WHERE 
        gs.id = $1
    `;

    const apiResult = await pool.query(apiQuery, [insertResult.rows[0].id]);
    console.log("API returns:", apiResult.rows[0]);
    console.log("Timestamp type:", typeof apiResult.rows[0].timestamp);
    console.log("String format:", apiResult.rows[0].timestamp.toString());

    // Test what happens in JavaScript
    const jsDate = new Date(apiResult.rows[0].timestamp);
    console.log("JavaScript Date:", jsDate);
    console.log(
      "With Belize timezone:",
      jsDate.toLocaleTimeString("en-US", {
        timeZone: "America/Belize",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
      })
    );

    // Clean up test record
    await pool.query("DELETE FROM game_stats WHERE id = $1", [
      insertResult.rows[0].id,
    ]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

testNewTimestamp();
