import express from "express";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import flash from "express-flash";
import helmet from "helmet";
import dotenv from "dotenv";
import ejsLayouts from "express-ejs-layouts";
import multer from "multer";
import fs from "fs";
import { Pool } from "pg";

// Import PostgreSQL session store
const pgSession = require("connect-pg-simple")(session);

// Import security middleware
import { sanitizeResponse, securityHeaders } from "./middleware/security";

// Import routes
import authRoutes from "./routes/auth";
import playerRoutes from "./routes/player";
import staffRoutes from "./routes/staff";
import adminRoutes from "./routes/admin";
import cashierRoutes from "./routes/cashier";
import refereeRoutes from "./routes/referee";
import leaderboardRoutes from "./routes/leaderboard";
import teamsRoutes from "./routes/teams";
import publicRoutes from "./routes/public";
import apiRoutes from "./routes/api";
import errorRoutes from "./routes/system/error";
import debugRoutes from "./routes/debug";

// Load environment variables
dotenv.config();

const app = express();

// Server startup timestamp to invalidate sessions on restart
export const SERVER_START_TIME = Date.now();

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views"));
app.set("layout", "layouts/main");
app.use(ejsLayouts);

// Disable view caching
app.disable("view cache");

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Temporarily disable CSP while debugging asset loading
  })
);

// Force the uploads to go to the root public directory
// This ensures consistency regardless of where the app is running from
const rootDir = path.resolve(__dirname, "..");
// When compiled, __dirname is in dist/, so go up one level to find public/
const publicDir = path.join(rootDir, "public"); // Use public from root (not src/public)
const uploadsDir = path.join(publicDir, "uploads");

// Create the directories if they don't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// IMPORTANT: Static files middleware must come BEFORE route handlers
// This ensures CSS, JS, and other static files are served properly
app.use(express.static(publicDir));

// Apply security middleware
app.use(securityHeaders);
app.use(sanitizeResponse);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Sanitize the original filename to avoid URL encoding issues
    const sanitizedBase = file.originalname
      .replace(path.extname(file.originalname), "") // Remove extension
      .replace(/[^a-zA-Z0-9\-_]/g, "-") // Replace special chars with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
      .toLowerCase();

    cb(null, uniqueSuffix + "-" + sanitizedBase + ext);
  },
});

const upload = multer({
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
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.CONNECTION_STRING,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Session setup with PostgreSQL store
app.use(
  session({
    store: new pgSession({
      pool: sessionPool,
      tableName: "session", // Table name for sessions
      createTableIfMissing: true, // Auto-create session table
      errorLog: console.error, // Log session store errors
    }),
    secret: process.env.SESSION_SECRET || "striker_splash_secret",
    resave: false, // Don't save session if unmodified - pgSession handles this
    saveUninitialized: false, // Don't save empty sessions - pgSession handles this
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      // Use explicit env flag; avoids forcing secure cookies on local HTTP in production mode
      secure: process.env.COOKIE_SECURE === "true", // set COOKIE_SECURE=true ONLY on real HTTPS
      httpOnly: true,
      sameSite: "lax",
    },
    // Add session store options for better persistence
    rolling: true, // Reset maxAge on every request
    name: "striker_splash_session", // Custom session name
  })
);

// Flash messages
app.use(flash());

// Debug middleware for session issues (only in production)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (
      req.path.includes("/admin/") ||
      req.path.includes("/staff/") ||
      req.path.includes("/cashier/") ||
      req.path.includes("/referee/")
    ) {
      console.log(`[DEBUG] Protected route access: ${req.path}`);
      console.log(`[DEBUG] Session exists: ${!!(req.session as any).user}`);
      console.log(
        `[DEBUG] User role: ${(req.session as any).user?.role || "none"}`
      );
      console.log(
        `[DEBUG] User ID: ${(req.session as any).user?.id || "none"}`
      );
      console.log(`[DEBUG] Session ID: ${req.sessionID}`);
      console.log(
        `[DEBUG] Server start time match: ${
          (req.session as any).serverStartTime === SERVER_START_TIME
        }`
      );
    }
    next();
  });
}

// Session invalidation middleware - logout users when server restarts
app.use((req, res, next) => {
  // Skip session invalidation for auth routes and public routes
  if (
    req.path.startsWith("/auth/") ||
    req.path.startsWith("/api/") ||
    req.path === "/" ||
    req.path.startsWith("/public/")
  ) {
    return next();
  }

  if ((req.session as any).user) {
    // If session doesn't have serverStartTime or it doesn't match current, invalidate session
    if (
      !(req.session as any).serverStartTime ||
      (req.session as any).serverStartTime !== SERVER_START_TIME
    ) {
      console.log(
        "Invalidating session due to server restart or missing serverStartTime"
      );
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
      return res.redirect("/auth/login");
    }
  }
  next();
});

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = (req.session as any).user || null;
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// File upload middleware
app.use((req: any, res, next) => {
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
    const uploadsPath = path.join(publicDir, "uploads"); // Use the same publicDir path
    fs.access(uploadsPath, fs.constants.R_OK, (err) => {
      if (err) {
        console.error("WARNING: Uploads directory not accessible:", err);
      } else {
        console.log("Uploads directory accessible at:", uploadsPath);
        // List a few files from uploads directory for debugging
        try {
          const files = fs.readdirSync(uploadsPath).slice(0, 5);
          console.log("Sample upload files:", files);
        } catch (e) {
          console.error("Error reading upload directory:", e);
        }
      }
    });
    app.locals.uploadsChecked = true;
  }
  next();
});

// Import our test routes
import testRoutes from "./routes/testRoutes";

// Import the displayQR function
import { displayQR } from "./controllers/player/playerController";

// Routes
// QR code display route (global access)
app.get("/qr/:id", displayQR);

app.use("/", publicRoutes);
app.use("/auth", authRoutes);
app.use("/player", playerRoutes);
app.use("/staff", staffRoutes);
app.use("/admin", adminRoutes);
app.use("/cashier", cashierRoutes);
app.use("/referee", refereeRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/teams", teamsRoutes);
app.use("/api", apiRoutes);
app.use("/debug", debugRoutes);
app.use("/test", testRoutes);

// Test route for search debugging
app.get("/test-search", async (req, res) => {
  try {
    const {
      searchPlayer,
    } = require("./controllers/cashier/transactionController");
    await searchPlayer(req, res);
  } catch (error) {
    res.json({ error: String(error) });
  }
});

// Error routes should be last
app.use(errorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render("system/error", {
    title: "Page Not Found",
    code: 404,
    message: "Page not found",
  });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).render("system/error", {
      title: "Server Error",
      code: 500,
      message: "Something went wrong",
    });
  }
);

export default app;
