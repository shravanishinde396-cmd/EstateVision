import { User } from '../models/User.model.js';
import { Property } from '../models/Property.model.js';
import { AuditLog } from '../models/AuditLog.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ── GET USERS (Admin) ─────────────────────────────────────
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch users', err.message);
  }
};

// ── TOGGLE USER ACTIVE STATUS (Admin) ─────────────────────
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return sendError(res, 404, 'User not found');

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, 200, `User active status updated to ${user.isActive}`, user.toPublicJSON());
  } catch (err) {
    return sendError(res, 500, 'Failed to update user status', err.message);
  }
};

// ── UPDATE USER ROLE (Admin) ──────────────────────────────
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'OWNER', 'TENANT'].includes(role)) {
      return sendError(res, 400, 'Invalid user role');
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return sendError(res, 404, 'User not found');

    return sendSuccess(res, 200, `User role updated to ${role}`, user.toPublicJSON());
  } catch (err) {
    return sendError(res, 500, 'Failed to update user role', err.message);
  }
};

// ── GET AUDIT LOGS (Admin) ────────────────────────────────
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(100);
    return sendSuccess(res, 200, 'Audit logs retrieved', logs);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve audit logs', err.message);
  }
};

// ── GET PROPERTIES (Admin) ────────────────────────────────
export const getAdminProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All properties retrieved', properties);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve properties', err.message);
  }
};

// ── GET PENDING PROPERTIES (Admin) ────────────────────────
export const getAdminPendingProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: 'PENDING_APPROVAL' })
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Pending properties retrieved successfully', properties);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch pending properties', err.message);
  }
};

// ── APPROVE OR REJECT PROPERTY (Admin) ────────────────────
export const approveOrRejectProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'REJECTED'].includes(status)) {
      return sendError(res, 400, 'Invalid status update. Must be ACTIVE or REJECTED.');
    }

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    property.status = status === 'REJECTED' ? 'INACTIVE' : 'ACTIVE';
    property.approvedAt = new Date();
    property.approvedBy = req.user.id;
    await property.save();

    return sendSuccess(res, 200, `Property listing successfully marked as ${status}`, property);
  } catch (err) {
    return sendError(res, 500, 'Listing approval process failed', err.message);
  }
};

