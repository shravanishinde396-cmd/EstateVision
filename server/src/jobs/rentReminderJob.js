// server/src/jobs/rentReminderJob.js
import cron      from 'node-cron';
import { Lease } from '../models/Lease.model.js';
import { User }  from '../models/User.model.js';
import { Notification } from '../models/Notification.model.js';
import { emailService } from '../services/email.service.js';
import { logger }        from '../utils/logger.util.js';

/**
 * Rent Reminder Cron Job
 * Runs daily at 9 AM IST
 * Sends reminders: 7 days before, 3 days before, on due date
 */
export const initRentReminderJob = () => {
  cron.schedule('0 3 * * *', async () => { // 9 AM IST = 3:30 AM UTC
    logger.info('Running rent reminder job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reminderDays = [7, 3, 0]; // Days before due

      for (const daysAhead of reminderDays) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysAhead);

        const leases = await Lease.find({
          status: 'ACTIVE',
          nextDueDate: {
            $gte: targetDate,
            $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          },
        }).populate('tenant', 'email firstName').populate('property', 'address');

        for (const lease of leases) {
          // Create in-app notification
          await Notification.create({
            user:      lease.tenant._id,
            type:      daysAhead === 0 ? 'RENT_DUE' : 'RENT_DUE',
            title:     daysAhead === 0 ? 'Rent Due Today!' : `Rent Due in ${daysAhead} Days`,
            message:   `₹${lease.monthlyRent.toLocaleString('en-IN')} due for ${lease.property.address}`,
            actionUrl: '/tenant/rent',
          });

          // Send email
          await emailService.sendRentDueReminder({
            to:              lease.tenant.email,
            tenantName:      lease.tenant.firstName,
            amount:          lease.monthlyRent,
            dueDate:         lease.nextDueDate,
            propertyAddress: lease.property.address,
            daysLeft:        daysAhead,
          });

          logger.info(`Rent reminder sent to ${lease.tenant.email} (${daysAhead} days)`);
        }
      }
    } catch (err) {
      logger.error('Rent reminder job failed:', err);
    }
  });

  logger.info('✅ Rent reminder cron job initialized');
};
