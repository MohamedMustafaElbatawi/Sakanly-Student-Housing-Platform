import http from 'http';
import { createApp } from '../expressApp.js';
import { resolveEnvironment, getValidatedJwtSecret, config } from '../config/index.js';
import { isDevelopmentOrigin, parseConfiguredOrigins, isOriginAllowed } from '../config/cors.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
}

async function runProductionEnvironmentTests() {
  console.log('========================================================================');
  console.log('🧪 SAKANLY PRODUCTION ENVIRONMENT RESOLUTION & SECURITY AUDIT TEST');
  console.log('========================================================================\n');

  // 1. Environment Resolution Logic (VERCEL_ENV & NODE_ENV)
  console.log('--- 1. Testing VERCEL_ENV & NODE_ENV Resolution Precedence ---');
  assert(
    resolveEnvironment({ VERCEL_ENV: 'production', NODE_ENV: 'development' }) === 'production',
    'VERCEL_ENV="production" strictly overrides NODE_ENV="development" to "production"'
  );

  assert(
    resolveEnvironment({ VERCEL_ENV: 'production', NODE_ENV: '' }) === 'production',
    'VERCEL_ENV="production" resolves to "production" even when NODE_ENV is unset'
  );

  assert(
    resolveEnvironment({ VERCEL_ENV: 'preview', NODE_ENV: 'development' }) === 'preview',
    'VERCEL_ENV="preview" resolves to "preview" on Vercel preview deployments'
  );

  assert(
    resolveEnvironment({ VERCEL_ENV: 'preview', NODE_ENV: 'production' }) === 'production',
    'Explicit NODE_ENV="production" on preview resolves to "production"'
  );

  assert(
    resolveEnvironment({ NODE_ENV: 'production' }) === 'production',
    'Standalone NODE_ENV="production" (Docker/VPS/Render) resolves to "production"'
  );

  assert(
    resolveEnvironment({ NODE_ENV: 'test' }) === 'test',
    'Test environment NODE_ENV="test" resolves to "test"'
  );

  assert(
    resolveEnvironment({}) === 'development',
    'Default with no env variables resolves safely to "development"'
  );

  // 2. JWT Secret Validation in Production
  console.log('\n--- 2. Testing JWT Secret Hardening & Default Dev Secret Prohibitions ---');
  let threwOnMissing = false;
  try {
    getValidatedJwtSecret({ JWT_SECRET: '' }, true);
  } catch (err) {
    threwOnMissing = true;
  }
  assert(threwOnMissing === true, 'Production rejects missing JWT_SECRET with fatal error');

  let threwOnDefault = false;
  try {
    getValidatedJwtSecret({ JWT_SECRET: 'sakanly_secret_key_change_in_production_2026' }, true);
  } catch (err) {
    threwOnDefault = true;
  }
  assert(threwOnDefault === true, 'Production rejects known development fallback secret');

  let threwOnInsecureDevKey = false;
  try {
    getValidatedJwtSecret({ JWT_SECRET: 'sakanly_jwt_secret_dev_key_2026' }, true);
  } catch (err) {
    threwOnInsecureDevKey = true;
  }
  assert(threwOnInsecureDevKey === true, 'Production rejects dev_key fallback secret');

  const validProdSecret = getValidatedJwtSecret({ JWT_SECRET: 'my_ultra_secure_prod_jwt_secret_2026_xyz!' }, true);
  assert(validProdSecret === 'my_ultra_secure_prod_jwt_secret_2026_xyz!', 'Production accepts valid custom JWT secret');

  // In non-production, fallback is permitted
  const devFallback = getValidatedJwtSecret({}, false);
  assert(Boolean(devFallback), 'Non-production environment permits fallback dev secret');

  // 3. CORS Enforcement in Production
  console.log('\n--- 3. Testing CORS Origins Rules in Production ---');
  // In production, isDevelopmentOrigin MUST be false for all origins
  const origEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  assert(isDevelopmentOrigin('http://localhost:5173') === false, 'Localhost 5173 blocked by isDevelopmentOrigin in production');
  assert(isDevelopmentOrigin('http://127.0.0.1:5174') === false, '127.0.0.1:5174 blocked by isDevelopmentOrigin in production');
  assert(isDevelopmentOrigin('http://192.168.1.100:5173') === false, 'LAN IP blocked by isDevelopmentOrigin in production');
  process.env.NODE_ENV = origEnv;

  // 4. Live Health Check Endpoint Security & Sanitization
  console.log('\n--- 4. Testing Live Health Check Endpoint Data & Information Disclosure ---');
  const app = createApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(healthRes.status === 200, 'GET /api/v1/health returns HTTP 200');
    const healthData = await healthRes.json();
    assert(healthData.success === true, 'Health response success: true');
    assert(healthData.data.environment === config.nodeEnv, `Health response environment matches config.nodeEnv (${config.nodeEnv})`);
    assert(healthData.data.status === 'UP', 'Health status is UP');

    // Verify ZERO secrets exposed in payload
    const serialized = JSON.stringify(healthData);
    assert(!serialized.includes(config.jwtSecret), 'Health check does NOT leak JWT secret');
    assert(!serialized.includes('mongodb+srv://'), 'Health check does NOT leak MongoDB URI');
    assert(!serialized.includes('mongodb://'), 'Health check does NOT leak Mongo connection string');
    assert(!serialized.includes(config.cloudinary.apiKey || 'placeholder_check'), 'Health check does NOT leak Cloudinary credentials');
    assert(!serialized.includes(config.brevo.apiKey || 'placeholder_check'), 'Health check does NOT leak Brevo API key');

    // 5. Root endpoint security
    console.log('\n--- 5. Testing Root Welcome Endpoint Security ---');
    const rootRes = await fetch(`${baseUrl}/`);
    assert(rootRes.status === 200, 'GET / returns HTTP 200');
    const rootData = await rootRes.json();
    assert(rootData.status === 'active', 'Root returns active status');
    assert(rootData.version === '1.0.0', 'Root returns version 1.0.0');

  } finally {
    server.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 PRODUCTION ENVIRONMENT AUDIT: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('========================================================================\n');
}

runProductionEnvironmentTests().catch((err) => {
  console.error('❌ Fatal test error:', err);
  process.exit(1);
});

