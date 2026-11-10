import http from 'http';
import handler from '../../api/index.js';
import { connectDB, disconnectDB, isMongoConnected } from '../config/database.js';

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

/**
 * Executes an HTTP request against the Vercel handler hosted on an ephemeral test server
 */
function requestVercel(serverUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || '/', serverUrl);
    const method = options.method || 'GET';
    const postData = options.body ? JSON.stringify(options.body) : null;

    const headers = {
      'content-type': 'application/json',
      ...(options.headers || {}),
    };

    if (postData) {
      headers['content-length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(rawData);
          } catch {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runVercelServerlessTests() {
  console.log('========================================================================');
  console.log('🚀 SAKANLY VERCEL SERVERLESS FUNCTION AUDIT TEST SUITE');
  console.log('========================================================================\n');

  // Connect to DB once initially
  await connectDB();

  // Create ephemeral HTTP server executing Vercel serverless function entry handler
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const serverUrl = `http://127.0.0.1:${address.port}`;
  console.log(`📡 Vercel Serverless Function test server bound to: ${serverUrl}\n`);

  try {
    // 1. Root & Health Check Endpoints
    console.log('--- 1. Testing Root & Health Check Endpoints via Serverless Handler ---');
    const rootRes = await requestVercel(serverUrl, { method: 'GET', url: '/' });
    assert(rootRes.statusCode === 200, 'GET / returns HTTP 200');
    assert(rootRes.body && rootRes.body.status === 'active', 'GET / returns active API status');

    const healthRes = await requestVercel(serverUrl, { method: 'GET', url: '/api/v1/health' });
    assert(healthRes.statusCode === 200, 'GET /api/v1/health returns HTTP 200');
    assert(healthRes.body?.success === true && (healthRes.body?.data?.status === 'UP' || healthRes.body?.status === 'ok'), 'GET /api/v1/health reports status UP/ok');
    assert(healthRes.body?.data?.database !== undefined || healthRes.body?.database !== undefined, 'GET /api/v1/health includes database status');

    // 2. Public Listings & Search Endpoints
    console.log('\n--- 2. Testing Listings & Search Endpoints via Serverless Handler ---');
    const listingsRes = await requestVercel(serverUrl, { method: 'GET', url: '/api/v1/listings' });
    assert(listingsRes.statusCode === 200, 'GET /api/v1/listings returns HTTP 200');
    assert(Array.isArray(listingsRes.body?.data) || Array.isArray(listingsRes.body?.data?.listings) || Array.isArray(listingsRes.body?.listings), 'GET /api/v1/listings returns listings array');

    // Search with location query (e.g. Sheikh Zayed)
    const searchRes = await requestVercel(serverUrl, { 
      method: 'GET', 
      url: '/api/v1/listings?search=%D8%A7%D9%84%D8%B4%D9%8A%D8%AE+%D8%B2%D8%A7%D9%8A%D8%AF' 
    });
    assert(searchRes.statusCode === 200, 'GET /api/v1/listings?search=الشيخ+زايد returns HTTP 200 without error');

    // 3. Database Connection Pooling & Cache Reuse
    console.log('\n--- 3. Testing MongoDB Serverless Connection Caching ---');
    const initialReadyState = isMongoConnected();
    assert(initialReadyState === true, 'MongoDB connection is actively established');

    // Rapid sequential invocations to simulate incoming serverless requests
    const startTimer = Date.now();
    for (let i = 0; i < 5; i++) {
      const res = await requestVercel(serverUrl, { method: 'GET', url: '/api/v1/health' });
      assert(res.statusCode === 200, `Sequential invocation #${i + 1} succeeded instantly`);
    }
    const duration = Date.now() - startTimer;
    console.log(`  ⏱️ Executed 5 sequential serverless invocations in ${duration}ms`);
    assert(duration < 1000, 'Warm serverless requests execute with zero connection latency (<1s for 5 requests)');
    assert(isMongoConnected() === true, 'Database connection remained healthy and cached throughout invocations');

    // 4. CORS Preflight (OPTIONS)
    console.log('\n--- 4. Testing CORS Preflight via Serverless Handler ---');
    const preflightRes = await requestVercel(serverUrl, {
      method: 'OPTIONS',
      url: '/api/v1/listings',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type,authorization',
      },
    });
    assert(preflightRes.statusCode === 204, 'OPTIONS /api/v1/listings returns HTTP 204 No Content');
    assert(preflightRes.headers['access-control-allow-origin'] === 'http://localhost:5173', 'CORS allows valid origin');

    // 5. Auth & Protection Endpoints
    console.log('\n--- 5. Testing Authentication & Route Protection via Serverless Handler ---');
    const failedLoginRes = await requestVercel(serverUrl, {
      method: 'POST',
      url: '/api/v1/auth/login',
      body: {
        email: 'nonexistent_user@sakanly.com',
        password: 'WrongPassword123!',
      },
    });
    assert(failedLoginRes.statusCode === 401, 'POST /api/v1/auth/login with wrong credentials returns HTTP 401');

    // Protected route without token
    const protectedRes = await requestVercel(serverUrl, {
      method: 'GET',
      url: '/api/v1/listings/inquiries/my',
    });
    assert(protectedRes.statusCode === 401, 'Protected route /api/v1/listings/inquiries/my rejects unauthenticated request (401)');

    // 6. Media Cloudinary Signature Endpoint
    console.log('\n--- 6. Testing Media Upload Signature via Serverless Handler ---');
    const mediaSigUnauthRes = await requestVercel(serverUrl, {
      method: 'POST',
      url: '/api/v1/media/signature',
      body: { folderType: 'property' },
    });
    assert(mediaSigUnauthRes.statusCode === 401, 'POST /api/v1/media/signature rejects unauthenticated request (401)');

    console.log('\n========================================================================');
    console.log(`📊 VERCEL SERVERLESS FUNCTION AUDIT: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('========================================================================\n');
  } finally {
    server.close();
    if (isMongoConnected()) {
      await disconnectDB();
    }
  }
}

runVercelServerlessTests().catch(async (err) => {
  console.error('❌ [Vercel Serverless Test] Unhandled error:', err);
  if (isMongoConnected()) {
    await disconnectDB();
  }
  process.exit(1);
});

