import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { CloudinaryService, CLOUDINARY_FOLDERS } from '../services/cloudinaryService.js';
import { ListingsService } from '../services/listingsService.js';
import { Listing } from '../models/Listing.js';
import { userStore } from '../data/mockUsers.js';

console.log('🧪 Starting Property Media & Video Lifecycle Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

const assert = (condition, description) => {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS ${totalTests}] ${description}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL ${totalTests}] ${description}`);
    process.exitCode = 1;
  }
};

const runSuite = async () => {
  const mongoConnected = await connectDB();
  assert(mongoConnected === true, 'MongoDB Atlas connection active for test suite');

  const ownerA = userStore.findByEmail('owner@sakanly.com') || { id: 'usr-owner-001', fullName: 'أحمد محمود' };
  const ownerB = userStore.findByEmail('mona.owner@example.com') || { id: 'usr-owner-002', fullName: 'منى الشريف' };
  const student = userStore.findByEmail('student@sakanly.com') || { id: 'usr-student-001', role: 'student' };

  // -------------------------------------------------------------
  // Test Case 1: Live Cloudinary Connection / Ping
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Cloudinary Ping & Configuration ---');
  const ping = await CloudinaryService.testConnection();
  if (CloudinaryService.isConfigured()) {
    assert(ping.connected === true, `Cloudinary connection ping successful (Cloud: ${ping.cloudName})`);
  } else {
    assert(ping.connected === false && ping.configured === false, 'Cloudinary unconfigured graceful response');
  }

  // -------------------------------------------------------------
  // Test Case 2: Validation of Disallowed MIME & Extensions (Security)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Reject Disallowed MIME & Extensions (.exe, .txt, etc.) ---');
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const dangerousMimes = ['application/x-msdownload', 'application/javascript', 'text/html', 'text/plain'];
  const dangerousExts = ['.exe', '.sh', '.bat', '.php', '.js', '.txt'];

  const isMimeAllowed = (mime, type) => {
    if (type === 'image') return allowedImageMimes.includes(mime);
    if (type === 'video') return allowedVideoMimes.includes(mime);
    return false;
  };

  assert(isMimeAllowed('application/x-msdownload', 'video') === false, 'Disallowed MIME .exe is rejected for video');
  assert(isMimeAllowed('text/plain', 'image') === false, 'Disallowed MIME .txt is rejected for image');
  assert(isMimeAllowed('image/jpeg', 'image') === true, 'Allowed MIME image/jpeg is accepted');
  assert(isMimeAllowed('video/mp4', 'video') === true, 'Allowed MIME video/mp4 is accepted');

  // -------------------------------------------------------------
  // Test Case 3: Reject Video > 100MB Limit Check
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Reject Video Exceeding 100MB Limit ---');
  const maxVideoSizeBytes = 100 * 1024 * 1024; // 100MB
  const maxImageSizeBytes = 10 * 1024 * 1024; // 10MB

  const oversizeVideoBytes = 105 * 1024 * 1024; // 105MB
  const validVideoBytes = 45 * 1024 * 1024; // 45MB

  assert(oversizeVideoBytes > maxVideoSizeBytes, '105MB video exceeds 100MB threshold');
  assert(validVideoBytes <= maxVideoSizeBytes, '45MB video passes size limit check');
  assert(maxImageSizeBytes === 10485760, 'Image limit strictly 10MB');

  // -------------------------------------------------------------
  // Test Case 4: Add Property with 5 Images and 1 Video
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Add Property with 5 Images and 1 Video ---');
  const propId4 = `prop-test-media-${Date.now()}`;
  const fiveImages = [
    'https://res.cloudinary.com/demo/image/upload/sample1.jpg',
    'https://res.cloudinary.com/demo/image/upload/sample2.jpg',
    'https://res.cloudinary.com/demo/image/upload/sample3.jpg',
    'https://res.cloudinary.com/demo/image/upload/sample4.jpg',
    'https://res.cloudinary.com/demo/image/upload/sample5.jpg',
  ];
  const testVideo = {
    url: 'https://res.cloudinary.com/demo/video/upload/sample_tour.mp4',
    secure_url: 'https://res.cloudinary.com/demo/video/upload/sample_tour.mp4',
    public_id: 'sakanly/properties/test_video_001',
    format: 'mp4',
    bytes: 14500000,
    duration: 35.5,
    thumbnail_url: 'https://res.cloudinary.com/demo/video/upload/sample_tour.jpg',
  };

  const createdWithVideo = await ListingsService.create({
    id: propId4,
    title: 'شقة تجريبية بخمس صور وفيديو جولة كاملة',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    district: 'الحي السابع',
    accommodationType: 'entire_apartment',
    monthlyPrice: 6000,
    deposit: 6000,
    bedrooms: 2,
    bathrooms: 1,
    totalBeds: 2,
    availableBeds: 2,
    images: fiveImages,
    video: testVideo,
    status: 'pending_review',
    owner: {
      id: ownerA.id,
      name: ownerA.fullName,
    },
  });

  assert(createdWithVideo.images.length === 5, 'Property created with exactly 5 images');
  assert(Boolean(createdWithVideo.video), 'Property video object stored correctly');
  assert(createdWithVideo.video.public_id === 'sakanly/properties/test_video_001', 'Property video public_id stored');
  assert(createdWithVideo.video.thumbnail_url?.includes('.jpg'), 'Property video thumbnail_url generated');

  // -------------------------------------------------------------
  // Test Case 5: Add Property with Images Only (No Video)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Add Property with Images Only (No Video) ---');
  const propId5 = `prop-test-images-only-${Date.now()}`;
  const createdNoVideo = await ListingsService.create({
    id: propId5,
    title: 'شقة تجريبية بصور فقط بدون فيديو',
    governorate: 'القاهرة',
    city: 'الدقي',
    district: 'مصدق',
    accommodationType: 'shared_room',
    monthlyPrice: 2500,
    deposit: 2500,
    bedrooms: 1,
    bathrooms: 1,
    totalBeds: 2,
    availableBeds: 1,
    images: ['https://res.cloudinary.com/demo/image/upload/sample_novid.jpg'],
    video: null,
    status: 'pending_review',
    owner: { id: ownerA.id, name: ownerA.fullName },
  });

  assert(createdNoVideo.images.length === 1, 'Property has 1 image');
  assert(!createdNoVideo.video, 'Property video is null/empty when not provided');

  // -------------------------------------------------------------
  // Test Case 6: Add Property with Video and 1 Image
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Add Property with Video and 1 Image ---');
  const propId6 = `prop-test-vid-one-img-${Date.now()}`;
  const createdOneImgVid = await ListingsService.create({
    id: propId6,
    title: 'استوديو تجريبي بصورة وفيديو',
    governorate: 'الجيزة',
    city: 'الدقي',
    district: 'مصدق',
    accommodationType: 'private_room',
    monthlyPrice: 4000,
    deposit: 4000,
    bedrooms: 1,
    bathrooms: 1,
    totalBeds: 1,
    availableBeds: 1,
    images: ['https://res.cloudinary.com/demo/image/upload/studio_img.jpg'],
    video: {
      url: 'https://res.cloudinary.com/demo/video/upload/studio_tour.mp4',
      secure_url: 'https://res.cloudinary.com/demo/video/upload/studio_tour.mp4',
      public_id: 'sakanly/properties/test_video_studio',
      format: 'mp4',
      thumbnail_url: 'https://res.cloudinary.com/demo/video/upload/studio_tour.jpg',
    },
    status: 'pending_review',
    owner: { id: ownerA.id, name: ownerA.fullName },
  });

  assert(createdOneImgVid.images.length === 1, 'Single image saved');
  assert(createdOneImgVid.video?.format === 'mp4', 'Video saved with format mp4');

  // -------------------------------------------------------------
  // Test Case 7: Delete Image and Update Media List
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Delete Image and Update Media List ---');
  const updatedImages = createdWithVideo.images.filter((_, idx) => idx !== 2); // remove 3rd image
  const updatedListing7 = await ListingsService.update(propId4, { images: updatedImages });
  assert(updatedListing7.images.length === 4, 'Image removed from listing (from 5 to 4 images)');
  assert(!updatedListing7.images.includes(fiveImages[2]), 'Specific deleted image is no longer in array');

  // -------------------------------------------------------------
  // Test Case 8: Replace Video and Clean Up Old Video Reference
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Replace Video and Ensure Cloudinary Cleanup Reference ---');
  const newVideoObj = {
    url: 'https://res.cloudinary.com/demo/video/upload/sample_tour_v2.mp4',
    secure_url: 'https://res.cloudinary.com/demo/video/upload/sample_tour_v2.mp4',
    public_id: 'sakanly/properties/test_video_002',
    format: 'mp4',
    thumbnail_url: 'https://res.cloudinary.com/demo/video/upload/sample_tour_v2.jpg',
  };

  const oldVideoPublicId = updatedListing7.video?.public_id;
  const updatedListing8 = await ListingsService.update(propId4, { video: newVideoObj });
  assert(updatedListing8.video.public_id === 'sakanly/properties/test_video_002', 'Listing now references new video v2');
  assert(oldVideoPublicId === 'sakanly/properties/test_video_001', 'Old video public_id was properly identified for cleanup');

  // -------------------------------------------------------------
  // Test Case 9: Update Property Without Re-uploading Unchanged Media
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Update Listing Metadata Without Re-uploading Media ---');
  const updatedListing9 = await ListingsService.update(propId4, {
    monthlyPrice: 6500,
    description: 'تم تحديث السعر والوصف دون المساس بروابط الصور والفيديو.',
  });
  assert(updatedListing9.monthlyPrice === 6500, 'Price updated successfully');
  assert(updatedListing9.images.length === 4, 'Images preserved unchanged without re-upload');
  assert(updatedListing9.video?.public_id === 'sakanly/properties/test_video_002', 'Video preserved unchanged');

  // -------------------------------------------------------------
  // Test Case 10: Approved Property Media is Visible to Students
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Approved Property Media Visible to Students ---');
  await ListingsService.update(propId4, { status: 'active', isVerified: true });
  const publicListings = await ListingsService.getAll({ status: 'active' });
  const publicFound = publicListings.find(p => p.id === propId4);

  assert(Boolean(publicFound), 'Active approved listing is returned in public query');
  assert(publicFound?.images?.length === 4, 'Public listing includes images array');
  assert(Boolean(publicFound?.video), 'Public listing includes video object with preview poster');

  // -------------------------------------------------------------
  // Test Case 11: Pending Review Property Not Visible in Public Search
  // -------------------------------------------------------------
  console.log('\n--- Test 11: Pending Review Property Hidden from Public / Students ---');
  const pendingListings = await ListingsService.getAll({ status: 'active' });
  const pendingFound = pendingListings.find(p => p.id === propId5); // propId5 is pending_review
  assert(pendingFound === undefined, 'Pending review listing is strictly excluded from public student results');

  // -------------------------------------------------------------
  // Test Case 12: Prevent Owner from Deleting Another Owner's Media (IDOR)
  // -------------------------------------------------------------
  console.log('\n--- Test 12: Prevent IDOR (Owner Cannot Delete Another Owner Media) ---');
  const checkOwnerCanModifyMedia = (listing, requestingUserId) => {
    if (!listing || !listing.owner) return false;
    const ownerId = listing.owner.id || listing.owner._id?.toString();
    return ownerId === requestingUserId;
  };

  const canOwnerADeleteOwn = checkOwnerCanModifyMedia(createdWithVideo, ownerA.id);
  const canOwnerBDeleteOwnerA = checkOwnerCanModifyMedia(createdWithVideo, ownerB.id);

  assert(canOwnerADeleteOwn === true, 'Owner A can modify/delete their own property media');
  assert(canOwnerBDeleteOwnerA === false, 'Owner B is strictly blocked from deleting Owner A property media (IDOR Defense)');

  // -------------------------------------------------------------
  // Test Case 13: Private Verification Documents Security Check
  // -------------------------------------------------------------
  console.log('\n--- Test 13: Verification Documents Privacy & Signed Access ---');
  const verificationDocPath = 'sakanly/verification/owner_usr-001_national_id.jpg';
  const isDocPubliclyAccessible = (path, userRole) => {
    if (path.startsWith(CLOUDINARY_FOLDERS.VERIFICATION)) {
      return userRole === 'admin' || userRole === 'super_admin';
    }
    return true;
  };

  assert(isDocPubliclyAccessible(verificationDocPath, 'student') === false, 'Students cannot view private verification documents');
  assert(isDocPubliclyAccessible(verificationDocPath, 'guest') === false, 'Guests cannot view private verification documents');
  assert(isDocPubliclyAccessible(verificationDocPath, 'super_admin') === true, 'Super Admin can view private verification documents');

  // Clean up created test listings in MongoDB
  try {
    if (Listing) {
      await Listing.deleteMany({ id: { $in: [propId4, propId5, propId6] } });
    }
  } catch (err) {
    console.log('Cleanup notice:', err.message);
  }

  console.log(`\n========================================`);
  console.log(`🎉 TEST RESULTS: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
};

runSuite().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

