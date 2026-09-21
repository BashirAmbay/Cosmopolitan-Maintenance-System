import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getDepartments);
router.post('/', authenticateToken, requireRole(['admin']), createDepartment);

export default router;
