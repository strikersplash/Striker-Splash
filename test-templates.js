const ejs = require("ejs");
const fs = require("fs");

let results = "Testing EJS templates...\n\n";

function testTemplate(templatePath) {
  try {
    results += `Testing ${templatePath}...\n`;
    const template = fs.readFileSync(templatePath, "utf8");
    ejs.compile(template);
    results += `✅ ${templatePath} - OK\n`;
    return true;
  } catch (error) {
    results += `❌ ${templatePath} - ERROR:\n`;
    results += `   ${error.message}\n`;
    return false;
  }
}

const templates = [
  "./src/views/public/home.ejs",
  "./src/views/public/about.ejs",
];

let allPassed = true;
templates.forEach((template) => {
  if (!testTemplate(template)) {
    allPassed = false;
  }
});

results += "\n" + "=".repeat(50) + "\n";
results += allPassed
  ? "✅ All templates compile successfully!"
  : "❌ Some templates have errors";

fs.writeFileSync("./template-test-results.txt", results);
console.log("Results written to template-test-results.txt");
