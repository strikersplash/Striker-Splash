const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

// Function to test a template
function testTemplate(templatePath) {
  try {
    console.log(`Testing ${templatePath}...`);
    const template = fs.readFileSync(templatePath, "utf8");

    // Basic mock data that might be used in templates
    const data = {
      heroContent: {},
      featuresContent: {},
      stepsContent: {},
      aboutContent: {},
      events: [],
      loggedIn: false,
      user: null,
      locals: {
        user: null,
      },
    };

    const result = ejs.render(template, data);
    console.log(`✅ SUCCESS: ${templatePath} compiled successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ ERROR in ${templatePath}:`);
    console.error(error.message);

    if (error.stack) {
      console.error(error.stack);
    }

    return false;
  }
}

// Test home.ejs
const homeResult = testTemplate("./src/views/public/home.ejs");

// Test about.ejs
const aboutResult = testTemplate("./src/views/public/about.ejs");

console.log("\nSummary:");
console.log(`Home template: ${homeResult ? "OK" : "FAILED"}`);
console.log(`About template: ${aboutResult ? "OK" : "FAILED"}`);

process.exit(homeResult && aboutResult ? 0 : 1);
