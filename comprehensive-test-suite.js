// Comprehensive test for competition live page functionality
const runComprehensiveTest = async () => {
  console.log("🧪 Starting Comprehensive Competition Live Page Test");
  console.log("=".repeat(60));

  let allTestsPassed = true;
  const testResults = [];

  // Helper function to log test results
  const logTest = (name, passed, details = "") => {
    const status = passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} ${name}${details ? ` - ${details}` : ""}`);
    testResults.push({ name, passed, details });
    if (!passed) allTestsPassed = false;
  };

  try {
    // Test 1: Check required functions exist
    console.log("\n1️⃣ Testing Function Availability");

    const requiredFunctions = [
      "openLogGoalsModal",
      "viewTeamMembers",
      "logTeamGoals",
      "submitGoals",
      "updateTeamAfterGoals",
      "updateTeamMaxKicks",
    ];

    requiredFunctions.forEach((funcName) => {
      const exists = typeof window[funcName] === "function";
      logTest(`Function ${funcName} exists`, exists);
    });

    // Test 2: Check team ID consistency
    console.log("\n2️⃣ Testing Team ID Consistency");

    const teamCards = document.querySelectorAll(".team-card");
    if (teamCards.length === 0) {
      logTest("Team cards found", false, "No team cards in DOM");
    } else {
      logTest("Team cards found", true, `${teamCards.length} cards`);

      teamCards.forEach((card, index) => {
        const cardTeamId = card.getAttribute("data-team-id");
        const scoreElement = card.querySelector('[id^="team-score-"]');
        const kicksElement = card.querySelector('[id^="team-kicks-"]');
        const button = card.querySelector(".view-team-members-btn");

        const scoreId = scoreElement?.id.replace("team-score-", "");
        const kicksId = kicksElement?.id.replace("team-kicks-", "");
        const buttonTeamId = button?.getAttribute("data-team-id");

        const allMatch =
          cardTeamId === scoreId &&
          scoreId === kicksId &&
          kicksId === buttonTeamId;
        logTest(
          `Team ${index + 1} ID consistency`,
          allMatch,
          `Card:${cardTeamId} Score:${scoreId} Kicks:${kicksId} Button:${buttonTeamId}`
        );
      });
    }

    // Test 3: Test UI update functions
    console.log("\n3️⃣ Testing UI Update Functions");

    if (teamCards.length > 0) {
      const firstCard = teamCards[0];
      const teamId = firstCard.getAttribute("data-team-id");

      // Test updateTeamAfterGoals
      const scoreElement = document.getElementById(`team-score-${teamId}`);
      const kicksElement = document.getElementById(`team-kicks-${teamId}`);

      if (scoreElement && kicksElement) {
        const originalScore = parseInt(scoreElement.textContent) || 0;
        const originalKicks = kicksElement.textContent;

        // Test update
        updateTeamAfterGoals(teamId, 2, 3);

        const newScore = parseInt(scoreElement.textContent) || 0;
        const newKicks = kicksElement.textContent;

        logTest("updateTeamAfterGoals - score", newScore === originalScore + 2);
        logTest("updateTeamAfterGoals - kicks", newKicks !== originalKicks);

        // Restore values
        scoreElement.textContent = originalScore;
        kicksElement.textContent = originalKicks;

        // Test updateTeamMaxKicks
        updateTeamMaxKicks(teamId, 55);
        const maxKicksTest = kicksElement.textContent.includes("/55");
        logTest("updateTeamMaxKicks", maxKicksTest);

        // Restore
        kicksElement.textContent = originalKicks;
      } else {
        logTest("UI elements found", false, "Score or kicks element missing");
      }
    }

    // Test 4: Test API connectivity
    console.log("\n4️⃣ Testing API Connectivity");

    if (teamCards.length > 0) {
      const firstCard = teamCards[0];
      const teamId = firstCard.getAttribute("data-team-id");

      try {
        const response = await fetch(`/referee/api/team/${teamId}/members`, {
          method: "GET",
          credentials: "include",
        });

        logTest(
          "Team members API call",
          response.ok,
          `Status: ${response.status}`
        );

        if (response.ok) {
          const data = await response.json();
          logTest(
            "Team members API response",
            data.success,
            `Members: ${data.members ? data.members.length : 0}`
          );
        }
      } catch (error) {
        logTest("Team members API call", false, `Error: ${error.message}`);
      }
    }

    // Test 5: Test form elements
    console.log("\n5️⃣ Testing Form Elements");

    const modal = document.getElementById("logGoalsModal");
    const form = document.getElementById("logGoalsForm");

    logTest("Log Goals Modal exists", !!modal);
    logTest("Log Goals Form exists", !!form);

    if (form) {
      const requiredFields = [
        "participantId",
        "playerName",
        "competitionId",
        "teamId",
        "kicksUsed",
        "goalsScored",
      ];

      requiredFields.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        logTest(`Form field ${fieldId} exists`, !!field);
      });
    }

    // Test 6: Test individual participant functions (if applicable)
    console.log("\n6️⃣ Testing Individual Participant Functions");

    const participantCards = document.querySelectorAll(".participant-card");
    if (participantCards.length > 0) {
      logTest(
        "Individual participants found",
        true,
        `${participantCards.length} participants`
      );

      // Test if log goals buttons exist
      const logGoalsButtons = document.querySelectorAll(".log-goals-btn");
      logTest(
        "Log goals buttons found",
        logGoalsButtons.length > 0,
        `${logGoalsButtons.length} buttons`
      );
    } else {
      logTest(
        "Individual participants",
        true,
        "No individual participants (team competition)"
      );
    }

    // Test Results Summary
    console.log("\n📊 TEST RESULTS SUMMARY");
    console.log("=".repeat(60));

    const passedTests = testResults.filter((t) => t.passed).length;
    const totalTests = testResults.length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );

    if (allTestsPassed) {
      console.log(
        "\n🎉 ALL TESTS PASSED! The competition live page is working correctly."
      );
    } else {
      console.log("\n⚠️  Some tests failed. Please check the issues above.");
    }

    // Export results for further analysis
    window.testResults = testResults;
  } catch (error) {
    console.error("❌ Test suite error:", error);
    logTest("Test suite execution", false, error.message);
  }

  console.log("\n🏁 Test Complete");
  console.log("=".repeat(60));

  return {
    allPassed: allTestsPassed,
    results: testResults,
    summary: {
      total: testResults.length,
      passed: testResults.filter((t) => t.passed).length,
      failed: testResults.filter((t) => !t.passed).length,
    },
  };
};

// Make it available globally
window.runComprehensiveTest = runComprehensiveTest;

console.log("🧪 Comprehensive Test Suite Loaded");
console.log("To run all tests: runComprehensiveTest()");
console.log("This will test all functionality on the competition live page.");
