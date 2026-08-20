import express from 'express';
import { getNotifications, markAsRead, getAuditLogs } from '../controllers/notificationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.get('/audit-logs', requireRole(['admin']), getAuditLogs);

export default router;
