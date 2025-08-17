// Check if there's a proper activity table for the competitions system
const { pool } = require("./dist/config/db.js");

async function checkActivityTables() {
  try {
    console.log("Checking activity tables for competitions system...");

    // Look for activity-related tables
    const activityTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%activity%' 
      AND table_schema = 'public'
      ORDER BY table_name;
    `;
    const activityTablesResult = await pool.query(activityTablesQuery);

    console.log("Activity-related tables:");
    activityTablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check if there's a competition_activity table (without custom_ prefix)
    console.log("\nChecking for competition_activity table:");
    try {
      const compActivityQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'competition_activity'
        ORDER BY ordinal_position;
      `;
      const compActivityResult = await pool.query(compActivityQuery);

      if (compActivityResult.rows.length > 0) {
        console.log("   competition_activity table exists with columns:");
        compActivityResult.rows.forEach((row) => {
          console.log(`     - ${row.column_name}: ${row.data_type}`);
        });
      } else {
        console.log("   competition_activity table does not exist");
      }
    } catch (error) {
      console.log(`   competition_activity table error: ${error.message}`);
    }

    // Check logs or activity table
    console.log("\nChecking for logs table:");
    try {
      const logsQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'logs'
        ORDER BY ordinal_position;
      `;
      const logsResult = await pool.query(logsQuery);

      if (logsResult.rows.length > 0) {
        console.log("   logs table exists with columns:");
        logsResult.rows.forEach((row) => {
          console.log(`     - ${row.column_name}: ${row.data_type}`);
        });
      } else {
        console.log("   logs table does not exist");
      }
    } catch (error) {
      console.log(`   logs table error: ${error.message}`);
    }

    console.log("\n🔧 Recommendation:");
    console.log(
      "   Either create a competition_activity table for the new system,"
    );
    console.log("   or modify the code to skip activity logging for now.");

    pool.end();
  } catch (error) {
    console.error("Error checking activity tables:", error);
    pool.end();
  }
}

checkActivityTables();
