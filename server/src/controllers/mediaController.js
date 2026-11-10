import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CloudinaryService, CLOUDINARY_FOLDERS } from '../services/cloudinaryService.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { userStore } from '../data/mockUsers.js';
import { ListingsService } from '../services/listingsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MediaController {
  /**
   * Check Cloudinary service configuration & live connection status
   */
  static async getStatus(req, res, next) {
    try {
      const status = await CloudinaryService.testConnection();
      return ApiResponse.success(res, status, status.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Issue signed upload parameters for direct, secure uploads
   * Enforces user authentication and role verification before issuing signature
   */
  static getUploadSignature(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً للحصول على تفويض رفع الوسائط.',
        });
      }

      if (!CloudinaryService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'CLOUDINARY_NOT_CONFIGURED',
          message: 'خدمة Cloudinary غير مهيأة بعد على الخادم. يرجى ضبط المتغيرات البيئية CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET في server/.env.',
        });
      }

      const { folderType = 'property', resourceType = 'image' } = req.body;

      let folder = CLOUDINARY_FOLDERS.PROPERTIES;
      let tags = ['sakanly'];

      if (folderType === 'verification') {
        if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح: رفع مستندات التوثيق متاح لملّاك العقارات فقط.',
          });
        }
        folder = CLOUDINARY_FOLDERS.VERIFICATION;
        tags.push('verification_doc', `owner_${req.user.id}`);
      } else if (folderType === 'avatar') {
        folder = CLOUDINARY_FOLDERS.USERS;
        tags.push('user_avatar', `user_${req.user.id}`);
      } else if (folderType === 'report') {
        folder = CLOUDINARY_FOLDERS.REPORTS;
        tags.push('report_evidence', `reporter_${req.user.id}`);
      } else {
        // Property media
        if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح: رفع وسائط العقارات متاح لملّاك العقارات والمديرين فقط.',
          });
        }
        folder = CLOUDINARY_FOLDERS.PROPERTIES;
        tags.push('property_media', `owner_${req.user.id}`);
      }

      const signatureData = CloudinaryService.generateUploadSignature({
        folder,
        resourceType,
        tags,
      });

      return ApiResponse.success(
        res,
        signatureData,
        'تم إصدار تفويض الرفع الآمن بنجاح.'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload property images or video via Server stream into sakanly/properties
   */
  static async uploadMedia(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لرفع الوسائط.',
        });
      }

      if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح: حسابات الطلاب لا تملك صلاحية رفع وسائط العقارات.',
        });
      }

      if (!CloudinaryService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'CLOUDINARY_NOT_CONFIGURED',
          message: 'خدمة Cloudinary غير مهيأة بعد على الخادم. يرجى إضافة CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET في server/.env لإتمام الرفع.',
        });
      }

      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم العثور على أي ملفات مرفوعة.',
        });
      }

      // Strict validation before uploading to Cloudinary
      for (const file of files) {
        const mime = (file.mimetype || '').toLowerCase();
        const ext = path.extname(file.originalname || '').toLowerCase();
        const isVideo = mime.startsWith('video/') || ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
        const isImage = mime.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'].includes(ext);

        if (!isImage && !isVideo) {
          return res.status(400).json({
            success: false,
            code: 'INVALID_FILE_TYPE',
            message: `صيغة الملف "${file.originalname}" غير مدعومة. يسمح فقط بالصور (JPG, PNG, WebP) والفيديوهات (MP4, WebM).`,
          });
        }

        const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
        if (isVideo && fileSize > 100 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            code: 'VIDEO_TOO_LARGE',
            message: `حجم ملف الفيديو "${file.originalname}" يتجاوز الحد الأقصى المسموح به (100 ميجابايت).`,
          });
        }

        if (isImage && fileSize > 10 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            code: 'IMAGE_TOO_LARGE',
            message: `حجم الصورة "${file.originalname}" يتجاوز الحد الأقصى المسموح به (10 ميجابايت).`,
          });
        }
      }

      const uploadPromises = files.map(async (file, index) => {
        const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.originalname || '');
        const resourceType = isVideo ? 'video' : 'image';

        const result = await CloudinaryService.uploadFromBuffer(file.buffer, {
          folder: CLOUDINARY_FOLDERS.PROPERTIES,
          resourceType,
          tags: ['sakanly', 'property_media', `owner_${req.user.id}`],
        });

        const isVid = result.resource_type === 'video' || isVideo;
        const posterUrl = isVid 
          ? (CloudinaryService.getVideoThumbnailUrl(result.public_id) || (result.secure_url ? result.secure_url.replace(/\.[^/.]+$/, ".jpg") : ''))
          : null;

        return {
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          resource_type: result.resource_type || (isVid ? 'video' : 'image'),
          format: result.format,
          bytes: result.bytes,
          width: result.width || null,
          height: result.height || null,
          duration: result.duration || null,
          isPrimary: index === 0,
          created_at: result.created_at,
          thumbnail_url: posterUrl,
          poster_url: posterUrl,
          optimized_url: isVid ? result.secure_url : CloudinaryService.getOptimizedUrl(result.public_id),
        };
      });

      const uploadedResults = await Promise.all(uploadPromises);

      return ApiResponse.success(
        res,
        {
          media: uploadedResults,
          total: uploadedResults.length,
        },
        'تم رفع الوسائط بنجاح وحفظها في Cloudinary.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload user profile avatar into sakanly/users
   */
  static async uploadAvatar(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      if (!CloudinaryService.isConfigured()) {
        return res.status(503).json({
          success: false,
          code: 'CLOUDINARY_NOT_CONFIGURED',
          message: 'خدمة Cloudinary غير مهيأة بعد على الخادم. يرجى إضافة مفاتيح Cloudinary في server/.env.',
        });
      }

      const file = req.file || (req.files && req.files[0]);
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'يرجى اختيار صورة شخصية للرفع.',
        });
      }

      // Check and delete previous avatar if hosted on Cloudinary
      const currentUser = userStore.findById(req.user.id);
      if (currentUser?.avatar && currentUser.avatar.includes('cloudinary.com')) {
        const match = currentUser.avatar.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (match && match[1]) {
          await CloudinaryService.deleteMedia(match[1], 'image', 'upload');
        }
      }

      const result = await CloudinaryService.uploadFromBuffer(file.buffer, {
        folder: CLOUDINARY_FOLDERS.USERS,
        resourceType: 'image',
        tags: ['sakanly_avatar', `user_${req.user.id}`],
      });

      // Update avatar in MongoDB / UserStore
      userStore.updateUser(req.user.id, {
        avatar: result.secure_url,
      });

      return ApiResponse.success(
        res,
        {
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          bytes: result.bytes,
        },
        'تم تحديث الصورة الشخصية بنجاح.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload private owner verification documents into sakanly/verification
   * Restricts public access by storing strictly as 'authenticated' type
   */
  static async uploadVerificationDocument(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      if (req.user.role !== 'owner' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح: رفع مستندات التوثيق متاح لملّاك العقارات فقط.',
        });
      }

      const files = req.files || (req.file ? [req.file] : []);
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'يرجى اختيار صورة بطاقة الرقم القومي أو مستند الملكية.',
        });
      }

      const { docType = 'national_id_front' } = req.body;
      const isCloudinaryActive = CloudinaryService.isConfigured();

      if (!isCloudinaryActive) {
        return res.status(503).json({
          success: false,
          code: 'CLOUDINARY_NOT_CONFIGURED',
          message: 'خدمة Cloudinary غير مهيأة في server/.env. يرجى إضافة CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET لتأمين مستندات التوثيق.',
        });
      }

      const uploadPromises = files.map(async (file) => {
        const isPdf = file.mimetype === 'application/pdf';
        const resourceType = isPdf ? 'raw' : 'image';

        const result = await CloudinaryService.uploadFromBuffer(file.buffer, {
          folder: CLOUDINARY_FOLDERS.VERIFICATION,
          resourceType,
          isVerificationDoc: true,
          tags: ['sakanly_verification', `owner_${req.user.id}`, `doc_${docType}`],
        });

        const temporarySignedUrl = CloudinaryService.generateSignedDocumentUrl(result.public_id, {
          expiresInSeconds: 600, // 10 minutes
          resourceType: result.resource_type,
        });

        return {
          public_id: result.public_id,
          docType,
          resource_type: resourceType,
          format: path.extname(file.originalname).replace('.', '') || (isPdf ? 'pdf' : 'jpg'),
          bytes: file.size || file.buffer.length,
          originalName: file.originalname,
          created_at: new Date().toISOString(),
          preview_url: temporarySignedUrl,
          secure_url: result.secure_url,
          access_mode: 'authenticated',
        };
      });

      const docs = await Promise.all(uploadPromises);

      return ApiResponse.success(
        res,
        {
          documents: docs,
        },
        'تم رفع مستند التوثيق وتشفيره وتأمينه بنجاح كملف خاص مصرح.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get temporary signed viewing URL for private verification document
   * Accessible only by Admin / Super Admin or the owner who uploaded it
   */
  static getPrivateDocumentUrl(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { publicId } = req.params;
      const { resourceType = 'image', redirect = 'false' } = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستند (public_id) مطلوب.',
        });
      }

      // Check ownership or admin / super_admin role
      const isOwner = publicId.includes(`owner_${req.user.id}`) || publicId.includes(`${req.user.id}`);
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN_DOCUMENT_ACCESS',
          message: 'غير مصرح: لا يمكنك الاطلاع على مستندات توثيق تخص مستخدماً آخر.',
        });
      }

      if (CloudinaryService.isConfigured()) {
        const signedUrl = CloudinaryService.generateSignedDocumentUrl(publicId, {
          expiresInSeconds: 600, // 10 minutes
          resourceType,
        });

        if (redirect === 'true') {
          return res.redirect(302, signedUrl);
        }

        return ApiResponse.success(res, { signedUrl, expires_in: 600 }, 'تم إنشاء رابط المعاينة المؤقت الآمن.');
      }

      return res.status(503).json({
        success: false,
        code: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'خدمة Cloudinary غير مهيأة لتوليد روابط المستندات الموقعة.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Safely delete media from Cloudinary
   */
  static async deleteMedia(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { publicId } = req.params;
      const { resourceType = 'image', type = 'upload' } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'معرف الملف (public_id) مطلوب لإتمام الحذف.',
        });
      }

      // Role check: Only admin, super_admin, or owner can delete
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      if (!isAdmin && req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'غير مصرح لك بحذف الوسائط.',
        });
      }

      // Strict Ownership Check (IDOR Prevention):
      // If not admin, the owner can ONLY delete media that belongs to them
      if (!isAdmin) {
        let isOwnerOfMedia = false;

        // 1. Check if publicId carries the user's ID
        if (publicId.includes(req.user.id)) {
          isOwnerOfMedia = true;
        }

        // 2. Check if media exists in any property owned by this user
        if (!isOwnerOfMedia) {
          const ownerListings = ListingsService.getAll({ ownerId: req.user.id });
          for (const listing of ownerListings) {
            const hasMedia = Array.isArray(listing.media) && listing.media.some(m => m.public_id === publicId);
            const hasImage = Array.isArray(listing.images) && listing.images.some(img => img.includes(publicId));
            const hasVideo = listing.video && (listing.video.public_id === publicId || (listing.video.url && listing.video.url.includes(publicId)) || (listing.video.secure_url && listing.video.secure_url.includes(publicId)));
            if (hasMedia || hasImage || hasVideo) {
              isOwnerOfMedia = true;
              break;
            }
          }
        }

        // 3. Check if user's verification documents contain this publicId
        if (!isOwnerOfMedia) {
          const fullUser = userStore.findById(req.user.id);
          const vDocs = fullUser?.verificationDetails?.ownershipDocs || [];
          if (vDocs.some(d => d.publicId === publicId)) {
            isOwnerOfMedia = true;
          }
        }

        if (!isOwnerOfMedia) {
          return res.status(403).json({
            success: false,
            code: 'FORBIDDEN_MEDIA_DELETE',
            message: 'غير مصرح: لا يمكنك حذف وسائط أو ملفات تخص مستخدماً آخر.',
          });
        }
      }

      const deleteResult = await CloudinaryService.deleteMedia(publicId, resourceType, type);

      return ApiResponse.success(
        res,
        { result: deleteResult },
        'تم حذف الملف من Cloudinary بنجاح.'
      );
    } catch (err) {
      next(err);
    }
  }
}
