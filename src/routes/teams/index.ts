import express from "express";
import { isAuthenticated } from "../../middleware/auth";
import {
  createTeam,
  getCreateTeamForm,
  joinTeam,
  leaveTeam,
  getTeamDashboard,
  browseTeams,
  getTeamComparison,
  checkMembership,
  handleJoinRequest,
  transferCaptaincy,
  removeMember,
  updateTeamName,
  deleteTeam,
  updateTeamSize,
} from "../../controllers/teams/teamController";

const router = express.Router();

// Team routes
router.get("/create", isAuthenticated, getCreateTeamForm);
router.post("/create", isAuthenticated, createTeam);
router.get("/dashboard/:teamIdentifier?", isAuthenticated, getTeamDashboard);
router.get("/browse", isAuthenticated, browseTeams);
router.post("/join/:teamId", isAuthenticated, joinTeam);
router.post("/leave", isAuthenticated, leaveTeam);
router.get("/compare", isAuthenticated, getTeamComparison);
router.get("/check-membership/:playerId", checkMembership);

// Team management routes (captain only)
router.post(
  "/join-request/:requestId/:action",
  isAuthenticated,
  handleJoinRequest
);
router.post("/transfer-captaincy", isAuthenticated, transferCaptaincy);
router.post("/remove-member", isAuthenticated, removeMember);
router.post("/update-name", isAuthenticated, updateTeamName);
router.post("/delete", isAuthenticated, deleteTeam);
router.post("/update-size", isAuthenticated, updateTeamSize);

export default router;
