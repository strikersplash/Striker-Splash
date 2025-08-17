// Import the database config properly
const { pool } = require("./dist/config/db");

// Function to test the getEventsWithRegistrations query directly
async function testEventRegistrationQuery() {
  try {
    const today = new Date().toISOString().split("T")[0];
    console.log("Today's date for query:", today);

    // Get events with count of registered players
    const eventsQuery = `
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

    console.log("Executing query with today's date:", today);
    const eventsResult = await pool.query(eventsQuery, [today]);

    console.log("Events found:", eventsResult.rows.length);

    if (eventsResult.rows.length === 0) {
      console.log("No events found matching the query criteria");
    } else {
      console.log("\nEvents Data:");
      eventsResult.rows.forEach((event, index) => {
        console.log(`\n--- Event ${index + 1} ---`);
        console.log(`ID: ${event.id}`);
        console.log(`Name: ${event.name}`);
        console.log(`Address: ${event.address}`);
        console.log(`Start Date: ${event.start_date}`);
        console.log(`End Date: ${event.end_date}`);
        console.log(`Total Registrations: ${event.total_registrations}`);
        console.log(
          `Pending Ticket Assignments: ${event.pending_ticket_assignments}`
        );
      });
    }

    // Also check if there are ANY events in the database
    const allEventsQuery = `SELECT COUNT(*) FROM event_locations`;
    const allEventsResult = await pool.query(allEventsQuery);
    console.log("\nTotal events in database:", allEventsResult.rows[0].count);

    // Check for future events without the date filter
    const futureEventsQuery = `
      SELECT COUNT(*) 
      FROM event_locations 
      WHERE end_date >= NOW()
    `;
    const futureEventsResult = await pool.query(futureEventsQuery);
    console.log("Future events in database:", futureEventsResult.rows[0].count);
  } catch (error) {
    console.error("Error executing test query:", error);
  } finally {
    // Close the pool when done
    await pool.end();
    console.log("Database pool closed");
  }
}

// Run the test
testEventRegistrationQuery();
