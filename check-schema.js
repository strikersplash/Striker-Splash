const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "striker_splash",
  password: "striker123",
  database: "striker_splash",
  port: 5432,
});

async function checkSchema() {
  try {
    console.log("Checking competition_players table schema...");

    const result = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'competition_players'
            ORDER BY ordinal_position;
        `);

    console.log("competition_players columns:");
    result.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });

    console.log("\nChecking competition_teams table schema...");

    const teamsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'competition_teams'
            ORDER BY ordinal_position;
        `);

    console.log("competition_teams columns:");
    teamsResult.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`
      );
    });
  } catch (error) {
    console.error("Error checking schema:", error);
  } finally {
    await pool.end();
  }
}

checkSchema();
