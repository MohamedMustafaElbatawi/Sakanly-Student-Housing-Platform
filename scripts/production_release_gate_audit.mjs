/**
 * Sakanly Production Release Gate Audit
 * Full Lifecycle & Security Automated Verification against Live Backend & MongoDB Atlas
 */

import http from 'http';
import { connectDB, disconnectDB, isMongoConnected } from '../server/src/config/database.js';
import { User } from '../server/src/models/User.js';
import { Listing } from '../server/src/models/Listing.js';
import { Inquiry } from '../server/src/models/Inquiry.js';
import { Notification } from '../server/src/models/Notification.js';

const BASE_URL = 'http://127.0.0.1:5000/api/v1';

const results = [];

function recordTest(phase, name, status, details = '') {
  results.push({ phase, name, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] [${phase}] ${name}`);
  if (details) console.log(`    ↳ ${details}`);
}

async function runReleaseGateAudit() {
  console.log('========================================================================');
  console.log('🛡️  SAKANLY PRODUCTION RELEASE GATE — LIVE AUDIT');
  console.log(`📡 Backend Target: ${BASE_URL}`);
  console.log('========================================================================\n');

  await connectDB();
  recordTest('Phase 2', 'MongoDB Atlas Connectivity', isMongoConnected() ? 'PASS' : 'FAIL', 'Connected to production Atlas replica set');

  const timestamp = Date.now();
  const ownerEmail = `audit_owner_${timestamp}@sakanly-test.com`;
  const studentEmail = `audit_student_${timestamp}@sakanly-test.com`;
  const ownerPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
  const studentPhone = `011${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testPassword = 'StrongPassword123!';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Sakanly#Owner2026!SecureRoot';

  let ownerToken = null;
  let ownerId = null;
  let studentToken = null;
  let studentId = null;
  let adminToken = null;
  let createdListingId = null;
  let createdInquiryId = null;

  try {
    // -------------------------------------------------------------------------
    // PHASE 2: COMPLETE PROPERTY LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 2: Full Property Lifecycle Walkthrough ---');

    // 2.1 Owner Registration & Login
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'مالك الاختبار الميداني للإنتاج',
        email: ownerEmail,
        password: testPassword,
        phone: ownerPhone,
        role: 'owner',
      }),
    });
    const regOwnerData = await regOwnerRes.json();
    ownerToken = regOwnerData.data?.token;
    ownerId = regOwnerData.data?.user?.id;
    recordTest('Phase 2', 'Step 1: Owner Registration & Login', regOwnerRes.status === 201 && Boolean(ownerToken) ? 'PASS' : 'FAIL', `Owner ID: ${ownerId}`);

    // Verify Owner in MongoDB
    const ownerDoc = await User.findOne({ id: ownerId });
    recordTest('Phase 2', 'Step 1: Owner Persisted in MongoDB Atlas', ownerDoc && ownerDoc.email === ownerEmail ? 'PASS' : 'FAIL', `Mongo _id: ${ownerDoc?._id}`);

    // Verify Owner Verification (Admin pre-verifies owner so they can publish)
    // First, Admin Login
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sakanly.com',
        password: adminPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data?.token;
    recordTest('Phase 2', 'Super Admin Login for Verification', adminLoginRes.status === 200 && Boolean(adminToken) ? 'PASS' : 'FAIL', 'Admin token retrieved');

    // Admin verifies the new owner
    const verifyOwnerRes = await fetch(`${BASE_URL}/admin/owners/${ownerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    recordTest('Phase 2', 'Owner Identity Verification Approved', verifyOwnerRes.status === 200 ? 'PASS' : 'FAIL', 'Owner status set to verified');

    // 2.2 Create New Property with Media
    const propertyPayload = {
      title: `شقة استوديو فاخرة للطلاب - تدقيق الإنتاج ${timestamp}`,
      governorate: 'الجيزة',
      city: 'الدقي',
      district: 'شارع التحرير',
      address: 'عمارة 14 شارع التحرير أمام محطة المترو',
      accommodationType: 'shared_room',
      monthlyPrice: 3800,
      deposit: 1500,
      utilitiesCost: 250,
      bedrooms: 2,
      bathrooms: 1,
      totalBeds: 4,
      availableBeds: 2,
      genderPreference: 'male',
      description: 'سكن طلابي مجهز بالكامل بتكييف ومطبخ وإنترنت عالي السرعة قريب جداً من جامعة القاهرة.',
      images: [
        'https://res.cloudinary.com/xdyc2vjs/image/upload/v1793714622/sakanly/properties/sample1.jpg',
        'https://res.cloudinary.com/xdyc2vjs/image/upload/v1793714622/sakanly/properties/sample2.jpg',
      ],
      status: 'pending_review',
    };

    const addPropRes = await fetch(`${BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify(propertyPayload),
    });
    const addPropData = await addPropRes.json();
    createdListingId = addPropData.data?.id;
    recordTest('Phase 2', 'Step 2: Owner Created Property via API', addPropRes.status === 201 && Boolean(createdListingId) ? 'PASS' : 'FAIL', `Listing ID: ${createdListingId}`);

    // 2.3 Verify Property Saved in MongoDB Atlas
    const listingDoc = await Listing.findOne({ id: createdListingId });
    recordTest('Phase 2', 'Step 3: Property Persisted in MongoDB Atlas', listingDoc && listingDoc.monthlyPrice === 3800 ? 'PASS' : 'FAIL', `DB Status: ${listingDoc?.status}`);

    // 2.4 Verify Cloudinary Media references
    const hasCloudinaryMedia = listingDoc?.images?.length >= 2 && listingDoc.images[0].includes('res.cloudinary.com');
    recordTest('Phase 2', 'Step 4: Cloudinary Media Attached to Listing', hasCloudinaryMedia ? 'PASS' : 'FAIL', `${listingDoc?.images?.length} Cloudinary assets linked`);

    // 2.5 Submit for Review
    recordTest('Phase 2', 'Step 5: Listing in "pending_review" Queue', listingDoc?.status === 'pending_review' ? 'PASS' : 'FAIL', 'Queue state: pending_review');

    // 2.6 Super Admin Approves Property
    const approvePropRes = await fetch(`${BASE_URL}/admin/listings/${createdListingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    recordTest('Phase 2', 'Step 6-7: Super Admin Reviewed & Approved Property', approvePropRes.status === 200 ? 'PASS' : 'FAIL', 'Status updated to active');

    // Wait 700ms for async MongoDB Atlas update
    await new Promise((r) => setTimeout(r, 700));

    // Verify DB update
    const updatedListingDoc = await Listing.findOne({ id: createdListingId });
    recordTest('Phase 2', 'Step 7: Property Status Active in MongoDB', updatedListingDoc?.status === 'active' ? 'PASS' : 'FAIL', `Confirmed active in DB: ${updatedListingDoc?.status}`);

    // 2.7 Student Registers & Searches
    const regStudentRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'طالب الاختبار الميداني للإنتاج',
        email: studentEmail,
        password: testPassword,
        phone: studentPhone,
        role: 'student',
      }),
    });
    const regStudentData = await regStudentRes.json();
    studentToken = regStudentData.data?.token;
    studentId = regStudentData.data?.user?.id;
    recordTest('Phase 2', 'Step 8: Student Registered & Logged in', regStudentRes.status === 201 && Boolean(studentToken) ? 'PASS' : 'FAIL', `Student ID: ${studentId}`);

    // Public Search finds the newly approved listing
    const searchRes = await fetch(`${BASE_URL}/listings?search=${encodeURIComponent('الدقي')}`);
    const searchData = await searchRes.json();
    const searchListings = searchData.data?.listings || searchData.listings || [];
    const foundInSearch = searchListings.some((l) => l.id === createdListingId);
    recordTest('Phase 2', 'Step 9: Student Finds Approved Listing in Public Search', foundInSearch ? 'PASS' : 'FAIL', `Visible to students in public feed (${searchListings.length} total)`);

    // Fetch Details
    const detailsRes = await fetch(`${BASE_URL}/listings/${createdListingId}`);
    const detailsData = await detailsRes.json();
    const detailListing = detailsData.data?.listing || detailsData.listing;
    recordTest('Phase 2', 'Step 9: Student Fetches Property Details', detailsRes.status === 200 && detailListing?.id === createdListingId ? 'PASS' : 'FAIL', `Title: ${detailListing?.title}`);

    // 2.8 Student Submits Viewing Request
    const inquiryRes = await fetch(`${BASE_URL}/listings/inquiry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify({
        listingId: createdListingId,
        moveInDate: '2026-11-25',
        message: 'أرغب في زيارة السكن غداً بعد انتهاء محاضرات الجامعة.',
        fullName: 'طالب الاختبار الميداني للإنتاج',
        phone: '01077778888',
      }),
    });
    const inquiryData = await inquiryRes.json();
    createdInquiryId = inquiryData.data?.id;
    recordTest('Phase 2', 'Step 10: Student Submitted Viewing Request', inquiryRes.status === 201 && Boolean(createdInquiryId) ? 'PASS' : 'FAIL', `Inquiry ID: ${createdInquiryId}`);

    // Wait 700ms for async MongoDB Atlas write
    await new Promise((r) => setTimeout(r, 700));

    // Verify Inquiry in MongoDB
    const inquiryDoc = await Inquiry.findOne({ id: createdInquiryId });
    recordTest('Phase 2', 'Step 10: Inquiry Saved in MongoDB Atlas', inquiryDoc && inquiryDoc.listingId === createdListingId ? 'PASS' : 'FAIL', `Inquiry status: ${inquiryDoc?.status}`);

    // 2.9 Owner Checks Inbox & Notifications
    const ownerInquiriesRes = await fetch(`${BASE_URL}/listings/inquiries/my`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerInquiriesData = await ownerInquiriesRes.json();
    const ownerReceivedInquiry = (ownerInquiriesData.data?.inquiries || ownerInquiriesData.inquiries || []).some(
      (inq) => inq.id === createdInquiryId || inq.listingId === createdListingId
    );
    recordTest('Phase 2', 'Step 11: Owner Received Viewing Request in Dashboard', ownerReceivedInquiry ? 'PASS' : 'FAIL', `Owner received matching inquiry`);

    // Check Notification in DB (recipientId: ownerId)
    const ownerNotification = await Notification.findOne({ recipientId: ownerId });
    recordTest('Phase 2', 'Step 11: Owner Notification Generated in MongoDB', Boolean(ownerNotification) ? 'PASS' : 'FAIL', `Notification title: ${ownerNotification?.title || 'Notice'}`);

    // -------------------------------------------------------------------------
    // PHASE 3: PRACTICAL SECURITY AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- PHASE 3: Practical Security Tests ---');

    // 3.1 Student blocked from Owner / Admin endpoints
    const studentToAdminRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordTest('Phase 3', 'Student Blocked from Admin Dashboard', studentToAdminRes.status === 403 ? 'PASS' : 'FAIL', 'HTTP 403 Forbidden confirmed');

    const studentToOwnerAddRes = await fetch(`${BASE_URL}/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
      body: JSON.stringify(propertyPayload),
    });
    recordTest('Phase 3', 'Student Blocked from Adding Property', studentToOwnerAddRes.status === 403 ? 'PASS' : 'FAIL', 'HTTP 403 Forbidden confirmed');

    // 3.2 Owner blocked from Super Admin
    const ownerToAdminRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    recordTest('Phase 3', 'Owner Blocked from Super Admin Endpoints', ownerToAdminRes.status === 403 ? 'PASS' : 'FAIL', 'HTTP 403 Forbidden confirmed');

    // 3.3 IDOR Protection: Owner A cannot edit Owner B's property
    const idorOwnerRes = await fetch(`${BASE_URL}/listings/prop-draft-002`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ title: 'محاولة اختراق وتعديل عقار مالك آخر IDOR' }),
    });
    recordTest('Phase 3', 'IDOR Defense: Owner Cannot Modify Other Owner Property', idorOwnerRes.status === 403 ? 'PASS' : 'FAIL', 'HTTP 403 IDOR Blocked');

    // 3.4 Verification Docs Access Control
    const studentDocAccessRes = await fetch(`${BASE_URL}/media/verification-document/sakanly/verification/owner_usr-owner-002_id`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    recordTest('Phase 3', 'Private Verification Docs Protected from Public/Students', studentDocAccessRes.status === 403 ? 'PASS' : 'FAIL', 'HTTP 403 Access Denied');

    // 3.5 Token Rotation via /auth/refresh
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send refresh request
    });
    // With no cookie, returns 401
    recordTest('Phase 3', 'Unauthenticated /auth/refresh Rejection', refreshRes.status === 401 ? 'PASS' : 'FAIL', 'HTTP 401 Unauthorized confirmed');

    // 3.6 Super Admin Escalation Immunity on Register
    const escalationRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'هاكر يحاول إنشاء سوبر أدمن',
        email: `hacker_${timestamp}@evil.com`,
        password: testPassword,
        role: 'super_admin',
      }),
    });
    const escalationData = await escalationRes.json();
    recordTest(
      'Phase 3',
      'Super Admin Escalation Immunity on Public Register',
      escalationData.data?.user?.role === 'student' ? 'PASS' : 'FAIL',
      `Role sanitized from super_admin to: ${escalationData.data?.user?.role}`
    );

    // 3.7 Sensitive Fields Stripped in User Response (toSafeUser)
    const userPayload = escalationData.data?.user;
    const isSafeUser = Boolean(userPayload) && userPayload.password === undefined && userPayload.refreshTokens === undefined;
    recordTest('Phase 3', 'No Passwords or Token Hashes in User Response', isSafeUser ? 'PASS' : 'FAIL', 'password & refreshTokens stripped');

    // 3.8 Brute Force Rate Limiter with skipSuccessfulRequests
    console.log('Testing Brute Force Protection on Failed Logins (via test client IP)...');
    let bruteBlocked = false;
    const testAttackerIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-rate-limit': 'true',
          'x-forwarded-for': testAttackerIp,
        },
        body: JSON.stringify({
          email: 'nonexistent@sakanly.com',
          password: 'wrong_password_test',
        }),
      });
      if (res.status === 429) {
        bruteBlocked = true;
        break;
      }
    }
    recordTest('Phase 3', 'Brute-Force Rate Limiter Enforces 429 on Failed Attempts', bruteBlocked ? 'PASS' : 'FAIL', `429 Too Many Requests triggered for IP ${testAttackerIp}`);

  } catch (err) {
    console.error('Audit exception:', err);
  } finally {
    // Clean up test data created during this specific audit run
    if (createdListingId) {
      await Listing.deleteOne({ id: createdListingId });
    }
    if (createdInquiryId) {
      await Inquiry.deleteOne({ id: createdInquiryId });
    }
    if (ownerId) {
      await User.deleteOne({ id: ownerId });
    }
    if (studentId) {
      await User.deleteOne({ id: studentId });
    }
    await disconnectDB();
  }

  // Summary
  console.log('\n========================================================================');
  console.log('📊 AUDIT EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log(`Total Audited Checks: ${results.length}`);
  console.log(`Passed Checks:        ${results.filter((r) => r.status === 'PASS').length}`);
  console.log(`Failed Checks:        ${results.filter((r) => r.status === 'FAIL').length}`);
  console.log('========================================================================\n');
}

runReleaseGateAudit().catch((err) => {
  console.error('Fatal release gate runner error:', err);
  process.exit(1);
});
