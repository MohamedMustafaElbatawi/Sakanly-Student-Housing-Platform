/**
 * Sakanly Brevo Transactional Email Service
 * Official integration with Brevo (formerly Sendinblue) v3 SMTP REST API.
 * Dispatches cryptographically secure 6-digit OTP emails for Owner Verification.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Masks an email address for privacy-safe logging (e.g. m****r@example.com)
 */
export const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '***@***';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***@***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 4))}${name[name.length - 1]}@${domain}`;
};

/**
 * Builds responsive Arabic HTML email template for Email OTP verification
 */
export const buildVerificationOtpEmailHtml = ({ name, otp, expiryMinutes = 10 }) => {
  const safeName = name ? String(name).trim() : 'مالك عقار سكنلي العزيز';
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رمز تأكيد البريد الإلكتروني - منصة سكنلي</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; direction: rtl; text-align: right; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0B3D3A 0%, #0F766E 100%); padding: 36px 28px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px; border: 1px solid rgba(255, 255, 255, 0.2); }
    .content { padding: 36px 32px; }
    .title { font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px; color: #0B3D3A; }
    .text { font-size: 14px; line-height: 1.8; color: #475569; margin-bottom: 24px; }
    .otp-card { background: #f0fdfa; border: 2px dashed #0F766E; border-radius: 20px; padding: 24px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 12px; color: #0F766E; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
    .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0B3D3A; font-family: 'Courier New', Courier, monospace; display: block; margin: 6px 0; }
    .otp-expiry { font-size: 12px; color: #64748b; font-weight: 600; display: block; margin-top: 8px; }
    .security-notice { background: #fffbeb; border: 1px solid #fef3c7; border-radius: 14px; padding: 14px 18px; margin-top: 24px; }
    .security-title { font-size: 12px; font-weight: 700; color: #92400e; margin: 0 0 4px 0; }
    .security-text { font-size: 11px; color: #b45309; line-height: 1.6; margin: 0; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">منظومة توثيق الملاك الرسمية</div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900;">سكنلي | Sakanly</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">المنصة الجامعية الأولى لسكن الطلاب في مصر</p>
    </div>
    <div class="content">
      <h2 class="title">مرحباً ${safeName}،</h2>
      <p class="text">
        لقد طلبت تأكيد البريد الإلكتروني لحساب المالك الخاص بك على منصة <strong>سكنلي</strong> كجزء من إجراءات توثيق الحساب (المرحلة 2).
      </p>

      <div class="otp-card">
        <span class="otp-label">رمز التحقق الخاص بك (OTP)</span>
        <span class="otp-code">${otp}</span>
        <span class="otp-expiry">⏱️ صالح لمدة ${expiryMinutes} دقائق من تاريخ الإرسال</span>
      </div>

      <p class="text" style="font-size: 13px;">
        يرجى إدخال هذا الرمز المكون من 6 أرقام في صفحة التوثيق لاستكمال تأكيد ملكية البريد والبدء في رفع بطاقة الرقم القومي.
      </p>

      <div class="security-notice">
        <p class="security-title">🔒 تنبيه أمني مشدد:</p>
        <p class="security-text">
          لا تشارك هذا الرمز مع أي شخص. فريق إدارة سكنلي لن يطلب منك هذا الرمز إطلاقاً عبر الهاتف أو وسائل التواصل. إذا لم تكن أنت من طلب هذا الرمز، يرجى تجاهل هذه الرسالة.
        </p>
      </div>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} منصة سكنلي Sakanly. جميع الحقوق محفوظة جمهورية مصر العربية.
    </div>
  </div>
</body>
</html>
  `;
};

export class BrevoService {
  constructor() {
    this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
    this.sentMessages = [];
    this.loadEnv(false);
  }

