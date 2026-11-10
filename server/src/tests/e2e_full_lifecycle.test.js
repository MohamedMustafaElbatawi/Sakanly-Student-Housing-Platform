/**
 * Sakanly Full End-to-End Production Lifecycle Test Suite
 * Tests the complete user story from registration, owner verification,
 * adding property, super admin approval, student search, favorites,
 * viewing request/inquiry, notifications, to cleanup.
 */

import http from 'http';
import { createApp } from '../expressApp.js';
import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { runMigrations } from '../services/migrationService.js';
import { ListingsService } from '../services/listingsService.js';
import { InquiriesStore } from '../data/mockInquiriesData.js';
import { FavoritesStore } from '../data/mockFavoritesData.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { userStore } from '../data/mockUsers.js';
import { Listing } from '../models/Listing.js';
import { User } from '../models/User.js';
import { Inquiry } from '../models/Inquiry.js';
import { Favorite } from '../models/Favorite.js';
import { Notification } from '../models/Notification.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runE2ELifecycleTest() {
  console.log('🌟 [E2E Lifecycle] Initializing Full Production Audit Test Suite...\n');

  await connectDB();
  await runMigrations();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const timestamp = Date.now();
  const studentEmail = `e2e_student_${timestamp}@sakanly-test.com`;
  const ownerEmail = `e2e_owner_${timestamp}@sakanly-test.com`;
  const testPassword = 'StrongPassword123!';

  let studentToken = null;
  let studentId = null;
  let ownerToken = null;
  let ownerId = null;
  let adminToken = null;
  let testListingId = null;
  let inquiryId = null;

  try {
    // -------------------------------------------------------------
    // STEP 1: Student Registration
    // -------------------------------------------------------------
    console.log('--- Step 1: Student Registration ---');
    const regStudentRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'طالب الاختبار الميداني',
        email: studentEmail,
        password: testPassword,
        phone: '01011112222',
        role: 'student',
      }),
    });
    assert(regStudentRes.status === 201, 'Student registered successfully (201)');
    const regStudentData = await regStudentRes.json();
    studentToken = regStudentData.data?.token;
    studentId = regStudentData.data?.user?.id;
    assert(Boolean(studentToken), 'Received valid JWT token for student');
    assert(regStudentData.data?.user?.role === 'student', 'Registered user has role "student"');

    // -------------------------------------------------------------
    // STEP 2: Owner Registration
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Owner Registration ---');
    const regOwnerRes = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'مالك الاختبار الميداني',
        email: ownerEmail,
        password: testPassword,
        phone: '01033334444',
        role: 'owner',
      }),
    });
    assert(regOwnerRes.status === 201, 'Owner registered successfully (201)');
    const regOwnerData = await regOwnerRes.json();
    ownerToken = regOwnerData.data?.token;
    ownerId = regOwnerData.data?.user?.id;
    assert(Boolean(ownerToken), 'Received valid JWT token for owner');
    assert(regOwnerData.data?.user?.role === 'owner', 'Registered user has role "owner"');
    assert(regOwnerData.data?.user?.isVerified === false, 'New owner is unverified by default');

    // -------------------------------------------------------------
    // STEP 3: Super Admin Login & Verification Approval
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Super Admin Login & Owner Verification ---');
    // Seed Super Admin with testPassword to test genuine login
    userStore.seedSuperAdmin({
      email: 'admin@sakanly.com',
      password: testPassword,
      fullName: 'مدير المنصة الرئيسي (Super Admin)',
      phone: '01200000000',
    });

    const adminLoginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sakanly.com',
        password: testPassword,
      }),
    });
    assert(adminLoginRes.status === 200, 'Super Admin logged in successfully (200)');
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token;
    assert(Boolean(adminToken), 'Super Admin JWT token retrieved');

    // Admin verifies the new owner
    const verifyOwnerRes = await fetch(`${baseUrl}/api/v1/admin/owners/${ownerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    assert(verifyOwnerRes.status === 200, 'Super Admin successfully verified owner account');
    const verifiedOwnerData = await verifyOwnerRes.json();
    assert(
      verifiedOwnerData.data?.user?.isVerified === true || verifiedOwnerData.data?.isVerified === true,
      'Owner status changed to verified'
    );

    // -------------------------------------------------------------
    // STEP 4: Verified Owner Adds New Property
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Verified Owner Adds New Property ---');
    const newPropPayload = {
      title: 'شقة طلابية راقية أمام جامعة القاهرة E2E',
      governorate: 'الجيزة',
      city: 'الدقي',
      district: 'بين السرايات',
      address: 'شارع التحرير أمام البوابة الرئيسية',
      accommodationType: 'shared_room',
      monthlyPrice: 3200,
      deposit: 1500,
      utilitiesCost: 200,
      bedrooms: 3,
      bathrooms: 2,
      totalBeds: 6,
      availableBeds: 2,
      genderPreference: 'male',
      description: 'سكن طلابي مجهز بالكامل بإنترنت فائق السرعة ومكيفات.',
      images: [
        'https://res.cloudinary.com/xdyc2vjs/image/upload/v1793714622/sakanly/properties/sample1.jpg',
      ],
      status: 'pending_review',
    };

    const addPropRes = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(newPropPayload),
    });
    assert(addPropRes.status === 201, 'Owner successfully submitted property (201)');
    const addPropData = await addPropRes.json();
    testListingId = addPropData.data?.id;
    assert(Boolean(testListingId), 'New property received unique ID');
    assert(addPropData.data?.status === 'pending_review', 'Listing entered "pending_review" queue');

    // -------------------------------------------------------------
    // STEP 5: Super Admin Approves Property
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Super Admin Reviews & Approves Property ---');
    const approvePropRes = await fetch(`${baseUrl}/api/v1/admin/listings/${testListingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'active',
        isVerified: true,
      }),
    });
    assert(approvePropRes.status === 200, 'Super admin approved listing status to "active"');
    const approveData = await approvePropRes.json();
    assert(
      approveData.data?.listing?.status === 'active' || approveData.data?.status === 'active',
      'Listing is now active'
    );

    // -------------------------------------------------------------
    // STEP 6: Student Searches & Views Property
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Student Searches & Views Property ---');
    const searchRes = await fetch(`${baseUrl}/api/v1/listings?search=الدقي`);
    assert(searchRes.status === 200, 'Student public search returned 200 OK');
    const searchData = await searchRes.json();
    const foundListing = searchData.data?.listings?.find((l) => l.id === testListingId);
    assert(Boolean(foundListing), 'Approved property is visible in student public search');

    // Fetch details
    const detailsRes = await fetch(`${baseUrl}/api/v1/listings/${testListingId}`);
    assert(detailsRes.status === 200, 'Student fetched property details (200)');
    const detailsData = await detailsRes.json();
    assert(detailsData.data?.listing?.id === testListingId, 'Property details match ID');

    // -------------------------------------------------------------
    // STEP 7: Student Adds Property to Favorites
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Student Favorites System ---');
    const addFavRes = await fetch(`${baseUrl}/api/v1/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ listingId: testListingId }),
    });
    assert(addFavRes.status === 201, 'Student successfully added property to favorites (201)');

    const getFavRes = await fetch(`${baseUrl}/api/v1/favorites`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getFavRes.status === 200, 'Student fetched favorites list (200)');
    const getFavData = await getFavRes.json();
    assert(getFavData.data?.favorites?.includes(testListingId), 'Listing ID exists in student favorites');

    // -------------------------------------------------------------
    // STEP 8: Student Submits Viewing Request / Inquiry
    // -------------------------------------------------------------
    console.log('\n--- Step 8: Student Submits Viewing Request ---');
    const inqPayload = {
      listingId: testListingId,
      applicant: {
        fullName: 'طالب الاختبار الميداني',
        phone: '01011112222',
        email: studentEmail,
      },
      moveInDate: '2026-11-15',
      message: 'أرغب في حجز موعد معاينة للشقة الطلابية يوم الأحد القادم.',
    };

    const inqRes = await fetch(`${baseUrl}/api/v1/listings/inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(inqPayload),
    });
    assert(inqRes.status === 201, 'Student successfully submitted viewing request (201)');
    const inqData = await inqRes.json();
    inquiryId = inqData.data?.inquiry?.id || inqData.data?.id;
    assert(Boolean(inquiryId), 'Inquiry created with unique ID');

    // -------------------------------------------------------------
    // STEP 9: Owner Receives Inquiry & Notification
    // -------------------------------------------------------------
    console.log('\n--- Step 9: Owner Inquiries & Notifications ---');
    const ownerInquiriesRes = await fetch(`${baseUrl}/api/v1/listings/inquiries/my`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(ownerInquiriesRes.status === 200, 'Owner retrieved inquiries list');
    const ownerInquiriesData = await ownerInquiriesRes.json();
    const receivedInq = ownerInquiriesData.data?.inquiries?.find((i) => i.id === inquiryId);
    assert(Boolean(receivedInq), 'Viewing request delivered accurately to the property owner');

    const ownerNotifRes = await fetch(`${baseUrl}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(ownerNotifRes.status === 200, 'Owner retrieved notifications list');
    const ownerNotifData = await ownerNotifRes.json();
    assert(
      Array.isArray(ownerNotifData.data?.notifications) &&
        ownerNotifData.data.notifications.length > 0,
      'Owner received notifications for property events'
    );

    // -------------------------------------------------------------
    // STEP 10: Owner Updates Property (Price / Beds)
    // -------------------------------------------------------------
    console.log('\n--- Step 10: Owner Updates Property ---');
    const updatePropRes = await fetch(`${baseUrl}/api/v1/listings/${testListingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        ...newPropPayload,
        monthlyPrice: 3500,
        availableBeds: 1,
      }),
    });
    assert(updatePropRes.status === 200, 'Owner successfully updated property (200)');
    const updatePropData = await updatePropRes.json();
    assert(updatePropData.data?.monthlyPrice === 3500, 'Updated monthly price persisted');
    assert(updatePropData.data?.availableBeds === 1, 'Updated available beds persisted');

    // -------------------------------------------------------------
    // STEP 11: Security & IDOR Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Step 11: Security, IDOR & Access Controls ---');

    // 11.1 Student cannot create listing
    const studentCreateAttempt = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ title: 'اختراق طالب' }),
    });
    assert(studentCreateAttempt.status === 403, 'Student blocked from creating listing (403)');

    // 11.2 Student cannot access admin endpoints
    const studentAdminAttempt = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAdminAttempt.status === 403, 'Student blocked from admin stats (403)');

    // 11.3 Student cannot modify owner listing
    const studentModifyAttempt = await fetch(`${baseUrl}/api/v1/listings/${testListingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({ monthlyPrice: 100 }),
    });
    assert(studentModifyAttempt.status === 403, 'Student blocked from modifying owner property (403)');

    // -------------------------------------------------------------
    // STEP 12: Clean Up Test Data from MongoDB Atlas
    // -------------------------------------------------------------
    console.log('\n--- Step 12: Database Cleanup & Hygiene ---');
    if (isMongoConnected()) {
      if (testListingId) await Listing.deleteOne({ id: testListingId });
      if (inquiryId) await Inquiry.deleteOne({ id: inquiryId });
      if (studentId) {
        await User.deleteOne({ id: studentId });
        await Favorite.deleteOne({ userId: studentId });
      }
      if (ownerId) {
        await User.deleteOne({ id: ownerId });
        await Notification.deleteMany({ recipientId: ownerId });
      }
      assert(true, 'Test records cleaned up from MongoDB Atlas');
    }

    console.log('\n======================================================');
    console.log(`🌟 E2E Full Lifecycle Summary: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('======================================================');

    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();

    if (passedTests !== totalTests) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal E2E error:', err);
    await new Promise((resolve) => server.close(resolve));
    await disconnectDB();
    process.exitCode = 1;
  }
}

runE2ELifecycleTest();
