// Test the raffle win notification endpoint
const fetch = require("node-fetch");

async function testRaffleNotification() {
  try {
    console.log("🧪 Testing raffle win notification endpoint...");

    // This will fail because we need admin authentication
    // but it will tell us if the endpoint exists
    const response = await fetch(
      "http://localhost:3000/api/notifications/raffle-win",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: 4,
          ticketNumber: 3,
          raffleDate: "2025-07-14",
        }),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response body:", result);

    if (response.status === 401) {
      console.log(
        "✅ Endpoint exists but requires admin authentication (expected)"
      );
    } else if (response.status === 404) {
      console.log("❌ Endpoint not found - route not loaded");
    } else {
      console.log("✅ Endpoint is working!");
    }
  } catch (error) {
    console.error("❌ Error testing endpoint:", error.message);
  }
}

testRaffleNotification();
