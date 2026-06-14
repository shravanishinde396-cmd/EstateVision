import { TenantProfile } from '../models/TenantProfile.model.js';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ── GET TENANTS (Admin/Owner) ─────────────────────────────
export const getTenants = async (req, res) => {
  try {
    const tenants = await TenantProfile.find()
      .populate('user', 'firstName lastName email phone avatar')
      .lean();
    return sendSuccess(res, 200, 'Tenants retrieved successfully', tenants);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve tenants', err.message);
  }
};

// ── GET TENANT BY ID (Admin/Owner) ────────────────────────
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await TenantProfile.findById(id)
      .populate('user', 'firstName lastName email phone avatar')
      .lean();

    if (!tenant) return sendError(res, 404, 'Tenant profile not found');
    return sendSuccess(res, 200, 'Tenant profile retrieved', tenant);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve tenant profile', err.message);
  }
};

// ── VERIFY TENANT (Admin) ─────────────────────────────────
export const verifyTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const tenant = await TenantProfile.findById(id);
    if (!tenant) return sendError(res, 404, 'Tenant profile not found');

    tenant.isVerified = isVerified;
    await tenant.save();

    return sendSuccess(res, 200, `Tenant verification status updated to ${isVerified}`, tenant);
  } catch (err) {
    return sendError(res, 500, 'Verification update failed', err.message);
  }
};

// ── GET PROFILE ME (Tenant) ───────────────────────────────
export const getTenantProfileMe = async (req, res) => {
  try {
    let tenant = await TenantProfile.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone avatar');

    if (!tenant) {
      // Auto-create tenant profile if none exists
      tenant = await TenantProfile.create({ user: req.user.id });
      tenant = await tenant.populate('user', 'firstName lastName email phone avatar');
    }

    return sendSuccess(res, 200, 'Tenant profile retrieved', tenant);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve profile', err.message);
  }
};

// ── UPDATE PROFILE ME (Tenant) ────────────────────────────
export const updateTenantProfileMe = async (req, res) => {
  try {
    const { permanentAddress, emergencyContact, occupation, organization, monthlyIncome } = req.body;

    let tenant = await TenantProfile.findOne({ user: req.user.id });
    if (!tenant) {
      tenant = new TenantProfile({ user: req.user.id });
    }

    if (permanentAddress) tenant.permanentAddress = permanentAddress;
    if (emergencyContact) tenant.emergencyContact = emergencyContact;
    if (occupation) tenant.occupation = occupation;
    if (organization) tenant.organization = organization;
    if (monthlyIncome) tenant.monthlyIncome = monthlyIncome;

    await tenant.save();

    return sendSuccess(res, 200, 'Profile updated successfully', tenant);
  } catch (err) {
    return sendError(res, 500, 'Profile update failed', err.message);
  }
};

// ── UPLOAD DOCUMENT (Tenant) ──────────────────────────────
export const uploadDocument = async (req, res) => {
  try {
    const { name, documentType } = req.body;

    if (!req.file) {
      return sendError(res, 400, 'Document file is required');
    }

    let tenant = await TenantProfile.findOne({ user: req.user.id });
    if (!tenant) {
      tenant = await TenantProfile.create({ user: req.user.id });
    }

    const docObj = {
      name: name || req.file.originalname,
      url: req.file.path,
      documentType: documentType || 'PASSPORT',
      isVerified: false,
    };

    tenant.documents.push(docObj);
    await tenant.save();

    return sendSuccess(res, 201, 'Document uploaded successfully', tenant);
  } catch (err) {
    return sendError(res, 500, 'Document upload failed', err.message);
  }
};

// ── GET DOCUMENTS (Tenant/Owner/Admin) ─────────────────────
export const getDocuments = async (req, res) => {
  try {
    if (req.user.role === 'TENANT') {
      const tenant = await TenantProfile.findOne({ user: req.user.id }).select('documents');
      return sendSuccess(res, 200, 'Documents retrieved', tenant ? tenant.documents : []);
    }

    const { tenantId } = req.query;
    if (!tenantId) {
      return sendError(res, 400, 'Tenant ID query parameter is required for Admin/Owner');
    }

    const tenant = await TenantProfile.findOne({ user: tenantId }).select('documents');
    if (!tenant) return sendError(res, 404, 'Tenant not found');

    return sendSuccess(res, 200, 'Documents retrieved', tenant.documents);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve documents', err.message);
  }
};
