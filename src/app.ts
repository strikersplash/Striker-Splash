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
    contentSecurityPolicy: false, // Temporarily disable CSP to test if it's blocking CSS
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

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "striker_splash_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      httpOnly: true, // Prevent client-side script access
    },
  })
);

// Flash messages
app.use(flash());

// Session validation middleware - invalidate sessions from before server restart
app.use((req, res, next) => {
  const session = req.session as any;

  // Check if session has a user but no server start time (old session)
  if (session && session.user && !session.serverStartTime) {
    // Old session from before this restart - invalidate it
    session.destroy((err: any) => {
      if (err) console.error("Error destroying old session:", err);
    });
    // Clear the session cookie
    res.clearCookie("connect.sid");
    return res.redirect("/auth/login");
  }

  // Check if session is from a different server instance
  if (
    session &&
    session.user &&
    session.serverStartTime &&
    session.serverStartTime !== SERVER_START_TIME
  ) {
    session.destroy((err: any) => {
      if (err) console.error("Error destroying session:", err);
    });
    // Clear the session cookie
    res.clearCookie("connect.sid");
    return res.redirect("/auth/login");
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
