// Manual test for team member goal logging
const testTeamMemberLogging = async () => {
  console.log("=== Manual Test: Team Member Goal Logging ===");

  try {
    // Step 1: Get the first team
    const firstTeamCard = document.querySelector(".team-card");
    if (!firstTeamCard) {
      console.log("No team cards found");
      return;
    }

    const teamId = firstTeamCard.getAttribute("data-team-id");
    console.log(`Testing with team ID: ${teamId}`);

    // Step 2: Get team members
    console.log("Fetching team members...");
    const response = await fetch(`/referee/api/team/${teamId}/members`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      console.log(`API call failed: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log("Team members response:", data);

    if (!data.success || !data.members || data.members.length === 0) {
      console.log("No team members found");
      return;
    }

    // Step 3: Simulate logging a goal for the first member
    const firstMember = data.members[0];
    console.log(
      `Testing goal logging for member: ${firstMember.name} (ID: ${firstMember.id})`
    );

    // Get current team score and kicks
    const scoreElement = document.getElementById(`team-score-${teamId}`);
    const kicksElement = document.getElementById(`team-kicks-${teamId}`);

    if (!scoreElement || !kicksElement) {
      console.log("Team score or kicks element not found");
      return;
    }

    const originalScore = parseInt(scoreElement.textContent) || 0;
    const originalKicks = kicksElement.textContent;

    console.log(`Original team score: ${originalScore}`);
    console.log(`Original team kicks: ${originalKicks}`);

    // Step 4: Simulate goal submission
    const goalData = {
      participantId: firstMember.id,
      competitionId: 1, // Assuming competition ID 1
      teamId: parseInt(teamId),
      kicksUsed: 3,
      goals: 2,
      timestamp: new Date().toISOString(),
    };

    console.log("Submitting goal data:", goalData);

    const submitResponse = await fetch("/staff/competition-setup/log-goals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(goalData),
    });

    if (!submitResponse.ok) {
      console.log(`Goal submission failed: ${submitResponse.status}`);
      const errorText = await submitResponse.text();
      console.log("Error:", errorText);
      return;
    }

    const submitResult = await submitResponse.json();
    console.log("Goal submission result:", submitResult);

    if (submitResult.success) {
      console.log("Goal logged successfully!");

      // Step 5: Test UI update function
      console.log("Testing UI update...");
      updateTeamAfterGoals(teamId, goalData.goals, goalData.kicksUsed);

      setTimeout(() => {
        const newScore = parseInt(scoreElement.textContent) || 0;
        const newKicks = kicksElement.textContent;

        console.log(`New team score: ${newScore}`);
        console.log(`New team kicks: ${newKicks}`);
        console.log(
          `Score updated correctly: ${
            newScore === originalScore + goalData.goals
          }`
        );

        // Check if kicks were updated
        const originalKicksUsed = parseInt(originalKicks.split("/")[0]) || 0;
        const newKicksUsed = parseInt(newKicks.split("/")[0]) || 0;
        console.log(
          `Kicks updated correctly: ${
            newKicksUsed === originalKicksUsed + goalData.kicksUsed
          }`
        );

        console.log("=== Test Complete ===");
      }, 100);
    } else {
      console.log("Goal submission failed:", submitResult.message);
    }
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Export for manual testing
window.testTeamMemberLogging = testTeamMemberLogging;

console.log("Manual test functions loaded:");
console.log(
  "- testTeamMemberLogging() - Test complete team member goal logging flow"
);
console.log("To run: testTeamMemberLogging()");
