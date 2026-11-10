import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import serverlessHandler, { extractNormalizedPathname, isPublicExemptedRoute } from '../../api/index.js';
import { createApp } from '../expressApp.js';
import { connectDB, disconnectDB, isMongoConnected } from '../config/database.js';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function requestHttp(serverUrl, urlPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, serverUrl);
    const req = http.request(url, { method }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let body = null;
        try {
          body = JSON.parse(rawData);
        } catch {
          body = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runVercelRoutingTests() {
  console.log('========================================================================');
  console.log('🧪 SAKANLY VERCEL SERVERLESS & EXPRESS ARCHITECTURE AUDIT');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. URL Path Normalization and Public Route Exemption Helper Tests
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing Path Normalization & Public Route Exemption ---');
  assert(extractNormalizedPathname('/') === '/', 'extracts "/" from "/"');
  assert(extractNormalizedPathname('/health?check=1') === '/health', 'extracts "/health" from "/health?check=1"');
  assert(extractNormalizedPathname('/health/?timestamp=123') === '/health', 'strips trailing slash with query string');
  assert(extractNormalizedPathname('/api/v1/health?debug=true') === '/api/v1/health', 'extracts "/api/v1/health" with query');
  assert(extractNormalizedPathname('/api/v1/listings?city=cairo') === '/api/v1/listings', 'extracts data route path');
  assert(isPublicExemptedRoute('/') === true, 'route "/" is public exempted');
  assert(isPublicExemptedRoute('/health') === true, 'route "/health" is public exempted');
  assert(isPublicExemptedRoute('/api/v1/health') === true, 'route "/api/v1/health" is public exempted');
  assert(isPublicExemptedRoute('/api/v1/listings') === false, 'data route "/api/v1/listings" is NOT exempted');

  // ---------------------------------------------------------------------------
  // 2. Vercel Auto-Detection Heuristics Defense & File Architecture Checks
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing File Architecture (Zero Vercel Collision Defense) ---');
  const legacyAppPath = path.resolve(__dirname, '../app.js');
  const legacyServerPath = path.resolve(__dirname, '../server.js');
  const expressAppPath = path.resolve(__dirname, '../expressApp.js');
  const localServerPath = path.resolve(__dirname, '../localServer.js');

  assert(!fs.existsSync(legacyAppPath), 'server/src/app.js is permanently removed to prevent Vercel auto-detection');
  assert(!fs.existsSync(legacyServerPath), 'server/src/server.js is permanently removed to prevent Vercel auto-detection');
  assert(fs.existsSync(expressAppPath), 'server/src/expressApp.js exists as dedicated internal Express module');
  assert(fs.existsSync(localServerPath), 'server/src/localServer.js exists as dedicated local development entry');

  // Verify expressApp.js has named createApp and NO default export
  const expressAppModule = await import('../expressApp.js');
  assert(typeof expressAppModule.createApp === 'function', 'expressApp.js exports named createApp() factory function');
  assert(expressAppModule.default === undefined, 'expressApp.js has NO default export (does not pretend to be a serverless function)');

  // ---------------------------------------------------------------------------
  // 3. Serverless Handler HTTP Routing Tests (Healthy Environment)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing server/api/index.js as Sole Serverless Entrypoint ---');
  await connectDB();

  const serverlessServer = http.createServer((req, res) => serverlessHandler(req, res));
  await new Promise((resolve) => serverlessServer.listen(0, '127.0.0.1', resolve));
  const serverlessUrl = `http://127.0.0.1:${serverlessServer.address().port}`;

  try {
    // 3.1 Root endpoint /
    const rootRes = await requestHttp(serverlessUrl, '/');
    assert(rootRes.statusCode === 200, 'GET / returns HTTP 200 OK');
    assert(rootRes.body?.status === 'active', 'GET / returns status: active');
    assert(rootRes.body?.name === 'Sakanly | سكنلي API', 'GET / returns name: "Sakanly | سكنلي API"');
    assert(rootRes.body?.documentation === '/api/v1/health', 'GET / returns documentation: "/api/v1/health"');

    // 3.2 Root endpoint with query string
    const rootQueryRes = await requestHttp(serverlessUrl, '/?ref=monitoring&timestamp=123');
    assert(rootQueryRes.statusCode === 200, 'GET /?ref=monitoring returns HTTP 200 OK');

    // 3.3 /health with query string
    const healthRes = await requestHttp(serverlessUrl, '/health?check=1&foo=bar');
    assert(healthRes.statusCode === 200, 'GET /health?check=1 returns HTTP 200 OK directly (no 500 error)');
    assert(healthRes.body?.success === true, 'GET /health response has success: true');
    assert(healthRes.body?.data?.status === 'UP', 'GET /health response data.status is "UP"');

    // 3.4 /api/v1/health with query string
    const apiHealthRes = await requestHttp(serverlessUrl, '/api/v1/health?probe=active');
    assert(apiHealthRes.statusCode === 200, 'GET /api/v1/health?probe=active returns HTTP 200 OK');
    assert(apiHealthRes.body?.success === true, 'GET /api/v1/health response has success: true');

    // 3.5 Data route
    const listingsRes = await requestHttp(serverlessUrl, '/api/v1/listings');
    assert(listingsRes.statusCode === 200, 'GET /api/v1/listings returns HTTP 200 OK');
    assert(Array.isArray(listingsRes.body?.data?.listings || listingsRes.body?.data), 'GET /api/v1/listings returns listings array');
  } finally {
    serverlessServer.close();
  }

  // ---------------------------------------------------------------------------
  // 4. MongoDB Lifecycle: Connection, Cache Reuse, Disconnection & Concurrent Calls
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testing MongoDB Lifecycle, Cache & Concurrent Requests ---');

  // 4.1 Connection state check & cache verification
  const isConnectedInitially = isMongoConnected();
  if (isConnectedInitially) {
    assert(isMongoConnected() === true, 'isMongoConnected() reflects active connection (readyState === 1)');
    assert(global.mongooseCache.conn !== null, 'global cache conn holds active mongoose instance');
  } else {
    assert(isMongoConnected() === false, 'isMongoConnected() reflects disconnected/fallback mode');
  }

  // 4.2 Multiple Concurrent Requests (Connection Promise Sharing)
  console.log('  Testing concurrent connectDB invocations:');
  const concurrentPromises = [connectDB(), connectDB(), connectDB(), connectDB(), connectDB()];
  const concurrentResults = await Promise.all(concurrentPromises);
  assert(
    concurrentResults.every((res) => res === concurrentResults[0]),
    'All 5 concurrent connectDB calls resolve consistently without race conditions'
  );

  // 4.3 Disconnection after Initial Connection
  console.log('  Testing disconnection handling:');
  if (isMongoConnected()) {
    await disconnectDB();
  }
  assert(isMongoConnected() === false, 'isMongoConnected() strictly returns false after disconnectDB');
  assert(global.mongooseCache.conn === null, 'global cache conn is cleared on disconnect');
  assert(global.mongooseCache.promise === null, 'global cache promise is cleared on disconnect');

  // 4.4 Initial Connection Failure Simulation (Unreachable URI)
  console.log('  Testing initial connection failure handling:');
  const failureConnected = await connectDB('mongodb://127.0.0.1:59999/test_unreachable', {
    serverSelectionTimeoutMS: 500,
  });
  assert(failureConnected === false, 'connectDB gracefully returns false on unreachable database');
  assert(isMongoConnected() === false, 'isMongoConnected() remains false after connection failure');
  assert(global.mongooseCache.conn === null, 'global cache conn is null on connection failure');
  assert(global.mongooseCache.promise === null, 'global cache promise is null on connection failure');

  // ---------------------------------------------------------------------------
  // 5. Database Outage Simulation in Production Mode (HTTP 503 Guard)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testing Database Outage Simulation & HTTP 503 Guard ---');
  if (isMongoConnected()) {
    await disconnectDB();
  }

  const origNodeEnv = process.env.NODE_ENV;
  const origMongoUri = config.mongoUri;
  const origEnvUri = process.env.MONGODB_URI;

  // Force production mode and unreachable DB URI with fast timeout
  process.env.NODE_ENV = 'production';
  config.mongoUri = 'mongodb://127.0.0.1:59999/unreachable_db?serverSelectionTimeoutMS=400';
  process.env.MONGODB_URI = config.mongoUri;
  delete process.env.MONGO_URI;

  const outageServer = http.createServer((req, res) => serverlessHandler(req, res));
  await new Promise((resolve) => outageServer.listen(0, '127.0.0.1', resolve));
  const outageUrl = `http://127.0.0.1:${outageServer.address().port}`;

  try {
    // 5.1 Public root endpoint remains functional (HTTP 200) during DB outage
    const outageRootRes = await requestHttp(outageUrl, '/');
    assert(outageRootRes.statusCode === 200, 'GET / responds HTTP 200 during DB outage (stateless metadata)');
    assert(outageRootRes.body?.status === 'active', 'GET / returns status: active during DB outage');

    // 5.2 Public health endpoint with query string remains functional during DB outage
    const outageHealthRes = await requestHttp(outageUrl, '/health?probe=outage');
    assert(outageHealthRes.statusCode === 200, 'GET /health?probe=outage responds HTTP 200 during DB outage (no 500 error)');
    assert(
      outageHealthRes.body?.data?.database === 'disconnected' || outageHealthRes.body?.data?.database === 'in-memory-fallback',
      'Health endpoint accurately reports database is disconnected/in-memory during outage'
    );

    // 5.3 Data route strictly returns HTTP 503 DATABASE_UNAVAILABLE in production
    const outageDataRes = await requestHttp(outageUrl, '/api/v1/listings');
    assert(outageDataRes.statusCode === 503, 'GET /api/v1/listings returns HTTP 503 during DB outage in production');
    assert(outageDataRes.body?.code === 'DATABASE_UNAVAILABLE', 'Returns code DATABASE_UNAVAILABLE');
    assert(outageDataRes.body?.success === false, 'Returns success: false');
  } finally {
    process.env.NODE_ENV = origNodeEnv;
    config.mongoUri = origMongoUri;
    if (origEnvUri) {
      process.env.MONGODB_URI = origEnvUri;
    }
    outageServer.close();
  }

  // Re-establish clean DB connection for any subsequent tests
  await connectDB();

  console.log('\n========================================================================');
  console.log(`📊 VERCEL SERVERLESS & EXPRESS ARCHITECTURE AUDIT: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('========================================================================\n');

  // Explicit clean exit
  process.exit(passedTests === totalTests ? 0 : 1);
}

runVercelRoutingTests().catch(async (err) => {
  console.error('❌ Fatal Vercel Routing test error:', err);
  if (isMongoConnected()) {
    await disconnectDB();
  }
  process.exit(1);
});
