import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { isMongoConnected } from '../config/database.js';
import { normalizeEgyptianPhone } from '../services/smsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// Dynamic Super Admin initialization strictly from environment variables (Never hardcoded in repository code!)
const cleanEnvStr = (val) => {
  if (!val || typeof val !== 'string') return '';
  return val.trim().replace(/^["']+|["']+$/g, '').trim();
};

const initSuperAdminFromEnv = () => {
  const email = cleanEnvStr(process.env.SUPER_ADMIN_EMAIL).toLowerCase();
  const rawPassword = cleanEnvStr(process.env.SUPER_ADMIN_PASSWORD);
  const passwordHash = cleanEnvStr(process.env.SUPER_ADMIN_PASSWORD_HASH);
  const fullName = cleanEnvStr(process.env.SUPER_ADMIN_NAME) || 'إدارة منصة سكنلي (Super Admin)';
  const phone = cleanEnvStr(process.env.SUPER_ADMIN_PHONE) || '01000000001';

  if (!email || (!rawPassword && !passwordHash)) {
    return null;
  }

  return {
    id: 'usr-super-admin-root',
    fullName,
    email,
    phone,
    password: passwordHash || hashPassword(rawPassword),
    role: 'super_admin',
    avatar: '',
    isVerified: true,
    verificationStatus: 'verified',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  };
};

const initialSuperAdmin = initSuperAdminFromEnv();

// Seed users representing all student and owner lifecycle states
let users = [
  ...(initialSuperAdmin ? [initialSuperAdmin] : []),
  {
    id: 'usr-student-001',
    fullName: 'أحمد محمود علي',
    email: 'student@sakanly.com',
    phone: '01012345678',
    password: hashPassword('123456'),
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    verificationStatus: 'not_applicable',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-001',
    fullName: 'م. أحمد الشناوي',
    email: 'owner@sakanly.com',
    phone: '01198765432',
    password: hashPassword('123456'),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    verificationStatus: 'verified',
    verifiedAt: '2026-01-15T10:00:00.000Z',
    rejectionReason: '',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-002',
    fullName: 'طارق عبد السلام (مالك غير موثق)',
    email: 'owner.unverified@sakanly.com',
    phone: '01211112222',
    password: hashPassword('123456'),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    isVerified: false,
    verificationStatus: 'not_started',
    rejectionReason: '',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-003',
    fullName: 'خالد سليم (بانتظار المراجعة)',
    email: 'owner.pending@sakanly.com',
    phone: '01233334444',
    nationalIdNumber: '29810151234567',
    tradeName: 'عقارات سليم لإسكان الطلبة',
    password: hashPassword('123456'),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    isVerified: false,
    phoneVerified: true,
    verificationStatus: 'pending_review',
    submittedAt: '2026-10-21T09:30:00.000Z',
    rejectionReason: '',
    isGoogleUser: false,
    suspended: false,
    verificationDetails: {
      accountInfo: {
        fullName: 'خالد سليم',
        nationalIdNumber: '29810151234567',
        tradeName: 'عقارات سليم لإسكان الطلبة',
        governorate: 'القاهرة',
        address: 'حي الزهور، مدينة نصر، القاهرة',
        completed: true,
      },
      phoneConfirmation: {
        phone: '01233334444',
        isVerified: true,
        verifiedAt: '2026-10-21T09:15:00.000Z',
      },
      nationalId: {
        frontDoc: {
          publicId: 'sakanly/verification/documents/owner_usr-owner-003_id_front',
          secureUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80',
          originalName: 'بطاقة_الرقم_القومي_وجه.jpg',
          format: 'jpg',
          status: 'pending',
          uploadedAt: '2026-10-21T09:20:00.000Z',
        },
        backDoc: {
          publicId: 'sakanly/verification/documents/owner_usr-owner-003_id_back',
          secureUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
          originalName: 'بطاقة_الرقم_القومي_ظهر.jpg',
          format: 'jpg',
          status: 'pending',
          uploadedAt: '2026-10-21T09:22:00.000Z',
        },
      },
      livenessCheck: {
        status: 'manual_review_pending',
        provider: 'manual_admin_review',
        selfieDoc: {
          publicId: 'sakanly/verification/documents/owner_usr-owner-003_selfie',
          secureUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
          originalName: 'live_selfie_capture.jpg',
          format: 'jpg',
        },
        capturedAt: '2026-10-21T09:25:00.000Z',
        notes: 'تم التقاط صورة سيلفي حية عبر الكاميرا. بانتظار المطابقة اليدوية للإدارة مع بطاقة الرقم القومي.',
      },
      ownershipDocs: [
        {
          id: 'own-doc-sample-1',
          docType: 'ownership_deed',
          publicId: 'sakanly/verification/documents/owner_usr-owner-003_deed',
          secureUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
          originalName: 'عقد_ملكية_موثق_بالشهر_العقاري.pdf',
          format: 'pdf',
          status: 'pending',
          uploadedAt: '2026-10-21T09:28:00.000Z',
        },
        {
          id: 'own-doc-sample-2',
          docType: 'utility_bill',
          publicId: 'sakanly/verification/documents/owner_usr-owner-003_utility',
          secureUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
          originalName: 'فاتورة_كهرباء_حديثة_باسم_المالك.jpg',
          format: 'jpg',
          status: 'pending',
          uploadedAt: '2026-10-21T09:29:00.000Z',
        },
      ],
      correctionRequests: [],
    },
    verificationHistory: [
      {
        action: 'submission',
        status: 'pending_review',
        adminName: 'المالك نفسه',
        reason: 'تقديم ملف التوثيق للمراجعة الإدارية لأول مرة',
        timestamp: '2026-10-21T09:30:00.000Z',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-005',
    fullName: 'سامح فوزي (يحتاج استكمال)',
    email: 'owner.correction@sakanly.com',
    phone: '01122334455',
    nationalIdNumber: '29505051234567',
    password: hashPassword('123456'),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    isVerified: false,
    phoneVerified: true,
    verificationStatus: 'needs_correction',
    needsCorrectionReason: 'يرجى إعادة رفع صورة ظهر بطاقة الرقم القومي لأنها غير واضحة، مع تقديم إيصال مرافق حديث.',
    submittedAt: '2026-10-20T11:00:00.000Z',
    rejectionReason: '',
    isGoogleUser: false,
    suspended: false,
    verificationDetails: {
      accountInfo: {
        fullName: 'سامح فوزي',
        nationalIdNumber: '29505051234567',
        governorate: 'الجيزة',
        address: 'الدقي، الجيزة',
        completed: true,
      },
      phoneConfirmation: {
        phone: '01122334455',
        isVerified: true,
        verifiedAt: '2026-10-20T10:45:00.000Z',
      },
      nationalId: {
        frontDoc: {
          publicId: 'sakanly/verification/documents/owner_usr-owner-005_id_front',
          secureUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=800&q=80',
          originalName: 'بطاقة_الرقم_القومي_وجه.jpg',
          format: 'jpg',
          status: 'approved',
          uploadedAt: '2026-10-20T10:50:00.000Z',
        },
      },
      livenessCheck: {
        status: 'manual_review_pending',
        provider: 'manual_admin_review',
        selfieDoc: {
          publicId: 'sakanly/verification/documents/owner_usr-owner-005_selfie',
          secureUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
          originalName: 'live_selfie_capture.jpg',
          format: 'jpg',
        },
        capturedAt: '2026-10-20T10:55:00.000Z',
        notes: 'بانتظار استكمال ظهر البطاقة لمطابقة الملامح.',
      },
      ownershipDocs: [
        {
          id: 'own-doc-sample-5',
          docType: 'ownership_deed',
          publicId: 'sakanly/verification/documents/owner_usr-owner-005_deed',
          secureUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
          originalName: 'عقد_إيجار_وإثبات_إدارة.pdf',
          format: 'pdf',
          status: 'pending',
          uploadedAt: '2026-10-20T10:58:00.000Z',
        },
      ],
      correctionRequests: [
        {
          id: 'corr-001',
          requestedAt: '2026-10-21T12:00:00.000Z',
          adminName: 'صاحب منصة سكنلي (Super Admin)',
          reason: 'يرجى إعادة رفع صورة ظهر بطاقة الرقم القومي لأنها غير واضحة، مع تقديم إيصال مرافق حديث.',
          specificCorrections: ['national_id_back', 'utility_bill'],
          resolved: false,
        },
      ],
    },
    verificationHistory: [
      {
        action: 'needs_correction',
        status: 'needs_correction',
        adminName: 'صاحب منصة سكنلي (Super Admin)',
        reason: 'يرجى إعادة رفع صورة ظهر بطاقة الرقم القومي لأنها غير واضحة، مع تقديم إيصال مرافق حديث.',
        timestamp: '2026-10-21T12:00:00.000Z',
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-owner-004',
    fullName: 'ياسر رضوان (طلب مرفوض)',
    email: 'owner.rejected@sakanly.com',
    phone: '01255556666',
    password: hashPassword('123456'),
    role: 'owner',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    isVerified: false,
    verificationStatus: 'rejected',
    rejectionReason: 'صورة بطاقة الرقم القومي غير واضحة ويُرجى إعادة رفع مستند إثبات الملكية أو الوكالة السارية.',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  },

  {
    id: 'usr-google-001',
    fullName: 'كريم الدسوقي (حساب Google)',
    email: 'google.user@sakanly.com',
    phone: null,
    password: null,
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isVerified: true,
    verificationStatus: 'not_applicable',
    isGoogleUser: true,
    googleId: '109876543210987654321',
    suspended: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-email-001',
    fullName: 'سارة إبراهيم (بريد فقط)',
    email: 'sara.email@sakanly.com',
    phone: null,
    password: hashPassword('123456'),
    role: 'student',
    avatar: '',
    isVerified: true,
    verificationStatus: 'not_applicable',
    isGoogleUser: false,
    suspended: false,
    createdAt: new Date().toISOString(),
  },
];

// Persistence helper to write changes to MongoDB Atlas when connected
const persistUserToDB = (user) => {
  if (!isMongoConnected() || !user || !user.id) return;
  const filter = user.email ? { $or: [{ id: user.id }, { email: user.email.toLowerCase() }] } : { id: user.id };
  User.findOneAndUpdate(
    filter,
    { $set: user },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [UserStore] Failed to persist user to MongoDB:', err.message);
  });
};

export const userStore = {
  async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbUsers = await User.find({}).lean();
      if (dbUsers && dbUsers.length > 0) {
        for (const dbu of dbUsers) {
          const idx = users.findIndex(u => u.id === dbu.id || u.email.toLowerCase() === dbu.email.toLowerCase());
          if (idx >= 0) {
            users[idx] = { ...users[idx], ...dbu };
          } else {
            users.push(dbu);
          }
        }
        console.log(`✅ [UserStore] Hydrated ${dbUsers.length} users from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [UserStore] Error syncing users from MongoDB:', err.message);
    }
  },

  findAll() {
    return users;
  },

  findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return users.find(u => u.email.toLowerCase() === normalized) || null;
  },

  findById(id) {
    if (!id) return null;
    return users.find(u => u.id === id || String(u._id) === String(id)) || null;
  },

  findByPhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    const normEg = normalizeEgyptianPhone(phone);
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits && !normEg) return null;

    return users.find(u => {
      const uPhone = u.phone || u.phoneNumber;
      if (!uPhone || typeof uPhone !== 'string') return false;
      const uNormEg = normalizeEgyptianPhone(uPhone);
      if (normEg && uNormEg) {
        return normEg === uNormEg;
      }
      const uDigits = uPhone.replace(/\D/g, '');
      if (!uDigits) return false;
      return (
        uDigits === cleanDigits ||
        (cleanDigits.length >= 10 && uDigits.endsWith(cleanDigits)) ||
        (uDigits.length >= 10 && cleanDigits.endsWith(uDigits))
      );
    }) || null;
  },

  findByGoogleId(googleId) {
    if (!googleId) return null;
    return users.find(u => u.googleId === googleId) || null;
  },

  createUser({
    fullName,
    email,
    password,
    role = 'student',
    phone = '',
    phoneNumber = '',
    phoneCountryCode = '+20',
    googleId = null,
    avatar = '',
    isGoogleUser = false
  }) {
    // Strictly sanitize allowed roles: only 'student' or 'owner' are permitted from registration
    const safeRole = role === 'owner' ? 'owner' : 'student';

    // Verification state is strictly enforced on Backend:
    // Owners always start as unverified (not_started) and CANNOT self-verify upon registration!
    const isOwner = safeRole === 'owner';
    const verificationStatus = isOwner ? 'not_started' : 'not_applicable';
    const isVerified = isOwner ? false : Boolean(isGoogleUser || true);

    const assignedPhone = phone ? phone.trim() : (phoneNumber ? phoneNumber.trim() : '');
    const assignedPhoneNumber = phoneNumber ? phoneNumber.trim() : (phone ? phone.trim() : '');
    const assignedCountryCode = phoneCountryCode ? phoneCountryCode.trim() : '+20';

    const newUser = {
      id: `usr-${isOwner ? 'own' : 'std'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: assignedPhone,
      phoneNumber: assignedPhoneNumber,
      phoneCountryCode: assignedCountryCode,
      role: safeRole,
      password: password ? hashPassword(password) : null,
      googleId: googleId || null,
      avatar: avatar || '',
      isGoogleUser: Boolean(isGoogleUser),
      isVerified,
      verificationStatus,
      rejectionReason: '',
      submittedAt: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    persistUserToDB(newUser);
    return newUser;
  },

  createStudentUser(data) {
    return this.createUser({ ...data, role: 'student' });
  },

  submitVerification(userId, submissionData = {}) {
    const user = this.findById(userId);
    if (!user) return null;
    if (user.role !== 'owner') return null;

    user.verificationStatus = 'pending_review';
    user.submittedAt = new Date().toISOString();
    user.rejectionReason = '';
    user.needsCorrectionReason = '';

    if (!user.verificationDetails) user.verificationDetails = {};
    if (!user.verificationHistory) user.verificationHistory = [];

    user.verificationHistory.push({
      action: 'submitted',
      status: 'pending_review',
      adminName: 'المالك نفسه',
      reason: 'تقديم ملف التوثيق للمراجعة الإدارية',
      timestamp: user.submittedAt,
    });

    user.verificationSubmission = {
      ...submissionData,
      submittedAt: user.submittedAt,
    };
    persistUserToDB(user);
    return user;
  },

  verifyOwnerPhone(userId, phone) {
    const user = this.findById(userId);
    if (!user || user.role !== 'owner') return null;

    user.phone = phone;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date().toISOString();

    if (!user.verificationDetails) user.verificationDetails = {};
    user.verificationDetails.phoneConfirmation = {
      phone,
      isVerified: true,
      verifiedAt: user.phoneVerifiedAt,
    };

    if (user.verificationStatus === 'not_started') {
      user.verificationStatus = 'in_progress';
    }

    persistUserToDB(user);
    return user;
  },

  verifyOwnerEmail(userId, email) {
    const user = this.findById(userId);
    if (!user || user.role !== 'owner') return null;

    const normalizedEmail = (email || user.email).trim().toLowerCase();
    user.email = normalizedEmail;
    user.emailVerified = true;
    user.emailVerifiedAt = new Date().toISOString();

    if (!user.verificationDetails) user.verificationDetails = {};
    user.verificationDetails.emailConfirmation = {
      email: normalizedEmail,
      isVerified: true,
      verifiedAt: user.emailVerifiedAt,
    };

    if (user.verificationStatus === 'not_started') {
      user.verificationStatus = 'in_progress';
    }

    persistUserToDB(user);
    return user;
  },

  saveVerificationAccountInfo(userId, info = {}) {
    const user = this.findById(userId);
    if (!user || user.role !== 'owner') return null;

    if (info.fullName) user.fullName = info.fullName.trim();
    if (info.nationalIdNumber) user.nationalIdNumber = String(info.nationalIdNumber).trim();
    if (info.tradeName !== undefined) user.tradeName = String(info.tradeName).trim();

    if (!user.verificationDetails) user.verificationDetails = {};
    user.verificationDetails.accountInfo = {
      fullName: user.fullName,
      nationalIdNumber: user.nationalIdNumber,
      tradeName: user.tradeName || '',
      governorate: info.governorate || 'القاهرة',
      address: info.address || '',
      completed: Boolean(user.fullName && user.nationalIdNumber && user.nationalIdNumber.length === 14),
      updatedAt: new Date().toISOString(),
    };

    if (user.verificationStatus === 'not_started') {
      user.verificationStatus = 'in_progress';
    }

    persistUserToDB(user);
    return user;
  },

  saveVerificationDoc(userId, docData = {}) {
    const user = this.findById(userId);
    if (!user || user.role !== 'owner') return null;

    if (!user.verificationDetails) user.verificationDetails = {};
    if (!user.verificationDetails.nationalId) user.verificationDetails.nationalId = {};
    if (!user.verificationDetails.ownershipDocs) user.verificationDetails.ownershipDocs = [];

    const { docType, publicId, secureUrl, originalName, bytes, format } = docData;

    if (docType === 'national_id_front') {
      user.verificationDetails.nationalId.frontDoc = {
        publicId,
        secureUrl,
        originalName: originalName || 'national_id_front.jpg',
        bytes,
        format,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
    } else if (docType === 'national_id_back') {
      user.verificationDetails.nationalId.backDoc = {
        publicId,
        secureUrl,
        originalName: originalName || 'national_id_back.jpg',
        bytes,
        format,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
    } else if (docType === 'live_selfie' || docType === 'liveness_selfie') {
      user.verificationDetails.livenessCheck = {
        status: 'manual_review_pending',
        provider: 'manual_admin_review',
        selfieDoc: {
          publicId,
          secureUrl,
          originalName: originalName || 'live_selfie.jpg',
          bytes,
          format,
        },
        capturedAt: new Date().toISOString(),
        notes: 'بانتظار مطابقة ملامح الوجه يدوياً بواسطة فريق الإدارة مع بطاقة الرقم القومي.',
      };
    } else {
      // Ownership documents (deed, lease, utility bill)
      const docItem = {
        id: `own-doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        docType: docType || 'ownership_deed',
        publicId,
        secureUrl,
        originalName: originalName || 'ownership_document.pdf',
        bytes,
        format,
        status: 'pending',
        uploadedAt: new Date().toISOString(),
      };
      // Replace existing with same docType or append
      const existingIdx = user.verificationDetails.ownershipDocs.findIndex(d => d.publicId === publicId || (d.docType === docType && d.docType === 'ownership_deed'));
      if (existingIdx >= 0) {
        user.verificationDetails.ownershipDocs[existingIdx] = docItem;
      } else {
        user.verificationDetails.ownershipDocs.push(docItem);
      }
    }

    if (user.verificationStatus === 'not_started') {
      user.verificationStatus = 'in_progress';
    }

    persistUserToDB(user);
    return user;
  },

  removeVerificationDoc(userId, docType, docId) {
    const user = this.findById(userId);
    if (!user || user.role !== 'owner') return null;

    if (!user.verificationDetails) return user;

    if (docType === 'national_id_front' && user.verificationDetails.nationalId) {
      delete user.verificationDetails.nationalId.frontDoc;
    } else if (docType === 'national_id_back' && user.verificationDetails.nationalId) {
      delete user.verificationDetails.nationalId.backDoc;
    } else if ((docType === 'live_selfie' || docType === 'liveness_selfie') && user.verificationDetails.livenessCheck) {
      delete user.verificationDetails.livenessCheck.selfieDoc;
      user.verificationDetails.livenessCheck.status = 'not_completed';
    } else if (user.verificationDetails.ownershipDocs) {
      user.verificationDetails.ownershipDocs = user.verificationDetails.ownershipDocs.filter(
        d => d.id !== docId && d.publicId !== docId
      );
    }

    persistUserToDB(user);
    return user;
  },

  reviewVerification(userId, { status, rejectionReason = '', correctionReason = '', specificCorrections = [], adminUser = null }) {
    const user = this.findById(userId);
    if (!user) return null;
    if (user.role !== 'owner') return null;

    if (!user.verificationHistory) user.verificationHistory = [];

    const adminName = adminUser?.fullName || 'إدارة منصة سكنلي';
    const adminId = adminUser?.id || 'admin-root';
    const now = new Date().toISOString();

    if (status === 'verified') {
      user.verificationStatus = 'verified';
      user.isVerified = true;
      user.verifiedAt = now;
      user.reviewedAt = now;
      user.reviewedBy = adminName;
      user.rejectionReason = '';
      user.needsCorrectionReason = '';

      // Mark all docs approved
      if (user.verificationDetails) {
        if (user.verificationDetails.nationalId?.frontDoc) user.verificationDetails.nationalId.frontDoc.status = 'approved';
        if (user.verificationDetails.nationalId?.backDoc) user.verificationDetails.nationalId.backDoc.status = 'approved';
        if (user.verificationDetails.livenessCheck) user.verificationDetails.livenessCheck.status = 'verified';
        if (Array.isArray(user.verificationDetails.ownershipDocs)) {
          user.verificationDetails.ownershipDocs.forEach(d => { d.status = 'approved'; });
        }
      }

      user.verificationHistory.push({
        action: 'verified',
        status: 'verified',
        adminId,
        adminName,
        reason: 'تم اعتماد وتوثيق الهوية والملكية رسمياً.',
        timestamp: now,
      });
    } else if (status === 'rejected') {
      user.verificationStatus = 'rejected';
      user.isVerified = false;
      user.reviewedAt = now;
      user.reviewedBy = adminName;
      user.rejectionReason = rejectionReason || 'المستندات المقدمة غير صالحة أو غير مطابقة لبيانات الحساب.';
      user.needsCorrectionReason = '';

      user.verificationHistory.push({
        action: 'rejected',
        status: 'rejected',
        adminId,
        adminName,
        reason: user.rejectionReason,
        timestamp: now,
      });
    } else if (status === 'needs_correction') {
      user.verificationStatus = 'needs_correction';
      user.isVerified = false;
      user.reviewedAt = now;
      user.reviewedBy = adminName;
      user.needsCorrectionReason = correctionReason || rejectionReason || 'يرجى تصحيح وإعادة رفع المستندات المحددة.';
      user.rejectionReason = '';

      if (!user.verificationDetails) user.verificationDetails = {};
      user.verificationDetails.correctionRequests = [
        ...(user.verificationDetails.correctionRequests || []),
        {
          id: `corr-${Date.now()}`,
          requestedAt: now,
          adminName,
          reason: user.needsCorrectionReason,
          specificCorrections: Array.isArray(specificCorrections) ? specificCorrections : [],
          resolved: false,
        },
      ];

      user.verificationHistory.push({
        action: 'needs_correction',
        status: 'needs_correction',
        adminId,
        adminName,
        reason: user.needsCorrectionReason,
        specificCorrections,
        timestamp: now,
      });
    } else if (status === 'in_progress' || status === 'not_started' || status === 'pending_review') {
      user.verificationStatus = status;
      user.isVerified = false;
      if (status !== 'rejected') user.rejectionReason = '';
      if (status !== 'needs_correction') user.needsCorrectionReason = '';

      user.verificationHistory.push({
        action: 'status_updated',
        status,
        adminId,
        adminName,
        reason: `تم تغيير الحالة إلى ${status}`,
        timestamp: now,
      });
    }

    persistUserToDB(user);
    return user;
  },

  linkGoogleAccount(userId, googleId, avatar = '') {
    const user = this.findById(userId);
    if (user) {
      user.googleId = googleId;
      user.isGoogleUser = true;
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }
      persistUserToDB(user);
    }
    return user;
  },

  updateUser(userId, fields = {}) {
    const user = this.findById(userId);
    if (!user) return null;
    // Don't allow changing sensitive fields through profile update (prevents role elevation / privilege escalation)
    const { password, id, role, isVerified, verificationStatus, ...allowed } = fields;
    Object.assign(user, allowed);
    persistUserToDB(user);
    return user;
  },

  updatePassword(userId, newPlainPassword) {
    const user = this.findById(userId);
    if (!user) return null;
    user.password = hashPassword(newPlainPassword);
    user.passwordUpdatedAt = new Date().toISOString();
    persistUserToDB(user);
    return user;
  },

  suspendUser(userId, reason = '') {
    const user = this.findById(userId);
    if (!user) return null;
    user.suspended = true;
    user.suspendReason = reason || 'تم إيقاف الحساب بقرار إداري.';
    user.suspendedAt = new Date().toISOString();
    persistUserToDB(user);
    return user;
  },

  unsuspendUser(userId) {
    const user = this.findById(userId);
    if (!user) return null;
    user.suspended = false;
    delete user.suspendedAt;
    delete user.suspendReason;
    user.unsuspendedAt = new Date().toISOString();
    persistUserToDB(user);
    return user;
  },

  seedSuperAdmin({ email, password, fullName, phone }) {
    if (!email || !password) throw new Error('Email and password are required for Super Admin.');
    const cleanEmail = cleanEnvStr(email).toLowerCase();
    const cleanPass = cleanEnvStr(password);
    const cleanName = cleanEnvStr(fullName) || 'إدارة منصة سكنلي (Super Admin)';
    const cleanPhone = cleanEnvStr(phone) || '01000000001';

    let admin = users.find(u => u.role === 'super_admin' || (u.email && u.email.toLowerCase() === cleanEmail) || u.id === 'usr-super-admin-root');
    if (admin) {
      admin.role = 'super_admin';
      admin.email = cleanEmail;
      admin.password = hashPassword(cleanPass);
      admin.fullName = cleanName || admin.fullName;
      admin.phone = cleanPhone || admin.phone;
      admin.suspended = false;
      persistUserToDB(admin);
      return admin;
    }
    admin = {
      id: 'usr-super-admin-root',
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashPassword(cleanPass),
      role: 'super_admin',
      avatar: '',
      isVerified: true,
      verificationStatus: 'verified',
      isGoogleUser: false,
      suspended: false,
      createdAt: new Date().toISOString(),
    };
    users.unshift(admin);
    persistUserToDB(admin);
    return admin;
  },

  comparePassword(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compareSync(plainPassword, hashedPassword);
  },

  saveRefreshToken(userId, { token, jti, family, expiresAt }) {
    const user = this.findById(userId);
    if (!user) return false;
    if (!Array.isArray(user.refreshTokens)) {
      user.refreshTokens = [];
    }
    // Clean up expired tokens
    const now = new Date();
    user.refreshTokens = user.refreshTokens.filter(t => new Date(t.expiresAt) > now);

    user.refreshTokens.push({
      token,
      jti,
      family,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
      createdAt: new Date(),
    });

    persistUserToDB(user);
    return true;
  },

  findRefreshToken(userId, token) {
    const user = this.findById(userId);
    if (!user || !Array.isArray(user.refreshTokens)) return null;
    return user.refreshTokens.find(t => t.token === token) || null;
  },

  revokeRefreshToken(userId, jti) {
    const user = this.findById(userId);
    if (!user || !Array.isArray(user.refreshTokens)) return false;
    const target = user.refreshTokens.find(t => t.jti === jti);
    if (target) {
      target.isRevoked = true;
      persistUserToDB(user);
      return true;
    }
    return false;
  },

  revokeTokenFamily(userId, family) {
    const user = this.findById(userId);
    if (!user || !Array.isArray(user.refreshTokens)) return false;
    for (const t of user.refreshTokens) {
      if (t.family === family) {
        t.isRevoked = true;
      }
    }
    persistUserToDB(user);
    return true;
  },

  revokeAllUserTokens(userId) {
    const user = this.findById(userId);
    if (!user) return false;
    user.refreshTokens = [];
    persistUserToDB(user);
    return true;
  },

  toSafeUser(user) {
    if (!user) return null;
    const { password, refreshTokens, passwordResetOtp, resetOtp, ...safe } = user;
    return safe;
  },
};

export { users };

