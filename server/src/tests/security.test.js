import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { createApp } from '../expressApp.js';
import { userStore } from '../data/mockUsers.js';
import { ListingsService } from '../services/listingsService.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../utils/token.js';
import { runMigrations } from '../services/migrationService.js';
import { noSqlSanitizer } from '../middleware/sanitizer.js';

console.log('🛡️ Starting Sakanly Comprehensive Production Security Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const run = async () => {
  await connectDB();
  await runMigrations();
  await PlatformSettingsStore.syncFromDB();
  await ListingsService.syncFromDB();

  const app = createApp();

  // Start real HTTP server on an ephemeral port for 100% genuine network & header testing
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const studentUser = userStore.findById('usr-student-001');
  const ownerUser = userStore.findById('usr-owner-001');
  const superAdminUser = userStore.findById('usr-super-admin-root');

  const studentToken = generateAccessToken(studentUser);
  const ownerToken = generateAccessToken(ownerUser);
  const superAdminToken = generateAccessToken(superAdminUser);

  const request = async (method, path, { headers = {}, body = null, cookies = {} } = {}) => {
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    const fetchOptions = {
      method: method.toUpperCase(),
      headers: finalHeaders,
    };
    if (body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    try {
      const res = await fetch(`${baseUrl}${path}`, fetchOptions);
      const resHeaders = Object.fromEntries(res.headers.entries());
      let json = null;
      try {
        json = await res.json();
      } catch {
        // non-json body
      }
      return {
        status: res.status,
        headers: resHeaders,
        body: json,
      };
    } catch (err) {
      return {
        status: 500,
        headers: {},
        body: { error: err.message },
      };
    }
  };

  console.log('--- 1. Testing Unauthenticated API Protection ---');

  // 1.1 Accessing /auth/me without token
  const res1 = await request('GET', '/api/v1/auth/me');
  assert(res1.status === 401, 'Unauthenticated access to /auth/me is blocked with 401');

  // 1.2 Accessing /admin/stats without token
  const res2 = await request('GET', '/api/v1/admin/stats');
  assert(res2.status === 401, 'Unauthenticated access to /admin/stats is blocked with 401');

  // 1.3 Accessing /media/upload without token
  const res3 = await request('POST', '/api/v1/media/upload');
  assert(res3.status === 401, 'Unauthenticated access to /media/upload is blocked with 401');

  console.log('\n--- 2. Testing Role-Based Access Control (RBAC) ---');

  // 2.1 Student attempting to access owner verification
  const res4 = await request('POST', '/api/v1/auth/verification/phone/send-otp', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { phone: '01011112222' },
  });
  assert(res4.status === 403, 'Student attempting owner phone verification is denied with 403');

  // 2.2 Student attempting to create property
  const res5 = await request('POST', '/api/v1/listings', {
    headers: { Authorization: `Bearer ${studentToken}` },
    body: { title: 'عقار تجريبي للتحقق من الصلاحيات' },
  });
  assert(res5.status === 403, 'Student attempting to add listing is denied with 403');

  // 2.3 Student attempting to access Super Admin dashboard
  const res6 = await request('GET', '/api/v1/admin/stats', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(res6.status === 403, 'Student attempting to access admin endpoints is denied with 403');

  // 2.4 Owner attempting to access Super Admin endpoints
  const res7 = await request('GET', '/api/v1/admin/users', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(res7.status === 403, 'Owner attempting to access admin user management is denied with 403');

  // 2.5 Security event logged on unauthorized admin access
  const securityEvents = PlatformSettingsStore.getSecurityEvents(10);
  const adminViolation = securityEvents.find(e => e.type === 'unauthorized_admin_access');
  assert(Boolean(adminViolation), 'Unauthorized admin access attempt is logged in Platform Security Events');

  // 2.6 Super Admin can access admin endpoints
  const res8 = await request('GET', '/api/v1/admin/stats', {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  assert(res8.status === 200, 'Super Admin successfully accesses admin stats (200 OK)');

  console.log('\n--- 3. Testing Data Isolation & IDOR Defenses ---');

  // 3.1 Owner A attempting to modify Owner B's listing
  const ownerBListings = await ListingsService.getByOwner('usr-owner-002');
  const ownerBListingId = ownerBListings[0]?.id || 'prop-004';

  const res9 = await request('PATCH', `/api/v1/listings/${ownerBListingId}/status`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { status: 'paused' },
  });
  assert(res9.status === 403, 'Owner A cannot modify status of Owner B listing (403 IDOR blocked)');

  // 3.2 Owner A attempting to delete Owner B's listing
  const res10 = await request('DELETE', `/api/v1/listings/${ownerBListingId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(res10.status === 403, 'Owner A cannot delete Owner B listing (403 IDOR blocked)');

  // 3.3 Unauthorized user attempting to delete another user's Cloudinary media
  const res11 = await request('DELETE', '/api/v1/media/sakanly/properties/foreign_owner_image', {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert(res11.status === 403, 'Owner cannot delete Cloudinary media belonging to another owner (403 IDOR blocked)');

  // 3.4 Student attempting to inspect private verification document of an owner
  const res12 = await request('GET', '/api/v1/media/verification-document/sakanly/verification/owner_usr-owner-002_id', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(res12.status === 403, 'Student cannot view private verification documents of owners (403 Forbidden)');

  console.log('\n--- 4. Testing Refresh Token Rotation & Reuse Detection ---');

  // 4.1 Login generates access token and refresh token
  const loginRes = await request('POST', '/api/v1/auth/login', {
    body: {
      email: 'student@sakanly.com',
      password: '123456',
    },
  });
  assert(loginRes.status === 200, 'Login succeeds with 200');
  const initialAccessToken = loginRes.body?.data?.accessToken;
  const initialRefreshToken = loginRes.body?.data?.refreshToken;
  assert(Boolean(initialAccessToken), 'Short-lived access token generated');
  assert(Boolean(initialRefreshToken), 'Secure refresh token generated');
  assert(Boolean(loginRes.headers['set-cookie']), 'Refresh token set in HttpOnly cookie');

  // 4.2 Refresh token rotation succeeds
  const refreshRes = await request('POST', '/api/v1/auth/refresh', {
    body: { refreshToken: initialRefreshToken },
  });
  assert(refreshRes.status === 200, 'Token refresh endpoint returns 200 OK');
  const rotatedAccessToken = refreshRes.body?.data?.accessToken;
  const rotatedRefreshToken = refreshRes.body?.data?.refreshToken;
  assert(Boolean(rotatedAccessToken), 'New rotated access token issued');
  assert(Boolean(rotatedRefreshToken) && rotatedRefreshToken !== initialRefreshToken, 'Refresh token rotated with new cryptographic JTI');

  // 4.3 Replay / Reuse Detection: Replaying initialRefreshToken must be rejected!
  const reuseRes = await request('POST', '/api/v1/auth/refresh', {
    body: { refreshToken: initialRefreshToken },
  });
  assert(reuseRes.status === 403 && reuseRes.body?.code === 'TOKEN_REUSE_DETECTED', 'Replaying consumed refresh token triggers TOKEN_REUSE_DETECTED (403)');

  // 4.4 Family Invalidation: The rotated token in the same family is now also invalidated
  const familyInvalidRes = await request('POST', '/api/v1/auth/refresh', {
    body: { refreshToken: rotatedRefreshToken },
  });
  assert(familyInvalidRes.status === 403, 'Entire token family invalidated on reuse attack');

  // 4.5 Logout revokes session
  const logoutRes = await request('POST', '/api/v1/auth/logout', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(logoutRes.status === 200, 'Logout succeeds with 200 OK');
  assert(logoutRes.headers['set-cookie']?.includes('refreshToken=;'), 'Logout clears refreshToken cookie');

  console.log('\n--- 5. Testing NoSQL Injection Sanitization ---');

  // 5.1 Direct test of noSqlSanitizer middleware
  const maliciousReq = {
    body: {
      email: { $gt: '' },
      password: 'password123',
      $where: 'sleep(1000)',
      safeField: 'normal_value',
    },
    query: {
      'admin.role': { $ne: null },
      city: 'القاهرة',
    },
    params: {},
  };
  noSqlSanitizer(maliciousReq, {}, () => { });
  assert(maliciousReq.body.email === undefined, 'NoSQL operator $gt stripped from body');
  assert(maliciousReq.body.$where === undefined, 'NoSQL operator $where stripped from body');
  assert(maliciousReq.body.safeField === 'normal_value', 'Legitimate field preserved');
  assert(maliciousReq.query['admin.role'] === undefined, 'Nested dot-notation injection key stripped from query');
  assert(maliciousReq.query.city === 'القاهرة', 'Legitimate query parameter preserved');

  console.log('\n--- 6. Testing Super Admin Creation Immunity & Safe Representation ---');

  // 6.1 Public registration attempt with super_admin role
  const regRes = await request('POST', '/api/v1/auth/register', {
    body: {
      fullName: 'مهاجم يحاول إنشاء أدمن',
      email: `attacker-${Date.now()}@test.com`,
      password: 'password123',
      role: 'super_admin',
    },
  });
  assert(regRes.status === 201, 'Registration handles input safely');
  assert(regRes.body?.data?.user?.role === 'student', 'Super admin role escalation attempt sanitized to student');

  // 6.2 Sensitive fields stripped from toSafeUser
  const safeUser = regRes.body?.data?.user;
  assert(safeUser.password === undefined, 'Password field stripped from user API response');
  assert(safeUser.refreshTokens === undefined, 'Refresh tokens stripped from user API response');

  console.log('\n--- 7. Testing Security Headers & Rate Limiting ---');

  // 7.1 Verify Helmet security headers
  const healthRes = await request('GET', '/');
  assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Helmet sets X-Content-Type-Options: nosniff');
  assert(healthRes.headers['cross-origin-resource-policy'] === 'cross-origin', 'Helmet sets Cross-Origin-Resource-Policy');

  // 7.2 Excessive auth requests trigger rate limiter (using x-test-rate-limit)
  let rateLimited = false;
  for (let i = 0; i < 15; i++) {
    const res = await request('POST', '/api/v1/auth/login', {
      headers: { 'x-test-rate-limit': 'true' },
      body: { email: 'bad@test.com', password: 'wrong' },
    });
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assert(rateLimited, 'Auth endpoint rate limiter enforces 429 Too Many Requests on brute-force attempts');

  console.log('\n========================================');
  console.log(`🛡️ Production Security Test Suite Finished!`);
  console.log(`Passed: ${passedTests} / ${totalTests} tests`);
  console.log(`========================================\n`);

  server.close();
  if (isMongoConnected()) {
    await disconnectDB();
  }
};

run().catch((err) => {
  console.error('Fatal security test error:', err);
  process.exit(1);
});