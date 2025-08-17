const request = require("supertest");
const app = require("./dist/app").default;

async function testAdminLogin() {
  console.log("Testing admin login and edit button visibility...");

  // Create a session and login as admin
  const agent = request.agent(app);

  try {
    // First, get the login page to establish session
    await agent.get("/auth/login");

    // Login as admin
    const loginResponse = await agent.post("/auth/login").send({
      username: "admin",
      password: "admin123",
      userType: "staff",
    });

    console.log("Login response status:", loginResponse.status);
    console.log("Login response headers:", loginResponse.headers.location);

    // Now visit the homepage as logged-in admin
    const homeResponse = await agent.get("/");
    console.log("Homepage response status:", homeResponse.status);

    // Check if edit buttons are present
    const hasEditButton = homeResponse.text.includes("Edit Hero Section");
    console.log("Edit button found:", hasEditButton);

    if (hasEditButton) {
      console.log("✅ SUCCESS: Admin edit buttons are visible!");
    } else {
      console.log("❌ ISSUE: Admin edit buttons are NOT visible");
      console.log("Checking for user debug info...");

      // Look for signs of logged-in user
      const hasUserInfo =
        homeResponse.text.includes("admin") ||
        homeResponse.text.includes("Admin");
      console.log("User info found:", hasUserInfo);
    }
  } catch (error) {
    console.error("Test error:", error.message);
  }

  process.exit(0);
}

testAdminLogin();
