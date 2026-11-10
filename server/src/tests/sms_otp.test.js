import assert from 'assert';
import {
  normalizeEgyptianPhone,
  toInternationalFormat,
  maskPhoneNumber,
  smsService,
  MockSmsAdapter,
} from '../services/smsService.js';
import {
  requestOwnerPhoneVerificationOtp,
  verifyOwnerPhoneVerificationOtp,
  _resetOtpStoreForTesting,
} from '../services/otpService.js';
import { userStore } from '../data/mockUsers.js';

console.log('🧪 Starting Sakanly SMS & Mobile OTP Verification Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

async function itAsync(description, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ ${description}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

// Ensure mock owner exists for tests
let testOwner = userStore.findByEmail('test_owner_otp@sakanly.com');
if (!testOwner) {
  testOwner = userStore.createUser({
    fullName: 'مالك تجريبي للاختبار',
    email: 'test_owner_otp@sakanly.com',
    password: 'Password123!',
    role: 'owner',
  });
}

// -----------------------------------------------------------------------------
// Suite 1: Phone Normalization & Formatting
// -----------------------------------------------------------------------------
console.log('--- 1. Egyptian Mobile Number Normalization & E.164 Formatting ---');

it('Normalizes 010 (Vodafone Egypt) local format', () => {
  const norm = normalizeEgyptianPhone('01012345678');
  assert.strictEqual(norm, '01012345678');
  assert.strictEqual(toInternationalFormat(norm), '+201012345678');
});

it('Normalizes 011 (Etisalat Misr) international format with +20', () => {
  const norm = normalizeEgyptianPhone('+201123456789');
  assert.strictEqual(norm, '01123456789');
  assert.strictEqual(toInternationalFormat(norm), '+201123456789');
});

it('Normalizes 012 (Orange Egypt) format with 0020 prefix', () => {
  const norm = normalizeEgyptianPhone('00201234567890');
  assert.strictEqual(norm, '01234567890');
  assert.strictEqual(toInternationalFormat(norm), '+201234567890');
});

it('Normalizes 015 (WE / Telecom Egypt) without leading 0', () => {
  const norm = normalizeEgyptianPhone('1512345678');
  assert.strictEqual(norm, '01512345678');
  assert.strictEqual(toInternationalFormat(norm), '+201512345678');
});

it('Rejects non-mobile Egyptian prefixes (e.g. 013 landline, 02 Cairo landline)', () => {
  assert.strictEqual(normalizeEgyptianPhone('01331234567'), null);
  assert.strictEqual(normalizeEgyptianPhone('0227654321'), null);
});

it('Rejects invalid phone lengths or non-numeric strings', () => {
  assert.strictEqual(normalizeEgyptianPhone('0101234'), null);
  assert.strictEqual(normalizeEgyptianPhone('01012345678999'), null);
  assert.strictEqual(normalizeEgyptianPhone('abcdefghijk'), null);
  assert.strictEqual(normalizeEgyptianPhone(''), null);
});

it('Masks phone numbers securely for logs', () => {
  assert.strictEqual(maskPhoneNumber('+201012345678'), '+2010****5678');
  assert.strictEqual(maskPhoneNumber('01012345678'), '01012****5678');
});

// -----------------------------------------------------------------------------
// Suite 2: Unconfigured SMS Gateway Behavior
// -----------------------------------------------------------------------------
console.log('\n--- 2. Unconfigured SMS Provider Handling ---');

await itAsync('Returns HTTP 503 and actionable requiredEnv when provider credentials missing', async () => {
  _resetOtpStoreForTesting();
  const originalProvider = process.env.SMS_PROVIDER;
  const originalSid = process.env.TWILIO_ACCOUNT_SID;
  const originalToken = process.env.TWILIO_AUTH_TOKEN;
  const originalPhone = process.env.TWILIO_PHONE_NUMBER;

  process.env.SMS_PROVIDER = 'twilio';
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;

  try {
    const result = await requestOwnerPhoneVerificationOtp(testOwner.id, '01011112222');
    assert.strictEqual(result.status, 503);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.code, 'SMS_GATEWAY_NOT_CONFIGURED');
    assert(Array.isArray(result.requiredEnv), 'Should return requiredEnv list');
    assert(result.requiredEnv.includes('TWILIO_ACCOUNT_SID'));
  } finally {
    process.env.SMS_PROVIDER = originalProvider;
    if (originalSid) process.env.TWILIO_ACCOUNT_SID = originalSid;
    if (originalToken) process.env.TWILIO_AUTH_TOKEN = originalToken;
    if (originalPhone) process.env.TWILIO_PHONE_NUMBER = originalPhone;
  }
});

// -----------------------------------------------------------------------------
// Suite 3: Mock SMS Delivery & OTP Generation
// -----------------------------------------------------------------------------
console.log('\n--- 3. Real Provider Flow (Mock Adapter Testing) ---');

await itAsync('Successfully dispatches OTP via active SMS adapter and records delivery', async () => {
  _resetOtpStoreForTesting();
  process.env.SMS_PROVIDER = 'mock';
  const mockAdapter = smsService.adapters.mock;
  mockAdapter.clear();

  const result = await requestOwnerPhoneVerificationOtp(testOwner.id, '01011112222');
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.phone, '01011112222');
  assert.strictEqual(result.cooldownSeconds, 60);

  const sent = mockAdapter.getSentMessages();
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].to, '+201011112222');
  assert(/رمز تأكيد رقم هاتف مالك/.test(sent[0].body));
});

