// server/src/models/MaintenanceTicket.model.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:    { type: String, required: true, maxlength: 2000 },
    isInternal: { type: Boolean, default: false }, // Owner-only note
  },
  { timestamps: true }
);

const maintenanceTicketSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    assignedTo: { type: String }, // Technician name + contact

    title:       { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 3000 },

    category: {
      type: String,
      enum: ['PLUMBING','ELECTRICAL','HVAC','APPLIANCE','STRUCTURAL','PEST_CONTROL','CLEANING','SECURITY','OTHER'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'CANCELLED'],
      default: 'PENDING',
    },

    images:        [{ url: String, publicId: String }],
    estimatedCost: { type: Number },
    actualCost:    { type: Number },

    scheduledAt: { type: Date },
    resolvedAt:  { type: Date },

    comments: [commentSchema],
  },
  { timestamps: true }
);

maintenanceTicketSchema.index({ property: 1, status: 1 });
maintenanceTicketSchema.index({ tenant: 1 });
maintenanceTicketSchema.index({ owner: 1, status: 1, priority: 1 });

export const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
