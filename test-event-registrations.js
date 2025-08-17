const { pool } = require("./dist/config/db");

async function testEventRegistrations() {
  try {
    console.log("Testing event registrations query...");

    // Use the same timezone calculation as the controller
    const now = new Date();
    const belizeTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const today = belizeTime.toISOString().split("T")[0];
    console.log("Using date filter:", today);

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

    const result = await pool.query(eventsQuery, [today]);

    console.log(`\nFound ${result.rows.length} events:`);
    result.rows.forEach((event, index) => {
      console.log(`${index + 1}. "${event.name}"`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Dates: ${event.start_date} to ${event.end_date}`);
      console.log(
        `   Total registrations: ${
          event.total_registrations
        } (type: ${typeof event.total_registrations})`
      );
      console.log(
        `   Pending tickets: ${
          event.pending_ticket_assignments
        } (type: ${typeof event.pending_ticket_assignments})`
      );
      console.log("");
    });

    // Also check the raw registrations table
    console.log("=== RAW EVENT_REGISTRATIONS TABLE ===");
    const rawQuery =
      "SELECT event_id, COUNT(*) as count FROM event_registrations GROUP BY event_id ORDER BY event_id";
    const rawResult = await pool.query(rawQuery);

    console.log("Registrations by event_id:");
    rawResult.rows.forEach((row) => {
      console.log(`Event ID ${row.event_id}: ${row.count} registrations`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

testEventRegistrations();
