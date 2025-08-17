const { pool } = require("./dist/config/db");

async function testGenderFilter() {
  try {
    console.log("Testing gender filter directly...");

    // Test 1: All players
    const allQuery = `
      SELECT p.name, p.gender, SUM(gs.goals) as total_goals
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      GROUP BY p.id, p.name, p.gender
      HAVING SUM(gs.goals) > 0
      ORDER BY total_goals DESC
    `;

    const allResult = await pool.query(allQuery);
    console.log("All players:", allResult.rows.length);
    allResult.rows.forEach((row) => {
      console.log(`  ${row.name} (${row.gender}): ${row.total_goals} goals`);
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 2: Female players only
    const femaleQuery = `
      SELECT p.name, p.gender, SUM(gs.goals) as total_goals
      FROM game_stats gs
      JOIN players p ON gs.player_id = p.id
      WHERE p.gender = $1
      GROUP BY p.id, p.name, p.gender
      HAVING SUM(gs.goals) > 0
      ORDER BY total_goals DESC
    `;

    const femaleResult = await pool.query(femaleQuery, ["female"]);
    console.log("Female players only:", femaleResult.rows.length);
    femaleResult.rows.forEach((row) => {
      console.log(`  ${row.name} (${row.gender}): ${row.total_goals} goals`);
    });

    console.log("\n" + "=".repeat(50) + "\n");

    // Test 3: The exact query from the app
    const appQuery = `
      SELECT 
        p.id,
        p.name,
        p.residence,
        p.city_village,
        p.gender,
        p.age_group,
        SUM(gs.goals) as total_goals,
        COUNT(gs.id) * 5 as total_attempts,
        COALESCE(MAX(gs.consecutive_kicks), 0) as best_streak,
        STRING_AGG(DISTINCT s.name, ', ') as referees
      FROM 
        game_stats gs
      JOIN 
        players p ON gs.player_id = p.id
      JOIN
        staff s ON gs.staff_id = s.id
      LEFT JOIN
        queue_tickets qt ON gs.queue_ticket_id = qt.id
      WHERE 
        (qt.status = 'played' AND qt.official = TRUE) OR gs.competition_type = 'custom_competition'
       AND p.gender = $1
      GROUP BY p.id, p.name, p.residence, p.city_village, p.gender, p.age_group
      HAVING SUM(gs.goals) > 0
      ORDER BY total_goals DESC, best_streak DESC LIMIT 100
    `;

    const appResult = await pool.query(appQuery, ["female"]);
    console.log("App query result:", appResult.rows.length);
    appResult.rows.forEach((row) => {
      console.log(`  ${row.name} (${row.gender}): ${row.total_goals} goals`);
    });
  } catch (error) {
    console.error("Error testing filter:", error);
  } finally {
    process.exit(0);
  }
}

testGenderFilter();
