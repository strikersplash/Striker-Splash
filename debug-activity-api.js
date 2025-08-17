// Debug script to test the activity API directly
const http = require("http");

async function testActivityAPI() {
  console.log("Testing /api/activity/today endpoint...");

  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/api/activity/today",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Response:", data);
    });
  });

  req.on("error", (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

testActivityAPI();
