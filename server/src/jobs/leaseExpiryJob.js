import cron from 'node-cron';
import { Lease } from '../models/Lease.model.js';
import { Notification } from '../models/Notification.model.js';
import { emailService } from '../services/email.service.js';
import { logger } from '../utils/logger.util.js';

export const initLeaseExpiryJob = () => {
  cron.schedule('30 3 * * *', async () => { // 9:30 AM IST = 3:30 AM UTC (or similar)
    logger.info('Running lease expiry job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const warningDays = [30, 15, 7];

      for (const daysAhead of warningDays) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysAhead);

        const leases = await Lease.find({
          status: 'ACTIVE',
          endDate: {
            $gte: targetDate,
            $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        }).populate('tenant', 'email firstName').populate('property', 'address');

        for (const lease of leases) {
          // Create in-app notification
          await Notification.create({
            user: lease.tenant._id,
            type: 'LEASE_EXPIRING',
            title: 'Lease Expiring Soon',
            message: `Your lease for ${lease.property.address} expires in ${daysAhead} days.`,
            actionUrl: '/tenant/documents',
          });

          // Send email
          await emailService.sendLeaseExpiryWarning({
            to: lease.tenant.email,
            tenantName: lease.tenant.firstName,
            propertyAddress: lease.property.address,
            expiryDate: lease.endDate,
            daysLeft: daysAhead,
          });

          logger.info(`Lease expiry reminder sent to ${lease.tenant.email} (${daysAhead} days)`);
        }
      }
    } catch (err) {
      logger.error('Lease expiry job failed:', err);
    }
  });

  logger.info('✅ Lease expiry warnings cron job initialized');
};
