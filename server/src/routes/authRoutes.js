import { Router } from 'express';
import { 
  register, 
  login, 
  googleAuth, 
  getProfile,
  updateProfile,
  getVerificationStatus,
  submitVerification,
  reviewVerification,
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
  sendPhoneVerificationOtp,
  verifyPhoneVerificationOtp,
  saveVerificationAccountInfo,
  saveVerificationDoc,
  removeVerificationDoc,
  forgotPassword,
  verifyResetOtp,
  resendResetOtp,
  resetPassword,
  refreshSession,
  logout
} from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/refresh', refreshSession);
router.post('/logout', logout);

// Password recovery flow endpoints
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/resend-reset-otp', resendResetOtp);
router.post('/reset-password', resetPassword);

// Authenticated user profile (strictly isolated to req.user.id)
router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);

// Owner verification lifecycle endpoints
router.get('/verification/status', requireAuth, getVerificationStatus);
router.post('/verification/email/send-otp', requireAuth, sendEmailVerificationOtp);
router.post('/verification/email/verify-otp', requireAuth, verifyEmailVerificationOtp);
router.post('/verification/phone/send-otp', requireAuth, sendPhoneVerificationOtp);
router.post('/verification/phone/verify-otp', requireAuth, verifyPhoneVerificationOtp);
router.post('/verification/account-info', requireAuth, saveVerificationAccountInfo);
router.post('/verification/doc', requireAuth, saveVerificationDoc);
router.delete('/verification/doc/:docType', requireAuth, removeVerificationDoc);
router.post('/verification/submit', requireAuth, submitVerification);

// Admin / Super Admin verification review endpoints
router.post('/verification/review', requireAuth, requireRole('admin', 'super_admin'), reviewVerification);
router.patch('/verification/:id/review', requireAuth, requireRole('admin', 'super_admin'), reviewVerification);

export default router;

