import express from "express";
import { isStaff, isStaffAPI } from "../../middleware/auth";
import {
  getRefereeInterface,
  processQRScan,
  searchPlayerByPhone,
  searchPlayerByName,
  searchTeams,
  getPlayerDetails,
  getTeamMembers,
  logGoals,
  updatePlayerName,
  fixKicksBalance,
  skipQueue,
} from "../../controllers/referee/gameController";

const router = express.Router();

// Referee interface routes
router.get("/", isStaff, getRefereeInterface);

// API routes
router.post("/api/scan", isStaffAPI, processQRScan);
router.get("/api/search", isStaffAPI, searchPlayerByPhone);
router.get("/api/search-name", isStaffAPI, searchPlayerByName);
router.get("/api/search-teams", isStaffAPI, searchTeams);
router.get("/api/team/:teamId/members", isStaffAPI, getTeamMembers);
router.get("/api/player/:playerId", isStaffAPI, getPlayerDetails);
router.post("/api/log-goals", isStaffAPI, logGoals);
router.post("/api/update-name", isStaffAPI, updatePlayerName);
router.post("/api/fix-kicks", isStaffAPI, fixKicksBalance);
router.post("/api/skip-queue", isStaffAPI, skipQueue);

export default router;
