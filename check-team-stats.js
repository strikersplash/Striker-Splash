const { pool } = require("./dist/config/db");

async function checkTeamStatsTable() {
  try {
    console.log("Checking team_stats table schema...");

    // Check if team_stats table exists
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'team_stats'
      );
    `);

    if (tableExistsResult.rows[0].exists) {
      console.log("✅ team_stats table exists");

      // Get table schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'team_stats'
        ORDER BY ordinal_position
      `);

      console.log("\nteam_stats table columns:");
      schemaResult.rows.forEach((row) => {
        console.log(
          `- ${row.column_name}: ${row.data_type} (${row.is_nullable})`
        );
      });

      // Check current data
      const dataResult = await pool.query(`
        SELECT * FROM team_stats LIMIT 5
      `);

      console.log("\nSample team_stats data:");
      dataResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${JSON.stringify(row)}`);
      });
    } else {
      console.log("❌ team_stats table does not exist");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkTeamStatsTable();
