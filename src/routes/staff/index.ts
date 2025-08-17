import express from "express";
import { isStaff } from "../../middleware/auth";
import { getInterface } from "../../controllers/staff/interfaceController";
import {
  processQRScan,
  logGoals,
  updatePlayerName,
  searchPlayerByName,
  skipCurrentQueue,
} from "../../controllers/staff/scanController";
import {
  getNameChangeInterface,
  postNameChange,
  postProfileEdit,
} from "../../controllers/staff/nameController";
import {
  createMatch,
  createSoloCompetition,
  getMatches,
  getSoloCompetitions,
  updateMatchStatus,
  updateSoloCompetitionStatus,
  addMatchParticipant,
  addSoloParticipant,
  getActiveCompetitions,
  getRecentActivity,
  getCompetitionManagement,
  getMatchLive,
  getSoloLive,
  startMatch,
  pauseMatch,
  resumeMatch,
  endMatch,
  startSoloCompetition,
  pauseSoloCompetition,
  resumeSoloCompetition,
  endSoloCompetition,
  getMatchLiveData,
  getSoloLiveData,
  getSoloLeaderboard,
} from "../../controllers/staff/competitionController";
import {
  logMatchKick,
  logSoloKick,
  getLiveMatchData,
  getLiveSoloData,
  getTodaysActivity,
  logKick,
  getMatchKicks,
  getSoloKicks,
  deleteKick,
} from "../../controllers/staff/liveController";
import {
  getCompetitionSetup,
  createCompetition,
  getCompetitionQueue,
  startCompetition,
  endCompetition,
  cancelCompetition,
  getCompetitionLive,
  getIndividualLeaderboard,
  getTeamLeaderboard,
  logCompetitionGoals,
  getCompetitionActivity,
  getParticipantsWithLoggedGoals,
  getActiveTeamPlayers,
  saveActiveTeamPlayers,
} from "../../controllers/staff/competitionSetupController";
import eventRegistrationManagementRoutes from "./eventRegistrationManagement";
import multer = require("multer");
import path = require("path");
import fs = require("fs");

const router = express.Router();

// Create uploads directory if it doesn't exist - use absolute path
const rootDir = path.resolve(__dirname, "../../../");
const uploadsDir = path.join(rootDir, "public/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  fileFilter: function (req: any, file: any, cb: any) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  },
});

// Staff interface routes
router.get("/interface", isStaff, getInterface);

// Name change routes (now profile editing routes)
router.get("/name-change", isStaff, getNameChangeInterface);
router.post("/name-change", isStaff, postNameChange);
router.post("/edit-profile", isStaff, upload.single("photo"), postProfileEdit);

// API routes
router.post("/scan", isStaff, processQRScan);
router.get("/search-by-name", isStaff, searchPlayerByName);
router.post("/log-goal", isStaff, logGoals);
router.post("/update-name", isStaff, updatePlayerName);
router.post("/skip-queue", isStaff, skipCurrentQueue);

// Event registration management route
router.get("/event-registration-management", isStaff, (req, res) => {
  res.render("staff/event-registration-management", {
    title: "Event Registration Management",
    user: (req.session as any).user,
  });
});

// Debug route for event registration management
router.get("/event-registration-debug", isStaff, (req, res) => {
  res.render("staff/event-registration-debug", {
    title: "Event Registration Debug",
    user: (req.session as any).user,
  });
});

// Simple event management route
router.get("/event-simple", isStaff, (req, res) => {
  res.render("staff/event-simple", {
    title: "Simple Event Management",
    user: (req.session as any).user,
  });
});

// Super simple event management route - even more basic testing
router.get("/super-simple-events", isStaff, (req, res) => {
  res.render("staff/super-simple-events", {
    title: "Super Simple Events",
    user: (req.session as any).user,
  });
});

// Simple registrations viewer - focused just on the registrations fetch
router.get("/simple-registrations", isStaff, (req, res) => {
  res.render("staff/simple-registrations", {
    title: "Simple Registrations Viewer",
    user: (req.session as any).user,
  });
});

// Competition management route (redirecting to the actual handler)
router.get("/competition-management", isStaff, (req, res) => {
  res.redirect("/staff/competitions");
});

// Competition Management Routes
router.get("/competitions", isStaff, getCompetitionManagement);

