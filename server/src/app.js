// server/src/app.js
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import authRoutes         from './routes/auth.routes.js';
import propertyRoutes     from './routes/properties.routes.js';
import tenantRoutes       from './routes/tenants.routes.js';
import leaseRoutes        from './routes/leases.routes.js';
import paymentRoutes      from './routes/payments.routes.js';
import maintenanceRoutes  from './routes/maintenance.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import analyticsRoutes    from './routes/analytics.routes.js';
import adminRoutes        from './routes/admin.routes.js';
import aiRoutes           from './routes/ai.routes.js';
import config             from './config/env.js';

const app = express();

// ── Security Middleware ───────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];
if (config.clientUrl) {
  allowedOrigins.push(config.clientUrl);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or vercel.app preview domains
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      /^http:\/\/localhost:\d+$/.test(origin);
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(mongoSanitize()); // Prevent MongoDB injection ($gt, etc.)
app.use(xss());           // Sanitize HTML input
app.use(hpp({ whitelist: ['amenities', 'bedrooms', 'propertyType'] }));

// ── General Middleware ────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.env === 'development') {
  app.use(morgan('dev'));
}

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/properties',    propertyRoutes);
app.use('/api/tenants',       tenantRoutes);
app.use('/api/leases',        leaseRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/maintenance',   maintenanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/ai',            aiRoutes);

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── 404 Handler ───────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;
