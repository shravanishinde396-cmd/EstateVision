import express from 'express';
import {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  updateProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';
import { upload } from '../middleware/upload.middleware.js';
import { sendSuccess } from '../utils/response.util.js';

const router = express.Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshAccessToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.patch('/reset-password/:token', validateBody(resetPasswordSchema), resetPassword);

router.get('/me', protect, getMe);
router.patch('/update-profile', protect, updateProfile);

router.post('/avatar', protect, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an avatar image' });
  }
  return sendSuccess(res, 200, 'Avatar updated successfully', { url: req.file.path });
});

export default router;
