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
exports.SERVER_START_TIME = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
const express_flash_1 = __importDefault(require("express-flash"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
// Import PostgreSQL session store
const pgSession = require("connect-pg-simple")(express_session_1.default);
// Import security middleware
const security_1 = require("./middleware/security");
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const player_1 = __importDefault(require("./routes/player"));
const staff_1 = __importDefault(require("./routes/staff"));
const admin_1 = __importDefault(require("./routes/admin"));
const cashier_1 = __importDefault(require("./routes/cashier"));
const referee_1 = __importDefault(require("./routes/referee"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const teams_1 = __importDefault(require("./routes/teams"));
const public_1 = __importDefault(require("./routes/public"));
const api_1 = __importDefault(require("./routes/api"));
const error_1 = __importDefault(require("./routes/system/error"));
const debug_1 = __importDefault(require("./routes/debug"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Server startup timestamp to invalidate sessions on restart
exports.SERVER_START_TIME = Date.now();
// Set view engine
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "../src/views"));
app.set("layout", "layouts/main");
app.use(express_ejs_layouts_1.default);
// Disable view caching
app.disable("view cache");
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Temporarily disable CSP to test if it's blocking CSS
}));
// Force the uploads to go to the root public directory
// This ensures consistency regardless of where the app is running from
const rootDir = path_1.default.resolve(__dirname, "..");
// When compiled, __dirname is in dist/, so go up one level to find public/
const publicDir = path_1.default.join(rootDir, "public"); // Use public from root (not src/public)
const uploadsDir = path_1.default.join(publicDir, "uploads");
// Create the directories if they don't exist
if (!fs_1.default.existsSync(publicDir)) {
    fs_1.default.mkdirSync(publicDir, { recursive: true });
}
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// IMPORTANT: Static files middleware must come BEFORE route handlers
// This ensures CSS, JS, and other static files are served properly
app.use(express_1.default.static(publicDir));
// Apply security middleware
app.use(security_1.securityHeaders);
app.use(security_1.sanitizeResponse);
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        // Sanitize the original filename to avoid URL encoding issues
        const sanitizedBase = file.originalname
            .replace(path_1.default.extname(file.originalname), "") // Remove extension
            .replace(/[^a-zA-Z0-9\-_]/g, "-") // Replace special chars with hyphens
            .replace(/-+/g, "-") // Replace multiple hyphens with single
            .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
            .toLowerCase();
        cb(null, uniqueSuffix + "-" + sanitizedBase + ext);
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(null, false);
        }
        cb(null, true);
    },
});
// Create PostgreSQL connection pool for session store
const sessionPool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || process.env.CONNECTION_STRING,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});
// Session setup with PostgreSQL store
app.use((0, express_session_1.default)({
    store: new pgSession({
        pool: sessionPool,
        tableName: "session", // Table name for sessions
        createTableIfMissing: true, // Auto-create session table
    }),
    secret: process.env.SESSION_SECRET || "striker_splash_secret",
    resave: false, // Don't save session if unmodified - pgSession handles this
    saveUninitialized: false, // Don't save empty sessions - pgSession handles this
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        // For DigitalOcean App Platform, let the platform handle HTTPS
        // Set secure to false to allow sessions to work properly
        secure: false,
        httpOnly: true, // Prevent client-side script access
        sameSite: "lax", // Help with cross-origin issues
    },
    // Add session store options for better persistence
    rolling: true, // Reset maxAge on every request
    name: "striker_splash_session", // Custom session name
}));
// Flash messages
app.use((0, express_flash_1.default)());
// Global variables middleware
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    next();
});
// File upload middleware
app.use((req, res, next) => {
    req.fileUpload = upload.single("photo");
    next();
});
// Clear view cache on each request in development
if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
        // Clear the require cache for views
        Object.keys(require.cache).forEach((key) => {
            if (key.includes("/views/")) {
                delete require.cache[key];
            }
        });
        next();
    });
}
// Add check on server start for uploads directory
app.use((req, res, next) => {
    // Only run once on startup
    if (req.path === "/" && !app.locals.uploadsChecked) {
        const uploadsPath = path_1.default.join(publicDir, "uploads"); // Use the same publicDir path
        fs_1.default.access(uploadsPath, fs_1.default.constants.R_OK, (err) => {
            if (err) {
                console.error("WARNING: Uploads directory not accessible:", err);
            }
            else {
                console.log("Uploads directory accessible at:", uploadsPath);
                // List a few files from uploads directory for debugging
                try {
                    const files = fs_1.default.readdirSync(uploadsPath).slice(0, 5);
                    console.log("Sample upload files:", files);
                }
                catch (e) {
                    console.error("Error reading upload directory:", e);
                }
            }
        });
        app.locals.uploadsChecked = true;
    }
    next();
});
// Import our test routes
const testRoutes_1 = __importDefault(require("./routes/testRoutes"));
// Import the displayQR function
const playerController_1 = require("./controllers/player/playerController");
// Routes
// QR code display route (global access)
app.get("/qr/:id", playerController_1.displayQR);
app.use("/", public_1.default);
app.use("/auth", auth_1.default);
app.use("/player", player_1.default);
app.use("/staff", staff_1.default);
app.use("/admin", admin_1.default);
app.use("/cashier", cashier_1.default);
app.use("/referee", referee_1.default);
app.use("/leaderboard", leaderboard_1.default);
app.use("/teams", teams_1.default);
app.use("/api", api_1.default);
app.use("/debug", debug_1.default);
app.use("/test", testRoutes_1.default);
// Test route for search debugging
app.get("/test-search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { searchPlayer, } = require("./controllers/cashier/transactionController");
        yield searchPlayer(req, res);
    }
    catch (error) {
        res.json({ error: String(error) });
    }
}));
// Error routes should be last
app.use(error_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).render("system/error", {
        title: "Page Not Found",
        code: 404,
        message: "Page not found",
    });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render("system/error", {
        title: "Server Error",
        code: 500,
        message: "Something went wrong",
    });
});
exports.default = app;
