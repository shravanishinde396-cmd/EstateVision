// server/src/models/Notification.model.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'RENT_DUE', 'RENT_RECEIVED', 'RENT_OVERDUE',
        'LEASE_EXPIRING', 'LEASE_EXPIRED',
        'MAINTENANCE_NEW', 'MAINTENANCE_UPDATE',
        'PROPERTY_APPROVED', 'PROPERTY_REJECTED',
        'NEW_TENANT', 'TENANT_LEFT',
        'PAYMENT_FAILED', 'DOCUMENT_UPLOADED', 'GENERAL',
      ],
      required: true,
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    isRead:    { type: Boolean, default: false },
    actionUrl: { type: String },
    metadata:  { type: mongoose.Schema.Types.Mixed }, // Extra data
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
