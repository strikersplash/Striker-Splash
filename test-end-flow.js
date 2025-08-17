// Test script to create an individual competition and then try to end it from the live page
const fetch = require("node-fetch");

async function testCompetitionFlow() {
  try {
    console.log("Creating a test individual competition...");

    // Create a competition using the test endpoint
    const createResponse = await fetch(
      "http://localhost:3000/staff/competition-setup/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "type=individual&format=penalties&cost=5&kicksPerPlayer=3&name=Test%20Individual%20Competition",
      }
    );

    console.log("Create response status:", createResponse.status);
    if (createResponse.ok) {
      const text = await createResponse.text();
      console.log(
        "Create response text (first 200 chars):",
        text.substring(0, 200)
      );
    }

    // Try to get the queue to see if the competition was created
    const queueResponse = await fetch(
      "http://localhost:3000/staff/competition-setup/queue-test"
    );
    if (queueResponse.ok) {
      const queueData = await queueResponse.json();
      console.log("Queue data:", queueData);

      if (queueData.competitions && queueData.competitions.length > 0) {
        const competition = queueData.competitions[0];
        console.log(
          "Found competition:",
          competition.id,
          competition.name,
          competition.status
        );

        // Start the competition if it's not active
        if (competition.status === "waiting") {
          console.log("Starting competition...");
          const startResponse = await fetch(
            `http://localhost:3000/staff/competition-setup/${competition.id}/start-test`,
            {
              method: "POST",
            }
          );
          const startData = await startResponse.json();
          console.log("Start response:", startData);
        }

        // Now try to end it
        console.log("Trying to end competition...");
        const endResponse = await fetch(
          `http://localhost:3000/staff/competition-setup/${competition.id}/end-test`,
          {
            method: "POST",
          }
        );

        if (endResponse.ok) {
          const endData = await endResponse.json();
          console.log("End response:", endData);
        } else {
          console.log("End failed with status:", endResponse.status);
          const errorText = await endResponse.text();
          console.log("Error text:", errorText);
        }
      }
    }
  } catch (error) {
    console.error("Error in test:", error);
  }
}

testCompetitionFlow();
