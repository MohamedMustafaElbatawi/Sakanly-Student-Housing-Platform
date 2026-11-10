import http from 'http';
import { createApp } from '../expressApp.js';
import {
  normalizeOrigin,
  parseConfiguredOrigins,
  isOriginAllowed,
  isDevelopmentOrigin,
  getAllowedOrigins,
} from '../config/cors.js';

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

async function runCorsTests() {
  console.log('========================================================================');
  console.log('🧪 SAKANLY CORS CONFIGURATION & SECURITY AUDIT TEST SUITE');
  console.log('========================================================================\n');

  // 1. Origin Normalization Unit Tests
  console.log('--- 1. Testing Origin Normalization ---');
  assert(normalizeOrigin('http://localhost:5173/') === 'http://localhost:5173', 'Strips trailing slash from localhost:5173/');
  assert(normalizeOrigin('http://127.0.0.1:5174///') === 'http://127.0.0.1:5174', 'Strips multiple trailing slashes');
  assert(normalizeOrigin('  http://localhost:5174  ') === 'http://localhost:5174', 'Trims whitespace');
  assert(normalizeOrigin('"http://localhost:5173"') === 'http://localhost:5173', 'Strips double quotes');
  assert(normalizeOrigin("'http://localhost:5174'") === 'http://localhost:5174', 'Strips single quotes');
  assert(normalizeOrigin('https://SAKANLY.COM/') === 'https://sakanly.com', 'Normalizes casing to lowercase');
  assert(normalizeOrigin('http://192.168.1.50:5173/') === 'http://192.168.1.50:5173', 'Preserves port and IP');
  assert(normalizeOrigin('') === '', 'Handles empty string safely');
  assert(normalizeOrigin(null) === '', 'Handles null safely');

  // 2. Comma-separated parsing
  console.log('\n--- 2. Testing Comma-Separated Environment Origin Parsing ---');
  const parsed = parseConfiguredOrigins(
    'http://localhost:5173/, http://localhost:5174/ , https://sakanly.com/ ',
    ['http://127.0.0.1:5173', ' "http://127.0.0.1:5174" ']
  );
  assert(parsed.includes('http://localhost:5173'), 'Includes parsed localhost:5173');
  assert(parsed.includes('http://localhost:5174'), 'Includes parsed localhost:5174');
  assert(parsed.includes('https://sakanly.com'), 'Includes parsed https://sakanly.com');
  assert(parsed.includes('http://127.0.0.1:5173'), 'Includes parsed 127.0.0.1:5173');
  assert(parsed.includes('http://127.0.0.1:5174'), 'Includes parsed 127.0.0.1:5174');

  // 3. Allowed Origins Matching
  console.log('\n--- 3. Testing Development Origin Matching ---');
  assert(isOriginAllowed('http://localhost:5173'), 'Permits http://localhost:5173');
  assert(isOriginAllowed('http://localhost:5174'), 'Permits http://localhost:5174 (User Vite Port)');
  assert(isOriginAllowed('http://127.0.0.1:5174'), 'Permits http://127.0.0.1:5174');
  assert(isOriginAllowed('http://192.168.1.120:5173'), 'Permits LAN IP in development (http://192.168.1.120:5173)');
  assert(!isOriginAllowed('https://evil-unauthorized-domain.com'), 'Rejects https://evil-unauthorized-domain.com');
  assert(!isOriginAllowed('http://attacker.com:5174'), 'Rejects http://attacker.com:5174');
  assert(!isOriginAllowed('http://localhost:1337'), 'Rejects non-dev port (http://localhost:1337)');

  // 4. Live HTTP Server CORS Tests
  console.log('\n--- 4. Testing Live HTTP Server with Express CORS Middleware ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 4.1 Test Request from Port 5174 (User's active frontend port)
    const userPortRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: 'http://localhost:5174' },
    });
    assert(userPortRes.status === 200, 'GET /api/v1/health from http://localhost:5174 returns HTTP 200');
    assert(
      userPortRes.headers.get('access-control-allow-origin') === 'http://localhost:5174',
      'access-control-allow-origin matches http://localhost:5174'
    );
    assert(
      userPortRes.headers.get('access-control-allow-credentials') === 'true',
      'access-control-allow-credentials is true for http://localhost:5174'
    );

    // 4.2 Test Request from Port 5173
    const port5173Res = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert(
      port5173Res.headers.get('access-control-allow-origin') === 'http://localhost:5173',
      'access-control-allow-origin matches http://localhost:5173'
    );

    // 4.3 Test Request from 127.0.0.1:5174
    const ipPortRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: 'http://127.0.0.1:5174' },
    });
    assert(
      ipPortRes.headers.get('access-control-allow-origin') === 'http://127.0.0.1:5174',
      'access-control-allow-origin matches http://127.0.0.1:5174'
    );

    // 4.4 Test Preflight OPTIONS Request from Port 5174
    const preflightRes = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    assert(preflightRes.status === 204, 'Preflight OPTIONS request returns HTTP 204 No Content');
    assert(
      preflightRes.headers.get('access-control-allow-origin') === 'http://localhost:5174',
      'Preflight returns matching access-control-allow-origin'
    );
    assert(
      preflightRes.headers.get('access-control-allow-credentials') === 'true',
      'Preflight returns access-control-allow-credentials: true'
    );
    assert(
      preflightRes.headers.get('access-control-allow-methods').includes('POST'),
      'Preflight permits POST method'
    );

    // 4.5 Test Unauthorized Origin
    const unauthorizedRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: 'https://evil-unauthorized-domain.com' },
    });
    assert(
      unauthorizedRes.headers.get('access-control-allow-origin') === null ||
      unauthorizedRes.status === 500,
      'Unauthorized origin receives NO access-control-allow-origin header or HTTP 500 error'
    );

    // 4.6 Test Request with No Origin Header (e.g. mobile app or server-to-server)
    const noOriginRes = await fetch(`${baseUrl}/api/v1/health`);
    assert(noOriginRes.status === 200, 'Request without Origin header is allowed (HTTP 200)');

  } finally {
    server.close();
  }

  console.log('\n========================================================================');
  console.log(`📊 CORS AUDIT TEST SUMMARY: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================================\n');
}

runCorsTests().catch((err) => {
  console.error('Fatal CORS test error:', err);
  process.exit(1);
});

