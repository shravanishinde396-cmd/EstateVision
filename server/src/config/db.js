import mongoose from 'mongoose';
import config from './env.js';
import { logger } from '../utils/logger.util.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`Database connection failed (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, err.message);
    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying connection in ${RETRY_INTERVAL_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectDB(retryCount + 1);
    } else {
      logger.error('Max database connection retries exceeded. Exiting...');
      throw err;
    }
  }
};
