import express from 'express';
import { getLeaderboard } from '../../controllers/leaderboard/leaderboardController';

const router = express.Router();

// Display leaderboard
router.get('/', getLeaderboard);

export default router;