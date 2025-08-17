// Simple test to start server and catch errors
try {
  console.log("Starting server...");
  const app = require("./dist/app").default;

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (error) {
  console.error("Failed to start server:", error);
}
