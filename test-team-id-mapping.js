// Test team ID mapping in competition live page
// Run this in the browser console to understand the data structure

const testTeamIdMapping = () => {
  console.log("=== Team ID Mapping Test ===");

  // Get all team cards
  const teamCards = document.querySelectorAll(".team-card");
  console.log("Found", teamCards.length, "team cards");

  teamCards.forEach((card, index) => {
    const teamId = card.getAttribute("data-team-id");
    const scoreElement = card.querySelector('[id^="team-score-"]');
    const kicksElement = card.querySelector('[id^="team-kicks-"]');
    const button = card.querySelector(".view-team-members-btn");

    console.log(`Team ${index + 1}:`);
    console.log("  Card data-team-id:", teamId);
    console.log("  Score element ID:", scoreElement?.id);
    console.log("  Kicks element ID:", kicksElement?.id);
    console.log("  Button data-team-id:", button?.getAttribute("data-team-id"));
    console.log("  Button onclick team ID:", button?.getAttribute("onclick"));

    // Extract IDs from element IDs
    const scoreId = scoreElement?.id.replace("team-score-", "");
    const kicksId = kicksElement?.id.replace("team-kicks-", "");

    console.log("  Score ID extracted:", scoreId);
    console.log("  Kicks ID extracted:", kicksId);
    console.log("  ----");
  });
};

// Test the updateTeamAfterGoals function
const testUpdateTeamAfterGoals = (teamId, goals, kicks) => {
  console.log("=== Testing updateTeamAfterGoals ===");
  console.log("Input - teamId:", teamId, "goals:", goals, "kicks:", kicks);

  const scoreElement = document.getElementById(`team-score-${teamId}`);
  const kicksElement = document.getElementById(`team-kicks-${teamId}`);

  console.log("Score element found:", !!scoreElement);
  console.log("Kicks element found:", !!kicksElement);

  if (scoreElement) {
    console.log("Current score:", scoreElement.textContent);
  }
  if (kicksElement) {
    console.log("Current kicks:", kicksElement.textContent);
  }
};

testTeamIdMapping();
