#!/usr/bin/env node

/**
 * Direct events query test script
 *
 * This script directly connects to the database and executes the same query
 * used by the getEventsWithRegistrations controller function.
 */

require("dotenv").config();
const { Pool } = require("pg");

// Create a new database pool using environment variables or fall back to defaults
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "striker_splash",
  password: process.env.DB_PASSWORD || "striker_splash",
  database: process.env.DB_NAME || "striker_splash",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// The main test function
async function testEventsQuery() {
  try {
    console.log("Connecting to database...");

    // Test the connection
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");

    // Get current date in ISO format (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];
    console.log(`Today's date: ${today}`);

    // Execute the events query
    const queryText = `
      SELECT 
        el.id, 
        el.name, 
        el.address, 
        el.start_date, 
        el.end_date,
        COALESCE(COUNT(er.id), 0) as total_registrations,
        COALESCE(SUM(CASE WHEN er.id IS NOT NULL AND er.queue_ticket_id IS NULL THEN 1 ELSE 0 END), 0) as pending_ticket_assignments
      FROM event_locations el
      LEFT JOIN event_registrations er ON el.id = er.event_id
      WHERE el.end_date >= $1
      GROUP BY el.id
      ORDER BY el.start_date ASC
    `;

    console.log("Executing query...");
    const result = await pool.query(queryText, [today]);

    // Display the results
    console.log(`Found ${result.rows.length} events:`);
    result.rows.forEach((event, i) => {
      console.log(`\n--- Event ${i + 1} ---`);
      console.log(`ID: ${event.id}`);
      console.log(`Name: ${event.name}`);
      console.log(`Address: ${event.address}`);
      console.log(`Start Date: ${formatDate(event.start_date)}`);
      console.log(`End Date: ${formatDate(event.end_date)}`);
      console.log(`Total Registrations: ${event.total_registrations}`);
      console.log(`Pending Assignments: ${event.pending_ticket_assignments}`);
    });

    // Print full raw result for debugging
    console.log("\nRaw result:");
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error("Error executing test:", err);
  } finally {
    // Close the pool
    await pool.end();
    console.log("\nDatabase connection closed");
  }
}

// Format date for nicer display
function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// Run the test
testEventsQuery();
