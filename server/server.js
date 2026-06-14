// server/server.js
import http   from 'http';
import { Server } from 'socket.io';
import app    from './src/app.js';
import { initSocket } from './src/socket/socketHandler.js';
import { connectDB }  from './src/config/db.js';
import { logger }     from './src/utils/logger.util.js';
import { initRentReminderJob } from './src/jobs/rentReminderJob.js';
import { initLeaseExpiryJob } from './src/jobs/leaseExpiryJob.js';
import config from './src/config/env.js';

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

initSocket(io);

// Initialize daily background jobs in production
if (config.env === 'production') {
  initRentReminderJob();
  initLeaseExpiryJob();
} else {
  logger.info('Background cron jobs skipped (not in production mode)');
}

const PORT = config.port || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`🚀 EstateVision API running on port ${PORT}`);
    logger.info(`🔌 Socket.IO ready`);
  });
}).catch((err) => {
  logger.error('Database connection failed:', err);
  process.exit(1);
});
