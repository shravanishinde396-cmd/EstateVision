import express from 'express';
import {
  getAdminUsers,
  toggleUserStatus,
  updateUserRole,
  getAuditLogs,
  getAdminProperties,
  getAdminPendingProperties,
  approveOrRejectProperty,
} from '../controllers/admin.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/users', getAdminUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.get('/audit-logs', getAuditLogs);
router.get('/properties', getAdminProperties);
router.get('/properties/pending', getAdminPendingProperties);
router.patch('/properties/:id/approve', approveOrRejectProperty);


export default router;
