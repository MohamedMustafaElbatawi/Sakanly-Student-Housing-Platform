import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { requireAuth } from '../middleware/auth.js';
import { 
  uploadPropertyMedia, 
  uploadVerificationDocs, 
  uploadUserAvatar,
  handleMulterErrors 
} from '../middleware/upload.js';

const router = Router();

// All media endpoints require authenticated session
router.use(requireAuth);

// 1. Cloudinary service health and connectivity status
router.get('/status', MediaController.getStatus);

// 2. Get Signed Upload Parameters (for direct, secure client-to-Cloudinary uploads)
router.post('/signature', MediaController.getUploadSignature);

// 3. Upload Property Media (Images & Video) via Server Buffer Stream into sakanly/properties
router.post(
  '/upload',
  handleMulterErrors(uploadPropertyMedia.array('files', 10)),
  MediaController.uploadMedia
);

// 4. Upload User Avatar into sakanly/users
router.post(
  '/upload-avatar',
  handleMulterErrors(uploadUserAvatar.single('avatar')),
  MediaController.uploadAvatar
);

// 5. Upload Private Verification Documents into sakanly/verification (Authenticated access only)
router.post(
  '/upload-verification',
  handleMulterErrors(uploadVerificationDocs.array('files', 5)),
  MediaController.uploadVerificationDocument
);

// 6. Get Temporary Signed URL for Private Verification Document
router.get(
  '/verification-document/:publicId(*)',
  MediaController.getPrivateDocumentUrl
);

// 7. Delete Media from Cloudinary by publicId
router.delete(
  '/:publicId(*)',
  MediaController.deleteMedia
);

export default router;
