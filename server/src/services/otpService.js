import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { userStore } from '../data/mockUsers.js';
import { generateResetToken } from '../utils/token.js';
import { sendPasswordResetEmail } from './emailService.js';
import { smsService, normalizeEgyptianPhone, toInternationalFormat } from './smsService.js';
import { brevoService, maskEmail } from './brevoService.js';
import { config } from '../config/index.js';

// In-memory store for OTP records: identifier (phone or email) -> { hashedOtp, userId, attempts, expiresAt, lastSentAt, type }
const otpStore = new Map();

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const COOLDOWN_SECONDS = 60; // 60 seconds resend cooldown
const MAX_ATTEMPTS = 5; // Max 5 wrong attempts before blocking
const OTP_SECRET_SALT = process.env.OTP_SALT || 'sakanly_secure_otp_salt_2026';

export { normalizeEgyptianPhone };

/**
 * Normalizes email address.
 */
export const normalizeEmail = (rawEmail) => {
  if (!rawEmail || typeof rawEmail !== 'string') return null;
  const trimmed = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

/**
 * Parses and normalizes an identifier (phone or email) based on explicit method or value detection.
 */
export const parseIdentifier = (identifier, method) => {
  if (!identifier) return null;
  const str = String(identifier).trim();

  if (method === 'email' || str.includes('@')) {
    const email = normalizeEmail(str);
    return email ? { type: 'email', value: email } : null;
  }

  const phone = normalizeEgyptianPhone(str);
  return phone ? { type: 'phone', value: phone } : null;
};

const hashOtp = (otp, identifier) => {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${identifier}:${OTP_SECRET_SALT}`)
    .digest('hex');
};

/**
 * Generates and dispatches a 6-digit OTP for password recovery via SMS or Email.
 */
export const requestPasswordReset = async (rawIdentifier, method) => {
  const parsed = parseIdentifier(rawIdentifier, method);
  if (!parsed) {
    const errorMsg = method === 'email'
      ? 'يرجى إدخال بريد إلكتروني صالح (مثال: student@example.com).'
      : 'يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقماً يبدأ بـ 01).';
    return {
      status: 400,
      success: false,
      message: errorMsg,
    };
  }

  const { type, value } = parsed;

  // Find user associated with this identifier
  const user = type === 'email'
    ? userStore.findByEmail(value)
    : userStore.findByPhone(value);

  // Security Check 1: If account is registered via Google only without a local password
  if (user && user.isGoogleUser && !user.password) {
    return {
      status: 200,
      success: false,
      isGoogleOnly: true,
      message: 'هذا الحساب مسجل باستخدام Google ولا يحتوي على كلمة مرور محلية. يمكنك تسجيل الدخول مباشرة بضغطة زر عبر حساب Google دون الحاجة لكلمة مرور.',
    };
  }

  // Security Check 2: If user does not exist, return generic success message to prevent user enumeration
  if (!user) {
    const genericMsg = type === 'email'
      ? 'إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على تعليمات استعادة كلمة المرور.'
      : 'إذا كان هذا الرقم مسجلاً لدينا، فسيتم إرسال رمز التحقق إليه في رسالة نصية.';
    return {
      status: 200,
      success: true,
      message: genericMsg,
      cooldownSeconds: COOLDOWN_SECONDS,
      identifier: value,
      type,
    };
  }

  // Security Check 3: Rate-limiting cooldown if a recent code was sent
  const existingRecord = otpStore.get(value);
  const now = Date.now();
  if (existingRecord && existingRecord.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existingRecord.lastSentAt) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const waitRemaining = COOLDOWN_SECONDS - elapsedSeconds;
      return {
        status: 429,
        success: false,
        message: `يرجى الانتظار ${waitRemaining} ثانية قبل طلب إعادة إرسال رمز جديد.`,
        waitRemaining,
      };
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = hashOtp(rawOtp, value);

  // Store hashed OTP with expiration and reset attempt counter
  otpStore.set(value, {
    hashedOtp,
    userId: user.id,
    type,
    attempts: 0,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
  });

  // Dispatch OTP according to method
  if (type === 'email') {
    // Generate secure, short-lived magic reset token (15 mins) for direct link
    const emailResetToken = generateResetToken({
      userId: user.id,
      email: value,
      deliveryMethod: 'email',
    });
    const clientBase = config.clientOrigin || 'http://localhost:5173';
    const resetLink = `${clientBase}/reset-password?token=${encodeURIComponent(emailResetToken)}&email=${encodeURIComponent(value)}`;

    await sendPasswordResetEmail({
      toEmail: value,
      name: user.fullName,
      otp: rawOtp,
      resetLink,
    });
  } else {
    // SMS Dispatch via real SMS service adapter
    const sendResult = await smsService.sendVerificationOtp({
      phone: value,
      otp: rawOtp,
      expiryMinutes: 10,
    });

    if (!sendResult.success) {
      otpStore.delete(value);
      return {
        status: sendResult.status || 503,
        success: false,
        code: sendResult.code || 'SMS_DELIVERY_FAILED',
        message: sendResult.message,
        requiredEnv: sendResult.requiredEnv,
      };
    }
  }

  const successMessage = type === 'email'
    ? 'تم إرسال رمز التحقق ورابط الاستعادة إلى بريدك الإلكتروني.'
    : 'تم إرسال رمز التحقق بنجاح إلى هاتفك المحمول.';

  return {
    status: 200,
    success: true,
    message: successMessage,
    cooldownSeconds: COOLDOWN_SECONDS,
    identifier: value,
    type,
  };
};

// Backward-compatible alias
export const requestPasswordResetOtp = async (rawPhone) => {
  return requestPasswordReset(rawPhone, 'phone');
};

/**
 * Verifies the 6-digit OTP provided by the user for phone or email.
 * On success, immediately deletes the OTP record to prevent replay attacks and issues a signed resetToken.
 */
export const verifyPasswordResetOtp = async (rawIdentifier, userEnteredOtp, method) => {
  const parsed = parseIdentifier(rawIdentifier, method);
  if (!parsed) {
    return {
      status: 400,
      success: false,
      message: 'بيانات الحساب (الموبايل أو البريد) غير صالحة.',
    };
  }

  const { value, type } = parsed;
  const cleanOtp = String(userEnteredOtp || '').trim();
  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      status: 400,
      success: false,
      message: 'يرجى إدخال رمز التحقق المكون من 6 أرقام.',
    };
  }

  const record = otpStore.get(value);
  const now = Date.now();

  if (!record) {
    return {
      status: 400,
      success: false,
      message: 'لم يتم العثور على رمز تحقق لهذا الحساب أو انتهت صلاحيته. يرجى طلب رمز جديد.',
    };
  }

  // Check expiration
  if (now > record.expiresAt) {
    otpStore.delete(value);
    return {
      status: 400,
      success: false,
      message: 'انتهت صلاحية رمز التحقق (مدة الصلاحية 10 دقائق). يرجى طلب رمز جديد.',
    };
  }

  // Check brute-force attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(value);
    return {
      status: 429,
      success: false,
      message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال الرمز، يرجى طلب رمز جديد.',
    };
  }

  // Compare hash
  const testHash = hashOtp(cleanOtp, value);
  const isMatch = crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(record.hashedOtp));

  if (!isMatch) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      status: 400,
      success: false,
      message: remaining > 0
        ? `رمز التحقق غير صحيح. متبقي لك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`
        : 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة. يرجى طلب رمز جديد.',
    };
  }

  // On Success: Consume and delete OTP record to prevent replay reuse
  const userId = record.userId;
  otpStore.delete(value);

  // Generate short-lived signed JWT reset token (15 mins)
  const resetToken = generateResetToken({
    userId,
    identifier: value,
    type,
  });

  return {
    status: 200,
    success: true,
    message: 'تم تأكيد رمز التحقق بنجاح.',
    resetToken,
  };
};

/**
 * Dispatches a 6-digit OTP for owner mobile verification (Step 2 of owner verification)
 */
export const requestOwnerPhoneVerificationOtp = async (userId, rawPhone) => {
  const normalizedPhone = normalizeEgyptianPhone(rawPhone);
  if (!normalizedPhone) {
    return {
      status: 400,
      success: false,
      code: 'INVALID_EGYPTIAN_PHONE',
      message: 'يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).',
    };
  }

  const user = userStore.findById(userId);
  if (!user || user.role !== 'owner') {
    return {
      status: 403,
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح: التحقق من هاتف المالك متاح لحسابات الملاك فقط.',
    };
  }

  // Cooldown check (60 seconds)
  const storeKey = `phone_verify:${normalizedPhone}`;
  const existing = otpStore.get(storeKey);
  const now = Date.now();
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const waitRemaining = COOLDOWN_SECONDS - elapsedSeconds;
      return {
        status: 429,
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: `يرجى الانتظار ${waitRemaining} ثانية قبل طلب إعادة إرسال الرمز.`,
        waitRemaining,
      };
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();

  // Dispatch via real SMS service adapter
  const sendResult = await smsService.sendVerificationOtp({
    phone: normalizedPhone,
    otp: rawOtp,
    expiryMinutes: 10,
    ownerName: user.fullName,
  });

  if (!sendResult.success) {
    // If provider failed or is unconfigured, do NOT store OTP or fake success
    return {
      status: sendResult.status || 503,
      success: false,
      code: sendResult.code || 'SMS_DELIVERY_FAILED',
      message: sendResult.message,
      requiredEnv: sendResult.requiredEnv,
    };
  }

  // Store hashed OTP with expiration only AFTER SMS provider confirms acceptance
  const hashedOtp = hashOtp(rawOtp, storeKey);
  otpStore.set(storeKey, {
    hashedOtp,
    userId,
    phone: normalizedPhone,
    attempts: 0,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
  });

  return {
    status: 200,
    success: true,
    message: sendResult.message || 'تم إرسال رمز التحقق إلى هاتفك المحمول بنجاح.',
    phone: normalizedPhone,
    cooldownSeconds: COOLDOWN_SECONDS,
    provider: sendResult.provider,
  };
};

/**
 * Validates the 6-digit OTP for owner mobile verification
 */
export const verifyOwnerPhoneVerificationOtp = async (userId, rawPhone, otp) => {
  const normalizedPhone = normalizeEgyptianPhone(rawPhone);
  if (!normalizedPhone || !otp) {
    return {
      status: 400,
      success: false,
      code: 'INVALID_INPUT',
      message: 'يرجى إدخال رقم الهاتف ورمز التحقق المكون من 6 أرقام.',
    };
  }

  const cleanOtp = String(otp).trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      status: 400,
      success: false,
      code: 'INVALID_OTP_FORMAT',
      message: 'رمز التحقق يجب أن يتكون من 6 أرقام بالضبط.',
    };
  }

  const storeKey = `phone_verify:${normalizedPhone}`;
  const record = otpStore.get(storeKey);

  if (!record) {
    return {
      status: 400,
      success: false,
      code: 'OTP_NOT_FOUND',
      message: 'رمز التحقق منتهي الصلاحية أو لم يتم طلبه. يرجى طلب رمز جديد.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(storeKey);
    return {
      status: 400,
      success: false,
      code: 'OTP_EXPIRED',
      message: 'انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.',
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(storeKey);
    return {
      status: 429,
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز، يرجى طلب رمز جديد.',
    };
  }

  const testHash = hashOtp(cleanOtp, storeKey);
  const isMatch = crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(record.hashedOtp));

  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(storeKey);
      return {
        status: 429,
        success: false,
        code: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال رمز التحقق، يرجى طلب رمز جديد.',
        remainingAttempts: 0,
      };
    }
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      status: 400,
      success: false,
      code: 'INCORRECT_OTP',
      message: `رمز التحقق غير صحيح. متبقي لك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`,
      remainingAttempts: remaining,
    };
  }

  // Consume OTP record to prevent replay
  otpStore.delete(storeKey);

  // Update user in data store
  const updatedUser = userStore.verifyOwnerPhone(userId, normalizedPhone);

  return {
    status: 200,
    success: true,
    message: 'تم التحقق من رقم الهاتف وتأكيده بنجاح!',
    user: userStore.toSafeUser(updatedUser),
  };
};

/**
 * Dispatches a 6-digit OTP for owner email verification (Stage 2 of Owner Verification Wizard via Brevo)
 * Uses the authenticated user's email directly from the user store to prevent tampering.
 */
export const requestOwnerEmailVerificationOtp = async (userId) => {
  const user = userStore.findById(userId);
  if (!user || user.role !== 'owner') {
    return {
      status: 403,
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح: التحقق من بريد المالك متاح لحسابات ملّاك العقارات فقط.',
    };
  }

  const destinationEmail = (user.email || '').trim().toLowerCase();
  if (!destinationEmail || !destinationEmail.includes('@')) {
    return {
      status: 400,
      success: false,
      code: 'INVALID_OWNER_EMAIL',
      message: 'البريد الإلكتروني المسجل في حسابك غير صالح.',
    };
  }

  const storeKey = `email_verify:${destinationEmail}`;
  const existing = otpStore.get(storeKey);
  const now = Date.now();

  // Cooldown check (60 seconds)
  if (existing && existing.lastSentAt) {
    const elapsedSeconds = Math.floor((now - existing.lastSentAt) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const waitRemaining = COOLDOWN_SECONDS - elapsedSeconds;
      return {
        status: 429,
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: `يرجى الانتظار ${waitRemaining} ثانية قبل طلب إعادة إرسال رمز التحقق.`,
        waitRemaining,
      };
    }
  }

  // Invalidate any previously active OTP for this email
  otpStore.delete(storeKey);

  // Generate cryptographically secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();

  // Dispatch via Brevo Transactional Email API
  const sendResult = await brevoService.sendVerificationOtp({
    toEmail: destinationEmail,
    toName: user.fullName,
    otp: rawOtp,
    expiryMinutes: 10,
  });

  if (!sendResult.success) {
    // If Brevo is not configured or rejected the request, do NOT store OTP or fake success
    return {
      status: sendResult.status || 503,
      success: false,
      code: sendResult.code || 'EMAIL_DELIVERY_FAILED',
      message: sendResult.message,
      requiredEnv: sendResult.requiredEnv,
    };
  }

  // Store hashed OTP with 10-minute expiration only AFTER Brevo confirms dispatch
  const hashedOtp = hashOtp(rawOtp, storeKey);
  otpStore.set(storeKey, {
    hashedOtp,
    userId,
    email: destinationEmail,
    attempts: 0,
    expiresAt: now + OTP_EXPIRY_MS,
    lastSentAt: now,
  });

  return {
    status: 200,
    success: true,
    message: 'تم إرسال رمز التحقق المكون من 6 أرقام إلى بريدك الإلكتروني بنجاح.',
    email: destinationEmail,
    maskedEmail: maskEmail(destinationEmail),
    cooldownSeconds: COOLDOWN_SECONDS,
    provider: sendResult.provider,
  };
};

/**
 * Validates the 6-digit OTP for owner email verification
 */
export const verifyOwnerEmailVerificationOtp = async (userId, userEnteredOtp) => {
  const user = userStore.findById(userId);
  if (!user || user.role !== 'owner') {
    return {
      status: 403,
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح: التحقق متاح لحسابات ملّاك العقارات فقط.',
    };
  }

  const destinationEmail = (user.email || '').trim().toLowerCase();
  const cleanOtp = String(userEnteredOtp || '').trim();

  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      status: 400,
      success: false,
      code: 'INVALID_OTP_FORMAT',
      message: 'يرجى إدخال رمز التحقق المكون من 6 أرقام بدقة.',
    };
  }

  const storeKey = `email_verify:${destinationEmail}`;
  const record = otpStore.get(storeKey);

  if (!record) {
    return {
      status: 400,
      success: false,
      code: 'OTP_NOT_FOUND',
      message: 'رمز التحقق منتهي الصلاحية أو لم يتم طلبه بعد. يرجى طلب رمز جديد.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(storeKey);
    return {
      status: 400,
      success: false,
      code: 'OTP_EXPIRED',
      message: 'انتهت صلاحية رمز التحقق (10 دقائق). يرجى طلب رمز جديد.',
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(storeKey);
    return {
      status: 429,
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة. تم إبطال الرمز، يرجى طلب رمز جديد.',
    };
  }

  const testHash = hashOtp(cleanOtp, storeKey);
  const isMatch = crypto.timingSafeEqual(Buffer.from(testHash), Buffer.from(record.hashedOtp));

  if (!isMatch) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(storeKey);
      return {
        status: 429,
        success: false,
        code: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم إبطال رمز التحقق، يرجى طلب رمز جديد.',
        remainingAttempts: 0,
      };
    }
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      status: 400,
      success: false,
      code: 'INCORRECT_OTP',
      message: `رمز التحقق غير صحيح. متبقي لك ${remaining} ${remaining === 1 ? 'محاولة' : 'محاولات'}.`,
      remainingAttempts: remaining,
    };
  }

  // Consume OTP record to prevent replay attacks
  otpStore.delete(storeKey);

  // Update user in persistent data store
  const updatedUser = userStore.verifyOwnerEmail(userId, destinationEmail);

  return {
    status: 200,
    success: true,
    message: 'تم تأكيد وتوثيق بريدك الإلكتروني بنجاح!',
    user: userStore.toSafeUser(updatedUser),
  };
};

/**
 * Testing helper to reset internal OTP store
 */
export const _resetOtpStoreForTesting = () => {
  otpStore.clear();
};

export const otpService = {
  requestPasswordReset,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  requestOwnerPhoneVerificationOtp,
  verifyOwnerPhoneVerificationOtp,
  requestOwnerEmailVerificationOtp,
  verifyOwnerEmailVerificationOtp,
  _resetOtpStoreForTesting,
};
