import { emailQueue } from './queue.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.util.js';

emailQueue.process('sendVerification', async (job) => {
  const { to, name, token } = job.data;
  return emailService.sendVerificationEmail({ to, name, token });
});

emailQueue.process('sendPasswordReset', async (job) => {
  const { to, name, token } = job.data;
  return emailService.sendPasswordResetEmail({ to, name, token });
});

emailQueue.process('sendRentReceipt', async (job) => {
  const { to, tenantName, propertyAddress, amount, lateFee, month, year, paymentId, paidAt } = job.data;
  return emailService.sendRentReceipt({ to, tenantName, propertyAddress, amount, lateFee, month, year, paymentId, paidAt });
});

logger.info('📩 Email Bull Worker processes started listening');
