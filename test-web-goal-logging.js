const http = require("http");

const postData = JSON.stringify({
  competitionId: 78,
  participantId: 1,
  teamId: 1,
  kicksUsed: 5,
  goals: 3,
  consecutiveKicks: null,
  notes: null,
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/staff/competition-setup/log-goals",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
    Cookie:
      "connect.sid=s%3AyQGNqPOD6-IqktEHqoWgmT_9_o5yrfUt.rYNK5%2BA4M6TJqSzlzE1tVh3wvfDN2%2BCLPXpJyTFTKIw", // You'll need to get this from browser dev tools
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

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

req.write(postData);
req.end();

console.log(
  "Sending goal log request for player 1 (John Doe) on team 1 (Ace Strikers)..."
);
