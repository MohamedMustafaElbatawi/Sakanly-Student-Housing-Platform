import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';
import { config } from '../src/config/index.js';

// Initialize Express app once at module level for maximum cold-start performance
const app = createApp();

/**
 * Safe HTTP 503 DATABASE_UNAVAILABLE response helper compatible with
 * both Express responses and raw Node.js http.ServerResponse instances.
 */
export const sendDatabaseUnavailable = (res) => {
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
 * Extracts and normalizes the pathname from a raw URL.
 * Strips query parameters, hashes, and trailing slashes.
 */
export const extractNormalizedPathname = (rawUrl = '/') => {
  if (!rawUrl) return '/';
  const withoutQuery = rawUrl.split('?')[0].split('#')[0];
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed || '/';
};

/**
 * Checks whether a requested pathname is an exempted public route
 * that remains accessible even during database downtime.
 */
export const isPublicExemptedRoute = (pathname) => {
  const apiHealthPath = `${config.apiPrefix || '/api/v1'}/health`;
  return (
    pathname === '/' ||
    pathname === '/health' ||
    pathname === '/api/v1/health' ||
    pathname === apiHealthPath
  );
};

/**
 * Vercel Serverless Function Entry Point for Sakanly Backend API
 * Compatible with Vercel Node.js Serverless Functions when Root Directory is set to 'server'.
 *
 * Handles:
 * - MongoDB Atlas cached connection reuse across warm lambdas
 * - Resilient database fallback / 503 handling in production
 * - Pathname extraction handling query strings and trailing slashes
 * - All Express routing, middleware, CORS, rate limiting, and HTTP methods
 */
export default async function handler(req, res) {
  let dbConnected = false;
  try {
    // Ensure MongoDB connection is active (or reuses cached connection pool)
    dbConnected = await connectDB();
  } catch (dbError) {
    console.error('❌ [Vercel Function] MongoDB connection failure:', dbError.message);
    dbConnected = false;
  }

  const pathname = extractNormalizedPathname(req.url);
  const isPublicStatic = isPublicExemptedRoute(pathname);

  const isProductionMode = Boolean(
    config.isProduction ||
    config.nodeEnv === 'production' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );

  // If database connection failed on a data route in production, strictly return HTTP 503
  // and prevent the request from proceeding to Express data handlers
  if (!dbConnected && !isPublicStatic && isProductionMode) {
    return sendDatabaseUnavailable(res);
  }

  // Hand over execution to the Express application
  return app(req, res);
}
