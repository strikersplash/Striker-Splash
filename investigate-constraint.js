// Investigate the foreign key constraint issue
const { pool } = require("./dist/config/db.js");

async function investigateConstraintIssue() {
  try {
    console.log("Investigating foreign key constraint issue...");

    // Check what tables exist related to competitions
    console.log("\n1. Checking competition-related tables:");
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%competition%' 
      AND table_schema = 'public'
      ORDER BY table_name;
    `;
    const tablesResult = await pool.query(tablesQuery);

    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    // Check the foreign key constraints on custom_competition_activity
    console.log(
      "\n2. Checking foreign key constraints on custom_competition_activity:"
    );
    const constraintsQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'custom_competition_activity';
    `;
    const constraintsResult = await pool.query(constraintsQuery);

    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach((row) => {
        console.log(
          `   - ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
        );
      });
    } else {
      console.log(
        "   No foreign key constraints found (table might not exist)"
      );
    }

    // Check if custom_competitions table exists and has our competition
    console.log("\n3. Checking custom_competitions table:");
    try {
      const customCompQuery = `SELECT COUNT(*) as count FROM custom_competitions`;
      const customCompResult = await pool.query(customCompQuery);
      console.log(
        `   - custom_competitions table exists with ${customCompResult.rows[0].count} records`
      );

      // Check if our competition 71 exists in custom_competitions
      const comp71Query = `SELECT * FROM custom_competitions WHERE id = 71`;
      const comp71Result = await pool.query(comp71Query);
      console.log(
        `   - Competition 71 in custom_competitions: ${
          comp71Result.rows.length > 0 ? "EXISTS" : "NOT FOUND"
        }`
      );
    } catch (error) {
      console.log(`   - custom_competitions table issue: ${error.message}`);
    }

    // Check competitions table
    console.log("\n4. Checking competitions table:");
    const compQuery = `SELECT id, name, type, status FROM competitions WHERE id = 71`;
    const compResult = await pool.query(compQuery);
    if (compResult.rows.length > 0) {
      console.log(`   - Competition 71 in competitions: EXISTS`);
      console.log(`     Name: ${compResult.rows[0].name}`);
      console.log(`     Type: ${compResult.rows[0].type}`);
      console.log(`     Status: ${compResult.rows[0].status}`);
    } else {
      console.log(`   - Competition 71 in competitions: NOT FOUND`);
    }

    pool.end();
  } catch (error) {
    console.error("Error investigating:", error);
    pool.end();
  }
}

investigateConstraintIssue();
