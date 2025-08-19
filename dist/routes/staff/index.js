"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const interfaceController_1 = require("../../controllers/staff/interfaceController");
const scanController_1 = require("../../controllers/staff/scanController");
const nameController_1 = require("../../controllers/staff/nameController");
const competitionController_1 = require("../../controllers/staff/competitionController");
const liveController_1 = require("../../controllers/staff/liveController");
const competitionSetupController_1 = require("../../controllers/staff/competitionSetupController");
const eventRegistrationManagement_1 = require("./eventRegistrationManagement");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express_1.default.Router();
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
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(null, false);
        }
        cb(null, true);
    },
});
// Staff interface routes
router.get("/interface", auth_1.isStaff, interfaceController_1.getInterface);
// Name change routes (now profile editing routes)
router.get("/name-change", auth_1.isStaff, nameController_1.getNameChangeInterface);
router.post("/name-change", auth_1.isStaff, nameController_1.postNameChange);
router.post("/edit-profile", auth_1.isStaff, upload.single("photo"), nameController_1.postProfileEdit);
// API routes
router.post("/scan", auth_1.isStaff, scanController_1.processQRScan);
router.get("/search-by-name", auth_1.isStaff, scanController_1.searchPlayerByName);
router.post("/log-goal", auth_1.isStaff, scanController_1.logGoals);
router.post("/update-name", auth_1.isStaff, scanController_1.updatePlayerName);
router.post("/skip-queue", auth_1.isStaff, scanController_1.skipCurrentQueue);
// Event registration management route
router.get("/event-registration-management", auth_1.isStaff, (req, res) => {
    res.render("staff/event-registration-management", {
        title: "Event Registration Management",
        user: req.session.user,
    });
});
// Debug route for event registration management
router.get("/event-registration-debug", auth_1.isStaff, (req, res) => {
    res.render("staff/event-registration-debug", {
        title: "Event Registration Debug",
        user: req.session.user,
    });
});
// Simple event management route
router.get("/event-simple", auth_1.isStaff, (req, res) => {
    res.render("staff/event-simple", {
        title: "Simple Event Management",
        user: req.session.user,
    });
});
// Super simple event management route - even more basic testing
router.get("/super-simple-events", auth_1.isStaff, (req, res) => {
    res.render("staff/super-simple-events", {
        title: "Super Simple Events",
        user: req.session.user,
    });
});
// Simple registrations viewer - focused just on the registrations fetch
router.get("/simple-registrations", auth_1.isStaff, (req, res) => {
    res.render("staff/simple-registrations", {
        title: "Simple Registrations Viewer",
        user: req.session.user,
    });
});
// Competition management route (redirecting to the actual handler)
router.get("/competition-management", auth_1.isStaff, (req, res) => {
    res.redirect("/staff/competitions");
});
// Competition Management Routes
router.get("/competitions", auth_1.isStaff, competitionController_1.getCompetitionManagement);
// Match Routes
router.post("/competitions/matches", auth_1.isStaff, competitionController_1.createMatch);
router.get("/competitions/matches", auth_1.isStaff, competitionController_1.getMatches);
router.get("/competitions/match/:id", auth_1.isStaff, competitionController_1.getMatchLive);
router.get("/competitions/match/:id/live-data", auth_1.isStaff, competitionController_1.getMatchLiveData);
router.post("/competitions/match/:id/start", auth_1.isStaff, competitionController_1.startMatch);
router.post("/competitions/match/:id/pause", auth_1.isStaff, competitionController_1.pauseMatch);
router.post("/competitions/match/:id/resume", auth_1.isStaff, competitionController_1.resumeMatch);
router.post("/competitions/match/:id/end", auth_1.isStaff, competitionController_1.endMatch);
router.post("/competitions/match/:id/participants", auth_1.isStaff, competitionController_1.addMatchParticipant);
// Solo Competition Routes
router.post("/competitions/solo", auth_1.isStaff, competitionController_1.createSoloCompetition);
router.get("/competitions/solo", auth_1.isStaff, competitionController_1.getSoloCompetitions);
router.get("/competitions/solo/:id", auth_1.isStaff, competitionController_1.getSoloLive);
router.get("/competitions/solo/:id/live-data", auth_1.isStaff, competitionController_1.getSoloLiveData);
router.get("/competitions/solo/:id/leaderboard", auth_1.isStaff, competitionController_1.getSoloLeaderboard);
router.post("/competitions/solo/:id/start", auth_1.isStaff, competitionController_1.startSoloCompetition);
router.post("/competitions/solo/:id/pause", auth_1.isStaff, competitionController_1.pauseSoloCompetition);
router.post("/competitions/solo/:id/resume", auth_1.isStaff, competitionController_1.resumeSoloCompetition);
router.post("/competitions/solo/:id/end", auth_1.isStaff, competitionController_1.endSoloCompetition);
router.post("/competitions/solo/:id/participants", auth_1.isStaff, competitionController_1.addSoloParticipant);
// Live Scoring Routes
router.post("/live/log-kick", auth_1.isStaff, liveController_1.logKick);
router.get("/live/match/:id/kicks", auth_1.isStaff, liveController_1.getMatchKicks);
router.get("/live/solo/:id/kicks", auth_1.isStaff, liveController_1.getSoloKicks);
router.delete("/live/kick/:id", auth_1.isStaff, liveController_1.deleteKick);
// Activity Routes
router.get("/competitions/activity", auth_1.isStaff, competitionController_1.getRecentActivity);
router.get("/competitions/active", auth_1.isStaff, competitionController_1.getActiveCompetitions);
// Competition Setup Routes
// Temporary test route without authentication for testing
router.get("/competition-setup-test", (req, res) => {
    // Mock user session for testing
    if (!req.session.user) {
        req.session.user = { id: 1, role: "admin", username: "test" };
    }
    res.render("staff/competition-setup", {
        title: "Competition Setup (Test Mode)",
        user: { id: 1, role: "admin", username: "test" },
    });
});
// Add test route for competition live page without authentication
router.get("/competition-live-test/:id", (req, res) => {
    // Mock user session for testing
    if (!req.session.user) {
        req.session.user = { id: 1, role: "admin", username: "test" };
    }
    // Call the actual controller function
    (0, competitionSetupController_1.getCompetitionLive)(req, res);
});
router.get("/competition-setup/queue-test", competitionSetupController_1.getCompetitionQueue);
router.post("/competition-setup/:id/start-test", competitionSetupController_1.startCompetition);
router.post("/competition-setup/:id/cancel-test", competitionSetupController_1.cancelCompetition);
router.post("/competition-setup/:id/end-test", competitionSetupController_1.endCompetition);
// Add test routes that work with the test live page
router.post("/competition-setup-test/:id/end", (req, res) => {
    // Mock user session for testing
    if (!req.session.user) {
        req.session.user = { id: 1, role: "admin", username: "test" };
    }
    (0, competitionSetupController_1.endCompetition)(req, res);
});
router.get("/competition-setup", auth_1.isStaff, competitionSetupController_1.getCompetitionSetup);
router.post("/competition-setup/create", auth_1.isStaff, competitionSetupController_1.createCompetition);
router.get("/competition-setup/queue", auth_1.isStaff, competitionSetupController_1.getCompetitionQueue);
router.post("/competition-setup/:id/start", auth_1.isStaff, competitionSetupController_1.startCompetition);
router.post("/competition-setup/:id/end", auth_1.isStaff, competitionSetupController_1.endCompetition);
router.post("/competition-setup/:id/cancel", auth_1.isStaff, competitionSetupController_1.cancelCompetition);
router.get("/competition-live/:id", auth_1.isStaff, competitionSetupController_1.getCompetitionLive);
router.get("/competition-setup/:id/leaderboard", auth_1.isStaff, competitionSetupController_1.getIndividualLeaderboard);
router.get("/competition-setup/:id/team-leaderboard", auth_1.isStaff, competitionSetupController_1.getTeamLeaderboard);
router.post("/competition-setup/log-goals", auth_1.isStaff, competitionSetupController_1.logCompetitionGoals);
router.get("/competition-setup/:id/activity", auth_1.isStaff, competitionSetupController_1.getCompetitionActivity);
router.get("/competition-setup/:competitionId/participants-with-goals", auth_1.isStaff, competitionSetupController_1.getParticipantsWithLoggedGoals);
router.get("/competition-setup/:competitionId/active-players", auth_1.isStaff, competitionSetupController_1.getActiveTeamPlayers);
router.post("/competition-setup/:competitionId/team/:teamId/active-players", auth_1.isStaff, competitionSetupController_1.saveActiveTeamPlayers);
// Use event registration management routes
router.use(eventRegistrationManagement_1.default);
exports.default = router;
