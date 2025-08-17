const { pool } = require("./dist/config/db");

async function checkTeamStatsConstraints() {
  try {
    console.log("Checking team_stats foreign key constraints...");

    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'team_stats'
    `);

    console.log("\nForeign key constraints on team_stats:");
    fkResult.rows.forEach((row) => {
      console.log(
        `- ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
      );
    });

    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'competitions' OR table_name = 'custom_competitions')
      ORDER BY table_name
    `);

    console.log("\nCompetition tables that exist:");
    tablesResult.rows.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkTeamStatsConstraints();
