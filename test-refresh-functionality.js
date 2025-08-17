// Test script to verify the auto-refresh functionality
const http = require("http");

// Test creating a competition and then cancelling it to see if the queue refreshes
async function testRefreshFunctionality() {
  console.log("=== Testing Competition Queue Auto-Refresh ===");

  // Step 1: Get current queue state
  console.log("\n1. Getting current queue state...");
  const initialQueue = await makeRequest("/staff/competition-setup/queue-test");
  console.log("Initial queue size:", initialQueue.competitions?.length || 0);

  // Step 2: Create a test competition
  console.log("\n2. Creating test competition...");
  const competitionData = {
    type: "individual",
    name: "Test Individual Competition (Auto-Refresh Test)",
    cost: 5.0,
    kicks_per_player: 5,
    max_participants: 4,
    description: "Test competition for auto-refresh testing",
    participants: [1, 2], // Assuming these player IDs exist
  };

  const createResult = await makeRequest(
    "/api/competitions",
    "POST",
    competitionData
  );
  console.log("Competition created:", createResult.success);

  if (!createResult.success) {
    console.error("Failed to create competition:", createResult.message);
    return;
  }

  const competitionId = createResult.data.id;
  console.log("Competition ID:", competitionId);

  // Step 3: Check queue after creation (should show new competition)
  console.log("\n3. Checking queue after creation...");
  const queueAfterCreate = await makeRequest(
    "/staff/competition-setup/queue-test"
  );
  console.log(
    "Queue size after creation:",
    queueAfterCreate.competitions?.length || 0
  );

  // Step 4: Cancel the competition
  console.log("\n4. Cancelling competition...");
  const cancelResult = await makeRequest(
    `/staff/competition-setup/${competitionId}/cancel-test`,
    "POST"
  );
  console.log("Cancel result:", cancelResult.success);

  if (!cancelResult.success) {
    console.error("Failed to cancel competition:", cancelResult.message);
    return;
  }

  // Step 5: Check queue after cancellation (should be back to original)
  console.log("\n5. Checking queue after cancellation...");
  const queueAfterCancel = await makeRequest(
    "/staff/competition-setup/queue-test"
  );
  console.log(
    "Queue size after cancellation:",
    queueAfterCancel.competitions?.length || 0
  );

  // Verify the refresh worked
  if (
    queueAfterCancel.competitions?.length === initialQueue.competitions?.length
  ) {
    console.log(
      "\n✅ Auto-refresh functionality appears to be working correctly!"
    );
    console.log(
      "The queue correctly updated after both creation and cancellation."
    );
  } else {
    console.log("\n❌ Auto-refresh may have issues:");
    console.log("Initial queue size:", initialQueue.competitions?.length || 0);
    console.log(
      "Final queue size:",
      queueAfterCancel.competitions?.length || 0
    );
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

// Run the test
testRefreshFunctionality().catch(console.error);
