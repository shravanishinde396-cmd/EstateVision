import { aiService } from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export const predictPrice = async (req, res) => {
  try {
    const prediction = await aiService.predictPrice(req.body);
    return sendSuccess(res, 200, 'Price prediction computed', prediction);
  } catch (err) {
    return sendError(res, 500, 'AI Price prediction failed', err.response?.data || err.message);
  }
};

export const calculateROI = async (req, res) => {
  try {
    const roi = await aiService.calculateROI(req.body);
    return sendSuccess(res, 200, 'ROI calculation computed', roi);
  } catch (err) {
    return sendError(res, 500, 'AI ROI calculation failed', err.response?.data || err.message);
  }
};

export const analyzeArea = async (req, res) => {
  try {
    const { city, area } = req.query;
    const analysis = await aiService.analyzeArea(city, area);
    return sendSuccess(res, 200, 'Area analysis trend retrieved', analysis);
  } catch (err) {
    return sendError(res, 500, 'AI Area analysis failed', err.response?.data || err.message);
  }
};
