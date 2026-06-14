// server/src/models/AuditLog.model.js
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action:    { type: String, required: true }, // CREATE_PROPERTY, DELETE_LEASE, etc.
    entity:    { type: String, required: true }, // Model name
    entityId:  { type: String },
    oldValue:  { type: mongoose.Schema.Types.Mixed },
    newValue:  { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    success:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// TTL: auto-delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
