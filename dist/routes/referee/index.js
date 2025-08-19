"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const gameController_1 = require("../../controllers/referee/gameController");
const router = express_1.default.Router();
// Referee interface routes
router.get("/", auth_1.isStaff, gameController_1.getRefereeInterface);
// API routes
router.post("/api/scan", auth_1.isStaff, gameController_1.processQRScan);
router.get("/api/search", auth_1.isStaff, gameController_1.searchPlayerByPhone);
router.get("/api/search-name", auth_1.isStaff, gameController_1.searchPlayerByName);
router.get("/api/search-teams", auth_1.isStaff, gameController_1.searchTeams);
router.get("/api/team/:teamId/members", auth_1.isStaff, gameController_1.getTeamMembers);
router.get("/api/player/:playerId", auth_1.isStaff, gameController_1.getPlayerDetails);
router.post("/api/log-goals", auth_1.isStaff, gameController_1.logGoals);
router.post("/api/update-name", auth_1.isStaff, gameController_1.updatePlayerName);
router.post("/api/fix-kicks", auth_1.isStaff, gameController_1.fixKicksBalance);
router.post("/api/skip-queue", auth_1.isStaff, gameController_1.skipQueue);
exports.default = router;
