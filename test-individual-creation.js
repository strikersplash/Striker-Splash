// Test individual competition creation with debug logging
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

async function testIndividualCreation() {
  console.log("🧪 Testing Individual Competition Creation...");

  try {
    // Create an individual competition with explicit participants
    const competitionData = {
      type: "individual",
      name: "Debug Individual Test - " + new Date().toLocaleTimeString(),
      cost: 5.0,
      kicks_per_player: 5,
      max_participants: 2,
      description: "Test competition to debug participant insertion",
      participants: [1, 2], // Explicit participant IDs
    };

    console.log("🎯 Creating competition with data:", competitionData);

    const result = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );

    if (result.success) {
      console.log("✅ Competition created successfully!");
      console.log(
        `Competition ID: ${result.data?.id || result.competition?.id}`
      );

      // Now check the queue to see if participants show up
      console.log("\n🔍 Checking queue for participant count...");
      const queueResult = await makeRequest("/staff/competition-setup/queue");

      if (queueResult.success) {
        const newComp = queueResult.competitions.find((c) =>
          c.name.includes("Debug Individual Test")
        );
        if (newComp) {
          console.log("📊 Found competition in queue:");
          console.log(`  Name: ${newComp.name}`);
          console.log(`  Type: ${newComp.type}`);
          console.log(`  Participant Count: ${newComp.participant_count}`);
          console.log(`  Team Count: ${newComp.team_count}`);
        } else {
          console.log("❌ Competition not found in queue");
        }
      } else {
        console.log("❌ Queue request failed:", queueResult.message);
      }
    } else {
      console.log(
        "❌ Competition creation failed:",
        result.message || result.body
      );
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

testIndividualCreation();
