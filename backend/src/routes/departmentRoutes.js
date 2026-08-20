import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getDepartments);
router.post('/', requireRole(['admin']), createDepartment);

export default router;
