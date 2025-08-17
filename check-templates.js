const ejs = require("ejs");
const fs = require("fs");

console.log("Testing EJS templates...\n");

function testTemplate(templatePath) {
  try {
    console.log(`Testing ${templatePath}...`);
    const template = fs.readFileSync(templatePath, "utf8");
    ejs.compile(template);
    console.log(`✅ ${templatePath} - OK`);
    return true;
  } catch (error) {
    console.error(`❌ ${templatePath} - ERROR:`);
    console.error(`   ${error.message}`);
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

console.log("\n" + "=".repeat(50));
console.log(
  allPassed
    ? "✅ All templates compile successfully!"
    : "❌ Some templates have errors"
);
process.exit(allPassed ? 0 : 1);
