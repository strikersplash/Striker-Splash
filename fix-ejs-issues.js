/**
 * This script performs a comprehensive check of all EJS files
 * to detect and fix potential issues with JavaScript code being
 * incorrectly rendered in HTML
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Get all EJS files in the project
function getAllEjsFiles() {
  try {
    const result = execSync('find ./src -name "*.ejs"', { encoding: "utf8" });
    return result.split("\n").filter((file) => file.trim());
  } catch (err) {
    console.error("Error finding EJS files:", err);
    return [];
  }
}

// Check and fix a single file
function checkAndFixFile(filePath) {
  console.log(`\nChecking ${filePath}...`);
  try {
    // Read the file content
    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;
    let modified = false;

    // Check for script tags
    const scriptTags = content.match(/<script[\s\S]*?<\/script>/g) || [];
    console.log(`Found ${scriptTags.length} script tags`);

    // Look for patterns that might indicate JavaScript outside script tags
    const potentialJsOutsideScript = [
      /console\.log\([^<]*?\)/g,
      /\/\/ Check initial[^<]*?\)/g,
      /const [a-zA-Z]+ = document\.getElementById\([^<]*?\)/g,
      /if\s*\([^<]*?\)\s*{[^<]*?}/g,
    ];

    for (const pattern of potentialJsOutsideScript) {
      const matches = content.match(pattern);
      if (!matches) continue;

      console.log(
        `Found ${matches.length} potential JS patterns matching ${pattern}`
      );

      for (const match of matches) {
        // Check if this match is inside a script tag
        let isInsideScript = false;
        for (const scriptTag of scriptTags) {
          if (scriptTag.includes(match)) {
            isInsideScript = true;
            break;
          }
        }

        if (!isInsideScript) {
          console.log(
            `Found JS outside script tags: ${match.substring(0, 50)}...`
          );

          // Fix: Wrap the JS in a script tag or remove it
          const wrapped = `\n<script>\n${match}\n</script>\n`;
          content = content.replace(match, wrapped);
          modified = true;
        }
      }
    }

    // Check for any specific debug code mentioned by the user
    const specificDebugCode = content.match(
      /\/\/ Check initial state based on current view[^<]*?all filters enabled[^<]*?/
    );
    if (specificDebugCode) {
      console.log("Found the specific debug code mentioned by the user!");
      console.log(specificDebugCode[0].substring(0, 100) + "...");

      // Remove this specific code
      content = content.replace(specificDebugCode[0], "");
      modified = true;
    }

    // Save the file if modified
    if (modified) {
      // Create a backup
      const backupPath = `${filePath}.bak.${Date.now()}`;
      fs.writeFileSync(backupPath, originalContent);
      console.log(`Created backup at ${backupPath}`);

      // Save the modified content
      fs.writeFileSync(filePath, content);
      console.log(`Fixed and saved ${filePath}`);
      return true;
    } else {
      console.log(`No issues found in ${filePath}`);
      return false;
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return false;
  }
}

// Main execution
const files = getAllEjsFiles();
console.log(`Found ${files.length} EJS files to check`);

let fixedAnyFiles = false;
files.forEach((file) => {
  const fixed = checkAndFixFile(file);
  fixedAnyFiles = fixedAnyFiles || fixed;
});

if (fixedAnyFiles) {
  console.log(
    "\nFixed issues in one or more files. Please restart your application to see the changes."
  );
} else {
  console.log("\nNo issues found that needed fixing.");
  console.log(
    "The problem might be related to how the application renders the templates."
  );
  console.log(
    "Consider checking your Express/EJS configuration or middleware."
  );
}
