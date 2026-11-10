import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index.js';
import streamifier from 'stream';

// Production Taxonomy for Sakanly Cloudinary Assets as specified
export const CLOUDINARY_FOLDERS = {
  PROPERTIES: 'sakanly/properties',
  USERS: 'sakanly/users',
  VERIFICATION: 'sakanly/verification',
  REPORTS: 'sakanly/reports',
  // Backward compatibility aliases
  PROPERTY_IMAGES: 'sakanly/properties',
  PROPERTY_VIDEOS: 'sakanly/properties',
  USER_AVATARS: 'sakanly/users',
  VERIFICATION_DOCS: 'sakanly/verification',
};

const initCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || config.cloudinary.cloudName;
  const apiKey = process.env.CLOUDINARY_API_KEY || config.cloudinary.apiKey;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || config.cloudinary.apiSecret;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName.trim(),
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      secure: true,
    });
  }
  return { cloudName, apiKey, apiSecret };
};

initCloudinaryConfig();

export class CloudinaryService {
  /**
   * Check if Cloudinary credentials are fully configured
   */
  static isConfigured() {
    const { cloudName, apiKey, apiSecret } = initCloudinaryConfig();
    return Boolean(cloudName && apiKey && apiSecret);
  }

  /**
   * Ping Cloudinary API to verify credentials & network reachability
   */
  static async testConnection() {
    if (!this.isConfigured()) {
      return {
        configured: false,
        connected: false,
        message: 'بيانات Cloudinary غير متوفرة في متغيرات البيئة (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
      };
    }

    try {
      const res = await cloudinary.api.ping();
      return {
        configured: true,
        connected: res.status === 'ok',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || config.cloudinary.cloudName,
        message: 'تم الاتصال بخدمة Cloudinary بنجاح والتحقق من صحة مفاتيح API.',
      };
    } catch (err) {
      return {
        configured: true,
        connected: false,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || config.cloudinary.cloudName,
        message: `فشل التحقق من اتصال Cloudinary: ${err.message}`,
      };
    }
  }

  /**
   * Test a real upload and deletion on Cloudinary to verify write permissions
   */
  static async uploadRealTestMedia() {
    if (!this.isConfigured()) {
      throw new Error('خدمة Cloudinary غير مهيأة.');
    }

    // 1x1 transparent PNG buffer
    const testPixelPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );

    const testId = `sakanly_test_ping_${Date.now()}`;
    const uploadResult = await this.uploadFromBuffer(testPixelPng, {
      folder: CLOUDINARY_FOLDERS.PROPERTIES,
      resourceType: 'image',
      publicId: testId,
      tags: ['sakanly_test'],
    });

    // Immediately clean up
    await this.deleteMedia(uploadResult.public_id, 'image', 'upload');

