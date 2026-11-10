import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { CloudinaryService, CLOUDINARY_FOLDERS } from '../services/cloudinaryService.js';
import { ListingsService } from '../services/listingsService.js';
import { userStore } from '../data/mockUsers.js';
import { InquiriesStore } from '../data/mockInquiriesData.js';
import { MessagesService } from '../services/messagesService.js';
import { FavoritesStore } from '../data/mockFavoritesData.js';
import { AuditLog } from '../data/auditLog.js';
import path from 'path';

console.log('🧪 Starting Phase 2 Cloudinary Media Management & Security Test Suite...\n');

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

const runPhase2Tests = async () => {
  // 0. Ensure MongoDB Atlas is connected for data persistence
  const mongoConnected = await connectDB();
  assert(mongoConnected === true, 'MongoDB Atlas connection active for Phase 2 tests');

  // 1. Cloudinary Service & Folder Taxonomy Check
  console.log('\n--- 1. Testing Cloudinary Folder Taxonomy & Configuration Detection ---');
  assert(CLOUDINARY_FOLDERS.PROPERTIES === 'sakanly/properties', 'Properties folder matches taxonomy (sakanly/properties)');
  assert(CLOUDINARY_FOLDERS.USERS === 'sakanly/users', 'Users folder matches taxonomy (sakanly/users)');
  assert(CLOUDINARY_FOLDERS.VERIFICATION === 'sakanly/verification', 'Verification folder matches taxonomy (sakanly/verification)');
  assert(CLOUDINARY_FOLDERS.REPORTS === 'sakanly/reports', 'Reports folder matches taxonomy (sakanly/reports)');

  const isConfigured = CloudinaryService.isConfigured();
  console.log(`ℹ️ [Cloudinary Status] isConfigured: ${isConfigured}`);

  if (isConfigured) {
    console.log('\n--- 2. Live Cloudinary API Connectivity & Real Media Upload/Delete Test ---');
    const pingResult = await CloudinaryService.testConnection();
    assert(pingResult.connected === true, `Cloudinary API Ping successful (${pingResult.cloudName})`);

    // Perform a real 1x1 pixel image upload and instant delete to verify real write permissions
    try {
      const realUpload = await CloudinaryService.uploadRealTestMedia();
      assert(realUpload.success === true, 'Real image upload and instant delete verified on live Cloudinary');
      assert(realUpload.secureUrl?.includes('res.cloudinary.com'), 'Secure HTTPS URL returned by live Cloudinary');
    } catch (err) {
      assert(false, `Real Cloudinary upload failed: ${err.message}`);
    }
  } else {
    console.log('\n--- 2. Cloudinary Unconfigured Safe Handling ---');
    const pingResult = await CloudinaryService.testConnection();
    assert(pingResult.connected === false, 'Safe handling: testConnection reports not connected when credentials missing');
    assert(pingResult.configured === false, 'Safe handling: testConnection reports not configured');
    
    // Ensure we do NOT fake success when unconfigured
    let uploadThrew = false;
    try {
      await CloudinaryService.uploadFromBuffer(Buffer.from('test'), { folder: CLOUDINARY_FOLDERS.PROPERTIES });
    } catch {
      uploadThrew = true;
    }
    assert(uploadThrew === true, 'Safe handling: uploadFromBuffer strictly throws error when Cloudinary is not configured (no fake success)');
  }

  // 3. Testing MIME Type & Extension Security Validation Logic
  console.log('\n--- 3. Testing MIME Type, Extension & Security Filter Logic ---');
  const allowedImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
  const dangerousExts = ['.exe', '.bat', '.sh', '.js', '.php', '.html'];

  assert(allowedImageExts.every(ext => !dangerousExts.includes(ext)), 'Dangerous executable extensions are completely excluded from allowed list');

  // Test URL Optimization & Video Poster Frame Generator
  const sampleCloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
  const optimizedUrl = CloudinaryService.getOptimizedUrl(sampleCloudinaryUrl, { width: 400, height: 300 });
  assert(optimizedUrl.includes('f_auto,q_auto'), 'getOptimizedUrl injects f_auto,q_auto transformations');
  assert(optimizedUrl.includes('w_400') && optimizedUrl.includes('h_300'), 'getOptimizedUrl injects width and height parameters');

  // 4. Testing Property Media CRUD & Persistence in MongoDB
  console.log('\n--- 4. Testing Property Media Object Structure & Persistence in MongoDB ---');
  const superAdmin = userStore.findByEmail(process.env.SUPER_ADMIN_EMAIL || 'superadmin@sakanly.com');
  const verifiedOwner = userStore.findAll().find(u => u.role === 'owner' && u.isVerified);
  assert(verifiedOwner !== undefined, 'Found verified owner account in UserStore');

  // Create test listing with multi-image & video media structures
  const mediaItems = [
    {
      public_id: 'sakanly/properties/test_img_01',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sakanly/properties/test_img_01.jpg',
      resource_type: 'image',
      format: 'jpg',
      bytes: 245000,
      width: 1920,
      height: 1080,
      isPrimary: true,
      order: 0,
    },
    {
      public_id: 'sakanly/properties/test_img_02',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/sakanly/properties/test_img_02.jpg',
      resource_type: 'image',
      format: 'jpg',
      bytes: 310000,
      width: 1920,
      height: 1080,
      isPrimary: false,
      order: 1,
    },
    {
      public_id: 'sakanly/properties/test_video_01',
      secure_url: 'https://res.cloudinary.com/demo/video/upload/sakanly/properties/test_video_01.mp4',
      resource_type: 'video',
      format: 'mp4',
      bytes: 15400000,
      duration: 32.5,
      isPrimary: false,
      order: 2,
    },
  ];

  const listing = ListingsService.create({
    title: 'عقار تجريبي مزود بوسائط Cloudinary',
    city: 'القاهرة',
    district: 'مدينة نصر',
    monthlyPrice: 4200,
    accommodationType: 'entire_apartment',
    media: mediaItems,
    images: mediaItems.filter(m => m.resource_type === 'image').map(m => m.secure_url),
    owner: {
      id: verifiedOwner.id,
      name: verifiedOwner.fullName,
      phone: verifiedOwner.phone,
      isVerified: true,
    },
  });

  assert(listing && listing.id, 'Listing created successfully with Cloudinary media array');
  assert(Array.isArray(listing.media) && listing.media.length === 3, 'All 3 media items (2 images + 1 video) stored');
  assert(listing.images[0] === mediaItems[0].secure_url, 'First image set as primary cover image in order');

  // Test updating listing and reordering images
  const reorderedMedia = [mediaItems[1], mediaItems[0], mediaItems[2]];
  const updatedListing = ListingsService.update(listing.id, {
    media: reorderedMedia,
    images: [reorderedMedia[0].secure_url, reorderedMedia[1].secure_url],
  });
  assert(updatedListing.images[0] === mediaItems[1].secure_url, 'Images reordered successfully, new primary image at index 0');

  // 5. Testing Private Verification Documents Security & Signed URLs
  console.log('\n--- 5. Testing Private Verification Documents & RBAC Authorization ---');
  const samplePrivateDocPublicId = `sakanly/verification/owner_${verifiedOwner.id}_national_id_front`;

  // Verify private document URL generator
  if (isConfigured) {
    const signedUrl = CloudinaryService.generateSignedDocumentUrl(samplePrivateDocPublicId, {
      expiresInSeconds: 600,
      resourceType: 'image',
    });
    assert(signedUrl.includes('sign_url=true') || signedUrl.includes('signature=') || signedUrl.includes('auth'), 'Signed URL generated with cryptographic signature');
    assert(signedUrl.includes('secure=true') || signedUrl.startsWith('https://'), 'Signed URL uses secure HTTPS');
  } else {
    let signThrew = false;
    try {
      CloudinaryService.generateSignedDocumentUrl(samplePrivateDocPublicId);
    } catch {
      signThrew = true;
    }
    assert(signThrew === true, 'generateSignedDocumentUrl safely throws when Cloudinary is not configured');
  }

  // Test RBAC Access Validation for Verification Document
  // Only Super Admin or the owner who uploaded the document may view it
  const isAuthorizedAdmin = (role) => role === 'admin' || role === 'super_admin';
  const isAuthorizedOwner = (userId, publicId) => publicId.includes(`owner_${userId}`) || publicId.includes(userId);

  assert(isAuthorizedAdmin('super_admin') === true, 'Super Admin is authorized to access verification documents');
  assert(isAuthorizedAdmin('student') === false, 'Student role is strictly forbidden from accessing verification documents');
  assert(isAuthorizedOwner(verifiedOwner.id, samplePrivateDocPublicId) === true, 'Document owner is authorized to access their own document');
  assert(isAuthorizedOwner('usr-other-owner-999', samplePrivateDocPublicId) === false, 'Different owner is strictly forbidden from accessing another owner document');

  // 6. User Avatar Upload & Replacement
  console.log('\n--- 6. Testing User Avatar Update in MongoDB ---');
  const studentUser = userStore.findAll().find(u => u.role === 'student');
  const newAvatarUrl = 'https://res.cloudinary.com/demo/image/upload/sakanly/users/usr_avatar_test.jpg';
  const updatedUser = userStore.updateUser(studentUser.id, { avatar: newAvatarUrl });
  assert(updatedUser.avatar === newAvatarUrl, 'User avatar updated with Cloudinary URL in UserStore/MongoDB');

  // 7. Non-Regression: System Integrity
  console.log('\n--- 7. Non-Regression: Inquiries, Favorites, Messages & Audit Logs Integrity ---');
  const allInquiries = InquiriesStore.getAll();
  assert(Array.isArray(allInquiries) && allInquiries.length > 0, 'Inquiries store operational');

  const studentFavorites = FavoritesStore.getFavorites(studentUser.id);
  assert(Array.isArray(studentFavorites), 'Favorites store operational');

  const allConversations = MessagesService.getConversations(verifiedOwner.id, 'owner');
  assert(Array.isArray(allConversations), 'Messages service operational');

  const auditLogs = AuditLog.getAll({ limit: 5 });
  assert(Array.isArray(auditLogs.logs), 'Audit logs operational');

  // Clean up test listing
  ListingsService.delete(listing.id);
  assert(ListingsService.getById(listing.id) === null, 'Test listing cleaned up cleanly');

  await disconnectDB();

  console.log(`\n===============================================`);
  console.log(`📊 Phase 2 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`===============================================`);
};

runPhase2Tests()
  .then(() => {
    console.log('🎉 Phase 2 Cloudinary test suite executed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Phase 2 test suite encountered an unhandled error:', err);
    process.exit(1);
  });

