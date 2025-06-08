import express from 'express';
import { isStaff } from '../../middleware/auth';
import { 
  getRefereeInterface,
  processQRScan,
  searchPlayerByPhone,
  logGoals,
  updatePlayerName
} from '../../controllers/referee/gameController';

const router = express.Router();

// Referee interface routes
router.get('/', isStaff, getRefereeInterface);

// API routes
router.post('/api/scan', isStaff, processQRScan);
router.get('/api/search', isStaff, searchPlayerByPhone);
router.post('/api/log-goals', isStaff, logGoals);
router.post('/api/update-name', isStaff, updatePlayerName);

export default router;