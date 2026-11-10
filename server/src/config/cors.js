import { config } from './index.js';

/**
 * Standardize and clean an origin string.
 * - Strips outer quotes (" or ')
 * - Trims leading and trailing whitespace
 * - Strips trailing slashes (e.g. http://localhost:5173/ -> http://localhost:5173)
 * - Normalizes protocol and hostname to lowercase via URL.origin
 * - Preserves explicit ports
 */
export const normalizeOrigin = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let trimmed = raw.trim();
  // Strip outer quotes
  trimmed = trimmed.replace(/^["']+|["']+$/g, '').trim();
  if (!trimmed) return '';
  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.toLowerCase().replace(/\/+$/, '');
  }
};

/**
 * Parse comma-separated origin strings or arrays into a clean array of normalized origins.
 */
export const parseConfiguredOrigins = (...sources) => {
  const origins = new Set();
  for (const source of sources) {
    if (!source) continue;
    const parts = Array.isArray(source) ? source : String(source).split(',');
    for (const part of parts) {
      const normalized = normalizeOrigin(part);
      if (normalized) {
        origins.add(normalized);
      }
    }
  }
  return Array.from(origins);
};

// Common development origins used by Vite, React, Next, preview servers
export const DEV_DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://[::1]:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

/**
 * Check if origin is a valid local development origin (localhost, 127.0.0.1, [::1], or private LAN)
 * on a standard web dev port (3000-9999).
 * Strictly disabled in production.
 */
export const isDevelopmentOrigin = (origin) => {
  if (config?.isProduction || process.env.NODE_ENV === 'production') return false;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

    const host = url.hostname;
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);

    // Development ports: standard Vite / React / Node development range
    const isDevPort = port >= 3000 && port <= 9999;
    if (!isDevPort) return false;

    // Local loopback
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]') {
      return true;
    }

    // Private LAN IPs (for mobile/tablet debugging on local WiFi)
    const isPrivateLan = (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
    );

    return isPrivateLan;
  } catch {
    return false;
  }
};

/**
 * Build the full list of allowed origins.
 */
export const getAllowedOrigins = () => {
  const isProd = config?.isProduction || process.env.NODE_ENV === 'production';

  const configured = parseConfiguredOrigins(
    process.env.ALLOWED_ORIGINS,
    process.env.CLIENT_ORIGIN,
    config?.clientOrigin
  );

  // In development, also include the standard dev localhost origins
  if (!isProd) {
    return Array.from(new Set([...configured, ...DEV_DEFAULT_ORIGINS]));
  }

  // In production, strictly use configured origins
  return Array.from(new Set(configured));
};

/**
 * Determine if an incoming origin is permitted by CORS policy
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true; // non-browser requests (Postman, curl, server-to-server)

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(normalized)) {
    return true;
  }

  // Check dynamic development origin if not in production
  const isProd = config?.isProduction || process.env.NODE_ENV === 'production';
  if (!isProd && isDevelopmentOrigin(normalized)) {
    return true;
  }

  return false;
};

/**
 * Configure Express CORS middleware options
 */
export const getCorsOptions = () => ({
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin header
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy: Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-test-rate-limit',
    'x-forwarded-for',
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours preflight cache
});

