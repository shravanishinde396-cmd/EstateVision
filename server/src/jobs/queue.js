import Queue from 'bull';
import config from '../config/env.js';
import { logger } from '../utils/logger.util.js';

class MockQueue {
  constructor(name) {
    this.name = name;
    this.handlers = new Map();
  }

  process(name, handler) {
    this.handlers.set(name, handler);
  }

  async add(name, data) {
    const handler = this.handlers.get(name);
    if (handler) {
      setImmediate(() => {
        handler({ data })
          .then(() => logger.info(`[MockQueue] Job ${name} processed successfully`))
          .catch(err => logger.error(`[MockQueue] Job ${name} failed: ${err.message}`));
      });
    }
  }

  on(event, callback) {
    // No-op for events in mock
  }
}

export const emailQueue = config.env === 'development'
  ? new MockQueue('emailQueue')
  : new Queue('emailQueue', config.redisUrl);

if (config.env !== 'development') {
  emailQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
  });

  emailQueue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });
}
