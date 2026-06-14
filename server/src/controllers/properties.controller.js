import { Property } from '../models/Property.model.js';
import { User } from '../models/User.model.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.util.js';
import cloudinary from '../config/cloudinary.js';

// ── GET PROPERTIES (Public, with Filter & Pagination) ─────
export const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: 'ACTIVE' };

    // Search filter
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // City & Area filter
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
    if (req.query.area) filter.area = new RegExp(req.query.area, 'i');

    // Classification filter
    if (req.query.propertyType) filter.propertyType = req.query.propertyType;
    if (req.query.furnishingStatus) filter.furnishingStatus = req.query.furnishingStatus;

    // Specifications filter
    if (req.query.bedrooms) filter.bedrooms = parseInt(req.query.bedrooms, 10);
    if (req.query.bathrooms) filter.bathrooms = { $gte: parseInt(req.query.bathrooms, 10) };

    // Pricing filter
    if (req.query.minRent || req.query.maxRent) {
      filter.rentAmount = {};
      if (req.query.minRent) filter.rentAmount.$gte = parseFloat(req.query.minRent);
      if (req.query.maxRent) filter.rentAmount.$lte = parseFloat(req.query.maxRent);
    }

    // Features filter
    if (req.query.amenities) {
      const amenitiesArr = Array.isArray(req.query.amenities)
        ? req.query.amenities
        : req.query.amenities.split(',');
      filter.amenities = { $all: amenitiesArr };
    }

    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'firstName lastName avatar email')
      .lean();

    return sendPaginated(res, properties, page, limit, total);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch properties', err.message);
  }
};

// ── GET PROPERTIES BY MAP (Geospatial Search) ────────────
export const getPropertiesMap = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // Radius in km

    if (!lat || !lng) {
      return sendError(res, 400, 'Latitude and longitude are required');
    }

    // Radius of Earth is 6378.1 km
    const radiusInRadians = radius / 6378.1;

    const properties = await Property.find({
      status: 'ACTIVE',
      location: {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians],
        },
      },
    })
    .populate('owner', 'firstName lastName avatar')
    .lean();

    return sendSuccess(res, 200, 'Properties fetched successfully by map location', properties);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch properties by location', err.message);
  }
};

// ── GET TRENDING PROPERTIES ───────────────────────────────
export const getTrendingProperties = async (req, res) => {
  try {
    // Top 6 properties sorted by viewCount and wishlistCount
    const properties = await Property.find({ status: 'ACTIVE' })
      .sort({ viewCount: -1, wishlistCount: -1 })
      .limit(6)
      .populate('owner', 'firstName lastName avatar')
      .lean();

    return sendSuccess(res, 200, 'Trending properties fetched', properties);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch trending properties', err.message);
  }
};

// ── GET PROPERTY BY ID OR SLUG (Detail) ────────────────────
export const getPropertyBySlugOrId = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    const isId = idOrSlug.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: idOrSlug } : { slug: idOrSlug };

    // Increment viewCount atomically
    const property = await Property.findOneAndUpdate(
      query,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate('owner', 'firstName lastName avatar email phone');

    if (!property) return sendError(res, 404, 'Property not found');

    return sendSuccess(res, 200, 'Property retrieved successfully', property);
  } catch (err) {
    return sendError(res, 500, 'Failed to retrieve property', err.message);
  }
};

// ── CREATE PROPERTY ───────────────────────────────────────
export const createProperty = async (req, res) => {
  try {
    const { coordinates, ...rest } = req.body;

    const locationObj = {
      type: 'Point',
      coordinates: coordinates || [0, 0],
    };

    const property = await Property.create({
      ...rest,
      owner: req.user.id,
      location: locationObj,
    });

    return sendSuccess(res, 201, 'Property created successfully. Pending approval.', property);
  } catch (err) {
    return sendError(res, 500, 'Failed to create property', err.message);
  }
};