  loadEnv(override = false) {
    const candidatePaths = [
      path.resolve(__dirname, '../../.env'), // server/.env
      path.resolve(__dirname, '../../../.env'), // root/.env
      path.resolve(process.cwd(), 'server/.env'),
      path.resolve(process.cwd(), '.env'),
    ];

    for (const envPath of candidatePaths) {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override });
      }
    }
  }

  isConfigured() {
    let key = process.env.BREVO_API_KEY;
    if (key === undefined) {
      // If undefined, attempt loading from candidate .env files
      this.loadEnv(true);
      key = process.env.BREVO_API_KEY;
    }
    return Boolean(key && key.trim().length > 0 && !key.startsWith('your_'));
  }

  getRequiredEnvVars() {
    return ['BREVO_API_KEY', 'BREVO_SENDER_EMAIL', 'BREVO_SENDER_NAME'];
  }

  async resolveSender() {
    this.isConfigured();
    const envSenderEmail = (process.env.BREVO_SENDER_EMAIL || '').trim().toLowerCase();
    const senderName = process.env.BREVO_SENDER_NAME || 'سكنلي | Sakanly';

    // If configured email is already a personal/active domain (not default placeholder sakanly.com), use it
    if (envSenderEmail && !envSenderEmail.includes('sakanly.com') && !envSenderEmail.includes('example.com')) {
      return { name: senderName, email: envSenderEmail };
    }

    // Query Brevo for active authorized senders in this account
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (apiKey && !apiKey.startsWith('your_')) {
      try {
        const res = await fetch('https://api.brevo.com/v3/senders', {
          headers: { 'api-key': apiKey, Accept: 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          const activeSenders = (data.senders || []).filter((s) => s.active);
          const matching = activeSenders.find((s) => s.email.toLowerCase() === envSenderEmail);
          if (matching) {
            return { name: senderName, email: matching.email };
          }
          if (activeSenders.length > 0) {
            const fallback = activeSenders[0];
            console.warn(`[Brevo Email Service] Sender "${envSenderEmail}" is not verified in Brevo. Auto-resolving to account verified sender: "${fallback.email}"`);
            return { name: senderName, email: fallback.email };
          }
        }
      } catch (err) {
        // Fallback to configured
      }
    }

    return {
      name: senderName,
      email: envSenderEmail || 'mohamedelbatawi93@gmail.com',
    };
  }

  getSender() {
    this.isConfigured();
    return {
      name: process.env.BREVO_SENDER_NAME || 'سكنلي | Sakanly',
      email: process.env.BREVO_SENDER_EMAIL || 'mohamedelbatawi93@gmail.com',
    };
  }

  /**
   * Dispatches a 6-digit OTP email to owner via Brevo Transactional Email API
   */
  async sendVerificationOtp({ toEmail, toName, otp, expiryMinutes = 10 }) {
    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return {
        success: false,
        status: 400,
        code: 'INVALID_EMAIL',
        message: 'عنوان البريد الإلكتروني غير صالح.',
      };
    }

    const masked = maskEmail(toEmail);

    // Mock mode for tests or explicit mock provider
    const isMock = process.env.EMAIL_PROVIDER === 'mock' ||
      (process.env.NODE_ENV === 'test' && !this.isConfigured());

    if (isMock) {
      const mockRecord = {
        messageId: `mock_brevo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        toEmail,
        toName,
        otp,
        sentAt: new Date().toISOString(),
      };
      this.sentMessages.push(mockRecord);
      console.log(`[Brevo Email Service - Mock] Verification OTP queued for ${masked} (ID: ${mockRecord.messageId})`);
      return {
        success: true,
        status: 200,
        messageId: mockRecord.messageId,
        provider: 'brevo_mock',
        message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
      };
    }

    // Check configuration
    if (!this.isConfigured()) {
      console.warn(`[Brevo Email Service] Cannot dispatch email to ${masked}: BREVO_API_KEY unconfigured.`);
      return {
        success: false,
        status: 503,
        code: 'BREVO_NOT_CONFIGURED',
        message: 'خدمة إرسال البريد الإلكتروني (Brevo) غير مهيأة بعد على الخادم. يرجى تهيئة BREVO_API_KEY في ملف .env.',
        requiredEnv: this.getRequiredEnvVars(),
      };
    }

    const apiKey = process.env.BREVO_API_KEY.trim();
    const sender = await this.resolveSender();
    const htmlContent = buildVerificationOtpEmailHtml({ name: toName, otp, expiryMinutes });

    const payload = {
      sender,
      to: [
        {
          email: toEmail.trim().toLowerCase(),
          name: toName ? toName.trim() : 'مالك عقار سكنلي',
        },
      ],
      subject: `رمز تأكيد بريد حساب المالك: ${otp} - سكنلي`,
      htmlContent,
    };

    console.log(`[Brevo Email Service] Initiating dispatch to ${masked} from sender "${sender.email}" via ${this.apiUrl}...`);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      console.log(`[Brevo Email Service] Brevo responded with HTTP ${response.status}`);

      if (!response.ok) {
        const errorMsg = data.message || response.statusText || 'Unknown Brevo API error';
        console.error(`[Brevo API Error ${response.status}] Delivery to ${masked} failed: ${errorMsg}`);
        
        if (response.status === 401) {
          console.error('[Brevo Security Error] HTTP 401 Unauthorized: Invalid API key or Unauthorized IP address in Brevo settings.');
        }

        return {
          success: false,
          status: response.status >= 500 ? 502 : response.status,
          code: response.status === 401 ? 'BREVO_UNAUTHORIZED_IP' : 'BREVO_DELIVERY_FAILED',
          message: `تعذر إرسال البريد عبر Brevo: ${errorMsg}`,
          brevoError: data,
        };
      }

      console.log(`[Brevo Email Service] ✅ Brevo accepted email! MessageId: ${data.messageId} (Queued for SMTP delivery)`);

      return {
        success: true,
        status: 200,
        messageId: data.messageId,
        provider: 'brevo',
        senderUsed: sender.email,
        message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح.',
      };
    } catch (netErr) {
      console.error(`[Brevo Network Error] Connection to Brevo failed for ${masked}: ${netErr.message}`);
      return {
        success: false,
        status: 502,
        code: 'BREVO_NETWORK_ERROR',
        message: `تعذر الاتصال بخدمة Brevo: ${netErr.message}`,
      };
    }
  }

  getSentMessages() {
    return [...this.sentMessages];
  }

  clear() {
    this.sentMessages = [];
  }
}

export const brevoService = new BrevoService();

