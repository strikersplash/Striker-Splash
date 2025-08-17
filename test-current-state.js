// Simple test to check current goal logging functionality
const testCurrentGoalLogging = async () => {
  console.log("=== Testing Current Goal Logging ===");

  try {
    // Test 1: Check if we're on individual or team competition
    const participantCards = document.querySelectorAll(".participant-card");
    const teamCards = document.querySelectorAll(".team-card");

    console.log(`Found ${participantCards.length} participant cards`);
    console.log(`Found ${teamCards.length} team cards`);

    if (participantCards.length > 0) {
      console.log("This is an individual competition");

      // Test individual goal logging
      const firstParticipant = participantCards[0];
      const logButton = firstParticipant.querySelector(".log-goals-btn");

      if (logButton) {
        console.log("Log goals button found");
        console.log("Button onclick:", logButton.getAttribute("onclick"));

        // Check if the function exists
        const participantId = logButton.getAttribute("data-participant-id");
        const participantName = logButton.getAttribute("data-participant-name");

        console.log(
          `Participant ID: ${participantId}, Name: ${participantName}`
        );

        if (typeof window.openLogGoalsModal === "function") {
          console.log("openLogGoalsModal function exists");
        } else {
          console.log("ERROR: openLogGoalsModal function missing");
        }
      } else {
        console.log("ERROR: No log goals button found");
      }
    }

    if (teamCards.length > 0) {
      console.log("This is a team competition");

      // Test team functionality
      const firstTeam = teamCards[0];
      const viewMembersButton = firstTeam.querySelector(
        ".view-team-members-btn"
      );

      if (viewMembersButton) {
        console.log("View team members button found");
        console.log(
          "Button onclick:",
          viewMembersButton.getAttribute("onclick")
        );

        const teamId = viewMembersButton.getAttribute("data-team-id");
        console.log(`Team ID: ${teamId}`);

        if (typeof window.viewTeamMembers === "function") {
          console.log("viewTeamMembers function exists");

          // Test API call
          console.log("Testing API call...");
          const response = await fetch(`/referee/api/team/${teamId}/members`, {
            method: "GET",
            credentials: "include",
          });

          console.log(`API Response: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log("API Data:", data);
          } else {
            console.log("API call failed");
          }
        } else {
          console.log("ERROR: viewTeamMembers function missing");
        }
      } else {
        console.log("ERROR: No view team members button found");
      }
    }

    // Test 2: Check modal
    const modal = document.getElementById("logGoalsModal");
    const form = document.getElementById("logGoalsForm");

    console.log("Modal exists:", !!modal);
    console.log("Form exists:", !!form);

    if (form) {
      const fields = [
        "participantId",
        "playerName",
        "competitionId",
        "teamId",
        "kicksUsed",
        "goalsScored",
      ];
      fields.forEach((field) => {
        const element = document.getElementById(field);
        console.log(`${field} field exists:`, !!element);
      });
    }

    // Test 3: Check submit function
    if (typeof window.submitGoals === "function") {
      console.log("submitGoals function exists");
    } else {
      console.log("ERROR: submitGoals function missing");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
};

window.testCurrentGoalLogging = testCurrentGoalLogging;
console.log("Test loaded. Run: testCurrentGoalLogging()");
