import joi from 'joi';

export const createOrderSchema = joi.object({
  leaseId: joi.string().required(),
  month: joi.number().integer().min(1).max(12).required(),
  year: joi.number().integer().min(2020).required(),
});

export const verifyPaymentSchema = joi.object({
  razorpayOrderId: joi.string().required(),
  razorpayPaymentId: joi.string().required(),
  razorpaySignature: joi.string().required(),
});
