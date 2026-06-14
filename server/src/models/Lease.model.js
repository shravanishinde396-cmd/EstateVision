// server/src/models/Lease.model.js
import mongoose from 'mongoose';

const leaseSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    monthlyRent:     { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED'],
      default: 'PENDING',
    },
    terms:       { type: String },
    documentUrl: { type: String }, // Signed lease PDF

    // Payment tracking
    rentDueDay:      { type: Number, default: 5, min: 1, max: 28 },
    lastRentPaidAt:  { type: Date },
    nextDueDate:     { type: Date },
    renewalCount:    { type: Number, default: 0 },
    renewalHistory: [
      {
        renewedAt:  Date,
        oldEndDate: Date,
        newEndDate: Date,
        newRent:    Number,
      },
    ],

    terminatedAt:     { type: Date },
    terminationReason:{ type: String },
  },
  { timestamps: true }
);

leaseSchema.index({ property: 1, status: 1 });
leaseSchema.index({ tenant: 1, status: 1 });
leaseSchema.index({ owner: 1 });
leaseSchema.index({ nextDueDate: 1 }); // For rent reminder cron

// Virtual: days until expiry
leaseSchema.virtual('daysUntilExpiry').get(function () {
  return Math.ceil((this.endDate - Date.now()) / (1000 * 60 * 60 * 24));
});

export const Lease = mongoose.model('Lease', leaseSchema);
