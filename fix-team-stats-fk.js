const { Pool } = require("pg");

const pool = new Pool({
  user: "striker_splash",
  host: "localhost",
  database: "striker_splash",
  password: "striker_splash",
  port: 5432,
});

async function fixTeamStatsForeignKey() {
  try {
    console.log("Fixing team_stats foreign key constraint...");

    // Drop the existing foreign key constraint
    console.log("Dropping existing foreign key constraint...");
    await pool.query(`
      ALTER TABLE team_stats 
      DROP CONSTRAINT IF EXISTS fk_team_stats_competition;
    `);
    console.log("Dropped existing constraint");

    // Add the correct foreign key constraint
    console.log("Adding new foreign key constraint to competitions table...");
    await pool.query(`
      ALTER TABLE team_stats 
      ADD CONSTRAINT fk_team_stats_competition 
      FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE;
    `);
    console.log("Added new constraint");

    // Verify the new constraint
    console.log("Verifying new constraint...");
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
    console.log("Updated foreign key constraints on team_stats:");
    console.log(result.rows);
  } catch (error) {
    console.error("Error fixing team_stats foreign key:", error);
  } finally {
    await pool.end();
  }
}

fixTeamStatsForeignKey();
