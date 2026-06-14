// server/src/models/AreaTrend.model.js
import mongoose from 'mongoose';

const areaTrendSchema = new mongoose.Schema(
  {
    city:  { type: String, required: true },
    area:  { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year:  { type: Number, required: true },

    avgRentPrice:        { type: Number },
    avgSalePrice:        { type: Number },
    demandScore:         { type: Number, min: 0, max: 100 },
    supplyScore:         { type: Number, min: 0, max: 100 },
    growthRate:          { type: Number }, // Monthly %
    investmentScore:     { type: Number, min: 0, max: 100 },
    infrastructureScore: { type: Number, min: 0, max: 100 },
    totalListings:       { type: Number, default: 0 },
    avgOccupancyRate:    { type: Number, min: 0, max: 100 },
  },
  { timestamps: true }
);

areaTrendSchema.index({ city: 1, area: 1, year: 1, month: -1 });
areaTrendSchema.index({ city: 1, year: 1 });

export const AreaTrend = mongoose.model('AreaTrend', areaTrendSchema);
