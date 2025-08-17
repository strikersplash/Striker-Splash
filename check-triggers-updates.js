const { pool } = require("./dist/config/db");

async function checkForTriggersAndUpdates() {
  console.log("=== CHECKING FOR TRIGGERS AND UPDATES ===");

  try {
    // Check for triggers on game_stats table
    const triggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'game_stats'
    `;

    const triggersResult = await pool.query(triggersQuery);
    console.log("Triggers on game_stats table:");
    if (triggersResult.rows.length === 0) {
      console.log("No triggers found.");
    } else {
      triggersResult.rows.forEach((trigger) => {
        console.log(
          `- ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`
        );
        console.log(`  Action: ${trigger.action_statement}`);
      });
    }

    // Test actual INSERT to see what happens
    console.log("\n=== TESTING ACTUAL INSERT ===");

    // Get test data
    const playerQuery = await pool.query("SELECT id FROM players LIMIT 1");
    const staffQuery = await pool.query("SELECT id FROM staff LIMIT 1");
    const playerId = playerQuery.rows[0].id;
    const staffId = staffQuery.rows[0].id;

    // Insert using the exact query from logGoals
    const insertQuery = `
      INSERT INTO game_stats (player_id, goals, kicks_used, staff_id, location, competition_type, queue_ticket_id, requeued, team_play, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() AT TIME ZONE 'America/Belize')
      RETURNING *
    `;

    console.log("Inserting with correct formula...");
    const insertResult = await pool.query(insertQuery, [
      playerId,
      1,
      5,
      staffId,
      "Test Location",
      "practice",
      null,
      false,
      false,
    ]);

    const inserted = insertResult.rows[0];
    console.log("Inserted activity:");
    console.log("  Raw timestamp:", inserted.timestamp);
    console.log("  JavaScript Date:", new Date(inserted.timestamp));

    const displayTime = new Date(inserted.timestamp).toLocaleTimeString(
      "en-US",
      {
        timeZone: "America/Belize",
        hour12: true,
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }
    );
    console.log("  Would display as:", displayTime);

    // Wait a few seconds and check if it changed
    console.log("\nWaiting 3 seconds to see if timestamp changes...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const checkQuery = `
      SELECT timestamp FROM game_stats WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [inserted.id]);
    const afterWait = checkResult.rows[0];

    console.log("After 3 seconds:");
    console.log("  Raw timestamp:", afterWait.timestamp);

    if (inserted.timestamp.getTime() === afterWait.timestamp.getTime()) {
      console.log("✅ Timestamp remained the same");
    } else {
      console.log("⚠️  Timestamp CHANGED!");
      console.log(
        "  Difference:",
        (afterWait.timestamp.getTime() - inserted.timestamp.getTime()) / 1000,
        "seconds"
      );
    }

    // Clean up
    await pool.query("DELETE FROM game_stats WHERE id = $1", [inserted.id]);
    console.log("Test record cleaned up.");
  } catch (error) {
    console.error("Error checking triggers:", error);
  } finally {
    process.exit(0);
  }
}

checkForTriggersAndUpdates();
