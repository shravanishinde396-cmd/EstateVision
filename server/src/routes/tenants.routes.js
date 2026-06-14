import express from 'express';
import {
  getTenants,
  getTenantById,
  verifyTenant,
  getTenantProfileMe,
  updateTenantProfileMe,
  uploadDocument,
  getDocuments,
} from '../controllers/tenants.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { logAudit } from '../middleware/auditLog.middleware.js';

const router = express.Router();

// Owner / Admin access
router.get('/', protect, restrictTo('ADMIN', 'OWNER'), getTenants);
router.get('/documents', protect, restrictTo('TENANT', 'ADMIN', 'OWNER'), getDocuments);
router.get('/:id', protect, restrictTo('ADMIN', 'OWNER'), getTenantById);
router.patch('/:id/verify', protect, restrictTo('ADMIN'), logAudit('VERIFY_TENANT', 'TenantProfile'), verifyTenant);

// Tenant portal profile access
router.get('/profile/me', protect, restrictTo('TENANT'), getTenantProfileMe);
router.patch('/profile/me', protect, restrictTo('TENANT'), updateTenantProfileMe);
router.post('/documents', protect, restrictTo('TENANT'), upload.single('doc'), uploadDocument);

export default router;
