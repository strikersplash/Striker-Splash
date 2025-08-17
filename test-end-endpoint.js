// Test script to check if the end competition endpoint is working
const fetch = require("node-fetch");

async function testEndCompetition() {
  try {
    // First, let's see what competitions exist
    console.log("Testing end competition endpoint...");

    // This assumes the server is running on port 3000
    const response = await fetch(
      "http://localhost:3000/staff/competition-setup/queue"
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Queue response:", data);

      if (data.competitions && data.competitions.length > 0) {
        const activeCompetition = data.competitions.find(
          (comp) => comp.status === "active"
        );
        if (activeCompetition) {
          console.log("Found active competition:", activeCompetition.id);

          // Test the end endpoint
          const endResponse = await fetch(
            `http://localhost:3000/staff/competition-setup/${activeCompetition.id}/end`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const endData = await endResponse.json();
          console.log("End competition response:", endData);
        } else {
          console.log("No active competitions found to test with");
        }
      } else {
        console.log("No competitions found in queue");
      }
    } else {
      console.log("Failed to get queue:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error testing end competition:", error);
  }
}

testEndCompetition();
