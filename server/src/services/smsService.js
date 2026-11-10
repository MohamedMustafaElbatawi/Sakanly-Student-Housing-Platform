/**
 * Sakanly SMS Service & Multi-Provider Adapter Architecture
 * Supports Twilio, Infobip, Generic Egyptian HTTP Gateways, and Test/Mock modes.
 * Enforces strict Egyptian mobile normalization (+20 E.164) and secure delivery tracking.
 */

import { config } from '../config/index.js';

/**
 * Validates and normalizes Egyptian mobile phone numbers.
 * Supported networks:
 * - 010: Vodafone Egypt
 * - 011: Etisalat Misr (e&)
 * - 012: Orange Egypt
 * - 015: Telecom Egypt (WE)
 *
 * Accepts: '01012345678', '+201012345678', '00201012345678', '201012345678'
 * Returns: '01xxxxxxxxx' (11 digits) or null if invalid.
 */
export const normalizeEgyptianPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  const clean = rawPhone.trim();
  let digits = clean.replace(/\D/g, '');

  if (digits.startsWith('0020') && digits.length === 14) {
    digits = digits.slice(3); // '00201xxxxxxxxx' -> '01xxxxxxxxx'
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = '0' + digits.slice(2); // '201xxxxxxxxx' -> '01xxxxxxxxx'
  } else if (digits.startsWith('1') && digits.length === 10) {
    digits = '0' + digits; // '1xxxxxxxxx' -> '01xxxxxxxxx'
  }

  // Must be strictly 11 digits starting with 010, 011, 012, or 015
  const egyptianMobileRegex = /^01[0125]\d{8}$/;
  if (!egyptianMobileRegex.test(digits)) {
    return null;
  }

  return digits;
};

/**
 * Formats normalized Egyptian phone to international E.164 (+201xxxxxxxxx)
 */
export const toInternationalFormat = (normalizedPhone) => {
  if (!normalizedPhone || !/^01[0125]\d{8}$/.test(normalizedPhone)) return null;
  return `+20${normalizedPhone.slice(1)}`;
};

/**
 * Masks phone number for safe logging (e.g. +2010****1234)
 */
export const maskPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '***';
  const clean = phone.trim();
  if (clean.length < 8) return '***';
  return clean.slice(0, 5) + '****' + clean.slice(-4);
};

// =============================================================================
// ADAPTER 1: TWILIO SMS ADAPTER
// =============================================================================
export class TwilioSmsAdapter {
  constructor() {
    this.name = 'twilio';
  }

