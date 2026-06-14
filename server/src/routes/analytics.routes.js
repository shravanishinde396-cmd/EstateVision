import express from 'express';
import {
  getAdminOverview,
  getOwnerOverview,
  getOwnerRevenueTrend,
  getOwnerOccupancy,
  getAreaTrends,
  getCityAnalytics,
} from '../controllers/analytics.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/admin/overview', restrictTo('ADMIN'), getAdminOverview);
router.get('/owner/overview', restrictTo('OWNER'), getOwnerOverview);
router.get('/owner/revenue', restrictTo('OWNER'), getOwnerRevenueTrend);
router.get('/owner/occupancy', restrictTo('OWNER'), getOwnerOccupancy);
router.get('/area-trends', getAreaTrends);
router.get('/city/:city', getCityAnalytics);

export default router;
