/**
 * This script fixes issues with debug JavaScript code being incorrectly
 * rendered directly in the HTML instead of being enclosed in script tags
 */
const fs = require("fs");
const path = require("path");

// Files to check for problematic debug code
const filesToCheck = [
  path.join(__dirname, "src", "views", "leaderboard", "index.ejs"),
  path.join(__dirname, "src", "views", "layouts", "main.ejs"),
];

// Debug code pattern to look for
const debugCodePattern =
  /\/\/ Check initial state based on current view.*?console\.log\(/s;

function fixFile(filePath) {
  console.log(`Checking ${filePath}...`);

  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Check if the file contains the problematic code pattern outside of script tags
    const debugCodeMatch = content.match(debugCodePattern);

    if (debugCodeMatch) {
      const debugCode = debugCodeMatch[0];
      console.log(
        `Found potential debug code: ${debugCode.substring(0, 50)}...`
      );

      // Check if this code is outside of script tags
      const beforeCode = content.substring(0, content.indexOf(debugCode));
      const lastScriptTagBefore = beforeCode.lastIndexOf("<script");
      const lastScriptClosingBefore = beforeCode.lastIndexOf("</script>");

      if (
        lastScriptTagBefore < lastScriptClosingBefore ||
        lastScriptTagBefore === -1
      ) {
        console.log(
          "Debug code appears to be outside of script tags. Fixing..."
        );

        // Move the code into a proper script tag
        content = content.replace(
          debugCode,
          `
<script>
${debugCode}
</script>
        `
        );

        fs.writeFileSync(filePath, content);
        console.log(`Fixed ${filePath}`);
        return true;
      } else {
        console.log("Debug code appears to be correctly inside script tags.");
      }
    } else {
      console.log("No problematic debug code pattern found in this file.");
    }

    return false;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return false;
  }
}

// Process each file
let fixedAnyFiles = false;
filesToCheck.forEach((filePath) => {
  const fixed = fixFile(filePath);
  fixedAnyFiles = fixedAnyFiles || fixed;
});

if (!fixedAnyFiles) {
  console.log(
    "\nNo files needed fixing. The issue may be in another file or have a different pattern."
  );
  console.log(
    "Please check for any JavaScript code that might be rendered directly in the HTML."
  );
}
