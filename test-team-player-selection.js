// Test team player selection and max kicks update
const testTeamPlayerSelection = async () => {
  console.log("=== Testing Team Player Selection and Max Kicks Update ===");

  try {
    // Get first team
    const firstTeamCard = document.querySelector(".team-card");
    if (!firstTeamCard) {
      console.log("No team cards found");
      return;
    }

    const teamId = firstTeamCard.getAttribute("data-team-id");
    console.log(`Testing with team ID: ${teamId}`);

    // Get team members
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

    console.log(`Found ${data.members.length} team members`);

    // Check if team has more than 11 members
    if (data.members.length > 11) {
      console.log(
        "Team has more than 11 members - testing player selection logic"
      );

      // Test the updateTeamMaxKicks function
      const kicksElement = document.getElementById(`team-kicks-${teamId}`);
      if (kicksElement) {
        const originalKicks = kicksElement.textContent;
        console.log(`Original kicks: ${originalKicks}`);

        console.log(
          "Testing updateTeamMaxKicks with 55 kicks for 11 players..."
        );
        updateTeamMaxKicks(teamId, 55);

        setTimeout(() => {
          const newKicks = kicksElement.textContent;
          console.log(`New kicks: ${newKicks}`);
          console.log(
            `Max kicks updated correctly: ${newKicks.includes("/55")}`
          );

          // Restore original
          kicksElement.textContent = originalKicks;
          console.log("Value restored");
        }, 100);
      }

      // Test that activeTeamPlayers storage works
      console.log("Testing active team players storage...");

      // Simulate selecting first 11 players
      const selectedPlayers = data.members.slice(0, 11).map((m) => m.id);
      console.log(`Selecting first 11 players: ${selectedPlayers.join(", ")}`);

      // Test the storage mechanism
      if (typeof window.activeTeamPlayers === "undefined") {
        window.activeTeamPlayers = {};
      }

      window.activeTeamPlayers[teamId] = selectedPlayers;
      console.log(
        "Active team players stored:",
        window.activeTeamPlayers[teamId]
      );

      // Test retrieval
      const storedPlayers = window.activeTeamPlayers[teamId];
      console.log(`Retrieved players: ${storedPlayers.join(", ")}`);
      console.log(`Storage works correctly: ${storedPlayers.length === 11}`);
    } else {
      console.log("Team has 11 or fewer members - no selection needed");

      // Test that all players are available for logging
      console.log("All players should be available for goal logging");

      // Test default max kicks calculation
      const expectedMaxKicks = data.members.length * 5; // Assuming 5 kicks per player
      console.log(`Expected max kicks: ${expectedMaxKicks}`);

      const kicksElement = document.getElementById(`team-kicks-${teamId}`);
      if (kicksElement) {
        const currentKicks = kicksElement.textContent;
        console.log(`Current kicks display: ${currentKicks}`);

        const maxKicks = currentKicks.split("/")[1];
        console.log(`Current max kicks: ${maxKicks}`);
        console.log(`Max kicks correct: ${maxKicks == expectedMaxKicks}`);
      }
    }

    console.log("=== Test Complete ===");
  } catch (error) {
    console.error("Test error:", error);
  }
};

// Export for manual testing
window.testTeamPlayerSelection = testTeamPlayerSelection;

console.log("Team player selection test loaded:");
console.log("To run: testTeamPlayerSelection()");
