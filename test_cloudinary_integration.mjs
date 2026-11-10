import assert from 'node:assert';
import { v2 as cloudinary } from 'cloudinary';
import { config } from './server/src/config/index.js';
import { CloudinaryService, CLOUDINARY_FOLDERS } from './server/src/services/cloudinaryService.js';
import { getOptimizedImageUrl, isVideoMedia, getVideoPosterUrl } from './client/src/utils/cloudinary.js';

console.log('===========================================================');
console.log('🧪 Starting Comprehensive Sakanly Cloudinary Integration Test');
console.log('===========================================================\n');

// 1. Test Folder Taxonomy Configuration
console.log('--- Test 1: فحص تنظيم المجلدات (Folders Taxonomy) ---');
assert.strictEqual(CLOUDINARY_FOLDERS.PROPERTY_IMAGES, 'sakanly/properties/images');
assert.strictEqual(CLOUDINARY_FOLDERS.PROPERTY_VIDEOS, 'sakanly/properties/videos');
assert.strictEqual(CLOUDINARY_FOLDERS.USER_AVATARS, 'sakanly/users/avatars');
assert.strictEqual(CLOUDINARY_FOLDERS.VERIFICATION_DOCS, 'sakanly/verification/documents');
console.log('✅ Test 1 PASSED: بنية المجلدات منظمة ومعزولة بنجاح.\n');

// 2. Test Media Optimization & Auto-format Helpers (f_auto, q_auto)
console.log('--- Test 2: فحص دوال تحسين الصور والفيديوهات (f_auto, q_auto) ---');
const sampleCloudinaryUrl = 'https://res.cloudinary.com/sakanly-demo/image/upload/v1234567890/sakanly/properties/images/room1.jpg';
const optimizedUrl = getOptimizedImageUrl(sampleCloudinaryUrl, { width: 800, height: 600 });
console.log('Original URL :', sampleCloudinaryUrl);
console.log('Optimized URL:', optimizedUrl);

assert.ok(optimizedUrl.includes('f_auto,q_auto'), 'Optimized URL must contain f_auto,q_auto');
assert.ok(optimizedUrl.includes('w_800'), 'Optimized URL must contain w_800');
assert.ok(optimizedUrl.includes('h_600'), 'Optimized URL must contain h_600');

// Test video poster generator
const sampleVideoUrl = 'https://res.cloudinary.com/sakanly-demo/video/upload/v1234567890/sakanly/properties/videos/tour.mp4';
const posterUrl = getVideoPosterUrl(sampleVideoUrl);
console.log('Video URL   :', sampleVideoUrl);
console.log('Poster Frame:', posterUrl);
assert.ok(posterUrl.endsWith('.jpg') || posterUrl.includes('.jpg'), 'Poster frame must point to jpg transformation');
assert.ok(isVideoMedia(sampleVideoUrl), 'isVideoMedia must detect mp4 as video');
assert.ok(!isVideoMedia(sampleCloudinaryUrl), 'isVideoMedia must not detect jpg as video');
console.log('✅ Test 2 PASSED: تحسينات Cloudinary وتوليد غلاف الفيديو تعمل بدقة.\n');

// 3. Test Signature Generation Algorithm (Signed Uploads)
console.log('--- Test 3: فحص خوارزمية توقيع الرفع (Signed Upload Parameters) ---');
// Mock credentials if not provided in local environment for algorithmic test
const testSecret = config.cloudinary.apiSecret || 'dev_secret_test_key_12345';
const testApiKey = config.cloudinary.apiKey || '123456789012345';
const testCloudName = config.cloudinary.cloudName || 'sakanly-test-cloud';

// Temporarily set test credentials if empty for pure unit testing
config.cloudinary.cloudName = testCloudName;
config.cloudinary.apiKey = testApiKey;
config.cloudinary.apiSecret = testSecret;

cloudinary.config({
  cloud_name: testCloudName,
  api_key: testApiKey,
  api_secret: testSecret,
});

const signParams = CloudinaryService.generateUploadSignature({
  folder: CLOUDINARY_FOLDERS.PROPERTY_IMAGES,
  resourceType: 'image',
  tags: ['sakanly', 'owner_usr-001'],
});

console.log('Generated Signature Payload:');
console.log('  folder      :', signParams.folder);
console.log('  timestamp   :', signParams.timestamp);
console.log('  apiKey      :', signParams.apiKey);
console.log('  signature   :', signParams.signature);

assert.ok(signParams.signature, 'Signature must be generated');
assert.strictEqual(signParams.folder, CLOUDINARY_FOLDERS.PROPERTY_IMAGES);
assert.strictEqual(signParams.apiKey, testApiKey);

// Verify signature matches Cloudinary official SDK signature calculation
const expectedSignature = cloudinary.utils.api_sign_request(
  {
    folder: CLOUDINARY_FOLDERS.PROPERTY_IMAGES,
    tags: 'sakanly,owner_usr-001',
    timestamp: signParams.timestamp,
  },
  testSecret
);

assert.strictEqual(signParams.signature, expectedSignature, 'Generated signature must match Cloudinary SDK api_sign_request');
console.log('✅ Test 3 PASSED: التوقيع المعتمد للرفع المباشر Signed Uploads مطابق 100% لخوارزمية Cloudinary الرسمية.\n');

// 4. Test Verification Document Protection (Authenticated Type)
console.log('--- Test 4: فحص حماية مستندات التوثيق (Private Authenticated Docs) ---');
const verificationSign = CloudinaryService.generateUploadSignature({
  folder: CLOUDINARY_FOLDERS.VERIFICATION_DOCS,
  resourceType: 'image',
});

assert.strictEqual(verificationSign.accessMode, 'authenticated', 'Verification docs must be authenticated');
assert.strictEqual(verificationSign.type, 'authenticated', 'Verification docs type must be authenticated');

// Generate temporary signed URL
const signedDocUrl = CloudinaryService.generateSignedDocumentUrl('sakanly/verification/documents/id_front_123', {
  expiresInSeconds: 600,
});
console.log('Generated Temporary Signed URL for Document:', signedDocUrl);
assert.ok(signedDocUrl.includes('s--'), 'Signed URL must contain Cloudinary signature token');
assert.ok(signedDocUrl.includes('/authenticated/'), 'Signed URL path must enforce authenticated access');
console.log('✅ Test 4 PASSED: مستندات التوثيق معزولة ومحمية بروابط موقعة مؤقتة.\n');

// 5. Test Multiple Media Cleanup (Orphan Asset Protection)
console.log('--- Test 5: فحص آلية الحذف الآمن للوسائط المتعددة (Orphan Cleanup) ---');
const mockMediaList = [
  { public_id: 'sakanly/properties/images/img1', resource_type: 'image' },
  { public_id: 'sakanly/properties/videos/vid1', resource_type: 'video' },
];

const deleteResults = await CloudinaryService.deleteMultipleMedia(mockMediaList);
assert.strictEqual(deleteResults.length, 2, 'Should process all media items in list');
console.log('✅ Test 5 PASSED: تم اختبار الحذف الجماعي الآمن للوسائط لمنع الملفات اليتيمة.\n');

console.log('===========================================================');
console.log('🎉 ALL CLOUDINARY INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
console.log('===========================================================');
