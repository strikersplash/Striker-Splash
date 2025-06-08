import express from 'express';
import { getHome, getAbout } from '../../controllers/public/publicController';

const router = express.Router();

// Home page
router.get('/', getHome);

// About page
router.get('/about', getAbout);

export default router;