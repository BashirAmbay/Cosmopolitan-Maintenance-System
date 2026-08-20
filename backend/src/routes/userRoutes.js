import express from 'express';
import { getUsers, getTechnicians, createUser, updateUserStatus } from '../controllers/userController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole(['admin', 'management', 'technician']), getUsers);
router.get('/technicians', getTechnicians);
router.post('/', requireRole(['admin']), createUser);
router.patch('/:id', requireRole(['admin']), updateUserStatus);

export default router;
