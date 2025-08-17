// Simple test script to check the end competition button functionality
console.log("Testing end competition button...");

// Check if we can access the live page
fetch("http://localhost:3000/staff/competition-live-test/66")
  .then((response) => response.text())
  .then((html) => {
    console.log("Page loaded successfully");

    // Check if the button exists in the HTML
    if (html.includes('id="end-competition-btn"')) {
      console.log("✓ End competition button found in HTML");
    } else {
      console.log("✗ End competition button NOT found in HTML");
    }

    // Check if the endCompetition function is defined in the HTML
    if (html.includes("window.endCompetition = function")) {
      console.log("✓ endCompetition function found in HTML");
    } else {
      console.log("✗ endCompetition function NOT found in HTML");
    }

    // Check if event listener is added
    if (
      html.includes("getElementById('end-competition-btn').addEventListener")
    ) {
      console.log("✓ Event listener setup found in HTML");
    } else {
      console.log("✗ Event listener setup NOT found in HTML");
    }

    // Test the actual endpoint
    return fetch("http://localhost:3000/staff/competition-setup-test/66/end", {
      method: "POST",
    });
  })
  .then((response) => response.json())
  .then((data) => {
    console.log("Direct endpoint test result:", data);
    if (data.success) {
      console.log("✓ Backend endpoint works correctly");
    } else {
      console.log("✗ Backend endpoint failed:", data.message);
    }
  })
  .catch((error) => {
    console.error("Error in test:", error);
  });
