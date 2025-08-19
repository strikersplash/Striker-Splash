"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const auth_1 = require("../../middleware/auth");
const teamController_1 = require("../../controllers/teams/teamController");
const router = express.Router();
// Team routes
router.get("/create", auth_1.isAuthenticated, teamController_1.getCreateTeamForm);
router.post("/create", auth_1.isAuthenticated, teamController_1.createTeam);
router.get("/dashboard/:teamIdentifier?", auth_1.isAuthenticated, teamController_1.getTeamDashboard);
router.get("/browse", auth_1.isAuthenticated, teamController_1.browseTeams);
router.post("/join/:teamId", auth_1.isAuthenticated, teamController_1.joinTeam);
router.post("/leave", auth_1.isAuthenticated, teamController_1.leaveTeam);
router.get("/compare", auth_1.isAuthenticated, teamController_1.getTeamComparison);
router.get("/check-membership/:playerId", teamController_1.checkMembership);
// Team management routes (captain only)
router.post("/join-request/:requestId/:action", auth_1.isAuthenticated, teamController_1.handleJoinRequest);
router.post("/transfer-captaincy", auth_1.isAuthenticated, teamController_1.transferCaptaincy);
router.post("/remove-member", auth_1.isAuthenticated, teamController_1.removeMember);
router.post("/update-name", auth_1.isAuthenticated, teamController_1.updateTeamName);
router.post("/delete", auth_1.isAuthenticated, teamController_1.deleteTeam);
router.post("/update-size", auth_1.isAuthenticated, teamController_1.updateTeamSize);
exports.default = router;
