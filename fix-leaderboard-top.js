/**
 * This script specifically checks and fixes the leaderboard index.ejs file
 * to ensure there's no JavaScript code rendered directly in the HTML
 */
const fs = require("fs");
const path = require("path");

const leaderboardFilePath = path.join(
  __dirname,
  "src",
  "views",
  "leaderboard",
  "index.ejs"
);

try {
  console.log(`Checking ${leaderboardFilePath}...`);
  let content = fs.readFileSync(leaderboardFilePath, "utf8");

  // Check if the file starts with the container div
  if (!content.trim().startsWith('<div class="container-fluid')) {
    console.log(
      "Found content before the container div. Creating backup and fixing..."
    );

    // Create a backup
    const backupPath = `${leaderboardFilePath}.bak.${Date.now()}`;
    fs.writeFileSync(backupPath, content);
    console.log(`Created backup at ${backupPath}`);

    // Extract the problematic code at the start
    const containerStartIndex = content.indexOf('<div class="container-fluid');
    const problematicCode = content.substring(0, containerStartIndex).trim();

    console.log("Problematic code found:");
    console.log(problematicCode);

    // Fix the content by removing the problematic code
    content = content.substring(containerStartIndex);

    // Write the fixed content
    fs.writeFileSync(leaderboardFilePath, content);
    console.log("Fixed the leaderboard file.");

    // Create a proper JavaScript file with the problematic code for reference
    const debugCodePath = path.join(__dirname, "removed-debug-code.js");
    fs.writeFileSync(debugCodePath, problematicCode);
    console.log(`Saved the removed code to ${debugCodePath} for reference.`);
  } else {
    console.log(
      "The leaderboard file starts with the container div. No fix needed."
    );
  }
} catch (err) {
  console.error(`Error processing the leaderboard file:`, err);
}
