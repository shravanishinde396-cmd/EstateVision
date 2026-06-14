import express from 'express';
import {
  getProperties,
  getPropertiesMap,
  getTrendingProperties,
  getPropertyBySlugOrId,
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  toggleWishlist,
  approveProperty,
  rejectProperty,
  getOwnerProperties,
  getPropertyAnalytics,
} from '../controllers/properties.controller.js';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { propertySchema } from '../validators/property.validator.js';
import { logAudit } from '../middleware/auditLog.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getProperties);
router.get('/map', getPropertiesMap);
router.get('/trending', getTrendingProperties);
router.get('/owner/mine', protect, restrictTo('OWNER'), getOwnerProperties);
router.get('/:idOrSlug', getPropertyBySlugOrId);

// Protected routes
router.post(
  '/',
  protect,
  restrictTo('OWNER', 'ADMIN'),
  validateBody(propertySchema),
  logAudit('CREATE_PROPERTY', 'Property'),
  createProperty
);

router.patch(
  '/:id',
  protect,
  restrictTo('OWNER', 'ADMIN'),
  logAudit('UPDATE_PROPERTY', 'Property'),
  updateProperty
);

router.delete(
  '/:id',
  protect,
  restrictTo('OWNER', 'ADMIN'),
  logAudit('DELETE_PROPERTY', 'Property'),
  deleteProperty
);

router.post('/:id/images', protect, restrictTo('OWNER', 'ADMIN'), upload.array('images', 10), uploadPropertyImages);
router.delete('/:id/images/:publicId', protect, restrictTo('OWNER', 'ADMIN'), deletePropertyImage);

router.post('/:id/wishlist', protect, restrictTo('TENANT'), toggleWishlist);
router.delete('/:id/wishlist', protect, restrictTo('TENANT'), toggleWishlist);

router.post('/:id/approve', protect, restrictTo('ADMIN'), logAudit('APPROVE_PROPERTY', 'Property'), approveProperty);
router.post('/:id/reject', protect, restrictTo('ADMIN'), logAudit('REJECT_PROPERTY', 'Property'), rejectProperty);

router.get('/:id/analytics', protect, restrictTo('OWNER', 'ADMIN'), getPropertyAnalytics);

export default router;
