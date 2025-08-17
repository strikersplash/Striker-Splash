// Debug script to test frontend JavaScript behavior
// This will simulate what happens in the browser

const http = require("http");

async function testFrontendRefresh() {
  console.log("=== Testing Frontend Refresh Logic ===");

  // Test 1: Verify the queue endpoint works
  console.log("\n1. Testing queue endpoint...");
  try {
    const queueResponse = await makeRequest(
      "/staff/competition-setup/queue-test"
    );
    console.log("Queue endpoint working:", queueResponse.success);
    console.log(
      "Current competitions in queue:",
      queueResponse.competitions?.length || 0
    );
  } catch (error) {
    console.error("Queue endpoint failed:", error.message);
    return;
  }

  // Test 2: Test the exact same flow as the frontend
  console.log("\n2. Simulating frontend refresh flow...");

  // Create competition
  const competitionData = {
    type: "individual",
    name: "Frontend Test Competition",
    cost: 10.0,
    kicks_per_player: 10,
    max_participants: 6,
    description: "Testing frontend refresh logic",
    participants: [1, 2, 3],
  };

  const createResult = await makeRequest(
    "/api/competitions",
    "POST",
    competitionData
  );
  if (!createResult.success) {
    console.error("Competition creation failed:", createResult.message);
    return;
  }

  const competitionId = createResult.data.id;
  console.log("Created competition ID:", competitionId);

  // Wait a moment (simulate network delay)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if queue refreshed
  const queueAfterCreate = await makeRequest(
    "/staff/competition-setup/queue-test"
  );
  console.log(
    "Queue after creation - competitions:",
    queueAfterCreate.competitions?.length || 0
  );

  // Test cancel with detailed logging
  console.log("\n3. Testing cancel with detailed response...");
  const cancelResponse = await makeRequest(
    `/staff/competition-setup/${competitionId}/cancel-test`,
    "POST"
  );
  console.log("Cancel response:", cancelResponse);

  // Wait a moment
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check queue after cancel
  const queueAfterCancel = await makeRequest(
    "/staff/competition-setup/queue-test"
  );
  console.log(
    "Queue after cancel - competitions:",
    queueAfterCancel.competitions?.length || 0
  );

  console.log(
    "\n=== Testing the exact JavaScript that should run in browser ==="
  );

  // Simulate the JavaScript flow
  console.log("4. Simulating forceRefreshQueue() function...");

  // This simulates what should happen when forceRefreshQueue() is called
  const refreshResult = await makeRequest(
    "/staff/competition-setup/queue-test"
  );
  console.log("Refresh simulation result:", {
    success: refreshResult.success,
    competitionCount: refreshResult.competitions?.length || 0,
  });

  if (refreshResult.success) {
    console.log("✅ JavaScript refresh logic should work");
    console.log("If the frontend isn't refreshing, the issue is likely:");
    console.log("  - JavaScript not executing the refresh call");
    console.log("  - DOM not updating with new data");
    console.log("  - Timing issues in the JavaScript");
    console.log("  - Browser caching issues");
  } else {
    console.log("❌ Backend refresh endpoint has issues");
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

testFrontendRefresh().catch(console.error);
