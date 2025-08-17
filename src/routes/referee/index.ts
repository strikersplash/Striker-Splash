import express from "express";
import { isStaff } from "../../middleware/auth";
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
router.post("/api/scan", isStaff, processQRScan);
router.get("/api/search", isStaff, searchPlayerByPhone);
router.get("/api/search-name", isStaff, searchPlayerByName);
router.get("/api/search-teams", isStaff, searchTeams);
router.get("/api/team/:teamId/members", isStaff, getTeamMembers);
router.get("/api/player/:playerId", isStaff, getPlayerDetails);
router.post("/api/log-goals", isStaff, logGoals);
router.post("/api/update-name", isStaff, updatePlayerName);
router.post("/api/fix-kicks", isStaff, fixKicksBalance);
router.post("/api/skip-queue", isStaff, skipQueue);

export default router;
