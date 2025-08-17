const { pool } = require("./dist/config/db");

async function checkPlayerAgeGroups() {
  try {
    console.log("Checking players table for age group information...");

    // Check table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'players' 
      ORDER BY ordinal_position
    `;

    const result = await pool.query(structureQuery);
    console.log("players table columns:");
    result.rows.forEach((col) => {
      console.log(
        `- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // Check some sample player data to see age-related fields
    const sampleQuery =
      "SELECT id, name, age, date_of_birth FROM players LIMIT 5";
    const sampleResult = await pool.query(sampleQuery);
    console.log("\nSample players data (age-related fields):");
    console.log(sampleResult.rows);

    // Check age distribution
    const ageStatsQuery =
      "SELECT age, COUNT(*) as count FROM players WHERE age IS NOT NULL GROUP BY age ORDER BY age";
    const ageStats = await pool.query(ageStatsQuery);
    console.log("\nAge distribution:");
    ageStats.rows.forEach((row) => {
      console.log(`Age ${row.age}: ${row.count} players`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkPlayerAgeGroups();
