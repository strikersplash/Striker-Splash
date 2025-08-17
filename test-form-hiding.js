// Test form hiding after competition creation
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

async function testFormHiding() {
  console.log("🧪 Testing Form Hiding After Competition Creation...");

  try {
    // Create a test competition
    console.log("1. Creating test competition...");
    const competitionData = {
      type: "individual",
      name: "Form Hide Test - " + new Date().toLocaleTimeString(),
      cost: 5.0,
      kicks_per_player: 5,
      max_participants: 2,
      description: "Test competition for form hiding",
      participants: [1, 2],
    };

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
      console.log("");
      console.log("🎯 Now test the form hiding behavior:");
      console.log("1. Go to http://localhost:3000/staff/competition-setup");
      console.log("2. Click 'Setup Individual Competition'");
      console.log("3. Fill out the form and create a competition");
      console.log("4. After creation, the form should automatically hide");
      console.log("5. You should see the success notification");
      console.log("6. The queue should refresh with the new competition");
      console.log("");
      console.log("✨ Expected behavior:");
      console.log("  - Form stays visible during creation");
      console.log("  - Success notification appears");
      console.log("  - Form automatically hides after 2 seconds");
      console.log("  - Queue refreshes and shows new competition");
      console.log("  - Only Start and Cancel buttons for new competition");
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

testFormHiding();