// Match Routes
router.post("/competitions/matches", isStaff, createMatch);
router.get("/competitions/matches", isStaff, getMatches);
router.get("/competitions/match/:id", isStaff, getMatchLive);
router.get("/competitions/match/:id/live-data", isStaff, getMatchLiveData);
router.post("/competitions/match/:id/start", isStaff, startMatch);
router.post("/competitions/match/:id/pause", isStaff, pauseMatch);
router.post("/competitions/match/:id/resume", isStaff, resumeMatch);
router.post("/competitions/match/:id/end", isStaff, endMatch);
router.post(
  "/competitions/match/:id/participants",
  isStaff,
  addMatchParticipant
);

// Solo Competition Routes
router.post("/competitions/solo", isStaff, createSoloCompetition);
router.get("/competitions/solo", isStaff, getSoloCompetitions);
router.get("/competitions/solo/:id", isStaff, getSoloLive);
router.get("/competitions/solo/:id/live-data", isStaff, getSoloLiveData);
router.get("/competitions/solo/:id/leaderboard", isStaff, getSoloLeaderboard);
router.post("/competitions/solo/:id/start", isStaff, startSoloCompetition);
router.post("/competitions/solo/:id/pause", isStaff, pauseSoloCompetition);
router.post("/competitions/solo/:id/resume", isStaff, resumeSoloCompetition);
router.post("/competitions/solo/:id/end", isStaff, endSoloCompetition);
router.post("/competitions/solo/:id/participants", isStaff, addSoloParticipant);

// Live Scoring Routes
router.post("/live/log-kick", isStaff, logKick);
router.get("/live/match/:id/kicks", isStaff, getMatchKicks);
router.get("/live/solo/:id/kicks", isStaff, getSoloKicks);
router.delete("/live/kick/:id", isStaff, deleteKick);

// Activity Routes
router.get("/competitions/activity", isStaff, getRecentActivity);
router.get("/competitions/active", isStaff, getActiveCompetitions);

// Competition Setup Routes
// Temporary test route without authentication for testing
router.get("/competition-setup-test", (req, res) => {
  // Mock user session for testing
  if (!(req.session as any).user) {
    (req.session as any).user = { id: 1, role: "admin", username: "test" };
  }
  res.render("staff/competition-setup", {
    title: "Competition Setup (Test Mode)",
    user: { id: 1, role: "admin", username: "test" },
  });
});
// Add test route for competition live page without authentication
router.get("/competition-live-test/:id", (req, res) => {
  // Mock user session for testing
  if (!(req.session as any).user) {
    (req.session as any).user = { id: 1, role: "admin", username: "test" };
  }
  // Call the actual controller function
  getCompetitionLive(req, res);
});
router.get("/competition-setup/queue-test", getCompetitionQueue);
router.post("/competition-setup/:id/start-test", startCompetition);
router.post("/competition-setup/:id/cancel-test", cancelCompetition);
router.post("/competition-setup/:id/end-test", endCompetition);

// Add test routes that work with the test live page
router.post("/competition-setup-test/:id/end", (req, res) => {
  // Mock user session for testing
  if (!(req.session as any).user) {
    (req.session as any).user = { id: 1, role: "admin", username: "test" };
  }
  endCompetition(req, res);
});

router.get("/competition-setup", isStaff, getCompetitionSetup);
router.post("/competition-setup/create", isStaff, createCompetition);
router.get("/competition-setup/queue", isStaff, getCompetitionQueue);
router.post("/competition-setup/:id/start", isStaff, startCompetition);
router.post("/competition-setup/:id/end", isStaff, endCompetition);
router.post("/competition-setup/:id/cancel", isStaff, cancelCompetition);
router.get("/competition-live/:id", isStaff, getCompetitionLive);
router.get(
  "/competition-setup/:id/leaderboard",
  isStaff,
  getIndividualLeaderboard
);
router.get(
  "/competition-setup/:id/team-leaderboard",
  isStaff,
  getTeamLeaderboard
);
router.post("/competition-setup/log-goals", isStaff, logCompetitionGoals);
router.get("/competition-setup/:id/activity", isStaff, getCompetitionActivity);
router.get(
  "/competition-setup/:competitionId/participants-with-goals",
  isStaff,
  getParticipantsWithLoggedGoals
);
router.get(
  "/competition-setup/:competitionId/active-players",
  isStaff,
  getActiveTeamPlayers
);
router.post(
  "/competition-setup/:competitionId/team/:teamId/active-players",
  isStaff,
  saveActiveTeamPlayers
);

// Use event registration management routes
router.use(eventRegistrationManagementRoutes);

export default router;
