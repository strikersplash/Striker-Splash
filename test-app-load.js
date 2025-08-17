// Test script to debug server startup
console.log("Testing server startup...");

try {
  require("./dist/app");
  console.log("App loaded successfully!");
} catch (e) {
  console.error("App failed to load:", e.message);
  console.error("Stack:", e.stack);
}
