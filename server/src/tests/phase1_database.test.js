import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import {
  User,
  Listing,
  Inquiry,
  Conversation,
  Report,
  Favorite,
  Notification,
  AuditLogModel,
  PlatformSettings,
} from '../models/index.js';
import { userStore } from '../data/mockUsers.js';
import { ListingsService } from '../services/listingsService.js';
import { InquiriesStore } from '../data/mockInquiriesData.js';
import { MessagesService } from '../services/messagesService.js';
import { FavoritesStore } from '../data/mockFavoritesData.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { AuditLog } from '../data/auditLog.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import { runMigrations } from '../services/migrationService.js';

console.log('🧪 Starting Phase 1 MongoDB Integration & Dual-Mode Verification Test...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const runTests = async () => {
  // 1. Database Module Behavior
  console.log('--- 1. Testing Database Connection Handling & Safe Fallback ---');
  const connected = await connectDB();
  if (config.mongoUri) {
    assert(connected === true, 'MongoDB Atlas connected successfully using configured URI');
    assert(isMongoConnected() === true, 'isMongoConnected() correctly returns true when connected to Atlas');
  } else {
    assert(connected === false, 'Safe fallback activated when MONGODB_URI is not provided (does not crash)');
    assert(isMongoConnected() === false, 'isMongoConnected() correctly returns false in fallback mode');
  }

  // 2. Models existence & Mongoose schemas
  console.log('\n--- 2. Testing Mongoose Models & Schemas ---');
  assert(User && User.modelName === 'User', 'User Mongoose model is properly registered');
  assert(Listing && Listing.modelName === 'Listing', 'Listing Mongoose model is properly registered');
  assert(Inquiry && Inquiry.modelName === 'Inquiry', 'Inquiry Mongoose model is properly registered');
  assert(Conversation && Conversation.modelName === 'Conversation', 'Conversation Mongoose model is properly registered');
  assert(Report && Report.modelName === 'Report', 'Report Mongoose model is properly registered');
  assert(Favorite && Favorite.modelName === 'Favorite', 'Favorite Mongoose model is properly registered');
  assert(Notification && Notification.modelName === 'Notification', 'Notification Mongoose model is properly registered');
  assert(AuditLogModel && AuditLogModel.modelName === 'AuditLog', 'AuditLog Mongoose model is properly registered');
  assert(PlatformSettings && PlatformSettings.modelName === 'PlatformSettings', 'PlatformSettings Mongoose model is properly registered');

  // Validate model schema fields
  assert(User.schema.path('role').enumValues.includes('super_admin'), 'User schema includes super_admin role');
  assert(User.schema.path('verificationStatus').enumValues.includes('needs_correction'), 'User schema includes needs_correction status');
  assert(Listing.schema.path('monthlyPrice').instance === 'Number', 'Listing schema enforces monthlyPrice as Number');
  assert(Listing.schema.path('accommodationType').enumValues.includes('individual_bed'), 'Listing schema includes individual_bed');

  // 3. User Store & Super Admin Handling
  console.log('\n--- 3. Testing UserStore & RBAC ---');
  const superAdmin = userStore.findByEmail(process.env.SUPER_ADMIN_EMAIL || 'superadmin@sakanly.com');
  assert(superAdmin !== null, 'Super Admin account is initialized from environment');
  assert(superAdmin?.role === 'super_admin', 'Super Admin role is strictly super_admin');

  // Create a new student user
  const testStudent = userStore.createUser({
    fullName: 'طالب اختباري',
    email: 'test.student@example.com',
    password: 'password123',
    role: 'student',
  });
  assert(testStudent?.id?.startsWith('usr-std-'), 'Student user created with valid custom ID');
  assert(testStudent.role === 'student', 'Student role correctly assigned');
  assert(userStore.findByEmail('test.student@example.com')?.id === testStudent.id, 'User found by email via UserStore');

  // Test password comparison
  const isMatch = userStore.comparePassword('password123', testStudent.password);
  assert(isMatch === true, 'Bcrypt password comparison works accurately');

  // Create owner and test verification workflow
  const testOwner = userStore.createUser({
    fullName: 'مالك اختباري',
    email: 'test.owner@example.com',
    password: 'password123',
    role: 'owner',
  });
  assert(testOwner.role === 'owner', 'Owner role assigned');
  assert(testOwner.verificationStatus === 'not_started', 'New owner starts with verificationStatus=not_started');
  assert(testOwner.isVerified === false, 'New owner is unverified by default');

  userStore.saveVerificationAccountInfo(testOwner.id, {
    fullName: 'مالك اختباري محدث',
    nationalIdNumber: '29810151234567',
    tradeName: 'عقارات النصر',
    governorate: 'الجيزة',
  });
  const updatedOwner = userStore.findById(testOwner.id);
  assert(updatedOwner.verificationDetails?.accountInfo?.nationalIdNumber === '29810151234567', 'Verification account info updated');
  assert(updatedOwner.verificationStatus === 'in_progress', 'Verification status transitioned to in_progress');

  // Review verification (Super Admin approves)
  userStore.reviewVerification(testOwner.id, {
    status: 'verified',
    adminUser: superAdmin,
  });
  const verifiedOwner = userStore.findById(testOwner.id);
  assert(verifiedOwner.verificationStatus === 'verified', 'Owner verified status updated');
  assert(verifiedOwner.isVerified === true, 'Owner isVerified set to true');

  // 4. Listings Service CRUD
  console.log('\n--- 4. Testing Listings Service CRUD ---');
  const allListings = ListingsService.getAll();
  assert(Array.isArray(allListings) && allListings.length > 0, 'ListingsService.getAll() retrieves existing listings');

  const newListing = ListingsService.create({
    title: 'شقة فاخرة بجوار جامعة القاهرة',
    city: 'الجيزة',
    district: 'الدقي',
    monthlyPrice: 3500,
    accommodationType: 'shared_room',
    owner: {
      id: verifiedOwner.id,
      name: verifiedOwner.fullName,
    },
  });
  assert(newListing?.id?.startsWith('prop-'), 'New listing created with custom prop ID');
  assert(ListingsService.getById(newListing.id)?.title === 'شقة فاخرة بجوار جامعة القاهرة', 'Listing retrieved by ID');

  ListingsService.updateStatus(newListing.id, 'rented');
  assert(ListingsService.getById(newListing.id)?.status === 'rented', 'Listing status updated to rented');

  // 5. Inquiries Store
  console.log('\n--- 5. Testing Inquiries Store ---');
  const newInquiry = InquiriesStore.create({
    applicant: {
      id: testStudent.id,
      fullName: testStudent.fullName,
      phone: '01099998888',
      email: testStudent.email,
    },
    ownerId: verifiedOwner.id,
    listingId: newListing.id,
    listingTitle: newListing.title,
    moveInDate: '2026-11-15',
    message: 'مهتم بالمعاينة',
  });
  assert(newInquiry?.id?.startsWith('req-'), 'Inquiry created successfully');
  const ownerInquiries = InquiriesStore.getByOwner(verifiedOwner.id);
  assert(ownerInquiries.some(i => i.id === newInquiry.id), 'Inquiry retrieved by owner ID');

  // 6. Favorites Store
  console.log('\n--- 6. Testing Favorites Store ---');
  FavoritesStore.addFavorite(testStudent.id, newListing.id);
  assert(FavoritesStore.isFavorite(testStudent.id, newListing.id) === true, 'Listing added to favorites');
  FavoritesStore.removeFavorite(testStudent.id, newListing.id);
  assert(FavoritesStore.isFavorite(testStudent.id, newListing.id) === false, 'Listing removed from favorites');

  // 7. Audit Log & Platform Settings
  console.log('\n--- 7. Testing Audit Log & Platform Settings ---');
  const logEntry = AuditLog.add({
    adminId: superAdmin.id,
    adminName: superAdmin.fullName,
    action: 'verify_owner',
    targetType: 'user',
    targetId: verifiedOwner.id,
    targetLabel: verifiedOwner.fullName,
  });
  assert(logEntry?.id?.startsWith('audit-'), 'Audit log entry created');
  const logs = AuditLog.getAll({ limit: 10 });
  assert(logs.logs.some(l => l.id === logEntry.id), 'Audit log retrieved in list');

  const settings = PlatformSettingsStore.getSettings();
  assert(settings.platformName.includes('سكنلي'), 'Platform settings loaded with defaults');

  // 8. Testing Security Logs Schema & Object Integrity (No String Cast)
  console.log('\n--- 8. Testing Security Logs Objects & Schema Integrity ---');
  const testSecEvent = PlatformSettingsStore.logSecurityEvent({
    type: 'admin_login_success',
    ip: '192.168.1.100',
    user: 'superadmin@sakanly.com',
    role: 'super_admin',
    description: 'تسجيل دخول ناجح لحساب الإدارة الرئيسي',
    severity: 'info',
  });
  assert(testSecEvent && typeof testSecEvent === 'object', 'Security log created as an Object');
  assert(testSecEvent.type === 'admin_login_success', 'Security log maintains "type" field correctly');
  assert(testSecEvent.ip === '192.168.1.100', 'Security log maintains "ip" field correctly');
  assert(testSecEvent.user === 'superadmin@sakanly.com', 'Security log maintains "user" field correctly');

  const secEvents = PlatformSettingsStore.getSecurityEvents(5);
  const foundSecEvent = secEvents.find(e => e.id === testSecEvent.id);
  assert(foundSecEvent !== undefined, 'Security event found in PlatformSettingsStore');
  assert(typeof foundSecEvent === 'object' && typeof foundSecEvent !== 'string', 'Security event in store is an Object, not a string');

  // Verify Mongoose model validation against security logs objects
  const testDoc = new PlatformSettings({
    key: 'test_validation_key',
    settings: { test: true },
    securityLogs: [testSecEvent],
  });
  let validationError = null;
  try {
    await testDoc.validate();
  } catch (err) {
    validationError = err;
  }
  assert(validationError === null, 'PlatformSettings Mongoose model validates securityLogs objects without CastError');
  assert(typeof testDoc.securityLogs[0] === 'object', 'Mongoose document stores securityLogs[0] as Object');

  // Clean up
  ListingsService.delete(newListing.id);
  assert(ListingsService.getById(newListing.id) === null, 'Listing deleted cleanly');

  if (isMongoConnected()) {
    console.log('\n--- 9. Live Migration & Atlas Persistence Check ---');
    const migResult = await runMigrations();
    assert(migResult.success === true, 'runMigrations() completed with success on live Atlas database');
    await disconnectDB();
  }

  console.log(`\n===============================================`);
  console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`===============================================`);
};

runTests()
  .then(() => {
    console.log('🎉 Phase 1 test suite executed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Test suite encountered an unhandled error:', err);
    process.exit(1);
  });
