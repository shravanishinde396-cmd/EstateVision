import joi from 'joi';

export const registerSchema = joi.object({
  email: joi.string().email().required().lowercase().trim(),
  password: joi.string().min(8).required(),
  firstName: joi.string().required().trim(),
  lastName: joi.string().required().trim(),
  phone: joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.pattern.base': 'Invalid Indian phone number. Must be 10 digits starting with 6-9.',
  }),
  role: joi.string().valid('OWNER', 'TENANT').default('TENANT'),
});

export const loginSchema = joi.object({
  email: joi.string().email().required().lowercase().trim(),
  password: joi.string().required(),
});

export const forgotPasswordSchema = joi.object({
  email: joi.string().email().required().lowercase().trim(),
});

export const resetPasswordSchema = joi.object({
  password: joi.string().min(8).required(),
});
