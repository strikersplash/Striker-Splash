const puppeteer = require("puppeteer");

async function testPlayerManagementAvatars() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  try {
    const page = await browser.newPage();

    console.log("Navigating to player management page...");
    await page.goto("http://localhost:3000/admin/players", {
      waitUntil: "networkidle2",
    });

    // Wait for the avatar script to load
    await page
      .waitForSelector("#avatar-container", { timeout: 5000 })
      .catch(() => {
        console.log(
          "No avatar container found, checking for individual avatar elements..."
        );
      });

    // Wait a bit for avatars to be generated
    await page.waitForTimeout(2000);

    // Check if avatars have been created
    const avatarInfo = await page.evaluate(() => {
      const avatarContainers = document.querySelectorAll('[id^="avatar-"]');
      const results = [];

      avatarContainers.forEach((container) => {
        const containerId = container.id;
        const hasChildren = container.children.length > 0;
        const childType = hasChildren ? container.children[0].tagName : "none";
        const childContent = hasChildren
          ? container.children[0].textContent ||
            container.children[0].src ||
            "no content"
          : "none";

        results.push({
          id: containerId,
          hasChildren,
          childType,
          childContent: childContent.substring(0, 50), // Limit length for readability
        });
      });

      return results;
    });

    console.log("Avatar container analysis:");
    console.log(JSON.stringify(avatarInfo, null, 2));

    // Take a screenshot for verification
    await page.screenshot({
      path: "player-management-avatars-test.png",
      fullPage: true,
    });
    console.log("Screenshot saved as player-management-avatars-test.png");
  } catch (error) {
    console.error("Error testing player management avatars:", error);
  } finally {
    await browser.close();
  }
}

testPlayerManagementAvatars();
