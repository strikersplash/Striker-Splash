// Test script to authenticate and test log goals functionality
const axios = require("axios");

async function testWithAuth() {
  try {
    // First, login as staff
    console.log("🔐 Logging in as staff...");
    const loginResponse = await axios.post(
      "http://localhost:3000/auth/login",
      {
        username: "staff",
        password: "staff123",
        userType: "staff",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      }
    );

    console.log("✅ Login successful!");
    const cookies = loginResponse.headers["set-cookie"];

    if (!cookies) {
      console.log("❌ No cookies received from login");
      return;
    }

    // Now test logging goals with authentication
    console.log("📝 Testing log goals functionality...");
    const logGoalsResponse = await axios.post(
      "http://localhost:3000/staff/competition-setup/log-goals",
      {
        competitionId: 82,
        participantId: 1,
        kicksUsed: 3,
        goals: 2,
        location: "Test Location",
        trackConsecutive: false,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookies.join("; "),
        },
      }
    );

    console.log("✅ Log Goals Response:", logGoalsResponse.data);

    // Test getting leaderboard
    console.log("📊 Testing leaderboard functionality...");
    const leaderboardResponse = await axios.get(
      "http://localhost:3000/staff/competition-setup/82/leaderboard",
      {
        headers: {
          Cookie: cookies.join("; "),
        },
      }
    );

    console.log("✅ Leaderboard Response:", leaderboardResponse.data);
  } catch (error) {
    console.log("❌ Error:", error.response?.data || error.message);
  }
}

testWithAuth();
