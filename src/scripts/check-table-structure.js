// Script to check the structure of the notifications table
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Create a PostgreSQL connection from the db.ts configuration
const dbPath = path.join(__dirname, "..", "config", "db.ts");
const dbFile = fs.readFileSync(dbPath, "utf8");

// Extract connection info from db.ts
const userMatch = dbFile.match(/user: ['"](.*?)['"]/);
const hostMatch = dbFile.match(/host: ['"](.*?)['"]/);
const databaseMatch = dbFile.match(/database: ['"](.*?)['"]/);
const passwordMatch = dbFile.match(/password: ['"](.*?)['"]/);
const portMatch = dbFile.match(/port: (\d+)/);

const user = userMatch ? userMatch[1] : "striker_splash";
const host = hostMatch ? hostMatch[1] : "localhost";
const database = databaseMatch ? databaseMatch[1] : "striker_splash";
const password = passwordMatch ? passwordMatch[1] : "striker_splash";
const port = portMatch ? parseInt(portMatch[1]) : 5432;

console.log("Using connection info:");
console.log({ user, host, database, password: "****", port });

const pool = new Pool({ user, host, database, password, port });

async function checkTableStructure() {
  try {
    // Query to get column information from the notifications table
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `;

    console.log("Executing query:", query);
    const result = await pool.query(query);

    console.log("=== Notifications Table Structure ===");
    console.table(result.rows);

    // Alternative approach: directly check if title column exists
    const titleQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'title'
      ) as has_title_column;
    `;

    const titleResult = await pool.query(titleQuery);
    const hasTitleColumn = titleResult.rows[0].has_title_column;

    console.log(
      `\nDoes notifications table have a 'title' column? ${
        hasTitleColumn ? "YES" : "NO"
      }`
    );
  } catch (error) {
    console.error("Error checking table structure:", error);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
