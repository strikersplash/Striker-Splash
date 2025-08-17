// Apply the migration to add registration cutoff columns
const { pool } = require("./dist/config/db.js");
const fs = require("fs");

async function applyMigration() {
  try {
    console.log("Applying migration to add registration cutoff columns...");

    // Read the SQL migration file
    const migration = fs.readFileSync(
      "./add-registration-cutoff-migration.sql",
      "utf8"
    );

    // Execute the migration
    await pool.query(migration);

    console.log("✅ Migration applied successfully!");

    // Verify the columns were added
    const schemaQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'event_locations' 
      AND column_name IN ('registration_closed', 'registration_closed_at', 'registration_closed_by')
      ORDER BY column_name;
    `;

    const result = await pool.query(schemaQuery);

    console.log("\nVerification - New columns added:");
    result.rows.forEach((row) => {
      console.log(
        `✅ ${row.column_name}: ${row.data_type} (default: ${row.column_default})`
      );
    });

    if (result.rows.length === 3) {
      console.log("\n🎉 Registration cutoff columns successfully added!");
      console.log("Now staff can close event registrations.");
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
