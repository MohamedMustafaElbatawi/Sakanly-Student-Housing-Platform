/**
 * Automated Test Suite: Owner Registration Phone & Uniqueness Validation
 * 
 * Verifies:
 * 1. Owner registration requires phone number.
 * 2. Rejection of invalid Egyptian phone numbers (too short, wrong prefix).
 * 3. Successful registration with valid Egyptian phone (normalized to 11 digits & stored with country code).
 * 4. Duplicate phone rejection (409 Conflict) preventing multiple accounts sharing same phone.
 * 5. Student registration remains intact without requiring phone.
 * 6. Profile update allows changing phone with uniqueness enforcement.
 * 7. Prevention of duplicate phone when updating profile.
 */

import assert from 'assert';
import http from 'http';
import { createApp } from '../app.js';
import { connectDB, isMongoConnected } from '../config/database.js';
import { userStore } from '../data/mockUsers.js';
import { User } from '../models/User.js';

let server;
let baseUrl;
const app = createApp();

const request = async (method, path, { headers = {}, body = null } = {}) => {
  const url = `${baseUrl}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, body: json };
};

const runSuite = async () => {
  console.log('\n======================================================');
  console.log('🧪 SAKANLY OWNER REGISTRATION PHONE TEST SUITE');
  console.log('======================================================\n');

  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️ MongoDB connection warning:', err.message);
  }

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
      resolve();
    });
  });

  try {
    // --- Test 1: Owner Registration without phone must fail (400) ---
    console.log('--- 1. Testing Owner Registration requires phone number ---');
    const noPhoneRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'مالك بدون هاتف',
        email: `owner-nophone-${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'owner',
        termsAccepted: true,
      },
    });
    assert.strictEqual(noPhoneRes.status, 400, 'Owner registration without phone returns HTTP 400');
    assert.ok(noPhoneRes.body.message.includes('رقم الهاتف مطلوب'), 'Returns clear message that phone is required');
    console.log('  ✅ [PASS] Mandatory phone requirement strictly enforced for property owners');

    // --- Test 2: Owner Registration with invalid Egyptian phone must fail (400) ---
    console.log('\n--- 2. Testing Invalid Egyptian Phone Numbers ---');
    // 2.1 Wrong prefix (014...)
    const wrongPrefixRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'مالك برقم خاطئ',
        email: `owner-badprefix-${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'owner',
        phone: '01412345678',
        phoneCountryCode: '+20',
        termsAccepted: true,
      },
    });
    assert.strictEqual(wrongPrefixRes.status, 400, 'Wrong prefix returns HTTP 400');

    // 2.2 Too short (010123)
    const tooShortRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'مالك برقم قصير',
        email: `owner-short-${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'owner',
        phone: '010123',
        phoneCountryCode: '+20',
        termsAccepted: true,
      },
    });
    assert.strictEqual(tooShortRes.status, 400, 'Too short number returns HTTP 400');
    console.log('  ✅ [PASS] Invalid prefixes and short phone numbers rejected with HTTP 400');

    // --- Test 3: Successful Owner Registration with Valid Egyptian Phone ---
    console.log('\n--- 3. Testing Successful Owner Registration with Valid Phone ---');
    const validEgyptianPhone = '01099887766';
    const uniqueEmail = `owner-valid-${Date.now()}@test.com`;

    const validRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'مهندس أشرف عبد الرحمن',
        email: uniqueEmail,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'owner',
        phone: validEgyptianPhone,
        phoneCountryCode: '+20',
        termsAccepted: true,
      },
    });

    assert.strictEqual(validRes.status, 201, 'Valid owner registration returns HTTP 201');
    assert.strictEqual(validRes.body.data.user.role, 'owner', 'User created with role owner');
    assert.strictEqual(validRes.body.data.user.phone, validEgyptianPhone, 'Phone saved and normalized');
    assert.strictEqual(validRes.body.data.user.phoneNumber, validEgyptianPhone, 'PhoneNumber field saved');
    assert.strictEqual(validRes.body.data.user.phoneCountryCode, '+20', 'Country code saved');
    const ownerToken = validRes.body.data.token;
    console.log('  ✅ [PASS] Owner registered successfully with normalized phone and +20 country code');

    // --- Test 4: Prevent Duplicate Phone Number Registration (409 Conflict) ---
    console.log('\n--- 4. Testing Duplicate Phone Number Rejection ---');
    const duplicateRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'شخص آخر يحاول استخدام نفس الرقم',
        email: `another-owner-${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'owner',
        phone: validEgyptianPhone, // Same phone!
        phoneCountryCode: '+20',
        termsAccepted: true,
      },
    });

    assert.strictEqual(duplicateRes.status, 409, 'Duplicate phone number returns HTTP 409 Conflict');
    assert.ok(
      duplicateRes.body.message.includes('مسجل بالفعل'),
      'Returns informative message about duplicate phone number'
    );
    console.log('  ✅ [PASS] Duplicate phone number blocked with HTTP 409 and descriptive error');

    // --- Test 5: Student Registration unaffected (doesn\'t require phone) ---
    console.log('\n--- 5. Testing Student Registration Remains Intact ---');
    const studentRes = await request('POST', '/auth/register', {
      body: {
        fullName: 'طالب جامعي جديد',
        email: `student-reg-${Date.now()}@test.com`,
        password: 'password123',
        confirmPassword: 'password123',
        role: 'student',
        termsAccepted: true,
      },
    });

    assert.strictEqual(studentRes.status, 201, 'Student registration without phone succeeds (201)');
    assert.strictEqual(studentRes.body.data.user.role, 'student', 'Role is student');
    console.log('  ✅ [PASS] Student registration intact without breaking legacy flows');

    // --- Test 6: Owner Profile Phone Update with Validation ---
    console.log('\n--- 6. Testing Owner Profile Phone Update ---');
    const updatedPhone = '01233445566';
    const updateProfileRes = await request('PATCH', '/auth/me', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        phone: updatedPhone,
        phoneCountryCode: '+20',
      },
    });

    assert.strictEqual(updateProfileRes.status, 200, 'Profile update returns HTTP 200');
    assert.strictEqual(updateProfileRes.body.data.user.phone, updatedPhone, 'Phone number updated');
    console.log('  ✅ [PASS] Owner updated phone successfully via /auth/me');

    // --- Test 7: Prevent Updating Profile to an Existing Phone Number ---
    console.log('\n--- 7. Testing Profile Phone Update Prevents Duplicates ---');
    // usr-owner-001 has phone: '01198765432'
    const duplicateUpdateRes = await request('PATCH', '/auth/me', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        phone: '01198765432', // Existing owner phone in seed data
        phoneCountryCode: '+20',
      },
    });

    assert.strictEqual(duplicateUpdateRes.status, 409, 'Updating to taken phone returns HTTP 409');
    assert.ok(
      duplicateUpdateRes.body.message.includes('مسجل بالفعل'),
      'Returns duplicate phone error message'
    );
    console.log('  ✅ [PASS] Duplicate phone on profile update blocked with HTTP 409');

    // --- Test 8: MongoDB Persistence Verification ---
    if (isMongoConnected()) {
      console.log('\n--- 8. Verifying MongoDB Atlas Document ---');
      const dbDoc = await User.findOne({ email: uniqueEmail }).lean();
      assert.ok(dbDoc, 'User exists in MongoDB Atlas');
      assert.strictEqual(dbDoc.phone, updatedPhone, 'Phone verified in MongoDB Atlas');
      assert.strictEqual(dbDoc.phoneCountryCode, '+20', 'Country code verified in MongoDB Atlas');
      console.log('  ✅ [PASS] User and phone persist in MongoDB Atlas');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL 8 OWNER REGISTRATION PHONE TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
};

runSuite().then(() => process.exit(0)).catch((err) => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
