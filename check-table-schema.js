// Check schema using the app's database connection
const { pool } = require("./dist/config/db.js");

async function checkCompetitionPlayersSchema() {
  try {
    console.log("Checking competition_players table schema...");

    const schemaQuery = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'competition_players' 
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(schemaQuery);

    console.log("Current columns in competition_players table:");
    console.log(
      "Column Name".padEnd(20) +
        "Data Type".padEnd(15) +
        "Nullable".padEnd(10) +
        "Default"
    );
    console.log("-".repeat(60));

    result.rows.forEach((row) => {
      console.log(
        row.column_name.padEnd(20) +
          row.data_type.padEnd(15) +
          row.is_nullable.padEnd(10) +
          (row.column_default || "")
      );
    });

    console.log("\nLooking for goals and kicks_taken columns...");
    const hasGoals = result.rows.some((row) => row.column_name === "goals");
    const hasKicksTaken = result.rows.some(
      (row) => row.column_name === "kicks_taken"
    );

    console.log(`goals column exists: ${hasGoals ? "✅" : "❌"}`);
    console.log(`kicks_taken column exists: ${hasKicksTaken ? "✅" : "❌"}`);

    if (!hasGoals || !hasKicksTaken) {
      console.log("\n🔧 Missing columns detected! Creating migration...");
    }

    pool.end();
  } catch (error) {
    console.error("Error checking schema:", error);
    pool.end();
  }
}

checkCompetitionPlayersSchema();
