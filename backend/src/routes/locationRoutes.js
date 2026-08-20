import express from 'express';
import { getLocations, createLocation } from '../controllers/locationController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getLocations);
router.post('/', requireRole(['admin']), createLocation);

export default router;
