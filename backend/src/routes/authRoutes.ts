import express from 'express';
import { signup, login, logout, getMe, updateProfile, requestPasswordReset, resetPassword } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// Public endpoints
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected endpoints
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);
router.put('/profile', authenticateToken, updateProfile);

export default router;
