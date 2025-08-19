"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardController_1 = require("../../controllers/leaderboard/leaderboardController");
const router = express_1.default.Router();
// Display leaderboard
router.get('/', leaderboardController_1.getLeaderboard);
exports.default = router;
