import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { getCorsOptions } from './config/cors.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { noSqlSanitizer } from './middleware/sanitizer.js';
import { HealthController } from './controllers/healthController.js';

export const createApp = () => {
  const app = express();

  // Trust reverse proxy (needed for secure cookies, proto detection, and accurate client IP behind proxies)
  app.set('trust proxy', 1);

  // 1. Security Headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      contentSecurityPolicy: false,
    })
  );

  // 2. Cookie Parser for Secure HttpOnly Tokens
  app.use(cookieParser());

  // 3. CORS Configuration with Strict Whitelist & Origin Normalization
  app.use(cors(getCorsOptions()));

  // 4. Request Body Parsers (with safe limits)
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // 5. NoSQL / Mongo Query Operator Sanitization
  app.use(noSqlSanitizer);

  // 6. Global API Rate Limiter
  app.use(config.apiPrefix, apiLimiter);

  // 7. Strict Auth Rate Limiter on Authentication & Recovery Endpoints
  app.use(`${config.apiPrefix}/auth/login`, authLimiter);
  app.use(`${config.apiPrefix}/auth/register`, authLimiter);
  app.use(`${config.apiPrefix}/auth/forgot-password`, authLimiter);
  app.use(`${config.apiPrefix}/auth/reset-password`, authLimiter);

  // 8. Logger in development
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // 9. Mount API v1 router
  app.use(config.apiPrefix, apiRouter);

  // Direct root health check (HTTP 200 with full health data)
  app.get('/health', HealthController.getHealth);

  // Root welcome endpoint
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Sakanly | سكنلي API',
      status: 'active',
      documentation: `${config.apiPrefix}/health`,
      version: '1.0.0',
    });
  });

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

// Singleton Express app instance for serverless invocations
let defaultApp = null;

export const getApp = () => {
  if (!defaultApp) {
    defaultApp = createApp();
  }
  return defaultApp;
};

// Helper for safe 503 responses across both Express and raw Node.js ServerResponse
const sendDatabaseUnavailable = (res) => {
  const payload = JSON.stringify({
    success: false,
    code: 'DATABASE_UNAVAILABLE',
    message: 'تعذر الاتصال بقاعدة البيانات حالياً. يرجى المحاولة بعد لحظات.',
  });

  if (typeof res.status === 'function') {
    return res.status(503).json(JSON.parse(payload));
  }

  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(payload);
};

/**
 * Default export handler for Vercel Serverless Functions
 * If Vercel invokes this module directly, this handler ensures DB connection is ready
 * and executes the Express app, preventing "Invalid export found in module" errors.
 */
export default async function handler(req, res) {
  let dbConnected = false;
  try {
    const { connectDB } = await import('./config/database.js');
    dbConnected = await connectDB();
  } catch (dbErr) {
    console.error('❌ [Database] Connection error in app handler:', dbErr.message);
    dbConnected = false;
  }

  const rawUrl = req.url || '/';
  const pathname = rawUrl.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const apiHealthPath = `${config.apiPrefix || '/api/v1'}/health`;
  const isPublicStatic = pathname === '/' || pathname === '/health' || pathname === apiHealthPath || pathname === '/api/v1/health';

  const isProductionMode = Boolean(
    config.isProduction ||
    config.nodeEnv === 'production' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );

  // If database connection failed and request is a data route in production, return HTTP 503
  if (!dbConnected && !isPublicStatic && isProductionMode) {
    return sendDatabaseUnavailable(res);
  }

  const app = getApp();
  return app(req, res);
}
