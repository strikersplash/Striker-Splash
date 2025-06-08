import express from 'express';
import { isStaff } from '../../middleware/auth';
import { getInterface } from '../../controllers/staff/interfaceController';
import { 
  processQRScan, 
  logGoals, 
  updatePlayerName, 
  searchPlayerByName,
  skipCurrentQueue
} from '../../controllers/staff/scanController';
import { getNameChangeInterface, postNameChange } from '../../controllers/staff/nameController';

const router = express.Router();

// Staff interface routes
router.get('/interface', isStaff, getInterface);

// Name change routes
router.get('/name-change', isStaff, getNameChangeInterface);
router.post('/name-change', isStaff, postNameChange);

// API routes
router.post('/scan', isStaff, processQRScan);
router.get('/search-by-name', isStaff, searchPlayerByName);
router.post('/log-goal', isStaff, logGoals);
router.post('/update-name', isStaff, updatePlayerName);
router.post('/skip-queue', isStaff, skipCurrentQueue);

export default router;