// Comprehensive test of the end competition functionality
const fetch = require("node-fetch");

async function runComprehensiveTest() {
  console.log("🧪 Starting comprehensive end competition test...\n");

  try {
    // Step 1: Check if server is running
    console.log("1️⃣ Testing server connectivity...");
    const serverTest = await fetch(
      "http://localhost:3000/staff/competition-setup/queue-test"
    );
    if (!serverTest.ok) {
      throw new Error("Server not responding");
    }
    console.log("✅ Server is running\n");

    // Step 2: Create a new test competition
    console.log("2️⃣ Creating new test competition...");
    const { pool } = require("./dist/config/db.js");
    const result = await pool.query(`
      INSERT INTO competitions (name, type, cost, kicks_per_player, status, created_at)
      VALUES ('Test End Button ' || NOW(), 'individual', 5.00, 3, 'active', NOW())
      RETURNING id, name, status
    `);
    const competition = result.rows[0];
    console.log(
      `✅ Created competition: ID ${competition.id}, Status: ${competition.status}\n`
    );

    // Step 3: Test direct endpoint access
    console.log("3️⃣ Testing direct endpoint access...");
    const endpointTest = await fetch(
      `http://localhost:3000/staff/competition-setup-test/${competition.id}/end`,
      {
        method: "POST",
      }
    );

    if (!endpointTest.ok) {
      console.log(`❌ Endpoint failed with status: ${endpointTest.status}`);
      const errorText = await endpointTest.text();
      console.log("Error response:", errorText.substring(0, 200));
    } else {
      const endpointData = await endpointTest.json();
      console.log(
        "✅ Direct endpoint test result:",
        endpointData.success ? "SUCCESS" : "FAILED"
      );
      console.log(`   Message: ${endpointData.message}\n`);
    }

    // Step 4: Create another competition for live page test
    console.log("4️⃣ Creating another competition for live page test...");
    const result2 = await pool.query(`
      INSERT INTO competitions (name, type, cost, kicks_per_player, status, created_at)
      VALUES ('Live Page Test ' || NOW(), 'individual', 5.00, 3, 'active', NOW())
      RETURNING id, name, status
    `);
    const competition2 = result2.rows[0];
    console.log(`✅ Created competition: ID ${competition2.id}\n`);

    // Step 5: Test live page accessibility
    console.log("5️⃣ Testing live page accessibility...");
    const livePageTest = await fetch(
      `http://localhost:3000/staff/competition-live-test/${competition2.id}`
    );
    if (livePageTest.ok) {
      const pageContent = await livePageTest.text();

      // Check for key elements
      const hasButton = pageContent.includes('id="end-competition-btn"');
      const hasFunction = pageContent.includes(
        "window.endCompetition = function"
      );
      const hasEventListener = pageContent.includes(
        "getElementById('end-competition-btn')"
      );

      console.log(`✅ Live page accessible`);
      console.log(`   End button present: ${hasButton ? "✅" : "❌"}`);
      console.log(`   endCompetition function: ${hasFunction ? "✅" : "❌"}`);
      console.log(`   Event listener setup: ${hasEventListener ? "✅" : "❌"}`);
      console.log(
        `   Live page URL: http://localhost:3000/staff/competition-live-test/${competition2.id}\n`
      );
    } else {
      console.log(`❌ Live page not accessible: ${livePageTest.status}\n`);
    }

    console.log("🎯 Test Summary:");
    console.log(`   - Active competition ID for testing: ${competition2.id}`);
    console.log(
      `   - Live page URL: http://localhost:3000/staff/competition-live-test/${competition2.id}`
    );
    console.log(
      `   - Direct endpoint: http://localhost:3000/staff/competition-setup-test/${competition2.id}/end`
    );
    console.log("\n🔧 Manual test steps:");
    console.log("   1. Open the live page URL in browser");
    console.log("   2. Click the red 'End Competition' button");
    console.log("   3. You should see an alert saying 'Button clicked!'");
    console.log("   4. Confirm the dialog to end the competition");
    console.log("   5. You should see a success notification and redirect");

    pool.end();
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runComprehensiveTest();
