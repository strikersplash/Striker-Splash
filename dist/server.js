"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const net_1 = __importDefault(require("net"));
// Load environment variables
dotenv_1.default.config();
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
(0, db_1.default)();
// Server configuration for cloud deployment
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
console.log(`🚀 Starting Striker Splash Server in ${NODE_ENV} mode...`);
console.log(`🌐 Server will run on port: ${PORT}`);
// Cloud deployment - SSL handled by DigitalOcean
if (process.env.TRUST_PROXY === "true") {
    app_1.default.set("trust proxy", 1);
    console.log("🔗 Trusting proxy for DigitalOcean deployment");
}
function findAvailablePort(startPort_1) {
    return __awaiter(this, arguments, void 0, function* (startPort, maxAttempts = 10) {
        for (let p = startPort; p < startPort + maxAttempts; p++) {
            const free = yield new Promise((resolve) => {
                const tester = net_1.default
                    .createServer()
                    .once("error", () => resolve(false))
                    .once("listening", () => {
                    tester.close(() => resolve(true));
                })
                    .listen(p, "0.0.0.0");
            });
            if (free)
                return p;
        }
        return startPort; // fallback
    });
}
function start(port) {
    const server = app_1.default
        .listen(port, () => {
        console.log(`✅ Striker Splash Server running on port ${port}`);
        if (NODE_ENV === "production") {
            console.log("🔗 SSL/TLS handled by DigitalOcean App Platform");
        }
    })
        .on("error", (err) => __awaiter(this, void 0, void 0, function* () {
        if (err.code === "EADDRINUSE") {
            console.error(`⚠️  Port ${port} in use.`);
            if (process.env.AUTO_PORT === "true") {
                const newPort = yield findAvailablePort(port + 1, 20);
                if (newPort !== port) {
                    console.log(`🔄 Switching to free port ${newPort} (AUTO_PORT enabled)`);
                    return start(newPort);
                }
                else {
                    console.error("❌ No free port found in range. Exiting.");
                }
            }
            else {
                console.error("Set AUTO_PORT=true to auto-pick another port or kill the existing process using that port.");
            }
            process.exit(1);
        }
        else {
            console.error("❌ Server error:", err);
        }
    }));
    return server;
}
// Start (with optional auto port)
const server = start(parseInt(PORT, 10));
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
