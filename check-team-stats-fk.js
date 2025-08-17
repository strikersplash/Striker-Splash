const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function checkTeamStatsForeignKey() {
  try {
    console.log("Checking team_stats foreign key constraints...");

    const constraintQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'team_stats';
    `;

    const result = await pool.query(constraintQuery);
    console.log("Foreign key constraints on team_stats:");
    console.log(result.rows);

    // Check what tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('competitions', 'custom_competitions')
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    console.log("\nAvailable tables:");
    console.log(tablesResult.rows);

    // Check team_stats table structure
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'team_stats'
      ORDER BY ordinal_position;
    `;

    const structureResult = await pool.query(structureQuery);
    console.log("\nteam_stats table structure:");
    console.log(structureResult.rows);
  } catch (error) {
    console.error("Error checking team_stats foreign key:", error);
  } finally {
    await pool.end();
  }
}

checkTeamStatsForeignKey();
