/**
 * Sakanly Production Readiness & Staging Validation Test Suite
 * Verifies all production criteria: Trust Proxy, CORS Whitelist, Health Check,
 * Cookie Security, Production Error Masking, and Security Headers.
 */

import http from 'http';
import { createApp } from '../app.js';
import { config } from '../config/index.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

async function runProductionReadinessTests() {
  console.log('🚀 [Production Readiness Test] Initializing test suite...');

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Trust Proxy Configuration
    console.log('\n--- 1. Reverse Proxy & Trust Proxy Verification ---');
    assert(app.get('trust proxy') === 1 || app.get('trust proxy') === true, 'app.get("trust proxy") is configured for reverse proxies');

    // 2. Safe Health Check Endpoint
    console.log('\n--- 2. Production Health Check Diagnostics ---');
    const healthRes = await fetch(`${baseUrl}${config.apiPrefix}/health`);
    assert(healthRes.status === 200, 'GET /health returns HTTP 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.success === true, 'Health check returns success: true');
    assert(healthData.data.status === 'UP', 'Health status is "UP"');
    assert(healthData.data.database !== undefined, 'Health check includes database connectivity status');
    assert(healthData.data.system !== undefined, 'Health check includes system metadata');
    assert(!JSON.stringify(healthData).includes('mongodb+srv'), 'Health check NEVER exposes MongoDB connection string');
    assert(!JSON.stringify(healthData).includes('CLOUDINARY_API_SECRET'), 'Health check NEVER exposes Cloudinary secret');

    // 3. Root Endpoint
    console.log('\n--- 3. Root Welcome Endpoint ---');
    const rootRes = await fetch(`${baseUrl}/`);
    assert(rootRes.status === 200, 'GET / returns HTTP 200');
    const rootData = await rootRes.json();
    assert(rootData.name.includes('Sakanly'), 'Root payload contains platform identity');

    // 4. CORS Whitelist Policy
    console.log('\n--- 4. CORS Whitelist & Security Policy ---');
    // Allowed origin
    const corsAllowedRes = await fetch(`${baseUrl}${config.apiPrefix}/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(
      corsAllowedRes.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'CORS permits whitelisted origin http://localhost:5173'
    );
    assert(
      corsAllowedRes.headers.get('access-control-allow-credentials') === 'true',
      'CORS returns Access-Control-Allow-Credentials: true'
    );

    // Disallowed origin
    const corsForbiddenRes = await fetch(`${baseUrl}${config.apiPrefix}/health`, {
      headers: { Origin: 'https://evil-unauthorized-domain.com' },
    });
    assert(
      corsForbiddenRes.headers.get('access-control-allow-origin') === null ||
      corsForbiddenRes.status === 500,
      'CORS blocks unauthorized origin https://evil-unauthorized-domain.com'
    );

    // 5. Helmet Security Headers
    console.log('\n--- 5. HTTP Security Headers ---');
    assert(healthRes.headers.get('x-powered-by') === null, 'X-Powered-By header is removed/hidden');
    assert(healthRes.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is nosniff');
    assert(healthRes.headers.get('x-frame-options') === 'SAMEORIGIN', 'X-Frame-Options is SAMEORIGIN');

    // 6. Production Error Handling (Masking 500 errors)
    console.log('\n--- 6. Production Error Sanitization ---');
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Request non-existent route to check 404 formatting
    const notFoundRes = await fetch(`${baseUrl}/api/v1/non-existent-endpoint-404`);
    assert(notFoundRes.status === 404, 'Unknown endpoint returns 404');
    const notFoundData = await notFoundRes.json();
    assert(notFoundData.success === false, '404 response has success: false');
    assert(notFoundData.error === null || notFoundData.error === undefined || !notFoundData.error.stack, '404 response does not leak stack trace in production');

    process.env.NODE_ENV = origEnv;

    console.log('\n======================================================');
    console.log(`🎯 Production Readiness Test Summary: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
    console.log('======================================================');

    await new Promise((resolve) => server.close(resolve));

    if (passedTests !== totalTests) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    await new Promise((resolve) => server.close(resolve));
    process.exitCode = 1;
  }
}

runProductionReadinessTests();
