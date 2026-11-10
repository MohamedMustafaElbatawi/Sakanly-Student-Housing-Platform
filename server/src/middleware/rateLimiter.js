import rateLimit from 'express-rate-limit';

/**
 * General API Rate Limiter
 * 1,000 requests per 15 minutes window per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.',
  },
});

/**
 * Strict Authentication & Password Reset Rate Limiter
 * 10 attempts per 15 minutes window (Mitigates Brute-Force & Credential Stuffing)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit'],
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'تم تجاوز الحد الأقصى لمحاولات الدخول غير الناجحة. يرجى الانتظار 15 دقيقة لدواعي الأمان.',
  },
});

