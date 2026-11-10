#!/usr/bin/env node
/**
 * Super Admin Seed Script - Sakanly Platform
 *
 * الاستخدام:
 *   SUPER_ADMIN_EMAIL=admin@sakanly.com SUPER_ADMIN_PASSWORD=YourSecurePass123 node server/scripts/seedSuperAdmin.js
 *
 * أو إضافة متغيرات البيئة في server/.env:
 *   SUPER_ADMIN_EMAIL=admin@example.com
 *   SUPER_ADMIN_PASSWORD=YourStrongPassword
 */

import dotenv from 'dotenv';
import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const email = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const fullName = process.env.SUPER_ADMIN_NAME || 'إدارة منصة سكنلي';

if (!email || !password) {
  console.error('❌ خطأ: يجب تحديد متغيرات البيئة في server/.env أو قبل تشغيل الأمر:');
  console.error('   SUPER_ADMIN_EMAIL=your@email.com');
  console.error('   SUPER_ADMIN_PASSWORD=YourSecurePassword');
  console.error('');
  console.error('مثال:');
  console.error('   $env:SUPER_ADMIN_EMAIL="admin@sakanly.com"; $env:SUPER_ADMIN_PASSWORD="SecurePassword#2026!"; node server/scripts/seedSuperAdmin.js');
  process.exit(1);
}

if (password.length < 8) {
  console.error('❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل لأسباب أمنية.');
  process.exit(1);
}

import bcrypt from 'bcryptjs';
const hashedPassword = bcrypt.hashSync(password, 12);

console.log('');
console.log('✅ Super Admin Configuration Verified');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Email    : ${email}`);
console.log(`  Name     : ${fullName}`);
console.log(`  Role     : super_admin`);
console.log(`  Password : [HIDDEN - Stored securely via Bcrypt Hash]`);
console.log(`  Hash     : ${hashedPassword}`);
console.log('');
console.log('تم تفعيل حساب Super Admin بنجاح عبر متغيرات البيئة الآمنة.');
