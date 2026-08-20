import express from 'express';
import { 
  createRequest, getRequests, getRequestById, assignTechnician, 
  updateStatus, addComment, rateResolution 
} from '../controllers/requestController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', upload.single('attachment'), createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/:id/assign', requireRole(['admin', 'management', 'technician']), assignTechnician);
router.patch('/:id/status', upload.single('evidence'), updateStatus);
router.post('/:id/comments', addComment);
router.post('/:id/rate', rateResolution);

export default router;
