// Test script to create a competition and then check the live page
const fetch = require("node-fetch");

async function createTestCompetition() {
  try {
    console.log("Creating test competition...");

    // Create a competition using the test endpoint (no auth required)
    const createResponse = await fetch(
      "http://localhost:3000/staff/competition-setup-test"
    );

    if (createResponse.ok) {
      console.log("Competition setup page loaded successfully");

      // Now let's check if there's an active competition we can work with
      const queueResponse = await fetch(
        "http://localhost:3000/staff/competition-setup/queue-test"
      );
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        console.log(
          "Current competitions:",
          queueData.competitions?.length || 0
        );

        const activeComp = queueData.competitions?.find(
          (c) => c.status === "active"
        );
        if (activeComp) {
          console.log(
            "Active competition found:",
            activeComp.id,
            activeComp.name
          );
          console.log(
            "Live page URL:",
            `http://localhost:3000/staff/competition-live/${activeComp.id}`
          );
        }

        const waitingComp = queueData.competitions?.find(
          (c) => c.status === "waiting"
        );
        if (waitingComp) {
          console.log(
            "Waiting competition found:",
            waitingComp.id,
            waitingComp.name
          );
          // Start it first
          const startResponse = await fetch(
            `http://localhost:3000/staff/competition-setup/${waitingComp.id}/start-test`,
            {
              method: "POST",
            }
          );
          const startData = await startResponse.json();
          console.log("Started competition:", startData);
          console.log(
            "Live page URL:",
            `http://localhost:3000/staff/competition-live/${waitingComp.id}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

createTestCompetition();
