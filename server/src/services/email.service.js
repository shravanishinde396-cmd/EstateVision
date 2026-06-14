// server/src/services/email.service.js
import { Resend } from 'resend';
import { logger } from '../utils/logger.util.js';
import config from '../config/env.js';

const resend = new Resend(config.resend.apiKey);
const FROM   = config.resend.from;

const send = async (options) => {
  try {
    const result = await resend.emails.send(options);
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return result;
  } catch (err) {
    logger.error(`Email failed to ${options.to}:`, err.message);
    throw err;
  }
};

export const emailService = {

  sendVerificationEmail: ({ to, name, token }) => send({
    from: FROM, to,
    subject: 'Verify your EstateVision account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px">
        <h1 style="color:#6366f1">Welcome to EstateVision, ${name}! 🏠</h1>
        <p>Click below to verify your email address:</p>
        <a href="${config.clientUrl}/auth/verify-email/${token}"
           style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#666;font-size:14px">This link expires in 24 hours.</p>
      </div>
    `,
  }),

  sendPasswordResetEmail: ({ to, name, token }) => send({
    from: FROM, to,
    subject: 'Reset your EstateVision password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px">
        <h1 style="color:#6366f1">Password Reset Request</h1>
        <p>Hi ${name}, you requested to reset your password.</p>
        <a href="${config.clientUrl}/auth/reset-password/${token}"
           style="background:#ef4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#666;font-size:14px">This link expires in <strong>10 minutes</strong>. If you didn't request this, ignore this email.</p>
      </div>
    `,
  }),

  sendRentReceipt: ({ to, tenantName, propertyAddress, amount, lateFee, month, year, paymentId, paidAt }) => send({
    from: FROM, to,
    subject: `✅ Rent Receipt — ${new Date(year, month-1).toLocaleString('en-IN',{month:'long'})} ${year}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px;background:#f9fafb;border-radius:16px">
        <div style="background:#6366f1;padding:24px;border-radius:12px;color:#fff;text-align:center">
          <h1 style="margin:0">Payment Confirmed ✅</h1>
          <p style="font-size:32px;font-weight:700;margin:8px 0">₹${amount.toLocaleString('en-IN')}</p>
        </div>
        <div style="padding:24px;background:#fff;border-radius:12px;margin-top:16px">
          <p>Dear ${tenantName},</p>
          <table width="100%" cellspacing="0" style="border-collapse:collapse">
            <tr><td style="padding:8px;color:#666">Property</td><td style="padding:8px;font-weight:600">${propertyAddress}</td></tr>
            <tr><td style="padding:8px;color:#666">Rent Amount</td><td style="padding:8px">₹${(amount - lateFee).toLocaleString('en-IN')}</td></tr>
            ${lateFee > 0 ? `<tr><td style="padding:8px;color:#ef4444">Late Fee</td><td style="padding:8px;color:#ef4444">₹${lateFee.toLocaleString('en-IN')}</td></tr>` : ''}
            <tr><td style="padding:8px;color:#666">Period</td><td style="padding:8px">${new Date(year, month-1).toLocaleString('en-IN',{month:'long',year:'numeric'})}</td></tr>
            <tr><td style="padding:8px;color:#666">Paid On</td><td style="padding:8px">${new Date(paidAt).toLocaleString('en-IN')}</td></tr>
            <tr><td style="padding:8px;color:#666">Transaction ID</td><td style="padding:8px;font-family:monospace;font-size:12px">${paymentId}</td></tr>
          </table>
        </div>
        <p style="color:#666;font-size:13px;text-align:center;margin-top:16px">EstateVision · Intelligence-Driven Property Management</p>
      </div>
    `,
  }),

  sendRentDueReminder: ({ to, tenantName, amount, dueDate, propertyAddress, daysLeft }) => send({
    from: FROM, to,
    subject: `⏰ Rent Due in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px">
        <h2 style="color:#f59e0b">Rent Reminder 🔔</h2>
        <p>Dear ${tenantName},</p>
        <p>Your rent of <strong>₹${amount.toLocaleString('en-IN')}</strong> for <strong>${propertyAddress}</strong> is due on <strong>${new Date(dueDate).toLocaleDateString('en-IN')}</strong>.</p>
        ${daysLeft === 0 ? '<p style="color:#ef4444;font-weight:700">Your rent is due TODAY. Late fees apply from tomorrow.</p>' : ''}
        <a href="${config.clientUrl}/tenant/rent"
           style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
          Pay Now
        </a>
      </div>
    `,
  }),

  sendMaintenanceUpdate: ({ to, tenantName, ticketTitle, status, message, ticketId }) => send({
    from: FROM, to,
    subject: `🔧 Maintenance Update: ${ticketTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px">
        <h2>Maintenance Ticket Update</h2>
        <p>Dear ${tenantName},</p>
        <p>Your maintenance request "<strong>${ticketTitle}</strong>" has been updated.</p>
        <p style="background:#f3f4f6;padding:16px;border-radius:8px">
          <strong>Status:</strong> ${status}<br>
          ${message ? `<strong>Note:</strong> ${message}` : ''}
        </p>
        <a href="${config.clientUrl}/tenant/maintenance/${ticketId}"
           style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">
          View Ticket
        </a>
      </div>
    `,
  }),

  sendLeaseExpiryWarning: ({ to, tenantName, propertyAddress, expiryDate, daysLeft }) => send({
    from: FROM, to,
    subject: `⚠️ Lease Expiring in ${daysLeft} Days`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:40px">
        <h2 style="color:#ef4444">Lease Expiry Notice</h2>
        <p>Dear ${tenantName}, your lease for <strong>${propertyAddress}</strong> expires on <strong>${new Date(expiryDate).toLocaleDateString('en-IN')}</strong> (${daysLeft} days remaining).</p>
        <p>Please contact your owner to discuss renewal.</p>
      </div>
    `,
  }),
};
