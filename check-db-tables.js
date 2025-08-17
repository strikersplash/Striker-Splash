const { Pool } = require("pg");

async function initDb() {
  try {
    // Try to import the pool from the application
    const { pool: appPool } = require("./dist/config/db");
    return appPool;
  } catch (error) {
    console.log("Could not import app pool, trying manual config...");

    // Fallback: try common database configurations
    const configs = [
      {
        host: "localhost",
        port: 5432,
        database: "striker_splash",
        user: "striker_user",
        password: "striker123!",
      },
      {
        host: "localhost",
        port: 5432,
        database: "striker_splash",
        user: "striker_splash",
        password: "striker123!",
      },
      {
        host: "localhost",
        port: 5432,
        database: "striker_splash",
        user: "postgres",
        password: "postgres",
      },
    ];

    for (const config of configs) {
      try {
        const testPool = new Pool(config);
        await testPool.query("SELECT 1");
        console.log(`Connected with config: ${config.user}@${config.database}`);
        return testPool;
      } catch (e) {
        console.log(`Failed with config: ${config.user}@${config.database}`);
      }
    }
    return null;
  }
}

async function checkTables() {
  const pool = await initDb();
  if (!pool) {
    console.error("Could not connect to database");
    return;
  }

  try {
    console.log("\n=== CHECKING COMPETITION TABLES ===\n");

    // Check what competition-related tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%competition%'
      ORDER BY table_name
    `);

    console.log("Competition-related tables found:");
    tablesResult.rows.forEach((row) => {
      console.log(`- ${row.table_name}`);
    });

    // Check each table's columns
    for (const table of tablesResult.rows) {
      console.log(`\n--- Columns in ${table.table_name} ---`);
      const columnsResult = await pool.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
        [table.table_name]
      );

      columnsResult.rows.forEach((col) => {
        console.log(
          `  ${col.column_name}: ${col.data_type} ${
            col.is_nullable === "YES" ? "(nullable)" : "(not null)"
          }`
        );
      });
    }

    console.log("\n=== CHECKING SAMPLE DATA ===\n");

    // Try to get sample data from competitions table
    try {
      const sampleResult = await pool.query(
        "SELECT * FROM competitions LIMIT 3"
      );
      console.log(
        `Found ${sampleResult.rows.length} competitions in 'competitions' table`
      );
      if (sampleResult.rows.length > 0) {
        console.log("Sample competition:", sampleResult.rows[0]);
      }
    } catch (e) {
      console.log("Error reading from competitions table:", e.message);
    }

    // Try alternative table name
    try {
      const sampleResult = await pool.query(
        "SELECT * FROM custom_competitions LIMIT 3"
      );
      console.log(
        `Found ${sampleResult.rows.length} competitions in 'custom_competitions' table`
      );
      if (sampleResult.rows.length > 0) {
        console.log("Sample competition:", sampleResult.rows[0]);
      }
    } catch (e) {
      console.log("Error reading from custom_competitions table:", e.message);
    }
  } catch (error) {
    console.error("Error checking tables:", error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

checkTables();
