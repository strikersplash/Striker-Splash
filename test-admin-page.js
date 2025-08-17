const axios = require("axios");

async function testAdminPage() {
  try {
    console.log("Testing admin player management page...");

    // First try to access the page without auth (should redirect)
    try {
      const response = await axios.get("http://localhost:3000/admin/players", {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status < 500; // Allow redirects
        },
      });

      if (response.status === 302) {
        console.log(
          "✓ Page correctly redirects to login when not authenticated"
        );
      } else {
        console.log("Page response status:", response.status);

        // Check if avatar containers are in the HTML
        if (response.data.includes('id="avatar-')) {
          console.log("✓ Avatar containers found in HTML");

          // Count avatar containers
          const avatarMatches = response.data.match(/id="avatar-\d+"/g);
          console.log(
            `Found ${
              avatarMatches ? avatarMatches.length : 0
            } avatar containers`
          );

          // Check if avatar.js is included
          if (response.data.includes("/js/avatar.js")) {
            console.log("✓ Avatar.js script is included");
          } else {
            console.log("✗ Avatar.js script is missing");
          }
        } else {
          console.log("✗ No avatar containers found in HTML");
        }
      }
    } catch (error) {
      console.error("Request error:", error.message);
    }
  } catch (error) {
    console.error("Test error:", error.message);
  }
}

testAdminPage();
