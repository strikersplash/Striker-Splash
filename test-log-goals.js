const axios = require("axios");

async function testLogGoals() {
  try {
    const response = await axios.post(
      "http://localhost:3000/staff/competition-setup/log-goals",
      {
        competitionId: 4,
        participantId: 5,
        kicksUsed: 5,
        goals: 3,
        consecutiveKicks: 4,
        notes: "Test goals for global leaderboard",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    console.log("Response:", response.data);
  } catch (error) {
    console.log("Error response status:", error.response?.status);
    console.log("Error response data:", error.response?.data);
    console.log("Error message:", error.message);
  }
}

testLogGoals();
