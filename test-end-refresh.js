// Test the end competition refresh functionality
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

async function testEndRefresh() {
  console.log("🧪 Testing End Competition Refresh...");

  try {
    // First create a competition to test ending
    console.log("1. Creating a test competition...");
    const competitionData = {
      type: "individual",
      name: "End Test Competition - " + new Date().toLocaleTimeString(),
      cost: 5.0,
      kicks_per_player: 5,
      max_participants: 2,
      description: "Test competition for end functionality",
      participants: [1, 2],
    };

    const createResult = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );

    if (createResult.success) {
      const competitionId =
        createResult.data?.id || createResult.competition?.id;
      console.log("✅ Competition created with ID:", competitionId);

      // Start the competition first
      console.log("2. Starting the competition...");
      const startResult = await makeRequest(
        `/staff/competition-setup/${competitionId}/start`,
        "POST"
      );

      if (startResult.success) {
        console.log("✅ Competition started successfully");

        // Now test ending the competition
        console.log("3. Testing end competition...");
        const endResult = await makeRequest(
          `/staff/competition-setup/${competitionId}/end`,
          "POST"
        );

        if (endResult.success) {
          console.log("✅ Competition ended successfully!");
          console.log("🎯 Now test in browser:");
          console.log(
            "   1. Go to http://localhost:3000/staff/competition-setup"
          );
          console.log(
            "   2. The ended competition should NOT appear in the queue"
          );
          console.log(
            "   3. The end action should have auto-refreshed the queue"
          );
        } else {
          console.log("❌ End failed:", endResult.message || endResult.body);
        }
      } else {
        console.log(
          "❌ Start failed:",
          startResult.message || startResult.body
        );
      }
    } else {
      console.log(
        "❌ Creation failed:",
        createResult.message || createResult.body
      );
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

testEndRefresh();
