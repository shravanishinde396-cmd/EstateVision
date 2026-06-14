import express from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addComment,
  uploadTicketImages,
} from '../controllers/maintenance.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { logAudit } from '../middleware/auditLog.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('TENANT'), logAudit('SUBMIT_MAINTENANCE', 'MaintenanceTicket'), createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);

router.patch('/:id/status', restrictTo('OWNER', 'ADMIN'), logAudit('STATUS_MAINTENANCE', 'MaintenanceTicket'), updateTicketStatus);
router.patch('/:id/assign', restrictTo('OWNER', 'ADMIN'), logAudit('ASSIGN_MAINTENANCE', 'MaintenanceTicket'), assignTicket);

router.post('/:id/comments', addComment);
router.post('/:id/images', upload.array('images', 5), uploadTicketImages);

export default router;
