import app from "./app";
import connectDB from "./config/db";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Add global error handlers to prevent server crashes
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("❌ Stack:", error.stack);
  // Don't exit the process - just log the error
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process - just log the error
});

// Connect to database
connectDB();

// Server configuration for cloud deployment
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

console.log(`🚀 Starting Striker Splash Server in ${NODE_ENV} mode...`);
console.log(`🌐 Server will run on port: ${PORT}`);

// Cloud deployment - SSL handled by DigitalOcean
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
  console.log("🔗 Trusting proxy for DigitalOcean deployment");
}

// Start the server
const server = app.listen(PORT, () => {
  console.log(`✅ Striker Splash Server running on port ${PORT}`);
  if (NODE_ENV === "production") {
    console.log("🔗 SSL/TLS handled by DigitalOcean App Platform");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("🌐 Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully...");
  server.close(() => {
    console.log("🌐 Server closed");
    process.exit(0);
  });
});
