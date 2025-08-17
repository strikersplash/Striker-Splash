// Test the SQL fixes
const http = require("http");

function makeRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(body);
          resolve(jsonData);
        } catch (e) {
          resolve({ body, status: res.statusCode });
        }
      });
    });

    req.on("error", (e) => {
      reject(e);
    });
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testSQLFixes() {
  console.log("🧪 Testing SQL fixes...");

  // Create a test competition
  const competitionData = {
    type: "individual",
    name: "SQL Fix Test - " + new Date().toLocaleTimeString(),
    cost: 5.0,
    kicks_per_player: 5,
    max_participants: 4,
    description: "Test competition for SQL fixes",
    participants: [1, 2],
  };

  try {
    console.log("1. Creating competition...");
    const result = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );

    if (result.success) {
      console.log("✅ Competition created successfully!");
      console.log("Competition ID:", result.data?.id || result.competition?.id);
      const competitionId = result.data?.id || result.competition?.id;

      // Test the leaderboard endpoint
      console.log("\n2. Testing leaderboard endpoint...");
      const leaderboard = await makeRequest(
        `/staff/competition-setup/${competitionId}/leaderboard`
      );

      if (leaderboard.success) {
        console.log("✅ Leaderboard endpoint working!");
        console.log("Participants:", leaderboard.participants.length);
        console.log("Sample participant:", leaderboard.participants[0]);
      } else {
        console.log(
          "❌ Leaderboard error:",
          leaderboard.message || leaderboard.body
        );
      }

      // Test team leaderboard too if possible
      console.log("\n3. Testing team leaderboard endpoint...");
      const teamLeaderboard = await makeRequest(
        `/staff/competition-setup/${competitionId}/team-leaderboard`
      );

      if (teamLeaderboard.success) {
        console.log("✅ Team leaderboard endpoint working!");
      } else {
        console.log(
          "❌ Team leaderboard error:",
          teamLeaderboard.message || "Expected error for individual competition"
        );
      }
    } else {
      console.log(
        "❌ Competition creation failed:",
        result.message || result.body
      );
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

testSQLFixes();
