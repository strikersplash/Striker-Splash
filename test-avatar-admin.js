const puppeteer = require("puppeteer");

async function testAvatarGeneration() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on("console", (msg) => {
    console.log("Browser console:", msg.text());
  });

  // Listen for errors
  page.on("error", (err) => {
    console.error("Page error:", err.message);
  });

  try {
    console.log("Navigating to admin players page...");
    await page.goto("http://localhost:3000/admin/players", {
      waitUntil: "networkidle2",
    });

    // Wait a bit for avatars to load
    await page.waitForTimeout(3000);

    // Check if avatars are present
    const avatarContainers = await page.$$('[id^="avatar-"]');
    console.log(`Found ${avatarContainers.length} avatar containers`);

    // Check if any contain actual avatar elements
    let avatarsWithContent = 0;
    for (let container of avatarContainers) {
      const children = await container.$$eval("*", (els) => els.length);
      if (children > 0) {
        avatarsWithContent++;
      }
    }

    console.log(`${avatarsWithContent} avatar containers have content`);

    // Take a screenshot
    await page.screenshot({
      path: "player-management-test.png",
      fullPage: true,
    });
    console.log("Screenshot saved as player-management-test.png");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
}

testAvatarGeneration();
