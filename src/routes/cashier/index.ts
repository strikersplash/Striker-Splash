import express from 'express';
import { isStaff } from '../../middleware/auth';
import { 
  getCashierInterface,
  searchPlayer,
  processQRScan,
  processKicksPurchase,
  processReQueue,
  processCreditTransfer
} from '../../controllers/cashier/transactionController';

const router = express.Router();

// Cashier interface routes
router.get('/', isStaff, getCashierInterface);

// API routes
router.get('/api/search', isStaff, searchPlayer);
router.post('/api/scan', isStaff, processQRScan);
router.post('/api/purchase', isStaff, processKicksPurchase);
router.post('/api/requeue', isStaff, processReQueue);
router.post('/api/transfer', isStaff, processCreditTransfer);

export default router;