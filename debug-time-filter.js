const { pool } = require("./dist/config/db");

async function debugTimeFilter() {
  try {
    console.log("Testing time filter logic...");

    // Test the exact query logic that leaderboard uses
    const filters = { timeRange: "week" };

    if (
      filters.timeRange &&
      filters.timeRange !== "all" &&
      filters.timeRange !== ""
    ) {
      const now = new Date();
      let startDate;

      switch (filters.timeRange) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      console.log("Current time:", now);
      console.log("Start date for week filter:", startDate);
      console.log(
        "Days difference:",
        (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      // Test the query
      const testQuery = `
        SELECT 
          gs.id,
          gs.created_at,
          p.name,
          gs.goals,
          EXTRACT(EPOCH FROM (NOW() - gs.created_at)) / 86400 as days_ago
        FROM game_stats gs
        JOIN players p ON gs.player_id = p.id
        WHERE gs.created_at >= $1
        ORDER BY gs.created_at DESC
        LIMIT 5
      `;

      console.log("\nTesting query with week filter...");
      const result = await pool.query(testQuery, [startDate]);
      console.log(`Found ${result.rows.length} game stats in the last week:`);

      result.rows.forEach((row) => {
        console.log(
          `- ${row.name}: ${row.goals} goals, ${Math.round(
            row.days_ago
          )} days ago`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

debugTimeFilter();
