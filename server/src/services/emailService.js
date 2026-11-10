import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }

  return null;
};

/**
 * Builds the Arabic HTML email template for password reset.
 */
const buildResetEmailHtml = ({ name, otp, resetLink }) => {
  const safeName = name || 'مستخدم سكنلي العزيز';
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>استعادة كلمة المرور - سكنلي</title>
  <style>
    body { font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; direction: rtl; text-align: right; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0B3D3A 0%, #0F766E 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .content { padding: 32px 28px; }
    .title { font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 12px; color: #0f172a; }
    .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
    .otp-card { background: #f0fdfa; border: 2px dashed #0F766E; border-radius: 16px; padding: 18px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0B3D3A; font-family: monospace; display: block; margin: 8px 0; }
    .btn-container { text-align: center; margin: 28px 0 20px; }
    .btn { display: inline-block; background-color: #0F766E; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 14px; font-weight: bold; font-size: 15px; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
    .warning { font-size: 12px; color: #e11d48; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">سكنلي | Sakanly</h1>
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">منصة سكن الطلاب الأولى في مصر</p>
    </div>
    <div class="content">
      <h2 class="title">مرحباً ${safeName}،</h2>
      <p class="text">
        تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة سكنلي. يمكنك استكمال العملية باستخدام رمز التحقق (OTP) أو النقر على الزر المباشر أدناه:
      </p>

      <div class="otp-card">
        <span style="font-size: 13px; color: #0F766E; font-weight: bold;">رمز التحقق (OTP) الخاص بك:</span>
        <span class="otp-code">${otp}</span>
        <span style="font-size: 12px; color: #64748b;">ينتهي الرمز خلال 10 دقائق</span>
      </div>

      <div class="btn-container">
        <a href="${resetLink}" class="btn" target="_blank">تعيين كلمة المرور مباشرة</a>
      </div>

      <p class="text" style="font-size: 12px; color: #64748b; text-align: center; margin-top: 16px;">
        رابط الاستعادة آمن وصالح للاستخدام لمرة واحدة فقط لمدة 15 دقيقة.
      </p>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">

      <p class="warning">
        إذا لم تقم بطلب استعادة كلمة المرور، يرجى تجاهل هذه الرسالة؛ فحسابك لا يزال آمناً تماماً.
      </p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} سكنلي Sakanly. جميع الحقوق محفوظة.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Sends a password reset email via configured SMTP,
 * or logs cleanly in development mode if SMTP is not configured.
 */
export const sendPasswordResetEmail = async ({ toEmail, name, otp, resetLink }) => {
  const mailTransporter = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || 'سكنلي <noreply@sakanly.com>';

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'إعادة تعيين كلمة المرور - سكنلي | Sakanly',
        html: buildResetEmailHtml({ name, otp, resetLink }),
      });
      console.log(`[Sakanly Email Service] Email dispatched to ${toEmail} (ID: ${info.messageId})`);
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error('[Sakanly Email Service] Failed to send via SMTP, falling back to dev log:', err.message);
    }
  }

  // Development mode logging when SMTP is not configured
  console.log('\n================================================================');
  console.log(' [SAKANLY EMAIL SERVICE] (Development Mode — SMTP not configured)');
  console.log(` To:          ${toEmail}`);
  console.log(` Name:        ${name || 'Student/Owner'}`);
  console.log(` Subject:     إعادة تعيين كلمة المرور - سكنلي | Sakanly`);
  console.log(` 6-Digit OTP: ${otp}`);
  console.log(` Reset Link:  ${resetLink}`);
  console.log(` Expires in:  15 minutes`);
  console.log(' Note: To send real emails, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
  console.log('================================================================\n');

  try {
    fs.writeFileSync(
      path.resolve(process.cwd(), '.otp_dev.json'),
      JSON.stringify(
        {
          type: 'email',
          email: toEmail,
          otp,
          resetLink,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch (_) {}

  return { success: true, mode: 'dev' };
};
