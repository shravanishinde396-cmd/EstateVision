import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true },
}, { _id: false });

const tenantDocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  documentType: { type: String, required: true }, // AADHAAR, PAN, PASSPORT, INCOME_PROOF
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const tenantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    permanentAddress: { type: String },
    emergencyContact: { type: emergencyContactSchema },
    occupation: { type: String },
    organization: { type: String },
    monthlyIncome: { type: Number },
    documents: [tenantDocumentSchema],
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

tenantProfileSchema.index({ user: 1 });

export const TenantProfile = mongoose.model('TenantProfile', tenantProfileSchema);
