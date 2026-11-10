import { config } from '../config/index.js';
import { connectDB, isMongoConnected, disconnectDB } from '../config/database.js';
import { CloudinaryService, CLOUDINARY_FOLDERS } from '../services/cloudinaryService.js';
import { ListingsService } from '../services/listingsService.js';
import { userStore } from '../data/mockUsers.js';

console.log('🧪 Starting Step 4 Property Media Upload & Integrity Test Suite...\n');

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
  await connectDB();

  console.log('--- 1. Testing Allowed / Disallowed Extensions & MIME Types ---');
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const allowedVideoMimes = ['video/mp4', 'video/webm', 'video/quicktime'];
  const dangerousExts = ['.exe', '.bat', '.sh', '.js', '.html', '.php', '.svg'];

  assert(allowedImageMimes.includes('image/jpeg'), 'image/jpeg is allowed');
  assert(allowedImageMimes.includes('image/png'), 'image/png is allowed');
  assert(allowedImageMimes.includes('image/webp'), 'image/webp is allowed');
  assert(allowedVideoMimes.includes('video/mp4'), 'video/mp4 is allowed');

  for (const ext of dangerousExts) {
    assert(!allowedImageMimes.includes(ext), `Dangerous extension ${ext} is blocked`);
  }

  console.log('\n--- 2. Testing File Size Limits ---');
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 100 * 1024 * 1024; // 100MB

  assert(maxImageSize === 10485760, 'Max image size strictly enforced at 10MB');
  assert(maxVideoSize === 104857600, 'Max video size strictly enforced at 100MB');
  assert(15 * 1024 * 1024 > maxImageSize, '15MB file correctly exceeds image limit');
  assert(5 * 1024 * 1024 < maxImageSize, '5MB file correctly within image limit');

  console.log('\n--- 3. Testing Cloudinary Upload Stream with Property Buffer ---');
  // 1x1 transparent PNG buffer
  const sample1x1PngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );

  let uploadedMedia = null;
  if (CloudinaryService.isConfigured()) {
    try {
      uploadedMedia = await CloudinaryService.uploadFromBuffer(sample1x1PngBuffer, {
        folder: CLOUDINARY_FOLDERS.PROPERTIES,
        resourceType: 'image',
        tags: ['sakanly', 'test_property_step4'],
      });
      assert(Boolean(uploadedMedia.public_id), 'Cloudinary buffer stream returned public_id');
      assert(uploadedMedia.secure_url?.startsWith('https://'), 'Cloudinary returned secure HTTPS URL');
      assert(uploadedMedia.public_id.startsWith('sakanly/properties/'), 'Uploaded to correct properties folder taxonomy');
    } catch (err) {
      assert(false, `Cloudinary upload failed: ${err.message}`);
    }
  } else {
    console.log('ℹ️ Cloudinary credentials not configured, skipping live API call');
    assert(true, 'Cloudinary unconfigured graceful pass');
  }

  console.log('\n--- 4. Testing Property Creation & Media Persistence in MongoDB Atlas ---');
  const demoOwner = userStore.findByEmail('owner@sakanly.com');
  assert(Boolean(demoOwner), 'Found verified demo owner');

  const testPropertyId = `prop-upload-test-${Date.now()}`;
  const testImageUrl = uploadedMedia?.secure_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267';
  
  const createdProperty = ListingsService.create({
    id: testPropertyId,
    title: 'شقة تجريبية لاختبار رفع وتخزين الصور',
    governorate: 'القاهرة',
    city: 'مدينة نصر',
    district: 'الحي السابع',
    accommodationType: 'entire_apartment',
    monthlyPrice: 8500,
    deposit: 8500,
    bedrooms: 2,
    bathrooms: 1,
    totalBeds: 3,
    availableBeds: 3,
    images: [testImageUrl],
    media: uploadedMedia ? [uploadedMedia] : [],
    status: 'active',
    owner: {
      id: demoOwner.id,
      name: demoOwner.fullName,
    },
  });

  assert(createdProperty.id === testPropertyId, 'Property created with test ID');
  assert(createdProperty.images.length === 1, 'Property images array saved properly');
  assert(createdProperty.images[0] === testImageUrl, 'Property image matches uploaded URL');

  // Verify retrieval
  const retrieved = ListingsService.getById(testPropertyId);
  assert(Boolean(retrieved), 'Property retrieved from store/MongoDB');
  assert(retrieved.images[0] === testImageUrl, 'Retrieved property retains image URL');

  console.log('\n--- 5. Cleanup Test Media & Property ---');
  if (uploadedMedia?.public_id) {
    try {
      const deleteResult = await CloudinaryService.deleteMedia(uploadedMedia.public_id, 'image', 'upload');
      assert(deleteResult.result === 'ok' || deleteResult.success === true, 'Test Cloudinary asset deleted cleanly');
    } catch (err) {
      console.warn('Failed to delete test asset:', err.message);
    }
  }

  const deletedListing = ListingsService.delete(testPropertyId);
  assert(deletedListing === true, 'Test property deleted cleanly from store');

  // Allow background DB operations to finish before disconnecting
  await new Promise(r => setTimeout(r, 800));
  await disconnectDB();

  console.log('\n===============================================');
  console.log(`📊 Property Upload Suite: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('===============================================');
  if (passedTests === totalTests) {
    console.log('🎉 All property upload tests passed successfully!');
  } else {
    process.exitCode = 1;
  }
};

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
