// server/src/middleware/auth.middleware.js
import { verifyAccessToken } from '../utils/jwt.util.js';
import { sendError } from '../utils/response.util.js';
import { User } from '../models/User.model.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return sendError(res, 401, 'Authentication required');

    const decoded = verifyAccessToken(token);

    // Fetch fresh user data (handles deactivation between token issuances)
    const user = await User.findById(decoded.sub).select('-password');
    if (!user || !user.isActive) return sendError(res, 401, 'User not found or inactive');

    req.user = { id: user._id.toString(), role: user.role, email: user.email, fullName: user.fullName };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 401, 'Token expired');
    return sendError(res, 401, 'Invalid token');
  }
};

// ── ROLE MIDDLEWARE ───────────────────────────────────────
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, `Access denied. Required role: ${roles.join(' or ')}`);
    }
    next();
  };
};
