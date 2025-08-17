// Test script to verify that transactions are loaded properly for sales users
const fetch = require("node-fetch");

async function testTransactionLoad() {
  try {
    console.log("Testing transaction loading for sales users...");

    // First, check the debug endpoint
    const response = await fetch(
      "http://localhost:3000/cashier/api/debug/transactions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: "connect.sid=s%3A", // You'll need to get the session cookie
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("Debug endpoint response:", data);
    } else {
      console.log("Debug endpoint status:", response.status);
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testTransactionLoad();
