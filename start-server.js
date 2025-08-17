// Simple script to start the server using the compiled JavaScript
const { spawn } = require("child_process");
const path = require("path");

// Path to the compiled app.js file
const appPath = path.join(__dirname, "dist", "app.js");

console.log(`Starting server from: ${appPath}`);

// Spawn the node process
const server = spawn("node", [appPath], {
  stdio: "inherit",
  env: process.env,
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

console.log("Server started. Press Ctrl+C to stop.");
