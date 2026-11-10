import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of current working directory
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const p of candidateEnvPaths) {
  dotenv.config({ path: p });
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'sakanly_secret_key_change_in_production_2026',
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
