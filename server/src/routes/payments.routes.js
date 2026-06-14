import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  getReceipt,
  getRevenueAnalytics,
} from '../controllers/payments.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator.js';

const router = express.Router();

// Webhook endpoint does NOT use protect because it is called directly by Razorpay with raw body signature check
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.use(protect);

router.post('/create-order', restrictTo('TENANT'), validateBody(createOrderSchema), createOrder);
router.post('/verify', restrictTo('TENANT'), validateBody(verifyPaymentSchema), verifyPayment);

router.get('/history', getPaymentHistory);
router.get('/:id/receipt', getReceipt);
router.get('/analytics/revenue', restrictTo('OWNER', 'ADMIN'), getRevenueAnalytics);

export default router;
