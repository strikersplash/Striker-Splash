const fetch = require("node-fetch");

async function testGoalLoggingAPI() {
  try {
    console.log("Testing goal logging API...");

    const data = {
      competitionId: 71,
      participantId: 1,
      teamId: null,
      kicksUsed: 3,
      goals: 2,
      consecutiveKicks: null,
      notes: "Test goal logging",
    };

    console.log("Sending request with data:", data);

    const response = await fetch(
      "http://localhost:3000/staff/competition-setup/log-goals",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "connect.sid=s%3AtestSessionId.testSignature", // Mock session
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();
    console.log("Response status:", response.status);
    console.log("Response body:", result);

    if (result.success) {
      console.log("✅ Goal logging API works!");

      // Test the leaderboard API
      console.log("\nTesting leaderboard API...");
      const leaderboardResponse = await fetch(
        "http://localhost:3000/staff/competition-setup/71/leaderboard"
      );
      const leaderboardResult = await leaderboardResponse.json();

      console.log("Leaderboard response:", leaderboardResult);

      if (
        leaderboardResult.success &&
        leaderboardResult.leaderboard.length > 0
      ) {
        console.log("✅ Leaderboard API works!");
        console.log(
          "Billy Kid stats:",
          leaderboardResult.leaderboard.find((p) => p.name === "Billy Kid")
        );
      }
    }
  } catch (error) {
    console.error("Error testing APIs:", error);
  }
}

testGoalLoggingAPI();
