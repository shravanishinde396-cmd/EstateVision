import { Notification } from '../models/Notification.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ── GET NOTIFICATIONS ─────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    return sendSuccess(res, 200, 'Notifications retrieved', notifications);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch notifications', err.message);
  }
};

// ── MARK NOTIFICATION AS READ ─────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return sendError(res, 404, 'Notification not found');
    return sendSuccess(res, 200, 'Notification marked as read', notification);
  } catch (err) {
    return sendError(res, 500, 'Failed to update notification', err.message);
  }
};

// ── MARK ALL AS READ ──────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    return sendSuccess(res, 200, 'All notifications marked as read');
  } catch (err) {
    return sendError(res, 500, 'Failed to update notifications', err.message);
  }
};

// ── DELETE NOTIFICATION ───────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Notification.findOneAndDelete({ _id: id, user: req.user.id });
    if (!result) return sendError(res, 404, 'Notification not found');

    return sendSuccess(res, 200, 'Notification deleted successfully');
  } catch (err) {
    return sendError(res, 500, 'Failed to delete notification', err.message);
  }
};
