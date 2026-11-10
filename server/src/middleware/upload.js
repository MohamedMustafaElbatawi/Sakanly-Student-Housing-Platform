import multer from 'multer';
import path from 'path';

// Use in-memory storage to pipe buffers straight into Cloudinary streams
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.avi'];

const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];
const ALLOWED_DOC_EXTS = [...ALLOWED_IMAGE_EXTS, '.pdf'];

const DANGEROUS_EXTS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.js', '.mjs', '.cjs',
  '.html', '.htm', '.svg', '.php', '.phtml', '.py', '.rb', '.pl',
  '.vbs', '.ps1', '.jar', '.dll', '.scr', '.msi'
];

// Strict File filter factory verifying both MIME type and Extension
const createSecureFileFilter = (allowedMimes, allowedExts, errorMessage) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    // 1. Block dangerous script and executable extensions unconditionally
    if (DANGEROUS_EXTS.includes(ext)) {
      const err = new Error('امتداد الملف المرفوع غير مسموح به لأسباب أمنية.');
      err.statusCode = 400;
      err.code = 'DISALLOWED_FILE_EXTENSION';
      return cb(err, false);
    }

    // 2. Validate allowed MIME & Extension
    const mimeValid = allowedMimes.includes(mime);
    const extValid = allowedExts.includes(ext);

    if (mimeValid && extValid) {
      cb(null, true);
    } else {
      const error = new Error(errorMessage || 'نوع الملف المرفوع غير مدعوم.');
      error.statusCode = 400;
      error.code = 'INVALID_FILE_TYPE';
      cb(error, false);
    }
  };
};

// 1. Property Images Upload: Max 10 images, 10MB each
export const uploadPropertyImages = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 10,
  },
  fileFilter: createSecureFileFilter(
    ALLOWED_IMAGE_TYPES,
    ALLOWED_IMAGE_EXTS,
    'تنسيق الصورة غير مدعوم. الصيغ المقبولة: JPG, PNG, WEBP, HEIC.'
  ),
});

// 2. Property Video Upload: Max 1 video, 100MB
export const uploadPropertyVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1,
  },
  fileFilter: createSecureFileFilter(
    ALLOWED_VIDEO_TYPES,
    ALLOWED_VIDEO_EXTS,
    'تنسيق الفيديو غير مدعوم. الصيغ المقبولة: MP4, WEBM, MOV.'
  ),
});

// 3. Property Mixed Media Upload: Images + Video
export const uploadPropertyMedia = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per item
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    if (DANGEROUS_EXTS.includes(ext)) {
      const err = new Error('امتداد الملف المرفوع غير مسموح به لأسباب أمنية.');
      err.statusCode = 400;
      return cb(err, false);
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(mime) && ALLOWED_IMAGE_EXTS.includes(ext);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mime) && ALLOWED_VIDEO_EXTS.includes(ext);

    if (isImage || isVideo) {
      cb(null, true);
    } else {
      const err = new Error('صيغة الملف غير مدعومة. يسمح فقط بالصور (JPG, PNG, WEBP) والفيديوهات (MP4, WEBM, MOV).');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

// 4. Verification Documents Upload: National ID, Deed, Selfie (Max 5 files, 10MB each)
export const uploadVerificationDocs = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: createSecureFileFilter(
    ALLOWED_DOC_TYPES,
    ALLOWED_DOC_EXTS,
    'صيغة المستند غير مقبولة. يرجى رفع ملفات بتنسيق PDF أو صور (JPG, PNG, WEBP).'
  ),
});

// 5. User Avatar Upload: Max 1 image, 5MB
export const uploadUserAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: createSecureFileFilter(
    ALLOWED_IMAGE_TYPES,
    ALLOWED_IMAGE_EXTS,
    'تنسيق الصورة الشخصية غير مدعوم. الصيغ المقبولة: JPG, PNG, WEBP.'
  ),
});

// Multer error handling wrapper middleware
export const handleMulterErrors = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت للصور و 100 ميجابايت للفيديو).',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            code: 'TOO_MANY_FILES',
            message: 'تجاوزت الحد الأقصى لعدد الملفات المسموح برفعها دفعة واحدة.',
          });
        }
        return res.status(400).json({
          success: false,
          code: err.code,
          message: `خطأ أثناء معالجة الملف: ${err.message}`,
        });
      }

      if (err) {
        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code || 'UPLOAD_ERROR',
          message: err.message,
        });
      }

      next();
    });
  };
};
