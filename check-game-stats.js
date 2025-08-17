const { pool } = require("./dist/config/db");

async function checkGameStatsTable() {
  try {
    console.log("Checking game_stats table structure...");

    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'game_stats' 
      ORDER BY ordinal_position
    `;

    const result = await pool.query(structureQuery);
    console.log("game_stats table columns:");
    result.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // Check some sample data
    const sampleQuery = "SELECT * FROM game_stats LIMIT 3";
    const sampleResult = await pool.query(sampleQuery);
    console.log("\nSample game_stats data:");
    console.log(sampleResult.rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkGameStatsTable();
