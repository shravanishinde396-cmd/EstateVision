// server/src/controllers/auth.controller.js
import crypto from 'crypto';
import { User } from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import { emailService } from '../services/email.service.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { logger } from '../utils/logger.util.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── REGISTER ──────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Prevent self-assigning ADMIN
    const safeRole = role === 'ADMIN' ? 'TENANT' : (role || 'TENANT');

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, 'Email already registered');
    }

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      role: safeRole,
      emailVerifyToken,
    });

    // Send verification email (non-blocking)
    emailService.sendVerificationEmail({
      to: user.email,
      name: user.firstName,
      token: emailVerifyToken,
    }).catch(err => logger.error('Verification email failed:', err));

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token hash in DB
    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.lastLoginAt  = new Date();
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, 201, 'Registration successful', {
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return sendError(res, 500, 'Registration failed', err.message);
  }
};

// ── LOGIN ─────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) return sendError(res, 401, 'Invalid email or password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 401, 'Invalid email or password');

    if (!user.isActive) return sendError(res, 403, 'Account suspended. Contact support.');

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.lastLoginAt  = new Date();
    await user.save({ validateBeforeSave: false });

    // Audit log
    await AuditLog.create({
      user: user._id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Login successful', {
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    return sendError(res, 500, 'Login failed', err.message);
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return sendError(res, 401, 'No refresh token');

    const decoded = verifyRefreshToken(token);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      _id: decoded.sub,
      refreshToken: hashedToken,
      isActive: true,
    });

    if (!user) return sendError(res, 401, 'Invalid refresh token');

    const newAccessToken  = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return sendSuccess(res, 200, 'Token refreshed', { accessToken: newAccessToken });
  } catch (err) {
    res.clearCookie('refreshToken');
    return sendError(res, 401, 'Refresh token expired. Please log in again.');
  }
};

// ── LOGOUT ────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null }, { validateBeforeSave: false });
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (err) {
    return sendError(res, 500, 'Logout failed');
  }
};

// ── FORGOT PASSWORD ───────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.firstName,
      token: resetToken,
    });

    return sendSuccess(res, 200, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    return sendError(res, 500, 'Failed to send reset email');
  }
};

// ── RESET PASSWORD ────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) return sendError(res, 400, 'Token is invalid or has expired');

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return sendSuccess(res, 200, 'Password reset successful');
  } catch (err) {
    return sendError(res, 500, 'Password reset failed', err.message);
  }
};

// ── VERIFY EMAIL ──────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ emailVerifyToken: token });
    if (!user) return sendError(res, 400, 'Invalid or expired email verification token');

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, 'Email verified successfully');
  } catch (err) {
    return sendError(res, 500, 'Email verification failed', err.message);
  }
};

// ── GET ME ────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'User profile retrieved', user.toPublicJSON());
  } catch (err) {
    return sendError(res, 500, 'Failed to get profile');
  }
};

// ── UPDATE PROFILE ────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 404, 'User not found');

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;

    await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', user.toPublicJSON());
  } catch (err) {
    return sendError(res, 500, 'Failed to update profile', err.message);
  }
};
