// Test script to login and then test the activity API
const http = require("http");
const querystring = require("querystring");

async function loginAndTestAPI() {
  console.log("Step 1: Logging in...");

  // First, login to get a session
  const loginData = querystring.stringify({
    username: "staff",
    userType: "staff",
  });

  const loginOptions = {
    hostname: "localhost",
    port: 3000,
    path: "/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(loginData),
    },
  };

  return new Promise((resolve) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      console.log(`Login status: ${loginRes.statusCode}`);

      // Extract session cookie
      const cookies = loginRes.headers["set-cookie"];
      let sessionCookie = "";
      if (cookies) {
        sessionCookie = cookies.find((cookie) =>
          cookie.startsWith("connect.sid=")
        );
        if (sessionCookie) {
          sessionCookie = sessionCookie.split(";")[0];
        }
      }

      console.log("Session cookie:", sessionCookie ? "Found" : "Not found");

      // Now test the API with the session
      console.log("\nStep 2: Testing API with session...");

      const apiOptions = {
        hostname: "localhost",
        port: 3000,
        path: "/api/activity/today",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: sessionCookie || "",
        },
      };

      const apiReq = http.request(apiOptions, (apiRes) => {
        console.log(`API Status: ${apiRes.statusCode}`);
        console.log(`API Headers:`, apiRes.headers);

        let data = "";
        apiRes.on("data", (chunk) => {
          data += chunk;
        });

        apiRes.on("end", () => {
          console.log(
            "API Response:",
            data.substring(0, 500) + (data.length > 500 ? "..." : "")
          );
          resolve();
        });
      });

      apiReq.on("error", (e) => {
        console.error(`API request error: ${e.message}`);
        resolve();
      });

      apiReq.end();
    });

    loginReq.on("error", (e) => {
      console.error(`Login request error: ${e.message}`);
      resolve();
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

loginAndTestAPI();
