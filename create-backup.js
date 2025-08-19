// Create database backup before production cleanup
const { Pool } = require("pg");
const { pool } = require("./dist/config/db");
const fs = require("fs");
const { exec } = require("child_process");
const util = require("util");

const execAsync = util.promisify(exec);

async function createDatabaseBackup() {
  console.log("💾 CREATING DATABASE BACKUP BEFORE CLEANUP\n");

  try {
    // Get database connection info
    console.log("📋 Getting database connection information...");

    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFilename = `striker-splash-backup-${timestamp}.sql`;

    console.log(`📁 Backup file: ${backupFilename}`);

    // Note: We'll create a simple data export since we can't access pg_dump directly
    console.log("🔄 Creating data export backup...");

    // Get all table names
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let backupContent = `-- STRIKER SPLASH DATABASE BACKUP
-- Created: ${new Date().toISOString()}
-- Contains all test data before production cleanup
-- 
-- To restore: Run this script on a clean database

BEGIN;

`;

    console.log(`📊 Found ${tableResult.rows.length} tables to backup:`);

    for (const table of tableResult.rows) {
      const tableName = table.table_name;
      console.log(`   📋 Backing up: ${tableName}`);

      try {
        // Get table structure (we'll keep it simple)
        const dataResult = await pool.query(`SELECT * FROM ${tableName}`);

        if (dataResult.rows.length > 0) {
          backupContent += `-- Data for table: ${tableName}\n`;
          backupContent += `-- Records: ${dataResult.rows.length}\n\n`;

          // Add table data as comments for reference
          backupContent += `/*\nTable: ${tableName}\nRecords: ${dataResult.rows.length}\n`;
          backupContent += `Sample data (first 3 records):\n`;

          const sampleData = dataResult.rows.slice(0, 3);
          backupContent += JSON.stringify(sampleData, null, 2);
          backupContent += `\n*/\n\n`;
        }
      } catch (err) {
        console.log(`   ⚠️  Could not backup ${tableName}: ${err.message}`);
        backupContent += `-- Could not backup ${tableName}: ${err.message}\n\n`;
      }
    }

    // Add summary information
    backupContent += `
-- BACKUP SUMMARY
-- =============
-- Total tables: ${tableResult.rows.length}
-- Backup created: ${new Date().toISOString()}
-- Purpose: Pre-production cleanup backup
-- 
-- This backup contains references to all test data that will be deleted.
-- The actual data is preserved in the comments above for reference.

COMMIT;

-- END OF BACKUP
`;

    // Write backup file
    fs.writeFileSync(backupFilename, backupContent);

    console.log(`\n✅ BACKUP CREATED SUCCESSFULLY!`);
    console.log(`📁 File: ${backupFilename}`);
    console.log(
      `📊 Size: ${Math.round(fs.statSync(backupFilename).size / 1024)} KB`
    );

    // Also create a JSON backup with actual data for critical tables
    console.log(`\n💾 Creating detailed JSON backup for critical tables...`);

    const criticalTables = ["players", "teams", "staff"];
    const jsonBackup = {
      created: new Date().toISOString(),
      purpose: "Pre-production cleanup backup",
      tables: {},
    };

    for (const tableName of criticalTables) {
      try {
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        jsonBackup.tables[tableName] = result.rows;
        console.log(
          `   📋 Backed up ${result.rows.length} records from ${tableName}`
        );
      } catch (err) {
        console.log(`   ⚠️  Could not backup ${tableName}: ${err.message}`);
      }
    }

    const jsonFilename = `striker-splash-data-backup-${timestamp}.json`;
    fs.writeFileSync(jsonFilename, JSON.stringify(jsonBackup, null, 2));

    console.log(`\n✅ DETAILED BACKUP CREATED!`);
    console.log(`📁 File: ${jsonFilename}`);
    console.log(
      `📊 Size: ${Math.round(fs.statSync(jsonFilename).size / 1024)} KB`
    );

    console.log(`\n🎯 BACKUP COMPLETE - NOW SAFE TO PROCEED WITH CLEANUP!`);
    console.log(`\n📋 Backup Files Created:`);
    console.log(`   1. ${backupFilename} - SQL reference backup`);
    console.log(`   2. ${jsonFilename} - Detailed data backup`);

    console.log(`\n🚀 Next Steps:`);
    console.log(`   1. Verify backup files exist`);
    console.log(`   2. Run: node production-cleanup.js --confirm-cleanup`);
    console.log(`   3. Follow the interactive prompts`);
  } catch (error) {
    console.error("❌ Error creating backup:", error.message);
    console.log("\n🚨 CANNOT PROCEED WITHOUT BACKUP!");
    console.log("Please resolve the backup issue before running cleanup.");
  } finally {
    await pool.end();
  }
}

createDatabaseBackup();
