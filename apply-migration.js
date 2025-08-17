// Apply the migration to add goals and kicks_taken columns
const { pool } = require("./dist/config/db.js");
const fs = require("fs");

async function applyMigration() {
  try {
    console.log("Applying migration to add goals and kicks_taken columns...");

    // Read the SQL migration file
    const migration = fs.readFileSync(
      "./add-goal-tracking-columns.sql",
      "utf8"
    );

    // Execute the migration
    await pool.query(migration);

    console.log("✅ Migration applied successfully!");

    // Verify the columns were added
    const schemaQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'competition_players' 
      AND column_name IN ('goals', 'kicks_taken')
      ORDER BY column_name;
    `;

    const result = await pool.query(schemaQuery);

    console.log("\nVerification - New columns added:");
    result.rows.forEach((row) => {
      console.log(
        `✅ ${row.column_name}: ${row.data_type} (default: ${row.column_default})`
      );
    });

    if (result.rows.length === 2) {
      console.log("\n🎉 Goal tracking columns successfully added!");
      console.log("Now you can log goals for participants.");
    } else {
      console.log("\n❌ Something went wrong - not all columns were added.");
    }

    pool.end();
  } catch (error) {
    console.error("Error applying migration:", error);
    pool.end();
  }
}

applyMigration();
