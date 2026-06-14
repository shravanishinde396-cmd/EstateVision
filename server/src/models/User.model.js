import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    phone: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
    },
    avatar: { type: String, default: null }, // Cloudinary URL
    role: {
      type: String,
      enum: ['ADMIN', 'OWNER', 'TENANT'],
      default: 'TENANT',
    },
    isVerified:   { type: Boolean, default: false },
    isActive:     { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
    passwordResetToken:  { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    emailVerifyToken:    { type: String, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

// ── Virtuals ─────────────────────────────────────────────
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Pre-save middleware: hash password ───────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance methods ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpiry;
  delete obj.emailVerifyToken;
  return obj;
};

export const User = mongoose.model('User', userSchema);
