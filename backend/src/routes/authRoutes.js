import express from 'express';
import { login, register, getCurrentUser, completeProfile, resetPassword } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/complete-profile', authenticateToken, completeProfile);

export default router;
