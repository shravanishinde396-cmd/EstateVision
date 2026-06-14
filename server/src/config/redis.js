import Redis from 'ioredis';
import config from './env.js';
import { logger } from '../utils/logger.util.js';

export let redisClient;

if (config.env === 'development') {
  logger.info('Local Redis mock initialized (development mode)');
  redisClient = {
    call: async () => {},
    on: () => {},
  };
} else {
  redisClient = new Redis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });

  redisClient.on('connect', () => {
    logger.info('Upstash/Local Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err);
  });
}
