import express from 'express';
import { getLocations, createLocation } from '../controllers/locationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getLocations);
router.post('/', authenticateToken, requireRole(['admin']), createLocation);

export default router;
