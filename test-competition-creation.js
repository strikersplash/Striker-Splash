const fetch = require("node-fetch");

async function testCompetitionCreation() {
  try {
    console.log("Testing competition creation API...");

    // Mock data that should be sent from frontend
    const testData = {
      type: "individual",
      name: "Test Competition (3 players)",
      cost: 10.0,
      kicks_per_player: 5,
      max_participants: 10,
      description: "Test competition",
      participants: [1, 3, 9], // Sample player IDs
    };

    console.log("Sending test data:", JSON.stringify(testData, null, 2));

    const response = await fetch(
      "http://localhost:3000/staff/competition-setup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // This will likely fail due to authentication, but we can see what happens
        },
        body: JSON.stringify(testData),
      }
    );

    console.log("Response status:", response.status);
    const result = await response.text(); // Use text() to see any HTML responses
    console.log("Response body:", result);
  } catch (error) {
    console.error("Error testing API:", error.message);
  }
}

testCompetitionCreation();
