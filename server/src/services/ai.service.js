import axios from 'axios';
import config from '../config/env.js';

const aiClient = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: 10000,
});

export const aiService = {
  predictPrice: async (priceData) => {
    const { data } = await aiClient.post('/predict/price', priceData);
    return data;
  },

  calculateROI: async (roiData) => {
    const { data } = await aiClient.post('/calculate/roi', roiData);
    return data;
  },

  analyzeArea: async (city, area) => {
    const { data } = await aiClient.get('/analyze/area', { params: { city, area } });
    return data;
  },

  generateAdvice: async (adviceData) => {
    const { data } = await aiClient.post('/generate/advice', adviceData);
    return data;
  },
};
