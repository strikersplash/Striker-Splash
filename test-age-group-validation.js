const { pool } = require("./dist/config/db");

async function testAgeGroupData() {
  try {
    console.log("Testing age group data...");

    // Check some sample players with their age groups
    const query = `
      SELECT id, name, age_group, residence, age 
      FROM players 
      WHERE age_group IS NOT NULL 
      LIMIT 5
    `;

    const result = await pool.query(query);
    console.log("Sample players with age groups:");
    result.rows.forEach((player) => {
      console.log(
        `- ${player.name} (ID: ${player.id}): Age Group = "${player.age_group}", Age = ${player.age}, Residence = ${player.residence}`
      );
    });

    // Check age group distribution
    const distQuery = `
      SELECT age_group, COUNT(*) as count 
      FROM players 
      WHERE age_group IS NOT NULL 
      GROUP BY age_group 
      ORDER BY age_group
    `;

    const distResult = await pool.query(distQuery);
    console.log("\nAge group distribution:");
    distResult.rows.forEach((row) => {
      console.log(`${row.age_group}: ${row.count} players`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testAgeGroupData();
