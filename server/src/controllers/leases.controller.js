import { Lease } from '../models/Lease.model.js';
import { Property } from '../models/Property.model.js';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ── CREATE LEASE (Owner) ──────────────────────────────────
export const createLease = async (req, res) => {
  try {
    const { property: propertyId, tenant: tenantId, startDate, endDate, monthlyRent, securityDeposit, terms, rentDueDay } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return sendError(res, 404, 'Property not found');

    if (property.owner.toString() !== req.user.id) {
      return sendError(res, 403, 'You do not own this property');
    }

    const tenant = await User.findById(tenantId);
    if (!tenant || tenant.role !== 'TENANT') {
      return sendError(res, 400, 'Invalid tenant ID');
    }

    // Check if property is already rented
    const activeLease = await Lease.findOne({ property: propertyId, status: 'ACTIVE' });
    if (activeLease) {
      return sendError(res, 400, 'This property already has an active lease');
    }

    // Set next due date as start date (or due day relative to start date)
    const nextDueDate = new Date(startDate);
    nextDueDate.setDate(rentDueDay || 5);
    // If nextDueDate is before startDate, push to next month
    if (nextDueDate < new Date(startDate)) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const lease = await Lease.create({
      property: propertyId,
      tenant: tenantId,
      owner: req.user.id,
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      terms,
      rentDueDay: rentDueDay || 5,
      nextDueDate,
      status: 'ACTIVE', // Automatically make active on creation
    });

    // Update property status to RENTED
    property.status = 'RENTED';
    await property.save();

    return sendSuccess(res, 201, 'Lease created successfully', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to create lease', err.message);
  }
};

// ── GET ALL LEASES (Admin/Owner) ──────────────────────────
export const getLeases = async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN' ? {} : { owner: req.user.id };
    const leases = await Lease.find(query)
      .populate('property', 'title address city')
      .populate('tenant', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Leases retrieved successfully', leases);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve leases', err.message);
  }
};

// ── GET LEASE BY ID (Tenant/Owner/Admin) ──────────────────
export const getLeaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const lease = await Lease.findById(id)
      .populate('property', 'title address city rentAmount images')
      .populate('tenant', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email phone');

    if (!lease) return sendError(res, 404, 'Lease not found');

    // Auth validation
    if (
      lease.tenant._id.toString() !== req.user.id &&
      lease.owner._id.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return sendError(res, 403, 'Unauthorized access to this lease');
    }

    return sendSuccess(res, 200, 'Lease details retrieved', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve lease details', err.message);
  }
};

// ── UPDATE LEASE (Owner) ──────────────────────────────────
export const updateLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { terms, rentDueDay, monthlyRent } = req.body;

    const lease = await Lease.findById(id);
    if (!lease) return sendError(res, 404, 'Lease not found');

    if (lease.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to edit this lease');
    }

    if (terms) lease.terms = terms;
    if (rentDueDay) lease.rentDueDay = rentDueDay;
    if (monthlyRent) lease.monthlyRent = monthlyRent;

    await lease.save();

    return sendSuccess(res, 200, 'Lease updated successfully', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to update lease', err.message);
  }
};

// ── RENEW LEASE (Owner) ───────────────────────────────────
export const renewLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, newRent } = req.body;

    const lease = await Lease.findById(id);
    if (!lease) return sendError(res, 404, 'Lease not found');

    if (lease.owner.toString() !== req.user.id) {
      return sendError(res, 403, 'Unauthorized to renew this lease');
    }

    // Push current end date and rent to renewal history
    lease.renewalHistory.push({
      renewedAt: new Date(),
      oldEndDate: lease.endDate,
      newEndDate,
      newRent: newRent || lease.monthlyRent,
    });

    lease.endDate = newEndDate;
    if (newRent) lease.monthlyRent = newRent;
    lease.renewalCount += 1;
    lease.status = 'ACTIVE';

    await lease.save();

    return sendSuccess(res, 200, 'Lease renewed successfully', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to renew lease', err.message);
  }
};

// ── TERMINATE LEASE (Owner/Admin) ─────────────────────────
export const terminateLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { terminationReason } = req.body;

    const lease = await Lease.findById(id);
    if (!lease) return sendError(res, 404, 'Lease not found');

    if (lease.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to terminate this lease');
    }

    lease.status = 'TERMINATED';
    lease.terminatedAt = new Date();
    lease.terminationReason = terminationReason || 'Terminated by owner';
    await lease.save();

    // Mark property status back to ACTIVE
    await Property.findByIdAndUpdate(lease.property, { status: 'ACTIVE' });

    return sendSuccess(res, 200, 'Lease terminated successfully', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to terminate lease', err.message);
  }
};

// ── GET CURRENT LEASE (Tenant) ────────────────────────────
export const getCurrentTenantLease = async (req, res) => {
  try {
    const lease = await Lease.findOne({ tenant: req.user.id, status: 'ACTIVE' })
      .populate('property', 'title address city images rentAmount depositAmount')
      .populate('owner', 'firstName lastName email phone');

    if (!lease) return sendSuccess(res, 200, 'No active lease found', null);
    return sendSuccess(res, 200, 'Active lease retrieved', lease);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch current lease', err.message);
  }
};

// ── GET LEASE HISTORY (Tenant) ────────────────────────────
export const getTenantLeaseHistory = async (req, res) => {
  try {
    const leases = await Lease.find({ tenant: req.user.id })
      .populate('property', 'title address city')
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Lease history retrieved', leases);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch lease history', err.message);
  }
};
