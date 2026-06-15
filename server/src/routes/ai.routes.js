import express from 'express';
import {
  predictPrice,
  calculateROI,
  analyzeArea,
  generateAdvice,
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/predict-price', predictPrice);
router.post('/roi-calculate', calculateROI);
router.get('/area-analysis', analyzeArea);
router.post('/generate-advice', generateAdvice);

export default router;
