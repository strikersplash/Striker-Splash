// Test immediate DOM removal after cancel
const http = require("http");

async function testImmediateRemoval() {
  console.log("🎯 === TESTING IMMEDIATE DOM REMOVAL ===");
  console.log(
    "This will create a competition that you can cancel to test immediate removal"
  );
  console.log("");

  try {
    // Create a test competition
    console.log("🏗️ Creating test competition...");
    const competitionData = {
      type: "individual",
      name: "DOM Removal Test - " + new Date().toLocaleTimeString(),
      cost: 5.0,
      kicks_per_player: 5,
      max_participants: 4,
      description: "Test competition for immediate DOM removal",
      participants: [1, 2],
    };

    const createResult = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );

    if (createResult.success) {
      console.log(`✅ Competition created successfully!`);
      console.log(`Competition ID: ${createResult.data.id}`);
      console.log(`Name: ${createResult.data.name}`);
      console.log("");
      console.log("🧪 NOW TEST THE IMMEDIATE REMOVAL:");
      console.log("1. Go to http://localhost:3000/staff/competition-setup");
      console.log("2. You should see the new competition in the queue");
      console.log('3. Click "Cancel" on the competition');
      console.log(
        "4. The competition should disappear IMMEDIATELY from the queue"
      );
      console.log('5. You should NOT need to click "Manual Refresh"');
      console.log("");
      console.log("🔍 Expected behavior:");
      console.log("  - Competition fades out with opacity animation");
      console.log("  - Competition card is removed from DOM after 300ms");
      console.log(
        '  - If queue becomes empty, shows "No competitions" message'
      );
      console.log(
        "  - Background refresh happens after 1 second for consistency"
      );
      console.log("");
      console.log("✨ This should now work without any manual refresh!");
    } else {
      console.error("❌ Failed to create competition:", createResult.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

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
          console.error("Failed to parse JSON response:", body);
          reject(e);
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

testImmediateRemoval();
