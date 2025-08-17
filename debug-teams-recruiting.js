const { pool } = require("./dist/config/db");

async function checkTeamsData() {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (t.id) t.*, 
              COALESCE(ts.total_goals, 0) as total_goals, 
              COALESCE(ts.total_attempts, 0) as total_attempts,
              (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as current_members
       FROM teams t 
       LEFT JOIN team_stats ts ON t.id = ts.team_id AND ts.competition_id IS NULL
       ORDER BY t.id, t.name
       LIMIT 1`
    );

    console.log("Sample team data:");
    console.log(JSON.stringify(result.rows[0], null, 2));

    // Check if is_recruiting column exists
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY column_name
    `);

    console.log("\nTeams table columns:");
    columnsResult.rows.forEach((col) => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

checkTeamsData();
