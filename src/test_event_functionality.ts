// This script will help us test the event_locations and event_registrations tables

import { pool } from "./config/db";

async function testEventFunctionality() {
  try {
    console.log("Testing event functionality...");

    // Check if tables exist
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('event_locations', 'event_registrations')
    `;
    const tablesResult = await pool.query(tablesQuery);
    console.log(
      "Available tables:",
  tablesResult.rows.map((row: any) => row.table_name)
    );

    // Get event locations
    const locationsQuery = "SELECT * FROM event_locations";
    const locationsResult = await pool.query(locationsQuery);
    // Get any registrations
    const registrationsQuery = `
      SELECT er.*, el.name, el.address, el.start_date, el.event_type
      FROM event_registrations er
      JOIN event_locations el ON er.event_id = el.id
    `;
    const registrationsResult = await pool.query(registrationsQuery);
    // Test adding a sample event
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const insertQuery = `
      INSERT INTO event_locations (
        name, 
        address, 
        start_date, 
        end_date, 
        event_type, 
        max_kicks, 
        tickets_required,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, [
      "Test Event " + Math.floor(Math.random() * 1000),
      "123 Test Address",
      todayStr,
      tomorrowStr,
      "practice",
      5,
      1,
      "This is a test event created by the test script",
    ]);

    // Check tables again to see the new event
    const updatedLocationsResult = await pool.query(locationsQuery);
  } catch (error) {
    console.error("Error testing event functionality:", error);
  } finally {
    // Close the connection
    await pool.end();
  }
}

// Run the test
testEventFunctionality().catch((err) =>
  console.error("Error running test script:", err)
);
