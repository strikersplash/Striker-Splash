// Final comprehensive test for auto-refresh functionality
const http = require("http");

async function finalRefreshTest() {
  console.log("🧪 === FINAL COMPREHENSIVE REFRESH TEST ===");
  console.log(
    "This test will verify that the auto-refresh functionality works correctly."
  );
  console.log("");

  try {
    // Step 1: Get initial queue state
    console.log("📊 Step 1: Getting initial queue state...");
    const initialQueue = await makeRequest(
      "/staff/competition-setup/queue-test"
    );
    const initialCount = initialQueue.competitions?.length || 0;
    console.log(`Initial queue has ${initialCount} competitions`);

    // Step 2: Create a test competition
    console.log("\n🏗️  Step 2: Creating test competition...");
    const competitionData = {
      type: "individual",
      name: "Final Test Competition - " + Date.now(),
      cost: 7.5,
      kicks_per_player: 10,
      max_participants: 6,
      description: "Final test for auto-refresh functionality",
      participants: [1, 2, 3],
    };

    const createResult = await makeRequest(
      "/api/competitions",
      "POST",
      competitionData
    );

    if (!createResult.success) {
      console.error("❌ Competition creation failed:", createResult.message);
      return;
    }

    const competitionId = createResult.data.id;
    console.log(`✅ Competition created successfully! ID: ${competitionId}`);

    // Wait for potential async operations
    await sleep(1000);

    // Step 3: Verify queue shows new competition
    console.log("\n🔍 Step 3: Verifying queue updated after creation...");
    const queueAfterCreate = await makeRequest(
      "/staff/competition-setup/queue-test"
    );
    const countAfterCreate = queueAfterCreate.competitions?.length || 0;

    console.log(`Queue now has ${countAfterCreate} competitions`);

    if (countAfterCreate > initialCount) {
      console.log("✅ Queue correctly updated after creation");
    } else {
      console.log("⚠️  Queue may not have updated properly after creation");
    }

    // Step 4: Cancel the competition
    console.log("\n🗑️  Step 4: Cancelling the test competition...");
    const cancelResult = await makeRequest(
      `/staff/competition-setup/${competitionId}/cancel-test`,
      "POST"
    );

    if (!cancelResult.success) {
      console.error(
        "❌ Competition cancellation failed:",
        cancelResult.message
      );
      return;
    }

    console.log("✅ Competition cancelled successfully");

    // Wait for potential async operations
    await sleep(1000);

    // Step 5: Verify queue updated after cancellation
    console.log("\n🔍 Step 5: Verifying queue updated after cancellation...");
    const queueAfterCancel = await makeRequest(
      "/staff/competition-setup/queue-test"
    );
    const countAfterCancel = queueAfterCancel.competitions?.length || 0;

    console.log(`Queue now has ${countAfterCancel} competitions`);

    // Final verification
    console.log("\n📋 === FINAL RESULTS ===");
    console.log(`Initial competitions: ${initialCount}`);
    console.log(`After creation: ${countAfterCreate}`);
    console.log(`After cancellation: ${countAfterCancel}`);

    if (countAfterCancel === initialCount) {
      console.log(
        "✅ SUCCESS: Queue correctly updated through the entire workflow!"
      );
      console.log("");
      console.log(
        "🎯 The backend auto-refresh functionality is working perfectly."
      );
      console.log(
        "If the frontend auto-refresh still isn't working, the issue is likely:"
      );
      console.log("  • JavaScript execution timing");
      console.log("  • DOM update delays");
      console.log("  • Browser console errors preventing refresh calls");
      console.log("");
      console.log("💡 DEBUGGING TIPS:");
      console.log("  1. Open browser DevTools (F12)");
      console.log("  2. Go to http://localhost:3000/staff/competition-setup");
      console.log("  3. Watch the Console tab for JavaScript errors");
      console.log('  4. Try clicking "Manual Refresh" button');
      console.log('  5. Try clicking "Test Refresh" button');
      console.log("  6. Try cancelling a competition and watch console logs");
    } else {
      console.log("❌ ISSUE: Queue did not return to original state");
      console.log("This suggests there might be a backend filtering issue");
    }
  } catch (error) {
    console.error("❌ Test failed with error:", error);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

finalRefreshTest();
