// Test script to be run in browser console
// Copy and paste this into the browser console on the competition setup page

console.log("=== Competition Setup Test ===");

// Check if elements exist
const individualCard = document.querySelector('[data-type="individual"]');
const teamCard = document.querySelector('[data-type="team"]');
const individualSection = document.getElementById("individual-setup");
const teamSection = document.getElementById("team-setup");
const individualBtn = document.querySelector(
  '[data-type="individual"] .setup-competition-btn'
);
const teamBtn = document.querySelector(
  '[data-type="team"] .setup-competition-btn'
);

console.log("Elements found:");
console.log("- Individual card:", !!individualCard);
console.log("- Team card:", !!teamCard);
console.log("- Individual section:", !!individualSection);
console.log("- Team section:", !!teamSection);
console.log("- Individual button:", !!individualBtn);
console.log("- Team button:", !!teamBtn);

// Check initial visibility
console.log("\nInitial visibility:");
console.log(
  "- Individual section visible:",
  individualSection
    ? window.getComputedStyle(individualSection).display !== "none"
    : false
);
console.log(
  "- Team section visible:",
  teamSection ? window.getComputedStyle(teamSection).display !== "none" : false
);

// Test function availability
console.log("\nFunction availability:");
console.log("- selectCompetitionType:", typeof window.selectCompetitionType);

// Test individual button click
console.log("\n=== Testing Individual Button ===");
if (individualBtn) {
  individualBtn.click();
  setTimeout(() => {
    console.log(
      "Individual section visible after click:",
      window.getComputedStyle(individualSection).display !== "none"
    );
  }, 100);
}

// Test team button click
setTimeout(() => {
  console.log("\n=== Testing Team Button ===");
  if (teamBtn) {
    teamBtn.click();
    setTimeout(() => {
      console.log(
        "Team section visible after click:",
        window.getComputedStyle(teamSection).display !== "none"
      );
      console.log(
        "Individual section hidden after team click:",
        window.getComputedStyle(individualSection).display === "none"
      );
    }, 100);
  }
}, 500);
