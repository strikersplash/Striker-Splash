import app from "./app";
import connectDB from "./config/db";
import dotenv from "dotenv";
import net from "net";

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

async function findAvailablePort(
  startPort: number,
  maxAttempts = 10
): Promise<number> {
  for (let p = startPort; p < startPort + maxAttempts; p++) {
    const free = await new Promise<boolean>((resolve) => {
      const tester = net
        .createServer()
        .once("error", () => resolve(false))
        .once("listening", () => {
          tester.close(() => resolve(true));
        })
        .listen(p, "0.0.0.0");
    });
    if (free) return p;
  }
  return startPort; // fallback
}

function start(port: number) {
  const server = app
    .listen(port, () => {
      console.log(`✅ Striker Splash Server running on port ${port}`);
      if (NODE_ENV === "production") {
        console.log("🔗 SSL/TLS handled by DigitalOcean App Platform");
      }
    })
    .on("error", async (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`⚠️  Port ${port} in use.`);
        if (process.env.AUTO_PORT === "true") {
          const newPort = await findAvailablePort(port + 1, 20);
          if (newPort !== port) {
            console.log(
              `🔄 Switching to free port ${newPort} (AUTO_PORT enabled)`
            );
            return start(newPort);
          } else {
            console.error("❌ No free port found in range. Exiting.");
          }
        } else {
          console.error(
            "Set AUTO_PORT=true to auto-pick another port or kill the existing process using that port."
          );
        }
        process.exit(1);
      } else {
        console.error("❌ Server error:", err);
      }
    });
  return server;
}

// Start (with optional auto port)
const server = start(parseInt(PORT as string, 10));

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
