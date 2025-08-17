const { pool } = require("./dist/config/db");

async function checkTeamsTable() {
  try {
    console.log("Checking teams table structure...");

    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'teams' 
      ORDER BY ordinal_position
    `;

    const result = await pool.query(structureQuery);
    console.log("teams table columns:");
    result.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // Check some sample team data
    const sampleQuery = "SELECT * FROM teams LIMIT 3";
    const sampleResult = await pool.query(sampleQuery);
    console.log("\nSample teams data:");
    console.log(sampleResult.rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkTeamsTable();
