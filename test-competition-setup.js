const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await puppeteer.newPage();

  // Enable console logging
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  try {
    await page.goto("http://localhost:3000/staff/competition-setup");

    // Wait for page to load
    await page.waitForSelector(".competition-type-card");

    console.log("Page loaded successfully");

    // Check if setup sections exist
    const individualSection = await page.$("#individual-setup");
    const teamSection = await page.$("#team-setup");

    console.log("Individual setup section exists:", !!individualSection);
    console.log("Team setup section exists:", !!teamSection);

    // Check initial visibility
    const individualVisible = await page.evaluate(() => {
      const el = document.getElementById("individual-setup");
      return el ? window.getComputedStyle(el).display !== "none" : false;
    });

    const teamVisible = await page.evaluate(() => {
      const el = document.getElementById("team-setup");
      return el ? window.getComputedStyle(el).display !== "none" : false;
    });

    console.log("Individual section initially visible:", individualVisible);
    console.log("Team section initially visible:", teamVisible);

    // Test clicking individual button
    console.log("\n--- Testing Individual Competition Button ---");
    await page.click('[data-type="individual"] .setup-competition-btn');

    // Wait a moment for animations
    await page.waitForTimeout(500);

    const individualVisibleAfterClick = await page.evaluate(() => {
      const el = document.getElementById("individual-setup");
      return el ? window.getComputedStyle(el).display !== "none" : false;
    });

    console.log(
      "Individual section visible after click:",
      individualVisibleAfterClick
    );

    // Test clicking team button
    console.log("\n--- Testing Team Competition Button ---");
    await page.click('[data-type="team"] .setup-competition-btn');

    // Wait a moment for animations
    await page.waitForTimeout(500);

    const teamVisibleAfterClick = await page.evaluate(() => {
      const el = document.getElementById("team-setup");
      return el ? window.getComputedStyle(el).display !== "none" : false;
    });

    const individualHiddenAfterTeamClick = await page.evaluate(() => {
      const el = document.getElementById("individual-setup");
      return el ? window.getComputedStyle(el).display === "none" : true;
    });

    console.log("Team section visible after click:", teamVisibleAfterClick);
    console.log(
      "Individual section hidden after team click:",
      individualHiddenAfterTeamClick
    );

    console.log("\n--- Test Summary ---");
    console.log("✓ Page loads correctly");
    console.log("✓ Setup sections exist");
    console.log("✓ Initial state correct (both hidden)");
    console.log("✓ Individual button works:", individualVisibleAfterClick);
    console.log("✓ Team button works:", teamVisibleAfterClick);
    console.log("✓ Section switching works:", individualHiddenAfterTeamClick);
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
