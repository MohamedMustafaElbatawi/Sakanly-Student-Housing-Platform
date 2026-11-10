import assert from 'assert';
import {
  brevoService,
  maskEmail,
  buildVerificationOtpEmailHtml,
} from '../services/brevoService.js';
import {
  requestOwnerEmailVerificationOtp,
  verifyOwnerEmailVerificationOtp,
  _resetOtpStoreForTesting,
} from '../services/otpService.js';
import { userStore } from '../data/mockUsers.js';

console.log('🧪 Starting Sakanly Brevo Email OTP Verification Test Suite...\n');

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

// Ensure test owner exists
let testOwner = userStore.findByEmail('test_owner_brevo@sakanly.com');
if (!testOwner) {
  testOwner = userStore.createUser({
    fullName: 'مالك تجريبي لفحص بريفو',
    email: 'test_owner_brevo@sakanly.com',
    password: 'SecurePassword123!',
    role: 'owner',
  });
}

// -----------------------------------------------------------------------------
// Suite 1: Privacy Masking & Template Rendering
// -----------------------------------------------------------------------------
console.log('--- 1. Email Privacy Masking & Arabic HTML Template ---');

it('Masks email addresses properly for security logs', () => {
  assert.strictEqual(maskEmail('mido@example.com'), 'm**o@example.com');
  assert.strictEqual(maskEmail('a@b.com'), 'a*@b.com');
  assert.strictEqual(maskEmail('owner.verification@sakanly.com'), 'o****n@sakanly.com');
  assert.strictEqual(maskEmail('invalid'), '***@***');
});

it('Builds high-contrast Arabic HTML template with OTP and expiry', () => {
  const html = buildVerificationOtpEmailHtml({ name: 'أحمد', otp: '789123', expiryMinutes: 10 });
  assert(html.includes('789123'), 'Template must contain raw OTP');
  assert(html.includes('سكنلي | Sakanly'), 'Template must contain platform title');
  assert(html.includes('صالح لمدة 10 دقائق'), 'Template must contain expiration disclaimer');
  assert(html.includes('لا تشارك هذا الرمز'), 'Template must contain security warning');
});

// -----------------------------------------------------------------------------
// Suite 2: Unconfigured Brevo Handling (503 Service Unavailable)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Unconfigured Brevo API Behavior ---');

await itAsync('Returns HTTP 503 and requiredEnv when BREVO_API_KEY is not configured', async () => {
  _resetOtpStoreForTesting();
  const origKey = process.env.BREVO_API_KEY;
  const origMode = process.env.EMAIL_PROVIDER;

  process.env.BREVO_API_KEY = '';
  delete process.env.EMAIL_PROVIDER;

  try {
    const result = await requestOwnerEmailVerificationOtp(testOwner.id);
    assert.strictEqual(result.status, 503);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.code, 'BREVO_NOT_CONFIGURED');
    assert(Array.isArray(result.requiredEnv), 'Should return list of required env vars');
    assert(result.requiredEnv.includes('BREVO_API_KEY'));
  } finally {
    if (origKey) process.env.BREVO_API_KEY = origKey;
    if (origMode) process.env.EMAIL_PROVIDER = origMode;
  }
});

// -----------------------------------------------------------------------------
// Suite 3: Mock / Live Dispatch Flow
// -----------------------------------------------------------------------------
console.log('\n--- 3. Email OTP Generation & Delivery Dispatch ---');

await itAsync('Dispatches OTP to authenticated owner email address and enforces destination integrity', async () => {
  _resetOtpStoreForTesting();
  process.env.EMAIL_PROVIDER = 'mock';
  brevoService.clear();

  const result = await requestOwnerEmailVerificationOtp(testOwner.id);
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.email, 'test_owner_brevo@sakanly.com');
  assert.strictEqual(result.cooldownSeconds, 60);

  const sent = brevoService.getSentMessages();
  assert.strictEqual(sent.length, 1);
  assert.strictEqual(sent[0].toEmail, 'test_owner_brevo@sakanly.com');
  assert(/^\d{6}$/.test(sent[0].otp), 'Must be a 6-digit OTP');
});

// -----------------------------------------------------------------------------
// Suite 4: Cooldown & Rate Limiting Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- 4. Cooldown Enforcement (60s) ---');

await itAsync('Blocks subsequent request within 60s cooldown with HTTP 429', async () => {
  // Already sent once in Suite 3
  const immediateResend = await requestOwnerEmailVerificationOtp(testOwner.id);
  assert.strictEqual(immediateResend.status, 429);
  assert.strictEqual(immediateResend.success, false);
  assert.strictEqual(immediateResend.code, 'COOLDOWN_ACTIVE');
  assert(immediateResend.waitRemaining > 0 && immediateResend.waitRemaining <= 60);
});

