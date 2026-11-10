import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/database.js';

// Initialize Express app once at module level for maximum cold-start performance
const app = createApp();

/**
 * Vercel Serverless Function Entry Point for Sakanly Backend API
 * Compatible with Vercel Node.js Serverless Functions when Root Directory is set to 'server'.
 *
 * Handles:
 * - MongoDB Atlas cached connection reuse across warm lambdas
 * - Resilient database fallback / 503 handling in production
 * - All Express routing, middleware, CORS, rate limiting, and HTTP methods
 */
export default async function handler(req, res) {
  try {
    // Ensure MongoDB connection is active (or reuses cached connection pool)
    await connectDB();
  } catch (dbError) {
    console.error('❌ [Vercel Function] MongoDB connection failure:', dbError.message);
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'تعذر الاتصال بقاعدة البيانات حالياً. يرجى المحاولة بعد لحظات.',
      error: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
    });
  }

  // Hand over execution to the Express application
  return app(req, res);
}

