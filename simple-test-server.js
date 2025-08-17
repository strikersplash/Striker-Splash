// Simple server test
const express = require("express");
const app = express();

app.use(express.json());

// Test endpoint
app.post("/test-raffle", (req, res) => {
  console.log("Test raffle endpoint called");
  res.json({ success: true, message: "Test successful" });
});

app.listen(3001, () => {
  console.log("Test server running on port 3001");
});
