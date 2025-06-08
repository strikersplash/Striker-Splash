import express from 'express';
import { isAuthenticated } from '../../middleware/auth';
import { getDashboard, getEditProfile, updateProfile, downloadQR } from '../../controllers/player/playerController';

const router = express.Router();

// Player routes
router.get('/dashboard', isAuthenticated, getDashboard);
router.get('/edit-profile', isAuthenticated, getEditProfile);
router.post('/update-profile', isAuthenticated, updateProfile);
router.get('/download-qr', isAuthenticated, downloadQR);

export default router;