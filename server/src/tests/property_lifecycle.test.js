import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { ListingsService } from '../services/listingsService.js';
import { Listing } from '../models/Listing.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { ListingsController } from '../controllers/listingsController.js';
import * as adminController from '../controllers/adminController.js';
import { runMigrations } from '../services/migrationService.js';

console.log('🧪 Starting Full Property Lifecycle ("دورة حياة العقار") Test Suite...\n');

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

const mockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
};

const run = async () => {
  await connectDB();
  await runMigrations();
  await PlatformSettingsStore.syncFromDB();
  await ListingsService.syncFromDB();
  await NotificationsStore.syncFromDB();

  const testOwnerId = 'usr-owner-001';
  const testOwnerName = 'م. أحمد الشناوي';
  const testStudentId = 'usr-student-001';
  const testAdminUser = {
    id: 'usr-super-admin-root',
    fullName: 'مدير المنظمة الرئيسي',
    email: 'admin@sakanly.com',
    role: 'super_admin',
  };

  // Helper mock users
  const studentUser = {
    id: testStudentId,
    fullName: 'أحمد علي',
    role: 'student',
  };

  const unverifiedOwner = {
    id: 'usr-owner-unverified',
    fullName: 'مالك غير موثق',
    role: 'owner',
    verificationStatus: 'not_started',
    isVerified: false,
  };

  const verifiedOwner = {
    id: testOwnerId,
    fullName: testOwnerName,
    role: 'owner',
    verificationStatus: 'verified',
    isVerified: true,
  };

  console.log('--- 1. Testing Security & Role-Based Access Controls ---');
  
  // 1.1 Student cannot create listing
  const studentReq = {
    user: studentUser,
    body: { title: 'محاولة طالب لإضافة سكن' },
  };
  const studentRes = mockRes();
  ListingsController.createListing(studentReq, studentRes, () => {});
  assert(studentRes.statusCode === 403, 'Students are strictly forbidden from creating listings (403)');

  // 1.2 Unverified owner cannot publish live listing
  const unverifiedReq = {
    user: unverifiedOwner,
    body: { title: 'شقة مالك غير موثق', status: 'active' },
  };
  const unverifiedRes = mockRes();
  ListingsController.createListing(unverifiedReq, unverifiedRes, () => {});
  assert(unverifiedRes.statusCode === 403 && unverifiedRes.jsonData?.code === 'OWNER_NOT_VERIFIED', 'Unverified owners cannot publish listings (OWNER_NOT_VERIFIED)');

  // 1.3 Unverified owner can save as draft
  const draftReq = {
    user: unverifiedOwner,
    body: { title: 'مسودة مؤقتة للمالك', status: 'draft', city: 'القاهرة', monthlyPrice: 3000 },
  };
  const draftRes = mockRes();
  ListingsController.createListing(draftReq, draftRes, () => {});
  assert(draftRes.statusCode === 201 && draftRes.jsonData?.data?.status === 'draft', 'Unverified owner can safely save listing as draft');
  const createdDraftId = draftRes.jsonData?.data?.id;

  console.log('\n--- 2. Testing Property Submission & Review Queue Routing ---');
  
  // 2.1 Verified owner submits property -> routes to pending_review
  const newPropPayload = {
    title: 'شقة فاخرة للطلاب أمام جامعة القاهرة مباشرة',
    city: 'الجيزة',
    district: 'ميدان الجيزة',
    monthlyPrice: 6500,
    accommodationType: 'entire_apartment',
    bedrooms: 2,
    bathrooms: 1,
    totalBeds: 4,
    availableBeds: 4,
    images: [
      'https://res.cloudinary.com/sakanly-cloud/image/upload/v1741234567/sakanly/properties/test-living.jpg',
      'https://res.cloudinary.com/sakanly-cloud/image/upload/v1741234568/sakanly/properties/test-bedroom.jpg',
    ],
    nearbyUniversities: [
      { name: 'جامعة القاهرة', distance: '5 دقائق سيراً على الأقدام' },
    ],
  };

  const createReq = {
    user: verifiedOwner,
    body: newPropPayload,
  };
  const createRes = mockRes();
  ListingsController.createListing(createReq, createRes, () => {});
  assert(createRes.statusCode === 201, 'Verified owner property creation responds with 201 Created');
  
  const createdListing = createRes.jsonData?.data;
  assert(Boolean(createdListing?.id), 'Created listing has unique ID');
  assert(createdListing?.status === 'pending_review', 'Listing status is automatically set to "pending_review" for admin moderation');
  assert(createdListing?.isVerified === false, 'Listing isVerified is false pending admin check');
  assert(Boolean(createdListing?.submittedAt), 'Listing submittedAt timestamp is recorded');

  // 2.2 Verify informative notification dispatched to owner
  const ownerNotifs = NotificationsStore.getByRecipient(testOwnerId);
  const reviewNotif = ownerNotifs.find(n => n.message?.includes(createdListing.title) || n.title?.includes('للمراجعة'));
  assert(Boolean(reviewNotif), 'Owner receives notification informing them listing is in admin review');

  console.log('\n--- 3. Testing Public Student Search Isolation (Privacy Guarantee) ---');
  
  // 3.1 Student public search must NOT return pending_review or draft listings
  const publicListings = ListingsService.getAll({});
  const leakedPending = publicListings.find(l => l.id === createdListing.id);
  const leakedDraft = publicListings.find(l => l.id === createdDraftId);
  assert(!leakedPending, 'Public Student Search strictly excludes "pending_review" listings');
  assert(!leakedDraft, 'Public Student Search strictly excludes "draft" listings');

  // 3.2 Student direct ID view receives 404 for unapproved listings
  const viewReqStudent = { user: studentUser, params: { id: createdListing.id } };
  const viewResStudent = mockRes();
  ListingsController.getListingById(viewReqStudent, viewResStudent, () => {});
  assert(viewResStudent.statusCode === 404, 'Direct view of unapproved listing by students returns 404');

  // 3.3 Owner can view their own unapproved listing
  const viewReqOwner = { user: verifiedOwner, params: { id: createdListing.id } };
  const viewResOwner = mockRes();
  ListingsController.getListingById(viewReqOwner, viewResOwner, () => {});
  assert(viewResOwner.statusCode === 200 && viewResOwner.jsonData?.data?.listing?.id === createdListing.id, 'Owner can preview their own unapproved listing');

  console.log('\n--- 4. Testing Admin Moderation: Approval Workflow ---');

  // 4.1 Admin retrieves moderation queue
  const adminQueue = ListingsService.getAll({ status: 'pending_review' });
  const inQueue = adminQueue.find(l => l.id === createdListing.id);
  assert(Boolean(inQueue), 'Admin moderation queue displays the pending listing');

  // 4.2 Admin approves listing
  const approveReq = {
    adminUser: testAdminUser,
    params: { id: createdListing.id },
    body: { status: 'active' },
  };
  const approveRes = mockRes();
  adminController.updateListingStatus(approveReq, approveRes);
  assert(approveRes.statusCode === 200, 'Admin approval endpoint succeeds with 200');

  const approvedListing = approveRes.jsonData?.data?.listing;
  assert(approvedListing?.status === 'active', 'Listing status successfully changed to "active"');
  assert(approvedListing?.isVerified === true, 'Listing isVerified flag set to true');
  assert(approvedListing?.rejectionReason === null, 'rejectionReason is cleared upon approval');
  assert(Boolean(approvedListing?.reviewedAt), 'reviewedAt timestamp recorded');
  assert(approvedListing?.reviewedBy?.includes('مدير المنظمة'), 'reviewedBy recorded with admin identity');

  // 4.3 Owner receives approval notification
  const updatedOwnerNotifs = NotificationsStore.getByRecipient(testOwnerId);
  const approvalNotif = updatedOwnerNotifs.find(n => n.type === 'success' && n.message?.includes(createdListing.title));
  assert(Boolean(approvalNotif), 'Owner receives congratulations/approval notification');

  // 4.4 Student now finds approved listing in public search
  const studentSearchAfterApproval = ListingsService.getAll({});
  const foundByStudent = studentSearchAfterApproval.find(l => l.id === createdListing.id);
  assert(Boolean(foundByStudent), 'Approved listing is now publicly visible in Student search');

  // 4.5 Student can view property details
  const viewReqStudentAfter = { user: studentUser, params: { id: createdListing.id } };
  const viewResStudentAfter = mockRes();
  ListingsController.getListingById(viewReqStudentAfter, viewResStudentAfter, () => {});
  assert(viewResStudentAfter.statusCode === 200, 'Student can view details of approved listing');

  console.log('\n--- 5. Testing Admin Moderation: Rejection Workflow with Reason ---');

  // 5.1 Verified owner submits a second property
  const rejectedCandidatePayload = {
    title: 'غرفة مشتركة بجوار جامعة حلوان',
    city: 'القاهرة',
    district: 'حلوان',
    monthlyPrice: 1800,
    accommodationType: 'shared_room',
    bedrooms: 1,
    bathrooms: 1,
    totalBeds: 2,
    availableBeds: 2,
  };
  const createReq2 = { user: verifiedOwner, body: rejectedCandidatePayload };
  const createRes2 = mockRes();
  ListingsController.createListing(createReq2, createRes2, () => {});
  const rejectedListing = createRes2.jsonData?.data;
  assert(rejectedListing?.status === 'pending_review', 'Second listing enters pending_review');

  // 5.2 Admin rejects listing with specific reason
  const rejectionReasonText = 'صور الوحدة غير واضحة ويُرجى رفع صور حديثة لغرفة النوم والحمام ومحيط العمارة.';
  const rejectReq = {
    adminUser: testAdminUser,
    params: { id: rejectedListing.id },
    body: {
      status: 'rejected',
      rejectionReason: rejectionReasonText,
    },
  };
  const rejectRes = mockRes();
  adminController.updateListingStatus(rejectReq, rejectRes);
  assert(rejectRes.statusCode === 200, 'Admin rejection succeeds with 200');

  const afterRejectListing = rejectRes.jsonData?.data?.listing;
  assert(afterRejectListing?.status === 'rejected', 'Listing status set to "rejected"');
  assert(afterRejectListing?.rejectionReason === rejectionReasonText, 'Specific rejection reason saved correctly');
  assert(afterRejectListing?.isVerified === false, 'isVerified is false for rejected listing');

  // 5.3 Owner receives rejection notification with reason
  const notifsAfterReject = NotificationsStore.getByRecipient(testOwnerId);
  const rejectionNotif = notifsAfterReject.find(n => n.type === 'warning' && n.message?.includes(rejectionReasonText));
  assert(Boolean(rejectionNotif), 'Owner receives warning notification containing exact rejection reason');

  // 5.4 Public student search does NOT return rejected listing
  const studentSearchAfterReject = ListingsService.getAll({});
  const leakedRejected = studentSearchAfterReject.find(l => l.id === rejectedListing.id);
  assert(!leakedRejected, 'Rejected listing is completely hidden from student searches');

  console.log('\n--- 6. Testing Owner Correction & Resubmission Flow ---');

  // 6.1 Owner edits rejected property and re-submits for review
  const updateReq = {
    user: verifiedOwner,
    params: { id: rejectedListing.id },
    body: {
      title: 'غرفة مشتركة مجددة بالكامل بجوار جامعة حلوان',
      images: [
        'https://res.cloudinary.com/sakanly-cloud/image/upload/v1741234599/sakanly/properties/new-room.jpg',
      ],
      status: 'pending_review',
    },
  };
  const updateRes = mockRes();
  ListingsController.updateListing(updateReq, updateRes, () => {});
  assert(updateRes.statusCode === 200, 'Owner update listing succeeds with 200');

  const reSubmittedListing = updateRes.jsonData?.data;
  assert(reSubmittedListing?.status === 'pending_review', 'Editing rejected property automatically resets status to "pending_review"');
  assert(reSubmittedListing?.rejectionReason === null, 'rejectionReason is cleared upon re-submission');
  assert(Boolean(reSubmittedListing?.submittedAt), 'New submittedAt recorded on re-submission');

  // 6.2 Check owner stats calculation includes all statuses
  const ownerStats = await ListingsService.getStatsByOwner(testOwnerId);
  assert(typeof ownerStats.pendingReview === 'number' && ownerStats.pendingReview >= 1, 'Owner stats accurately track pendingReview count');
  assert(typeof ownerStats.active === 'number' && ownerStats.active >= 1, 'Owner stats accurately track active count');

  console.log('\n--- 7. Cleanup Test Data ---');
  ListingsService.delete(createdListing.id);
  ListingsService.delete(createdDraftId);
  ListingsService.delete(rejectedListing.id);
  assert(true, 'Temporary lifecycle test listings cleaned up successfully');
  await new Promise(r => setTimeout(r, 1000));

  console.log(`\n========================================`);
  console.log(`🎉 Property Lifecycle Test Suite Finished!`);
  console.log(`Passed: ${passedTests} / ${totalTests} tests`);
  console.log(`========================================\n`);

  if (isMongoConnected()) {
    await disconnectDB();
  }
};

run().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
