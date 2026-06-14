import { AuditLog } from '../models/AuditLog.model.js';
import { logger } from '../utils/logger.util.js';

export const logAudit = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;
      res.send(body);

      // Perform non-blocking logging
      try {
        const responseData = JSON.parse(body);
        const success = res.statusCode >= 200 && res.statusCode < 300;

        AuditLog.create({
          user: req.user ? req.user.id : null,
          action,
          entity,
          entityId: req.params.id || responseData.data?.id || responseData.data?._id || null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          success,
        }).catch((err) => logger.error('Audit logging failed:', err.message));
      } catch (err) {
        // Response body wasn't JSON or parsing failed, still log audit
        AuditLog.create({
          user: req.user ? req.user.id : null,
          action,
          entity,
          entityId: req.params.id || null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          success: res.statusCode >= 200 && res.statusCode < 300,
        }).catch((err) => logger.error('Audit logging failed:', err.message));
      }
    };

    next();
  };
};
