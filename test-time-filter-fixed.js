const { pool } = require("./dist/config/db");

async function testTimeFilterFixed() {
  try {
    console.log("Testing time filter with correct column name...");

    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    console.log("Current time:", now);
    console.log("Start date for week filter:", startDate);

    // Test the query with timestamp column
    const testQuery = `
      SELECT 
        gs.id,
        gs.timestamp,
        p.name,
        gs.goals,
        EXTRACT(EPOCH FROM (NOW() - gs.timestamp)) / 86400 as days_ago
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      WHERE gs.timestamp >= $1
      ORDER BY gs.timestamp DESC
      LIMIT 10
    `;

    const result = await pool.query(testQuery, [startDate]);
    console.log(`\nFound ${result.rows.length} game stats in the last week:`);

    result.rows.forEach((row) => {
      console.log(
        `- ${row.name}: ${row.goals} goals, ${Math.round(
          row.days_ago
        )} days ago`
      );
    });

    // Also check all game stats to see date range
    const allStatsQuery = `
      SELECT 
        MIN(gs.timestamp) as earliest,
        MAX(gs.timestamp) as latest,
        COUNT(*) as total_count
      FROM game_stats gs
    `;

    const allStats = await pool.query(allStatsQuery);
    console.log("\nAll game stats date range:");
    console.log(`- Earliest: ${allStats.rows[0].earliest}`);
    console.log(`- Latest: ${allStats.rows[0].latest}`);
    console.log(`- Total count: ${allStats.rows[0].total_count}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testTimeFilterFixed();
