import mongoose from 'mongoose';

const ownerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    agencyName: { type: String, trim: true },
    businessAddress: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

ownerProfileSchema.index({ user: 1 });

export const OwnerProfile = mongoose.model('OwnerProfile', ownerProfileSchema);
