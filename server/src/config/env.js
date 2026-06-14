import dotenv from 'dotenv';
import path from 'path';
import joi from 'joi';

// Load environment variables
dotenv.config();

const envVarsSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  PORT: joi.number().default(5000),
  MONGODB_URI: joi.string().required().description('MongoDB connection URI'),
  JWT_ACCESS_SECRET: joi.string().min(32).required().description('JWT Access Token Secret'),
  JWT_REFRESH_SECRET: joi.string().min(32).required().description('JWT Refresh Token Secret'),
  CLIENT_URL: joi.string().required().description('Client app URL'),
  CLOUDINARY_CLOUD_NAME: joi.string().required(),
  CLOUDINARY_API_KEY: joi.string().required(),
  CLOUDINARY_API_SECRET: joi.string().required(),
  RAZORPAY_KEY_ID: joi.string().required(),
  RAZORPAY_KEY_SECRET: joi.string().required(),
  RAZORPAY_WEBHOOK_SECRET: joi.string().required(),
  RESEND_API_KEY: joi.string().required(),
  EMAIL_FROM: joi.string().default('EstateVision <noreply@estatevision.ai>'),
  REDIS_URL: joi.string().required(),
  AI_SERVICE_URL: joi.string().required(),
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongodbUri: envVars.MONGODB_URI,
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiration: '15m',
    refreshExpiration: '7d',
  },
  clientUrl: envVars.CLIENT_URL,
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  razorpay: {
    keyId: envVars.RAZORPAY_KEY_ID,
    keySecret: envVars.RAZORPAY_KEY_SECRET,
    webhookSecret: envVars.RAZORPAY_WEBHOOK_SECRET,
  },
  resend: {
    apiKey: envVars.RESEND_API_KEY,
    from: envVars.EMAIL_FROM,
  },
  redisUrl: envVars.REDIS_URL,
  aiServiceUrl: envVars.AI_SERVICE_URL,
};