// -----------------------------------------------------------------------------
// Suite 4: Cooldown & Rate Limiting Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- 4. Cooldown & Rate Limiting Enforcement ---');

await itAsync('Blocks subsequent OTP requests within 60s cooldown with HTTP 429', async () => {
  // We already sent one in Suite 3
  const immediateResend = await requestOwnerPhoneVerificationOtp(testOwner.id, '01011112222');
  assert.strictEqual(immediateResend.status, 429);
  assert.strictEqual(immediateResend.success, false);
  assert.strictEqual(immediateResend.code, 'COOLDOWN_ACTIVE');
  assert(immediateResend.waitRemaining > 0 && immediateResend.waitRemaining <= 60);
});

// -----------------------------------------------------------------------------
// Suite 5: OTP Verification & Attempt Limits
// -----------------------------------------------------------------------------
console.log('\n--- 5. OTP Verification, Attempt Counter, & Replay Defense ---');

await itAsync('Rejects wrong OTP and decrements remaining attempts', async () => {
  const verifyRes = await verifyOwnerPhoneVerificationOtp(testOwner.id, '01011112222', '000000');
  assert.strictEqual(verifyRes.status, 400);
  assert.strictEqual(verifyRes.success, false);
  assert.strictEqual(verifyRes.code, 'INCORRECT_OTP');
  assert.strictEqual(verifyRes.remainingAttempts, 4);
});

await itAsync('Locks out after 5 consecutive incorrect attempts with HTTP 429', async () => {
  for (let i = 0; i < 3; i++) {
    await verifyOwnerPhoneVerificationOtp(testOwner.id, '01011112222', '000000');
  }
  // 5th failed attempt:
  const lockoutRes = await verifyOwnerPhoneVerificationOtp(testOwner.id, '01011112222', '000000');
  assert.strictEqual(lockoutRes.status, 429);
  assert.strictEqual(lockoutRes.code, 'MAX_ATTEMPTS_EXCEEDED');

  // Verify the record was purged to prevent further brute-force
  const nextAttempt = await verifyOwnerPhoneVerificationOtp(testOwner.id, '01011112222', '000000');
  assert.strictEqual(nextAttempt.status, 400);
  assert.strictEqual(nextAttempt.code, 'OTP_NOT_FOUND');
});

await itAsync('Correct OTP verifies phone and updates userStore, then prevents replay', async () => {
  _resetOtpStoreForTesting();
  const mockAdapter = smsService.adapters.mock;
  mockAdapter.clear();

  // Send new OTP
  const sendRes = await requestOwnerPhoneVerificationOtp(testOwner.id, '01099887766');
  assert.strictEqual(sendRes.status, 200);

  const sent = mockAdapter.getSentMessages();
  assert.strictEqual(sent.length, 1);
  // Extract 6 digit OTP from message body
  const match = sent[0].body.match(/\b\d{6}\b/);
  assert(match, 'Message must contain a 6-digit OTP');
  const validOtp = match[0];

  // Verify with correct OTP
  const verifyRes = await verifyOwnerPhoneVerificationOtp(testOwner.id, '01099887766', validOtp);
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.success, true);
  assert.strictEqual(verifyRes.user.phoneVerified, true);
  assert.strictEqual(verifyRes.user.phone, '01099887766');

  // Check user in store
  const updatedOwner = userStore.findById(testOwner.id);
  assert.strictEqual(updatedOwner.phoneVerified, true);
  assert.strictEqual(updatedOwner.phone, '01099887766');

  // Replay attempt must fail because OTP was consumed
  const replayRes = await verifyOwnerPhoneVerificationOtp(testOwner.id, '01099887766', validOtp);
  assert.strictEqual(replayRes.status, 400);
  assert.strictEqual(replayRes.code, 'OTP_NOT_FOUND');
});

// -----------------------------------------------------------------------------
// Suite 6: RBAC Protection
// -----------------------------------------------------------------------------
console.log('\n--- 6. Role-Based Access Control ---');

await itAsync('Denies non-owner users from requesting owner phone verification', async () => {
  let studentUser = userStore.findByEmail('student_test@sakanly.com');
  if (!studentUser) {
    studentUser = userStore.createUser({
      fullName: 'طالب جامعي للاختبار',
      email: 'student_test@sakanly.com',
      password: 'Password123!',
      role: 'student',
    });
  }

  const result = await requestOwnerPhoneVerificationOtp(studentUser.id, '01011112222');
  assert.strictEqual(result.status, 403);
  assert.strictEqual(result.success, false);
});

console.log(`\n======================================================`);
console.log(`🎉 All SMS & Mobile OTP Verification Tests Passed: ${passedTests}/${totalTests}`);
console.log(`======================================================\n`);
