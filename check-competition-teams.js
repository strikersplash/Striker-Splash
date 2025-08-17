const { pool } = require("./dist/config/db");

async function checkCompetitionTeamsTable() {
  try {
    console.log("Checking competition_teams table schema...");

    // Get table schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'competition_teams'
      ORDER BY ordinal_position
    `);

    console.log("\ncompetition_teams table columns:");
    schemaResult.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (${row.is_nullable})`
      );
    });

    // Check current data
    const dataResult = await pool.query(`
      SELECT * FROM competition_teams LIMIT 5
    `);

    console.log("\nSample competition_teams data:");
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${JSON.stringify(row)}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkCompetitionTeamsTable();