// -----------------------------------------------------------------------------
// Suite 5: OTP Verification & Attempt Limits
// -----------------------------------------------------------------------------
console.log('\n--- 5. OTP Verification & Attempt Counter ---');

await itAsync('Rejects wrong OTP and decrements remaining attempts', async () => {
  const verifyRes = await verifyOwnerEmailVerificationOtp(testOwner.id, '000000');
  assert.strictEqual(verifyRes.status, 400);
  assert.strictEqual(verifyRes.success, false);
  assert.strictEqual(verifyRes.code, 'INCORRECT_OTP');
  assert.strictEqual(verifyRes.remainingAttempts, 4);
});

await itAsync('Locks out immediately on 5th incorrect attempt with HTTP 429 and invalidates OTP', async () => {
  // Attempts 2, 3, 4:
  for (let i = 0; i < 3; i++) {
    await verifyOwnerEmailVerificationOtp(testOwner.id, '000000');
  }
  // 5th attempt:
  const lockoutRes = await verifyOwnerEmailVerificationOtp(testOwner.id, '000000');
  assert.strictEqual(lockoutRes.status, 429);
  assert.strictEqual(lockoutRes.code, 'MAX_ATTEMPTS_EXCEEDED');

  // Verify record was purged:
  const nextAttempt = await verifyOwnerEmailVerificationOtp(testOwner.id, '000000');
  assert.strictEqual(nextAttempt.status, 400);
  assert.strictEqual(nextAttempt.code, 'OTP_NOT_FOUND');
});

await itAsync('Verifies successfully with correct OTP, updates DB store, and prevents replay', async () => {
  _resetOtpStoreForTesting();
  brevoService.clear();

  // Send fresh code
  const sendRes = await requestOwnerEmailVerificationOtp(testOwner.id);
  assert.strictEqual(sendRes.status, 200);

  const sent = brevoService.getSentMessages();
  const validOtp = sent[0].otp;

  // Verify
  const verifyRes = await verifyOwnerEmailVerificationOtp(testOwner.id, validOtp);
  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.success, true);
  assert.strictEqual(verifyRes.user.emailVerified, true);

  // Check store
  const updatedOwner = userStore.findById(testOwner.id);
  assert.strictEqual(updatedOwner.emailVerified, true);
  assert.strictEqual(updatedOwner.verificationDetails?.emailConfirmation?.isVerified, true);

  // Replay attempt must fail because OTP was consumed
  const replayRes = await verifyOwnerEmailVerificationOtp(testOwner.id, validOtp);
  assert.strictEqual(replayRes.status, 400);
  assert.strictEqual(replayRes.code, 'OTP_NOT_FOUND');
});

// -----------------------------------------------------------------------------
// Suite 6: Authorization & Stage Gating
// -----------------------------------------------------------------------------
console.log('\n--- 6. Role Protection & Submission Stage Gate ---');

await itAsync('Denies non-owner users from requesting email verification', async () => {
  let student = userStore.findByEmail('student_brevo_test@sakanly.com');
  if (!student) {
    student = userStore.createUser({
      fullName: 'طالب لاختبار الصلاحيات',
      email: 'student_brevo_test@sakanly.com',
      password: 'SecurePassword123!',
      role: 'student',
    });
  }

  const result = await requestOwnerEmailVerificationOtp(student.id);
  assert.strictEqual(result.status, 403);
  assert.strictEqual(result.success, false);
});

await itAsync('Prevents submission to Step 6 when email verification is not complete', async () => {
  const unverifiedOwner = userStore.createUser({
    fullName: 'مالك غير مؤكد البريد',
    email: 'unverified_owner@sakanly.com',
    password: 'SecurePassword123!',
    role: 'owner',
  });

  // Fill Step 1
  userStore.saveVerificationAccountInfo(unverifiedOwner.id, {
    fullName: 'مالك غير مؤكد البريد',
    nationalIdNumber: '29801011234567',
  });

  // Attempt submit
  let thrownError = null;
  // Use mock request directly
  const { submitVerification } = await import('../controllers/authController.js');
  let mockStatus = 0;
  let mockJson = null;

  const req = {
    user: { id: unverifiedOwner.id, role: 'owner' },
    body: {},
  };
  const res = {
    status(s) { mockStatus = s; return this; },
    json(j) { mockJson = j; return this; },
  };

  submitVerification(req, res);
  assert.strictEqual(mockStatus, 400);
  assert.strictEqual(mockJson.missingStep, 2);
  assert(/المرحلة 2 غير مكتملة/.test(mockJson.message));
});

console.log(`\n======================================================`);
console.log(`🎉 All Brevo Email OTP Verification Tests Passed: ${passedTests}/${totalTests}`);
console.log(`======================================================\n`);

