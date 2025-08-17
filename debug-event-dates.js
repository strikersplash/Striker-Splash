const { pool } = require("./dist/config/db");

async function debugEventDates() {
  try {
    console.log("=== DEBUG EVENT DATES ===");

    // Check what the server thinks today is
    const serverDate = new Date();
    const serverDateString = serverDate.toISOString().split("T")[0];
    console.log(`Server date: ${serverDate.toISOString()}`);
    console.log(`Server date string (for SQL): ${serverDateString}`);
    console.log(`Server local date: ${serverDate.toLocaleDateString()}`);
    console.log(
      `Server timezone offset: ${serverDate.getTimezoneOffset()} minutes`
    );

    console.log("\n=== ALL EVENTS IN DATABASE ===");

    // Get ALL events from database
    const allEventsQuery = `
      SELECT id, name, start_date, end_date 
      FROM event_locations 
      ORDER BY start_date ASC
    `;

    const allEvents = await pool.query(allEventsQuery);
    console.log(`Total events in database: ${allEvents.rows.length}`);

    if (allEvents.rows.length > 0) {
      allEvents.rows.forEach((event, index) => {
        console.log(`${index + 1}. "${event.name}"`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Start: ${event.start_date}`);
        console.log(`   End: ${event.end_date}`);
        console.log(
          `   Today >= start_date: ${serverDateString >= event.start_date}`
        );
        console.log(
          `   Today <= end_date: ${serverDateString <= event.end_date}`
        );
        console.log(
          `   Should show (end_date >= today): ${
            event.end_date >= serverDateString
          }`
        );
        console.log("");
      });
    }

    console.log("\n=== EVENTS USING CURRENT API FILTER ===");

    // Test the same query the API uses
    const apiQuery = `
      SELECT id, name, start_date, end_date 
      FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;

    const apiEvents = await pool.query(apiQuery, [serverDateString]);
    console.log(
      `Events returned by API filter (end_date >= ${serverDateString}): ${apiEvents.rows.length}`
    );

    if (apiEvents.rows.length > 0) {
      apiEvents.rows.forEach((event, index) => {
        console.log(
          `${index + 1}. "${event.name}" (${event.start_date} to ${
            event.end_date
          })`
        );
      });
    } else {
      console.log("No events found with current API filter!");
    }

    console.log("\n=== EVENTS ENDING TODAY OR LATER ===");

    // Check specifically for events ending on July 15, 2025
    const july15Query = `
      SELECT id, name, start_date, end_date 
      FROM event_locations 
      WHERE end_date >= '2025-07-15'
      ORDER BY start_date ASC
    `;

    const july15Events = await pool.query(july15Query);
    console.log(
      `Events ending on or after July 15, 2025: ${july15Events.rows.length}`
    );

    if (july15Events.rows.length > 0) {
      july15Events.rows.forEach((event, index) => {
        console.log(
          `${index + 1}. "${event.name}" (${event.start_date} to ${
            event.end_date
          })`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

debugEventDates();
