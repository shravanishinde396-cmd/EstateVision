import joi from 'joi';

export const leaseSchema = joi.object({
  property: joi.string().required().description('Property ID'),
  tenant: joi.string().required().description('Tenant ID'),
  startDate: joi.date().required(),
  endDate: joi.date().greater(joi.ref('startDate')).required(),
  monthlyRent: joi.number().positive().required(),
  securityDeposit: joi.number().positive().required(),
  terms: joi.string().optional(),
  rentDueDay: joi.number().integer().min(1).max(28).default(5),
});
