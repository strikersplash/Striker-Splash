const { pool } = require("./dist/config/db");

async function testLeaderboardData() {
  try {
    console.log("Testing leaderboard data and time filtering...");

    // Check game_stats entries and their dates
    const recentStatsQuery = `
      SELECT 
        gs.id, 
        gs.player_id, 
        gs.goals, 
        gs.created_at,
        p.name,
        EXTRACT(EPOCH FROM (NOW() - gs.created_at)) / 86400 as days_ago
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      ORDER BY gs.created_at DESC 
      LIMIT 10
    `;

    const recentStats = await pool.query(recentStatsQuery);
    console.log("\nRecent game stats:");
    recentStats.rows.forEach((stat) => {
      console.log(
        `- ${stat.name}: ${stat.goals} goals, ${Math.round(
          stat.days_ago
        )} days ago (${stat.created_at})`
      );
    });

    // Check this week's stats
    const thisWeekQuery = `
      SELECT COUNT(*) as count, SUM(gs.goals) as total_goals
      FROM game_stats gs
      WHERE gs.created_at >= (NOW() - INTERVAL '7 days')
    `;

    const thisWeekStats = await pool.query(thisWeekQuery);
    console.log(
      `\nThis week's stats: ${thisWeekStats.rows[0].count} games, ${thisWeekStats.rows[0].total_goals} total goals`
    );

    // Check today's stats
    const todayQuery = `
      SELECT COUNT(*) as count, SUM(gs.goals) as total_goals
      FROM game_stats gs
      WHERE gs.created_at >= CURRENT_DATE
    `;

    const todayStats = await pool.query(todayQuery);
    console.log(
      `Today's stats: ${todayStats.rows[0].count} games, ${todayStats.rows[0].total_goals} total goals`
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testLeaderboardData();
