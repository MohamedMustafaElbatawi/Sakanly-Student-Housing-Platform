import assert from 'node:assert';
import { userStore } from './server/src/data/mockUsers.js';
import { generateToken } from './server/src/utils/token.js';

console.log('===========================================================');
console.log('🧪 Testing Sakanly Authentication & Role Routing Logic');
console.log('===========================================================\n');

// 1. Phone number login resolution
console.log('--- Test 1: تسجيل الدخول برقم الهاتف المصري ---');
const studentByPhone = userStore.findByPhone('01012345678');
assert.ok(studentByPhone, 'Must find student by phone 01012345678');
assert.strictEqual(studentByPhone.role, 'student');
assert.strictEqual(userStore.comparePassword('123456', studentByPhone.password), true);
console.log('✓ Found student by phone:', studentByPhone.fullName, 'Role:', studentByPhone.role);
console.log('✅ Test 1 PASSED: تسجيل الدخول برقم الهاتف يعمل بدقة.\n');

// 2. Owner phone login resolution
console.log('--- Test 2: تسجيل الدخول لمالك موثق برقم الهاتف ---');
const ownerByPhone = userStore.findByPhone('01198765432');
assert.ok(ownerByPhone, 'Must find owner by phone 01198765432');
assert.strictEqual(ownerByPhone.role, 'owner');
assert.strictEqual(ownerByPhone.isVerified, true);
assert.strictEqual(ownerByPhone.verificationStatus, 'verified');
console.log('✓ Found owner by phone:', ownerByPhone.fullName, 'Status:', ownerByPhone.verificationStatus);
console.log('✅ Test 2 PASSED: تم التحقق من هوية المالك الموثق.\n');

// 3. Password validation
console.log('--- Test 3: فحص التحقق من كلمة السر الخاطئة ---');
const isInvalidPass = userStore.comparePassword('wrong_password', studentByPhone.password);
assert.strictEqual(isInvalidPass, false, 'Invalid password must return false');
console.log('✅ Test 3 PASSED: رفض كلمات المرور غير المطابقة بنجاح.\n');

// 4. Role Isolation for Google OAuth Users
console.log('--- Test 4: قواعد الأدوار والصلاحيات لمستخدمي Google ---');
const newGoogleUser = userStore.createStudentUser({
  fullName: 'طالب Google جديد',
  email: `google.student.${Date.now()}@university.edu.eg`,
  googleId: 'g-test-12345',
  isGoogleUser: true,
});

assert.strictEqual(newGoogleUser.role, 'student', 'New Google registrations MUST be strictly student role');
assert.notStrictEqual(newGoogleUser.role, 'owner', 'Google registration MUST NEVER grant owner role');
console.log('✓ Created Google user role:', newGoogleUser.role);
console.log('✅ Test 4 PASSED: حسابات Google معزولة وتقتصر على دور الطالب الافتراضي.\n');

// 5. Existing user role preservation when linking Google
console.log('--- Test 5: الحفاظ على دور المالك عند ربط حساب Google ---');
const existingOwner = userStore.findByEmail('owner@sakanly.com');
const initialRole = existingOwner.role;
userStore.linkGoogleAccount(existingOwner.id, 'g-owner-link-999');
const updatedOwner = userStore.findById(existingOwner.id);
assert.strictEqual(updatedOwner.role, initialRole, 'Existing user role must never mutate when linking Google');
assert.strictEqual(updatedOwner.role, 'owner');
console.log('✓ Owner role preserved after Google linking:', updatedOwner.role);
console.log('✅ Test 5 PASSED: تم تأكيد ثبات أدوار المستخدمين ومنع الترقية غير المصرح بها.\n');

console.log('===========================================================');
console.log('🎉 ALL AUTHENTICATION LOGIC TESTS PASSED SUCCESSFULLY!');
console.log('===========================================================');
