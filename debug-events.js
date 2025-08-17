const { Client } = require("pg");

async function debugEvents() {
  const client = new Client({
    host: "localhost",
    port: 5432,
    database: "striker_splash",
    user: "striker_splash",
    password: "striker_splash",
  });

  try {
    await client.connect();
    console.log("=== Debug: Checking event_locations table ===");

    // Check what's actually in the table
    const allEventsQuery =
      "SELECT * FROM event_locations ORDER BY created_at DESC";
    const allEventsResult = await client.query(allEventsQuery);

    console.log(`Total events in database: ${allEventsResult.rows.length}`);

    if (allEventsResult.rows.length > 0) {
      console.log("\nAll events:");
      allEventsResult.rows.forEach((event, index) => {
        console.log(`${index + 1}. ${event.name}`);
        console.log(`   Start Date: ${event.start_date}`);
        console.log(`   End Date: ${event.end_date}`);
        console.log(`   Address: ${event.address}`);
        console.log(`   Created: ${event.created_at}`);
        console.log("");
      });
    }

    // Check what today's date filter returns
    const today = new Date().toISOString().split("T")[0];
    console.log(`Today's date (filter): ${today}`);

    const upcomingQuery = `
      SELECT * FROM event_locations 
      WHERE end_date >= $1
      ORDER BY start_date ASC
    `;

    const upcomingResult = await client.query(upcomingQuery, [today]);
    console.log(
      `\nUpcoming events (end_date >= ${today}): ${upcomingResult.rows.length}`
    );

    if (upcomingResult.rows.length > 0) {
      console.log("\nUpcoming events:");
      upcomingResult.rows.forEach((event, index) => {
        console.log(
          `${index + 1}. ${event.name} (${event.start_date} to ${
            event.end_date
          })`
        );
      });
    } else {
      console.log("No upcoming events found with current filter.");
    }
  } catch (error) {
    console.error("Debug error:", error);
  } finally {
    await client.end();
  }
}

debugEvents();
