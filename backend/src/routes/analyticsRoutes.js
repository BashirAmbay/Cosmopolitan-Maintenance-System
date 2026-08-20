import express from 'express';
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', requireRole(['admin', 'management', 'technician']), getDashboardAnalytics);

export default router;