    return {
      success: true,
      publicId: uploadResult.public_id,
      secureUrl: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    };
  }

  /**
   * Generate signed parameters for direct, secure client-side uploads
   */
  static generateUploadSignature({ folder, resourceType = 'image', tags = [], allowedFormats = [] }) {
    if (!this.isConfigured()) {
      throw new Error('خدمة Cloudinary غير مهيأة بعد على الخادم. يرجى ضبط المتغيرات البيئية.');
    }

    const { apiSecret, apiKey, cloudName } = initCloudinaryConfig();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      timestamp,
      folder: folder || CLOUDINARY_FOLDERS.PROPERTIES,
    };

    if (tags && tags.length > 0) {
      paramsToSign.tags = Array.isArray(tags) ? tags.join(',') : tags;
    }

    if (allowedFormats && allowedFormats.length > 0) {
      paramsToSign.allowed_formats = Array.isArray(allowedFormats) ? allowedFormats.join(',') : allowedFormats;
    }

    // For verification documents, restrict public viewing and enforce authenticated access
    if (folder === CLOUDINARY_FOLDERS.VERIFICATION) {
      paramsToSign.access_mode = 'authenticated';
      paramsToSign.type = 'authenticated';
    }

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: paramsToSign.folder,
      resourceType,
      accessMode: paramsToSign.access_mode || 'public',
      type: paramsToSign.type || 'upload',
      tags: paramsToSign.tags || '',
    };
  }

  /**
   * Upload media stream from memory buffer (Multer)
   */
  static async uploadFromBuffer(fileBuffer, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('خدمة Cloudinary غير مهيأة. يرجى توفير CLOUDINARY_CLOUD_NAME و API_KEY و API_SECRET في server/.env.');
    }

    const {
      folder = CLOUDINARY_FOLDERS.PROPERTIES,
      resourceType = 'auto',
      tags = ['sakanly'],
      isVerificationDoc = false,
      publicId,
    } = options;

    const uploadOptions = {
      folder,
      resource_type: resourceType,
      tags,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    // Enforce authenticated privacy on sensitive owner verification documents
    if (isVerificationDoc || folder === CLOUDINARY_FOLDERS.VERIFICATION) {
      uploadOptions.type = 'authenticated';
      uploadOptions.access_mode = 'authenticated';
      if (resourceType === 'auto') {
        uploadOptions.resource_type = 'auto';
      }
    }

    // Auto optimization for standard images
    if (resourceType === 'image') {
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' },
      ];
    }

    return new Promise((resolve, reject) => {
      // Chunked stream for video (supports large videos), standard stream for images & docs
      const uploadStream = resourceType === 'video'
        ? cloudinary.uploader.upload_chunked_stream(
            { ...uploadOptions, chunk_size: 20 * 1024 * 1024 }, // 20MB chunks
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          )
        : cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });

      const bufferStream = new streamifier.PassThrough();
      bufferStream.end(fileBuffer);
      bufferStream.pipe(uploadStream);
    });
  }

  /**
   * Delete single media asset from Cloudinary
   */
  static async deleteMedia(publicId, resourceType = 'image', type = 'upload') {
    if (!this.isConfigured() || !publicId) return { result: 'skipped' };

    const resType = typeof resourceType === 'string' ? resourceType : (resourceType?.resourceType || 'image');
    const upType = typeof resourceType === 'object' && resourceType?.type ? resourceType.type : type;

    try {
      const response = await cloudinary.uploader.destroy(publicId, {
        resource_type: resType,
        type: upType,
        invalidate: true,
      });
      return response;
    } catch (error) {
      console.error(`[CloudinaryService] Failed to delete asset ${publicId}:`, error.message);
      return { result: 'error', error: error.message };
    }
  }

  /**
   * Delete multiple media assets safely
   */
  static async deleteMultipleMedia(mediaItems = []) {
    if (!this.isConfigured() || !Array.isArray(mediaItems) || mediaItems.length === 0) {
      return [];
    }

    const deletionPromises = mediaItems.map(async (item) => {
      const publicId = typeof item === 'string' ? item : item.public_id;
      const resourceType = typeof item === 'object' && item.resource_type ? item.resource_type : 'image';
      const type = typeof item === 'object' && item.type ? item.type : 'upload';

      if (!publicId) return null;
      return this.deleteMedia(publicId, resourceType, type);
    });

    return Promise.allSettled(deletionPromises);
  }

  /**
   * Generate temporary signed URL for private verification documents
   */
  static generateSignedDocumentUrl(publicId, { expiresInSeconds = 600, resourceType = 'image' } = {}) {
    if (!this.isConfigured()) {
      throw new Error('خدمة Cloudinary غير مهيأة.');
    }

    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const isPdf = typeof publicId === 'string' && publicId.toLowerCase().endsWith('.pdf');
    const finalResourceType = isPdf ? 'raw' : resourceType;

    return cloudinary.url(publicId, {
      type: 'authenticated',
      resource_type: finalResourceType,
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });
  }

  /**
   * Helper to format an image URL with standard auto-format and auto-quality
   */
  static getOptimizedUrl(publicIdOrUrl, { width, height, crop = 'fill' } = {}) {
    if (!publicIdOrUrl) return '';

    if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('cloudinary.com')) {
      return publicIdOrUrl;
    }

    if (publicIdOrUrl.includes('cloudinary.com') && publicIdOrUrl.includes('/upload/')) {
      const transform = `f_auto,q_auto${width ? `,w_${width}` : ''}${height ? `,h_${height},c_${crop}` : ''}`;
      return publicIdOrUrl.replace('/upload/', `/upload/${transform}/`);
    }

    const transformOptions = {
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    };

    if (width) transformOptions.width = width;
    if (height) {
      transformOptions.height = height;
      transformOptions.crop = crop;
    }

    return cloudinary.url(publicIdOrUrl, transformOptions);
  }

  /**
   * Helper to generate a video thumbnail/poster URL from a video public_id or url
   */
  static getVideoThumbnailUrl(publicIdOrUrl, { width = 800, height = 450, crop = 'limit' } = {}) {
    if (!publicIdOrUrl) return '';

    if (typeof publicIdOrUrl === 'string' && publicIdOrUrl.includes('cloudinary.com')) {
      const withoutExt = publicIdOrUrl.substring(0, publicIdOrUrl.lastIndexOf('.')) || publicIdOrUrl;
      const cleanUrl = `${withoutExt}.jpg`;
      return this.getOptimizedUrl(cleanUrl, { width, height, crop });
    }

    try {
      return cloudinary.url(publicIdOrUrl, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          ...(width ? [{ width, height, crop }] : []),
        ],
        secure: true,
      });
    } catch {
      return '';
    }
  }
}
