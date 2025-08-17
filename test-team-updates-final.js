// Comprehensive test for team updates
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== Team Updates Test Script ===");

  // Part 1: Verify team ID consistency
  const verifyTeamIds = () => {
    console.log("Verifying team ID consistency...");

    const teamCards = document.querySelectorAll(".team-card");
    console.log(`Found ${teamCards.length} team cards`);

    teamCards.forEach((card, index) => {
      const cardTeamId = card.getAttribute("data-team-id");
      const button = card.querySelector(".view-team-members-btn");
      const buttonTeamId = button?.getAttribute("data-team-id");
      const scoreElement = document.getElementById(`team-score-${cardTeamId}`);
      const kicksElement = document.getElementById(`team-kicks-${cardTeamId}`);

      console.log(`Team ${index + 1}:`);
      console.log(`  Card data-team-id: ${cardTeamId}`);
      console.log(`  Button data-team-id: ${buttonTeamId}`);
      console.log(`  Score element exists: ${!!scoreElement}`);
      console.log(`  Kicks element exists: ${!!kicksElement}`);

      if (cardTeamId !== buttonTeamId) {
        console.error(
          `  INCONSISTENCY: Card team ID ${cardTeamId} doesn't match button team ID ${buttonTeamId}`
        );
      }

      if (!scoreElement) {
        console.error(`  MISSING: Score element for team ID ${cardTeamId}`);
      }

      if (!kicksElement) {
        console.error(`  MISSING: Kicks element for team ID ${cardTeamId}`);
      }
    });
  };

  // Part 2: Test update functions directly
  const testUpdateFunctions = () => {
    console.log("\nTesting update functions...");

    const teamCards = document.querySelectorAll(".team-card");
    if (teamCards.length === 0) {
      console.log("No team cards found to test");
      return;
    }

    // Get first team ID
    const firstTeamId = teamCards[0].getAttribute("data-team-id");
    console.log(`Using team ID: ${firstTeamId}`);

    // Get current values
    const scoreElement = document.getElementById(`team-score-${firstTeamId}`);
    const kicksElement = document.getElementById(`team-kicks-${firstTeamId}`);

    if (!scoreElement || !kicksElement) {
      console.error("Score or kicks element not found");
      return;
    }

    const originalScore = scoreElement.textContent;
    const originalKicks = kicksElement.textContent;

    console.log(`Original score: "${originalScore}"`);
    console.log(`Original kicks: "${originalKicks}"`);

    // Test updateTeamAfterGoals
    console.log("\nTesting updateTeamAfterGoals...");
    if (typeof updateTeamAfterGoals === "function") {
      console.log("Function exists, calling with test values...");
      updateTeamAfterGoals(firstTeamId, 2, 3);

      setTimeout(() => {
        console.log(`New score: "${scoreElement.textContent}"`);
        console.log(`New kicks: "${kicksElement.textContent}"`);

        // Test updateTeamMaxKicks
        console.log("\nTesting updateTeamMaxKicks...");
        if (typeof updateTeamMaxKicks === "function") {
          console.log("Function exists, calling with test values...");
          updateTeamMaxKicks(firstTeamId, 55);

          setTimeout(() => {
            console.log(
              `Kicks after updateTeamMaxKicks: "${kicksElement.textContent}"`
            );

            // Restore original values
            console.log("\nRestoring original values...");
            scoreElement.textContent = originalScore;
            kicksElement.textContent = originalKicks;
          }, 500);
        } else {
          console.error("updateTeamMaxKicks function not found");
        }
      }, 500);
    } else {
      console.error("updateTeamAfterGoals function not found");
    }
  };

  // Part 3: Simulate goal submission
  const simulateGoalSubmission = async (teamId) => {
    console.log("\nSimulating goal submission for team " + teamId);

    // Get team members
    try {
      console.log("Fetching team members...");
      const response = await fetch(`/referee/api/team/${teamId}/members`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        console.error(`API call failed: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (!data.success || !data.members || data.members.length === 0) {
        console.error("No team members found");
        return;
      }

      // Mock form data
      const player = data.members[0];
      const formData = {
        participantId: player.id,
        competitionId:
          document.querySelector('input[name="competitionId"]')?.value || 1,
        teamId: teamId,
        kicksUsed: 3,
        goals: 2,
        timestamp: new Date().toISOString(),
      };

      console.log("Form data:", formData);
      console.log("Note: Not actually submitting to avoid affecting real data");

      // Show the expected UI updates
      console.log("\nTesting UI updates as if submission was successful:");
      updateTeamAfterGoals(teamId, formData.goals, formData.kicksUsed);
    } catch (error) {
      console.error("Error in simulation:", error);
    }
  };

  // Execute tests
  setTimeout(() => {
    verifyTeamIds();

    setTimeout(() => {
      testUpdateFunctions();

      // Get first team ID for simulation
      const teamCards = document.querySelectorAll(".team-card");
      if (teamCards.length > 0) {
        const firstTeamId = teamCards[0].getAttribute("data-team-id");
        setTimeout(() => {
          simulateGoalSubmission(firstTeamId);
        }, 2000);
      }
    }, 1000);
  }, 500);
});

console.log(
  "Test script loaded. Results will appear after page loads completely."
);
