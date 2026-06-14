import { MaintenanceTicket } from '../models/MaintenanceTicket.model.js';
import { Lease } from '../models/Lease.model.js';
import { Property } from '../models/Property.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';
import cloudinary from '../config/cloudinary.js';

// ── CREATE MAINTENANCE TICKET (Tenant) ────────────────────
export const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    // Find active lease for the tenant to identify property and owner
    const lease = await Lease.findOne({ tenant: req.user.id, status: 'ACTIVE' });
    if (!lease) {
      return sendError(res, 400, 'You must have an active lease to submit a maintenance ticket');
    }

    const ticket = await MaintenanceTicket.create({
      property: lease.property,
      tenant: req.user.id,
      owner: lease.owner,
      title,
      description,
      category,
      priority: priority || 'MEDIUM',
    });

    return sendSuccess(res, 201, 'Maintenance ticket submitted successfully', ticket);
  } catch (err) {
    return sendError(res, 500, 'Failed to submit maintenance ticket', err.message);
  }
};

// ── GET MAINTENANCE TICKETS (Tenant/Owner/Admin) ──────────
export const getTickets = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'TENANT') {
      query = { tenant: req.user.id };
    } else if (req.user.role === 'OWNER') {
      query = { owner: req.user.id };
    }

    const tickets = await MaintenanceTicket.find(query)
      .populate('property', 'title address city')
      .populate('tenant', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Maintenance tickets retrieved', tickets);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch tickets', err.message);
  }
};

// ── GET TICKET BY ID ──────────────────────────────────────
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await MaintenanceTicket.findById(id)
      .populate('property', 'title address city images')
      .populate('tenant', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email phone')
      .populate('comments.author', 'firstName lastName role avatar');

    if (!ticket) return sendError(res, 404, 'Ticket not found');

    // Auth validation
    if (
      ticket.tenant._id.toString() !== req.user.id &&
      ticket.owner._id.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return sendError(res, 403, 'Unauthorized access to this ticket');
    }

    return sendSuccess(res, 200, 'Ticket details retrieved', ticket);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch ticket details', err.message);
  }
};

// ── UPDATE TICKET STATUS (Owner/Admin) ────────────────────
export const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedCost, actualCost } = req.body;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    if (ticket.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to update status');
    }

    if (status) ticket.status = status;
    if (estimatedCost !== undefined) ticket.estimatedCost = estimatedCost;
    if (actualCost !== undefined) ticket.actualCost = actualCost;

    if (status === 'COMPLETED') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();

    return sendSuccess(res, 200, 'Ticket status updated', ticket);
  } catch (err) {
    return sendError(res, 500, 'Failed to update ticket', err.message);
  }
};

// ── ASSIGN TICKET (Owner/Admin) ───────────────────────────
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, scheduledAt } = req.body;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    if (ticket.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to assign technician');
    }

    ticket.assignedTo = assignedTo;
    if (scheduledAt) ticket.scheduledAt = scheduledAt;
    ticket.status = 'ASSIGNED';

    await ticket.save();

    return sendSuccess(res, 200, 'Technician assigned to ticket', ticket);
  } catch (err) {
    return sendError(res, 500, 'Failed to assign technician', err.message);
  }
};

// ── ADD COMMENT (All) ─────────────────────────────────────
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    // Auth validation
    if (
      ticket.tenant.toString() !== req.user.id &&
      ticket.owner.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return sendError(res, 403, 'Unauthorized comment posting');
    }

    const comment = {
      author: req.user.id,
      content,
      isInternal: req.user.role === 'TENANT' ? false : (isInternal || false),
    };

    ticket.comments.push(comment);
    await ticket.save();

    // Populate comments.author info for response
    const populated = await ticket.populate('comments.author', 'firstName lastName role avatar');
    const newComment = populated.comments[populated.comments.length - 1];

    return sendSuccess(res, 201, 'Comment added successfully', newComment);
  } catch (err) {
    return sendError(res, 500, 'Failed to add comment', err.message);
  }
};

// ── UPLOAD IMAGES (Tenant/Owner) ──────────────────────────
export const uploadTicketImages = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await MaintenanceTicket.findById(id);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    if (ticket.tenant.toString() !== req.user.id && ticket.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized image upload');
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'Please upload images');
    }

    const uploadedImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    ticket.images.push(...uploadedImages);
    await ticket.save();

    return sendSuccess(res, 200, 'Ticket images uploaded successfully', ticket.images);
  } catch (err) {
    return sendError(res, 500, 'Failed to upload ticket images', err.message);
  }
};
