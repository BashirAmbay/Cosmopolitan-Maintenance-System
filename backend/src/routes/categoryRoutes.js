import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getCategories);
router.post('/', requireRole(['admin']), createCategory);

export default router;
