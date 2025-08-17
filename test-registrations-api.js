#!/usr/bin/env node

/**
 * Direct test for the registered-players endpoint
 *
 * This script tests the API endpoint that fetches registrations for a specific event
 */

const axios = require("axios");

// Set the base URL and event ID
const baseUrl = "http://localhost:3000"; // Change this if you're using a different port
const eventId = process.argv[2] || "1"; // Default to event ID 1 if not provided

// URL to test
const url = `${baseUrl}/staff/registered-players/${eventId}`;

console.log(`Testing endpoint: ${url}`);

// Make the request
axios
  .get(url)
  .then((response) => {
    console.log("Response status:", response.status);
    console.log("Success:", response.data.success);

    if (response.data.event) {
      console.log("\nEvent Details:");
      console.log(`Name: ${response.data.event.name}`);
      console.log(`Address: ${response.data.event.address}`);
      console.log(
        `Dates: ${new Date(
          response.data.event.start_date
        ).toLocaleDateString()} - ${new Date(
          response.data.event.end_date
        ).toLocaleDateString()}`
      );
    }

    const registrations = response.data.registrations || [];
    console.log(`\nRegistrations found: ${registrations.length}`);

    if (registrations.length > 0) {
      console.log("\nRegistrations:");
      registrations.forEach((reg, i) => {
        console.log(`\n--- Registration ${i + 1} ---`);
        console.log(`ID: ${reg.registration_id}`);
        console.log(`Player: ${reg.player_name}`);
        console.log(`Phone: ${reg.phone || "N/A"}`);
        console.log(`Reg #: ${reg.registration_number}`);
        console.log(`Kicks: ${reg.kicks_requested}`);
        console.log(
          `Date: ${new Date(reg.registration_date).toLocaleString()}`
        );
        console.log(`Type: ${reg.is_competition ? "Competition" : "Practice"}`);
        console.log(`Has Ticket: ${reg.queue_ticket_id ? "Yes" : "No"}`);
      });
    }

    // Print raw response for debugging
    console.log("\nRaw response data:");
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((error) => {
    console.error("Error while fetching registrations:");

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server");
    } else {
      // Something happened in setting up the request
      console.error("Error message:", error.message);
    }
  });
