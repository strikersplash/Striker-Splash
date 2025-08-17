const { pool } = require("./dist/config/db");

async function cleanupAndFixConstraint() {
  try {
    console.log("Checking existing activity data...");
    const activityResult = await pool.query(`
      SELECT DISTINCT competition_id FROM custom_competition_activity
    `);

    console.log(
      "Competition IDs in activity table:",
      activityResult.rows.map((r) => r.competition_id)
    );

    console.log("Checking existing competitions...");
    const competitionsResult = await pool.query(`
      SELECT id FROM competitions
    `);

    console.log(
      "Competition IDs in competitions table:",
      competitionsResult.rows.map((r) => r.id)
    );

    console.log("Deleting invalid activity records...");
    await pool.query(`
      DELETE FROM custom_competition_activity 
      WHERE competition_id NOT IN (SELECT id FROM competitions)
    `);

    console.log("Dropping old foreign key constraint...");
    await pool.query(`
      ALTER TABLE custom_competition_activity 
      DROP CONSTRAINT IF EXISTS custom_competition_activity_competition_id_fkey
    `);

    console.log("Adding new foreign key constraint to competitions table...");
    await pool.query(`
      ALTER TABLE custom_competition_activity 
      ADD CONSTRAINT custom_competition_activity_competition_id_fkey 
      FOREIGN KEY (competition_id) REFERENCES competitions(id)
    `);

    console.log("Foreign key constraint updated successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

cleanupAndFixConstraint();
