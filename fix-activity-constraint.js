const { pool } = require("./dist/config/db");

async function fixActivityConstraint() {
  try {
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
    console.error("Error updating constraint:", error);
  } finally {
    await pool.end();
  }
}

fixActivityConstraint();
