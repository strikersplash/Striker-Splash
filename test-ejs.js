const ejs = require("ejs");
const fs = require("fs");

// First test home.ejs
try {
  const homeTemplate = fs.readFileSync("./src/views/public/home.ejs", "utf8");
  ejs.compile(homeTemplate);
  fs.writeFileSync("./home-ejs-test-result.txt", "Home template OK");
} catch (error) {
  fs.writeFileSync(
    "./home-ejs-test-result.txt",
    `Error in home.ejs: ${error.message}`
  );
}

// Then test about.ejs
try {
  const aboutTemplate = fs.readFileSync("./src/views/public/about.ejs", "utf8");
  ejs.compile(aboutTemplate);
  fs.writeFileSync("./about-ejs-test-result.txt", "About template OK");
} catch (error) {
  fs.writeFileSync(
    "./about-ejs-test-result.txt",
    `Error in about.ejs: ${error.message}`
  );
}
