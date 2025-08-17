const axios = require("axios");

// Set the URL to match your application server
const baseUrl = "http://localhost:3000"; // Change this if you're using a different port/host
const path = "/staff/events-with-registrations";

// Make the request
axios
  .get(`${baseUrl}${path}`)
  .then((response) => {
    const data = response.data;
    console.log("Response status:", response.status);
    console.log("Success:", data.success);
    console.log(
      "Number of events found:",
      data.events ? data.events.length : 0
    );

    if (data.events && data.events.length > 0) {
      console.log("\nEvents:");
      data.events.forEach((event, index) => {
        console.log(`\n--- Event ${index + 1} ---`);
        console.log(`ID: ${event.id}`);
        console.log(`Name: ${event.name}`);
        console.log(`Address: ${event.address}`);
        console.log(`Start Date: ${event.start_date}`);
        console.log(`End Date: ${event.end_date}`);
        console.log(`Total Registrations: ${event.total_registrations || 0}`);
        console.log(
          `Pending Ticket Assignments: ${event.pending_ticket_assignments || 0}`
        );
      });
    } else {
      console.log("No events found or empty events array returned.");
    }
  })
  .catch((error) => {
    console.error("Error fetching events:");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request error:", error.message);
    }
  });
