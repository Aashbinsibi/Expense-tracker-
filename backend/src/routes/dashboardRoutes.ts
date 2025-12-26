import express from 'express';
import {
    getCurrentMonthSummary,
    getMonthlyTrend,
    getCategoryBreakdown,
} from '../controllers/dashboardController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard summary
router.get('/summary', getCurrentMonthSummary);

// Monthly trend (last N months)
router.get('/trend', getMonthlyTrend);

// Category breakdown
router.get('/breakdown', getCategoryBreakdown);

export default router;
