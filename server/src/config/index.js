import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. In Vercel or cloud environments, environment variables are injected directly into process.env.
// Avoid loading local .env files if VERCEL or VERCEL_ENV is set to prevent stale dev values from overriding production.
const isVercelRuntime = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

if (!isVercelRuntime) {
  const candidateEnvPaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(process.cwd(), 'server/.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const p of candidateEnvPaths) {
    dotenv.config({ path: p });
  }
}

/**
 * Robust Environment Resolution Helper
 * Determines the true environment taking VERCEL_ENV, NODE_ENV, and fallbacks into account.
 *
 * Priority:
 * 1. VERCEL_ENV === 'production' => 'production'
 * 2. Explicit NODE_ENV if set (e.g. 'production', 'test')
 * 3. VERCEL_ENV === 'preview' => 'preview'
 * 4. Default => 'development'
 */
export const resolveEnvironment = (overrideEnv = process.env) => {
  const vercelEnv = (overrideEnv.VERCEL_ENV || '').trim().toLowerCase();
  const rawNodeEnv = (overrideEnv.NODE_ENV || '').trim().toLowerCase();

  // 1. Vercel production deployment has authoritative precedence
  if (vercelEnv === 'production') {
    return 'production';
  }

  // 2. Vercel preview deployment
  if (vercelEnv === 'preview') {
    return rawNodeEnv === 'production' ? 'production' : 'preview';
  }

  // 3. Explicit NODE_ENV if provided (e.g. 'production', 'test', 'development')
  if (rawNodeEnv) {
    return rawNodeEnv;
  }

  // 4. Fallback to development
  return 'development';
};

const activeEnv = resolveEnvironment();
const isProd = activeEnv === 'production';

// Keep process.env.NODE_ENV strictly synchronized with resolved environment
// so third-party libraries (Express, Helmet, Mongoose) enforce production mode.
process.env.NODE_ENV = activeEnv;

// List of known insecure development fallback secrets that must NEVER be used in production
const INSECURE_DEFAULT_SECRETS = [
  'sakanly_secret_key_change_in_production_2026',
  'sakanly_jwt_secret_dev_key_2026',
  'secret',
  'dev_secret',
  'changeme',
];

export const getValidatedJwtSecret = (env = process.env, isProductionMode = isProd) => {
  const rawSecret = (env.JWT_SECRET || '').trim();
  if (isProductionMode) {
    if (!rawSecret || INSECURE_DEFAULT_SECRETS.includes(rawSecret)) {
      const errMsg = '[Security Fatal] Insecure or missing JWT_SECRET in production environment! A strong custom secret is required.';
      console.error(`❌ ${errMsg}`);
      throw new Error(errMsg);
    }
    return rawSecret;
  }
  return rawSecret || 'sakanly_secret_key_change_in_production_2026';
};

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: activeEnv,
  isProduction: isProd,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: getValidatedJwtSecret(),
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'no-reply@sakanly.com',
    senderName: process.env.BREVO_SENDER_NAME || 'سكنلي | Sakanly',
  },
  superAdmin: {
    email: (process.env.SUPER_ADMIN_EMAIL || '').replace(/^["']+|["']+$/g, '').trim().toLowerCase(),
    password: (process.env.SUPER_ADMIN_PASSWORD || '').replace(/^["']+|["']+$/g, ''),
    name: (process.env.SUPER_ADMIN_NAME || '').replace(/^["']+|["']+$/g, '').trim() || 'إدارة منصة سكنلي (Super Admin)',
    phone: (process.env.SUPER_ADMIN_PHONE || '').replace(/^["']+|["']+$/g, '').trim() || '01000000001',
  },
};
