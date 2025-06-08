import express from 'express';
import { getLogin, postLogin, logout, getRegister, postRegister } from '../../controllers/auth/loginController';

const router = express.Router();

// Login routes
router.get('/login', getLogin);
router.post('/login', postLogin);

// Registration routes
router.get('/register', getRegister);
router.post('/register', postRegister);

// Logout route
router.get('/logout', logout);

export default router;