// Script to clean up stale team join requests
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "striker_splash",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  port: process.env.DB_PORT || 5432,
});

async function cleanupStaleRequests() {
  console.log("Starting cleanup of stale team join requests...");

  try {
    // Find join requests marked as 'approved' but player is not actually in team_members
    const staleRequests = await pool.query(`
      SELECT tjr.id, tjr.player_id, tjr.team_id, tjr.status, p.name as player_name, t.name as team_name
      FROM team_join_requests tjr
      JOIN players p ON p.id = tjr.player_id
      JOIN teams t ON t.id = tjr.team_id
      WHERE tjr.status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM team_members tm 
        WHERE tm.player_id = tjr.player_id 
        AND tm.team_id = tjr.team_id
      )
    `);

    if (staleRequests.rows.length > 0) {
      console.log(
        `Found ${staleRequests.rows.length} stale approved requests:`
      );
      staleRequests.rows.forEach((req) => {
        console.log(`- ${req.player_name} -> ${req.team_name} (ID: ${req.id})`);
      });

      // Delete stale requests
      const deleteResult = await pool.query(`
        DELETE FROM team_join_requests 
        WHERE status = 'approved'
        AND NOT EXISTS (
          SELECT 1 FROM team_members tm 
          WHERE tm.player_id = team_join_requests.player_id 
          AND tm.team_id = team_join_requests.team_id
        )
      `);

      console.log(`Cleaned up ${deleteResult.rowCount} stale requests.`);
    } else {
      console.log("No stale requests found.");
    }

    // Also find any duplicate requests for the same player/team
    const duplicates = await pool.query(`
      SELECT player_id, team_id, COUNT(*) as count
      FROM team_join_requests 
      GROUP BY player_id, team_id 
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length > 0) {
      console.log(
        `Found ${duplicates.rows.length} sets of duplicate requests.`
      );

      // Keep only the most recent request for each player/team pair
      await pool.query(`
        DELETE FROM team_join_requests a USING team_join_requests b
        WHERE a.player_id = b.player_id 
        AND a.team_id = b.team_id 
        AND a.created_at < b.created_at
      `);

      console.log("Removed older duplicate requests.");
    }

    console.log("Cleanup completed successfully!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await pool.end();
  }
}

cleanupStaleRequests();
