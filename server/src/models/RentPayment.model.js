// server/src/models/RentPayment.model.js
import mongoose from 'mongoose';

const rentPaymentSchema = new mongoose.Schema(
  {
    lease:  { type: mongoose.Schema.Types.ObjectId, ref: 'Lease',    required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    property:{ type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },

    amount:      { type: Number, required: true },
    lateFee:     { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_PAID'],
      default: 'PENDING',
    },

    // Razorpay fields
    razorpayOrderId:   { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String, select: false },

    // Period
    forMonth: { type: Number, required: true, min: 1, max: 12 },
    forYear:  { type: Number, required: true },
    dueDate:  { type: Date, required: true },
    paidAt:   { type: Date },

    paymentMethod: { type: String }, // upi, card, netbanking
    receiptUrl:    { type: String },
    notes:         { type: String },
    failureReason: { type: String },
  },
  { timestamps: true }
);

rentPaymentSchema.index({ lease: 1, forMonth: 1, forYear: 1 }, { unique: true });
rentPaymentSchema.index({ tenant: 1, status: 1 });
rentPaymentSchema.index({ owner: 1, status: 1 });
rentPaymentSchema.index({ dueDate: 1, status: 1 });

export const RentPayment = mongoose.model('RentPayment', rentPaymentSchema);
