import express from 'express';
import {
  predictPrice,
  calculateROI,
  analyzeArea,
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/predict-price', predictPrice);
router.post('/roi-calculate', calculateROI);
router.get('/area-analysis', analyzeArea);

export default router;
