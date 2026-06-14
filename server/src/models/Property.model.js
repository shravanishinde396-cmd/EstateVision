// server/src/models/Property.model.js
import mongoose from 'mongoose';

const nearbyPlacesSchema = new mongoose.Schema({
  hospitals:  [{ name: String, distance: String }],
  schools:    [{ name: String, distance: String }],
  metro:      [{ name: String, distance: String }],
  malls:      [{ name: String, distance: String }],
  restaurants:[{ name: String, distance: String }],
}, { _id: false });

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title:       { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    slug:        { type: String, unique: true }, // SEO-friendly URL

    // Classification
    propertyType: {
      type: String,
      enum: ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO', 'PENTHOUSE', 'COMMERCIAL', 'PLOT', 'PG'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'ACTIVE', 'RENTED', 'INACTIVE', 'ARCHIVED'],
      default: 'PENDING_APPROVAL',
    },
    furnishingStatus: {
      type: String,
      enum: ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED'],
      required: true,
    },

    // Location
    address:   { type: String, required: true },
    city:      { type: String, required: true, index: true },
    area:      { type: String, required: true },  // locality/neighborhood
    state:     { type: String, required: true },
    pincode:   { type: String, required: true },
    country:   { type: String, default: 'India' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // Specifications
    bedrooms:    { type: Number, required: true, min: 0, max: 20 },
    bathrooms:   { type: Number, required: true, min: 0 },
    areaSqft:    { type: Number, required: true },
    floor:       { type: Number },
    totalFloors: { type: Number },
    ageYears:    { type: Number, default: 0 },
    facing:      { type: String, enum: ['North', 'South', 'East', 'West', 'NE', 'NW', 'SE', 'SW'] },

    // Pricing
    rentAmount:          { type: Number, required: true },
    depositAmount:       { type: Number, required: true },
    maintenanceCharges:  { type: Number, default: 0 },

    // Media
    images:         [{ url: String, publicId: String }],
    videos:         [String],
    virtualTourUrl: { type: String },
    floorPlanUrl:   { type: String },

    // Features
    amenities:     [{ type: String }],
    nearbyPlaces:  { type: nearbyPlacesSchema },
    parkingAvailable: { type: Boolean, default: false },
    petFriendly:      { type: Boolean, default: false },

    // Analytics (denormalized for performance)
    viewCount:     { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
    avgRating:     { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:   { type: Number, default: 0 },

    // Admin
    availableFrom: { type: Date },
    approvedAt:    { type: Date },
    approvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Wishlist (array of user IDs for quick check)
    wishlistedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Geospatial Index (for map search) ────────────────────
propertySchema.index({ location: '2dsphere' });

// ── Compound Indexes ──────────────────────────────────────
propertySchema.index({ city: 1, status: 1 });
propertySchema.index({ city: 1, propertyType: 1, status: 1 });
propertySchema.index({ rentAmount: 1, status: 1 });
propertySchema.index({ bedrooms: 1, status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ status: 1, createdAt: -1 });

// ── Text Search Index ─────────────────────────────────────
propertySchema.index({
  title: 'text',
  description: 'text',
  city: 'text',
  area: 'text',
  address: 'text',
});

// ── Auto-generate slug ────────────────────────────────────
propertySchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = `${this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
  }
  next();
});

export const Property = mongoose.model('Property', propertySchema);