  isConfigured() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;
    return Boolean(sid && token && from);
  }

  getRequiredEnvVars() {
    return ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  }

  async sendSms({ to, body }) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!this.isConfigured()) {
      throw new Error('Twilio credentials incomplete. Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER.');
    }

    const internationalTo = toInternationalFormat(to);
    if (!internationalTo) {
      throw new Error(`Invalid destination phone number: ${to}`);
    }

    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const basicAuth = Buffer.from(`${sid}:${token}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', internationalTo);
    params.append('Body', body);

    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else {
      params.append('From', from);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errCode = responseData.code || response.status;
      const errMsg = responseData.message || response.statusText;
      console.error(`[Twilio Error ${errCode}]:`, errMsg);
      throw new Error(`Twilio delivery failed [${errCode}]: ${errMsg}`);
    }

    return {
      success: true,
      messageId: responseData.sid,
      provider: 'twilio',
      status: responseData.status || 'queued',
      to: internationalTo,
    };
  }
}

// =============================================================================
// ADAPTER 2: INFOBIP SMS ADAPTER
// =============================================================================
export class InfobipSmsAdapter {
  constructor() {
    this.name = 'infobip';
  }

  isConfigured() {
    const apiKey = process.env.INFOBIP_API_KEY;
    const baseUrl = process.env.INFOBIP_BASE_URL;
    return Boolean(apiKey && baseUrl);
  }

  getRequiredEnvVars() {
    return ['INFOBIP_API_KEY', 'INFOBIP_BASE_URL', 'INFOBIP_SENDER_ID'];
  }

  async sendSms({ to, body }) {
    if (!this.isConfigured()) {
      throw new Error('Infobip credentials incomplete. Missing INFOBIP_API_KEY or INFOBIP_BASE_URL.');
    }

    const internationalTo = toInternationalFormat(to);
    const baseUrl = process.env.INFOBIP_BASE_URL.replace(/\/+$/, '');
    const endpoint = `${baseUrl}/sms/2/text/advanced`;

    const payload = {
      messages: [
        {
          from: process.env.INFOBIP_SENDER_ID || 'Sakanly',
          destinations: [{ to: internationalTo }],
          text: body,
        },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `App ${process.env.INFOBIP_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Infobip delivery failed: ${JSON.stringify(responseData)}`);
    }

    const messageResult = responseData.messages?.[0];
    return {
      success: true,
      messageId: messageResult?.messageId,
      provider: 'infobip',
      status: messageResult?.status?.name || 'PENDING',
      to: internationalTo,
    };
  }
}

// =============================================================================
// ADAPTER 3: GENERIC EGYPTIAN HTTP SMS GATEWAY
// Supports local gateways (VictoryLink, Vodafone SMS, Cequens, Misr SMS)
// =============================================================================
export class GenericHttpSmsAdapter {
  constructor() {
    this.name = 'generic_http';
  }

  isConfigured() {
    const url = process.env.SMS_GATEWAY_URL;
    const keyOrUser = process.env.SMS_API_KEY || process.env.SMS_USERNAME;
    return Boolean(url && keyOrUser);
  }

  getRequiredEnvVars() {
    return ['SMS_GATEWAY_URL', 'SMS_API_KEY', 'SMS_SENDER_ID'];
  }

  async sendSms({ to, body }) {
    if (!this.isConfigured()) {
      throw new Error('Generic SMS gateway incomplete. Missing SMS_GATEWAY_URL or SMS_API_KEY.');
    }

    const internationalTo = toInternationalFormat(to);
    const url = process.env.SMS_GATEWAY_URL;

    const payload = {
      to: internationalTo,
      phone: to,
      message: body,
      sender: process.env.SMS_SENDER_ID || 'Sakanly',
      apiKey: process.env.SMS_API_KEY,
      username: process.env.SMS_USERNAME,
      password: process.env.SMS_PASSWORD,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_API_KEY ? { 'X-API-KEY': process.env.SMS_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      throw new Error(`SMS Gateway rejected request: ${data.message || response.statusText}`);
    }

    return {
      success: true,
      messageId: data.messageId || data.id || `sms_${Date.now()}`,
      provider: 'generic_http',
      status: 'sent',
      to: internationalTo,
    };
  }
}

// =============================================================================
// ADAPTER 4: TEST / MOCK SMS ADAPTER (For Unit & Integration Testing)
// Strictly active when NODE_ENV === 'test' or SMS_PROVIDER === 'mock'
// =============================================================================
export class MockSmsAdapter {
  constructor() {
    this.name = 'mock';
    this.sentMessages = [];
    this.simulateFailure = false;
  }

  isConfigured() {
    return true; // Always available in test environments
  }

  getRequiredEnvVars() {
    return [];
  }

  setSimulateFailure(value) {
    this.simulateFailure = Boolean(value);
  }

  getSentMessages() {
    return [...this.sentMessages];
  }

  clear() {
    this.sentMessages = [];
    this.simulateFailure = false;
  }

  async sendSms({ to, body }) {
    if (this.simulateFailure) {
      throw new Error('Simulated SMS provider network timeout / failure');
    }

    const internationalTo = toInternationalFormat(to);
    const record = {
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      to: internationalTo,
      localPhone: to,
      body,
      provider: 'mock',
      status: 'delivered',
      sentAt: new Date().toISOString(),
    };

    this.sentMessages.push(record);

    return {
      success: true,
      messageId: record.messageId,
      provider: 'mock',
      status: 'delivered',
      to: internationalTo,
    };
  }
}

// =============================================================================
// CENTRAL SMS SERVICE MANAGER
// =============================================================================
export class SmsService {
  constructor() {
    this.adapters = {
      twilio: new TwilioSmsAdapter(),
      infobip: new InfobipSmsAdapter(),
      generic: new GenericHttpSmsAdapter(),
      mock: new MockSmsAdapter(),
    };
  }

  /**
   * Resolve active adapter based on explicit SMS_PROVIDER or auto-detected credentials.
   */
  getActiveAdapter() {
    const requested = (process.env.SMS_PROVIDER || '').toLowerCase().trim();

    // In automated testing or if explicit 'mock' requested
    if (requested === 'mock' || requested === 'test' || (process.env.NODE_ENV === 'test' && !requested)) {
      return this.adapters.mock;
    }

    // Explicit provider chosen
    if (requested && this.adapters[requested]) {
      return this.adapters[requested];
    }

    // Auto-detect based on configured environment variables
    if (this.adapters.twilio.isConfigured()) return this.adapters.twilio;
    if (this.adapters.infobip.isConfigured()) return this.adapters.infobip;
    if (this.adapters.generic.isConfigured()) return this.adapters.generic;

    return null;
  }

  /**
   * Returns list of required environment variables for the selected/default provider
   */
  getRequiredEnvVars() {
    const adapter = this.getActiveAdapter();
    if (adapter) return adapter.getRequiredEnvVars();
    return ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  }

  /**
   * Check if real SMS delivery is currently configured and operational
   */
  isConfigured() {
    const adapter = this.getActiveAdapter();
    return Boolean(adapter && adapter.isConfigured());
  }

  /**
   * Send Owner Phone Verification OTP via SMS
   */
  async sendVerificationOtp({ phone, otp, expiryMinutes = 10 }) {
    const normalizedPhone = normalizeEgyptianPhone(phone);
    if (!normalizedPhone) {
      return {
        success: false,
        status: 400,
        code: 'INVALID_EGYPTIAN_PHONE',
        message: 'يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).',
      };
    }

    const adapter = this.getActiveAdapter();

    // If no provider is configured, return an actionable configuration error
    if (!adapter || !adapter.isConfigured()) {
      const required = this.getRequiredEnvVars();
      const masked = maskPhoneNumber(normalizedPhone);
      console.warn(`[Sakanly SMS Service] Cannot dispatch SMS to ${masked}: Provider unconfigured.`);

      return {
        success: false,
        status: 503,
        code: 'SMS_GATEWAY_NOT_CONFIGURED',
        message: 'بوابة إرسال الرسائل النصية (SMS) غير مهيأة بعد على الخادم. يرجى تهيئة بيانات مزود الخدمة (Twilio أو SMS Gateway) في ملف .env.',
        requiredEnv: required,
      };
    }

    const messageBody = `رمز تأكيد رقم هاتف مالك عقار منصة سكنلي هو: ${otp} - صالح لمدة ${expiryMinutes} دقائق. لا تشارك هذا الرمز مع أي شخص.`;
    const maskedPhone = maskPhoneNumber(toInternationalFormat(normalizedPhone));

    try {
      const result = await adapter.sendSms({
        to: normalizedPhone,
        body: messageBody,
      });

      console.log(`[Sakanly SMS Service] OTP message accepted by provider [${result.provider}] for ${maskedPhone} (ID: ${result.messageId})`);

      return {
        success: true,
        status: 200,
        messageId: result.messageId,
        provider: result.provider,
        phone: normalizedPhone,
        message: 'تم إرسال رمز التحقق (OTP) في رسالة نصية بنجاح إلى هاتفك المحمول.',
      };
    } catch (err) {
      console.error(`[Sakanly SMS Service] Failed sending SMS to ${maskedPhone}:`, err.message);
      return {
        success: false,
        status: 502,
        code: 'SMS_DELIVERY_FAILED',
        message: `تعذر إرسال الرسالة النصية عبر مزود الخدمة (${adapter.name}): ${err.message}`,
      };
    }
  }
}

export const smsService = new SmsService();