// ── UPDATE PROPERTY ───────────────────────────────────────
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinates, ...rest } = req.body;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    // Authorization check
    if (property.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to update this property');
    }

    if (coordinates) {
      property.location = {
        type: 'Point',
        coordinates,
      };
    }

    Object.assign(property, rest);
    await property.save();

    return sendSuccess(res, 200, 'Property updated successfully', property);
  } catch (err) {
    return sendError(res, 500, 'Failed to update property', err.message);
  }
};

// ── DELETE PROPERTY ───────────────────────────────────────
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    if (property.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to delete this property');
    }

    // Delete images from Cloudinary before deleting DB record
    if (property.images && property.images.length > 0) {
      await Promise.all(
        property.images.map((img) => cloudinary.uploader.destroy(img.publicId))
      ).catch((err) => console.error('Cloudinary delete error:', err));
    }

    await Property.findByIdAndDelete(id);

    return sendSuccess(res, 200, 'Property deleted successfully');
  } catch (err) {
    return sendError(res, 500, 'Failed to delete property', err.message);
  }
};

// ── UPLOAD PROPERTY IMAGES ────────────────────────────────
export const uploadPropertyImages = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    if (property.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to upload images');
    }

    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'Please upload at least one image');
    }

    const uploadedImages = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    property.images.push(...uploadedImages);
    await property.save();

    return sendSuccess(res, 200, 'Images uploaded successfully', property);
  } catch (err) {
    return sendError(res, 500, 'Image upload failed', err.message);
  }
};

// ── DELETE PROPERTY IMAGE ─────────────────────────────────
export const deletePropertyImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    if (property.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized to delete image');
    }

    // Remove from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove from DB array
    property.images = property.images.filter((img) => img.publicId !== publicId);
    await property.save();

    return sendSuccess(res, 200, 'Image deleted successfully', property);
  } catch (err) {
    return sendError(res, 500, 'Image deletion failed', err.message);
  }
};

// ── WISHLIST TOGGLE ───────────────────────────────────────
export const toggleWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    const index = property.wishlistedBy.indexOf(userId);
    let message = '';

    if (index === -1) {
      // Add to wishlist
      property.wishlistedBy.push(userId);
      property.wishlistCount += 1;
      message = 'Property added to wishlist';
    } else {
      // Remove from wishlist
      property.wishlistedBy.splice(index, 1);
      property.wishlistCount -= 1;
      message = 'Property removed from wishlist';
    }

    await property.save();

    return sendSuccess(res, 200, message, {
      wishlistCount: property.wishlistCount,
      wishlistedBy: property.wishlistedBy,
    });
  } catch (err) {
    return sendError(res, 500, 'Wishlist modification failed', err.message);
  }
};

// ── APPROVE PROPERTY (Admin) ──────────────────────────────
export const approveProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    property.status = 'ACTIVE';
    property.approvedAt = new Date();
    property.approvedBy = req.user.id;
    await property.save();

    return sendSuccess(res, 200, 'Property approved and active', property);
  } catch (err) {
    return sendError(res, 500, 'Property approval failed', err.message);
  }
};

// ── REJECT PROPERTY (Admin) ──────────────────────────────
export const rejectProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) return sendError(res, 404, 'Property not found');

    property.status = 'INACTIVE';
    await property.save();

    return sendSuccess(res, 200, 'Property rejected and marked inactive', property);
  } catch (err) {
    return sendError(res, 500, 'Property rejection failed', err.message);
  }
};

// ── GET OWNER PROPERTIES ──────────────────────────────────
export const getOwnerProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Owner properties retrieved', properties);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch owner properties', err.message);
  }
};

// ── GET PROPERTY ANALYTICS ────────────────────────────────
export const getPropertyAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id).lean();
    if (!property) return sendError(res, 404, 'Property not found');

    if (property.owner.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'Unauthorized access to analytics');
    }

    return sendSuccess(res, 200, 'Property analytics retrieved', {
      viewCount: property.viewCount,
      wishlistCount: property.wishlistCount,
      avgRating: property.avgRating,
      reviewCount: property.reviewCount,
    });
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch property analytics', err.message);
  }
};
