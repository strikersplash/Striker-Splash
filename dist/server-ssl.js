"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpsServer = exports.httpServer = void 0;
// SSL/HTTPS Configuration for Production
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv.config();
// Connect to database
(0, db_1.default)();
// SSL Configuration
const SSL_CONFIG = {
    // Development: Use self-signed certificates
    development: {
        enabled: process.env.ENABLE_HTTPS === "true",
        port: process.env.HTTPS_PORT || 3443,
        cert: process.env.SSL_CERT_PATH || "./ssl/cert.pem",
        key: process.env.SSL_KEY_PATH || "./ssl/key.pem",
    },
    // Production: Use real certificates (Let's Encrypt, etc.)
    production: {
        enabled: process.env.ENABLE_HTTPS !== "false", // Default to true in production
        port: process.env.HTTPS_PORT || 443,
        cert: process.env.SSL_CERT_PATH || "/etc/ssl/certs/your-domain.crt",
        key: process.env.SSL_KEY_PATH || "/etc/ssl/private/your-domain.key",
        ca: process.env.SSL_CA_PATH || "/etc/ssl/certs/ca-bundle.crt", // Optional certificate authority
    },
};
const NODE_ENV = process.env.NODE_ENV || "development";
const HTTP_PORT = process.env.PORT || 3000;
const config = SSL_CONFIG[NODE_ENV];
console.log(`🚀 Starting Striker Splash Server in ${NODE_ENV} mode...`);
// Function to create HTTPS server
function createHTTPSServer() {
    try {
        // Check if SSL files exist
        if (!fs_1.default.existsSync(config.cert) || !fs_1.default.existsSync(config.key)) {
            console.log("⚠️  SSL certificates not found. Starting HTTP server only.");
            console.log(`   Expected cert: ${config.cert}`);
            console.log(`   Expected key: ${config.key}`);
            if (NODE_ENV === "development") {
                console.log("💡 To enable HTTPS in development:");
                console.log("   1. Generate self-signed certificates:");
                console.log("      mkdir -p ssl");
                console.log("      openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes");
                console.log("   2. Set ENABLE_HTTPS=true in your .env file");
            }
            return null;
        }
        // Load SSL certificates
        const httpsOptions = {
            cert: fs_1.default.readFileSync(config.cert),
            key: fs_1.default.readFileSync(config.key),
        };
        // Add CA bundle if specified (for production)
        if (config.ca && fs_1.default.existsSync(config.ca)) {
            httpsOptions.ca = fs_1.default.readFileSync(config.ca);
        }
        // Create HTTPS server
        const httpsServer = https_1.default.createServer(httpsOptions, app_1.default);
        httpsServer.listen(config.port, () => {
            console.log(`🔒 HTTPS Server running on: https://localhost:${config.port}`);
            if (NODE_ENV === "production") {
                console.log(`🌐 Production HTTPS enabled on port ${config.port}`);
            }
            else {
                console.log(`🔧 Development HTTPS enabled on port ${config.port}`);
                console.log("⚠️  Using self-signed certificates - browsers will show security warnings");
            }
        });
        return httpsServer;
    }
    catch (error) {
        console.error("❌ Error creating HTTPS server:", error);
        console.log("📋 Falling back to HTTP server...");
        return null;
    }
}
// Function to create HTTP server (and redirect to HTTPS if needed)
function createHTTPServer() {
    let httpApp = app_1.default;
    // In production with HTTPS enabled, redirect HTTP to HTTPS
    if (NODE_ENV === "production" && config.enabled) {
        const express = require("express");
        httpApp = express();
        // Redirect all HTTP traffic to HTTPS
        httpApp.use((req, res) => {
            var _a;
            const host = (_a = req.headers.host) === null || _a === void 0 ? void 0 : _a.replace(/:\d+$/, ""); // Remove port if present
            const httpsUrl = `https://${host}${config.port !== 443 ? `:${config.port}` : ""}${req.url}`;
            console.log(`🔄 Redirecting HTTP to HTTPS: ${req.url} -> ${httpsUrl}`);
            res.redirect(301, httpsUrl);
        });
    }
    const httpServer = http_1.default.createServer(httpApp);
    httpServer.listen(HTTP_PORT, () => {
        if (NODE_ENV === "production" && config.enabled) {
            console.log(`🔄 HTTP Server running on port ${HTTP_PORT} (redirecting to HTTPS)`);
        }
        else {
            console.log(`🌐 HTTP Server running on: http://localhost:${HTTP_PORT}`);
        }
    });
    return httpServer;
}
// Start servers
console.log("📋 Server Configuration:");
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   HTTP Port: ${HTTP_PORT}`);
console.log(`   HTTPS Enabled: ${config.enabled}`);
console.log(`   HTTPS Port: ${config.port}`);
// Create HTTPS server if enabled and certificates available
let httpsServer = null;
exports.httpsServer = httpsServer;
if (config.enabled) {
    exports.httpsServer = httpsServer = createHTTPSServer();
}
// Always create HTTP server
const httpServer = createHTTPServer();
exports.httpServer = httpServer;
// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("🛑 Received SIGTERM, shutting down gracefully...");
    if (httpsServer) {
        httpsServer.close(() => {
            console.log("🔒 HTTPS server closed");
        });
    }
    httpServer.close(() => {
        console.log("🌐 HTTP server closed");
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    console.log("🛑 Received SIGINT, shutting down gracefully...");
    if (httpsServer) {
        httpsServer.close(() => {
            console.log("🔒 HTTPS server closed");
        });
    }
    httpServer.close(() => {
        console.log("🌐 HTTP server closed");
        process.exit(0);
    });
});
