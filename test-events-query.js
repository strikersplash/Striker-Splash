const { pool } = require("./dist/config/db");

async function testEventQuery() {
  try {
    console.log("Connecting to database...");
    await pool.connect();
    console.log("Connected successfully.");

    console.log("Checking event_locations table...");
    const result = await pool.query("SELECT COUNT(*) FROM event_locations");
    console.log("Total events:", result.rows[0].count);

    console.log("Checking some events...");
    const events = await pool.query(
      "SELECT id, name, address, start_date, end_date FROM event_locations LIMIT 5"
    );
    console.log("First few events:", events.rows);

    const today = new Date().toISOString().split("T")[0];
    console.log("Today's date for query:", today);

    console.log("Running the events with registrations query...");
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
    const eventsResult = await pool.query(eventsQuery, [today]);
    console.log("Query results:", eventsResult.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

testEventQuery();
