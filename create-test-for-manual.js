// Manual test to check refresh functionality in real-time
const http = require("http");

async function createTestCompetition() {
  console.log("Creating test competition for manual testing...");

  const competitionData = {
    type: "individual",
    name: "Manual Test Competition - " + new Date().toLocaleTimeString(),
    cost: 5.0,
    kicks_per_player: 5,
    max_participants: 4,
    description: "Test competition for manual refresh testing",
    participants: [1, 2],
  };

  try {
    const result = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );
    if (result.success) {
      console.log(`✅ Competition created successfully!`);
      console.log(`Competition ID: ${result.data.id}`);
      console.log(`Name: ${result.data.name}`);
      console.log("");
      console.log("🔍 Now check the browser:");
      console.log("1. Go to http://localhost:3000/staff/competition-setup");
      console.log('2. Click the "Manual Refresh" button');
      console.log("3. You should see the new competition appear");
      console.log(
        '4. Click "Test Refresh" button to test the refresh function'
      );
      console.log(
        "5. Try cancelling the competition and see if the queue auto-updates"
      );
      return result.data.id;
    } else {
      console.error("Failed to create competition:", result.message);
    }
  } catch (error) {
    console.error("Error creating test competition:", error);
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

createTestCompetition();
