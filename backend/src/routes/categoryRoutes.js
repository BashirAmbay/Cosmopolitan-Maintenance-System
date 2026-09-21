import express from 'express';
import { getCategories, createCategory } from '../controllers/categoryController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);
router.post('/', authenticateToken, requireRole(['admin']), createCategory);

export default router;
