import express from 'express';
import {
  createLease,
  getLeases,
  getLeaseById,
  updateLease,
  renewLease,
  terminateLease,
  getCurrentTenantLease,
  getTenantLeaseHistory,
} from '../controllers/leases.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { leaseSchema } from '../validators/lease.validator.js';
import { logAudit } from '../middleware/auditLog.middleware.js';

const router = express.Router();

router.use(protect);

// Tenant portal routes
router.get('/tenant/current', restrictTo('TENANT'), getCurrentTenantLease);
router.get('/tenant/history', restrictTo('TENANT'), getTenantLeaseHistory);

// Owner/Admin operations
router.post('/', restrictTo('OWNER'), validateBody(leaseSchema), logAudit('CREATE_LEASE', 'Lease'), createLease);
router.get('/', restrictTo('ADMIN', 'OWNER'), getLeases);
router.get('/:id', getLeaseById);

router.patch('/:id', restrictTo('OWNER'), logAudit('UPDATE_LEASE', 'Lease'), updateLease);
router.post('/:id/renew', restrictTo('OWNER'), logAudit('RENEW_LEASE', 'Lease'), renewLease);
router.post('/:id/terminate', restrictTo('OWNER', 'ADMIN'), logAudit('TERMINATE_LEASE', 'Lease'), terminateLease);

export default router;
