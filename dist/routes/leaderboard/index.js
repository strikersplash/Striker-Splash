"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const leaderboardController_1 = require("../../controllers/leaderboard/leaderboardController");
const router = express.Router();
// Display leaderboard
router.get('/', leaderboardController_1.getLeaderboard);
exports.default = router;
