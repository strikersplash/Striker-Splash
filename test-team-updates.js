// Test to verify team ID consistency and UI update functionality
const testTeamUpdates = async () => {
  console.log("=== Testing Team ID Consistency and UI Updates ===");

  try {
    // Test 1: Check team ID consistency
    console.log("\n1. Testing team ID consistency...");

    const teamCards = document.querySelectorAll(".team-card");
    console.log(`Found ${teamCards.length} team cards`);

    teamCards.forEach((card, index) => {
      const cardTeamId = card.getAttribute("data-team-id");
      const scoreElement = card.querySelector('[id^="team-score-"]');
      const kicksElement = card.querySelector('[id^="team-kicks-"]');
      const button = card.querySelector(".view-team-members-btn");

      const scoreId = scoreElement?.id.replace("team-score-", "");
      const kicksId = kicksElement?.id.replace("team-kicks-", "");
      const buttonTeamId = button?.getAttribute("data-team-id");

      console.log(`Team ${index + 1}:`);
      console.log(`  Card data-team-id: ${cardTeamId}`);
      console.log(`  Score element team ID: ${scoreId}`);
      console.log(`  Kicks element team ID: ${kicksId}`);
      console.log(`  Button team ID: ${buttonTeamId}`);
      console.log(
        `  All IDs match: ${
          cardTeamId === scoreId &&
          scoreId === kicksId &&
          kicksId === buttonTeamId
        }`
      );
      console.log("  ----");
    });

    // Test 2: Test updateTeamAfterGoals function
    console.log("\n2. Testing updateTeamAfterGoals function...");

    if (teamCards.length > 0) {
      const firstCard = teamCards[0];
      const teamId = firstCard.getAttribute("data-team-id");

      console.log(`Testing with team ID: ${teamId}`);

      // Get current values
      const scoreElement = document.getElementById(`team-score-${teamId}`);
      const kicksElement = document.getElementById(`team-kicks-${teamId}`);

      if (scoreElement && kicksElement) {
        const originalScore = parseInt(scoreElement.textContent) || 0;
        const originalKicks = kicksElement.textContent;

        console.log(`Original score: ${originalScore}`);
        console.log(`Original kicks: ${originalKicks}`);

        // Test update function
        if (typeof updateTeamAfterGoals === "function") {
          console.log("Testing updateTeamAfterGoals(teamId, 2, 3)...");
          updateTeamAfterGoals(teamId, 2, 3);

          setTimeout(() => {
            const newScore = parseInt(scoreElement.textContent) || 0;
            const newKicks = kicksElement.textContent;

            console.log(`New score: ${newScore}`);
            console.log(`New kicks: ${newKicks}`);
            console.log(
              `Score update successful: ${newScore === originalScore + 2}`
            );

            // Restore original values
            scoreElement.textContent = originalScore;
            kicksElement.textContent = originalKicks;
            console.log("Values restored");
          }, 100);
        } else {
          console.log("updateTeamAfterGoals function not found");
        }
      } else {
        console.log("Score or kicks element not found");
      }
    }

    // Test 3: Test updateTeamMaxKicks function
    console.log("\n3. Testing updateTeamMaxKicks function...");

    if (teamCards.length > 0) {
      const firstCard = teamCards[0];
      const teamId = firstCard.getAttribute("data-team-id");

      const kicksElement = document.getElementById(`team-kicks-${teamId}`);

      if (kicksElement) {
        const originalKicks = kicksElement.textContent;
        console.log(`Original kicks: ${originalKicks}`);

        if (typeof updateTeamMaxKicks === "function") {
          console.log("Testing updateTeamMaxKicks(teamId, 55)...");
          updateTeamMaxKicks(teamId, 55);

          setTimeout(() => {
            const newKicks = kicksElement.textContent;
            console.log(`New kicks: ${newKicks}`);
            console.log(
              `Max kicks update successful: ${newKicks.includes("/55")}`
            );

            // Restore original values
            kicksElement.textContent = originalKicks;
            console.log("Values restored");
          }, 100);
        } else {
          console.log("updateTeamMaxKicks function not found");
        }
      }
    }

    // Test 4: Test viewTeamMembers function
    console.log("\n4. Testing viewTeamMembers function...");

    if (teamCards.length > 0) {
      const firstCard = teamCards[0];
      const teamId = firstCard.getAttribute("data-team-id");

      console.log(`Testing viewTeamMembers with team ID: ${teamId}`);

      if (typeof viewTeamMembers === "function") {
        console.log("Function exists, testing API call...");

        // Test the API call
        try {
          const response = await fetch(`/referee/api/team/${teamId}/members`, {
            method: "GET",
            credentials: "include",
          });

          console.log(`API Response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log("API Response data:", data);
            console.log(`API call successful: ${data.success}`);
            console.log(
              `Team members found: ${data.members ? data.members.length : 0}`
            );
          } else {
            console.log("API call failed");
          }
        } catch (error) {
          console.log("API call error:", error);
        }
      } else {
        console.log("viewTeamMembers function not found");
      }
    }

    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Run the test
testTeamUpdates();

// Export for manual testing
window.testTeamUpdates = testTeamUpdates;
