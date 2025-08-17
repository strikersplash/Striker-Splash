const { pool } = require("./dist/config/db");

async function checkActivitySchema() {
  try {
    // Check activity tables
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%activity%'
    `);

    console.log("Activity tables:");
    tablesResult.rows.forEach((row) => console.log("- " + row.table_name));

    // Check custom_competition_activity schema
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'custom_competition_activity'
      ORDER BY ordinal_position
    `);

    console.log("\ncustom_competition_activity schema:");
    schemaResult.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (${row.is_nullable})`
      );
    });

    // Check foreign key constraints
    const fkResult = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'custom_competition_activity'
    `);

    console.log("\nForeign key constraints:");
    fkResult.rows.forEach((row) => {
      console.log(
        `- ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkActivitySchema();
