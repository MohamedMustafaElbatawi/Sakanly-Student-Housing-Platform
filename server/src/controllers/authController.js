import { OAuth2Client } from 'google-auth-library';
import { userStore } from '../data/mockUsers.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  generateToken, 
  verifyRefreshToken, 
  verifyResetToken 
} from '../utils/token.js';
import { otpService } from '../services/otpService.js';
import { config } from '../config/index.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import { normalizeEgyptianPhone, toInternationalFormat } from '../services/smsService.js';

// Initialize Google OAuth2 client if client ID is provided
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

// Secure HttpOnly Cookie configuration helper for Refresh Tokens
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

// Email validation helper
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
};

export const register = async (req, res, next) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      role = 'student', 
      termsAccepted,
      phone,
      phoneNumber,
      phoneCountryCode = '+20'
    } = req.body;

    // 1. Validation of required fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال الاسم بالكامل (3 أحرف على الأقل).',
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال بريد إلكتروني صالح (مثال: student@example.com).',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام.',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمتا المرور غير متطابقتين. يرجى التأكد وإعادة المحاولة.',
      });
    }

    if (termsAccepted !== undefined && !termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'يرجى الموافقة على الشروط والأحكام وميثاق الأمان للمتابعة.',
      });
    }

    // 2. Check if user email already exists
    const existingUser = userStore.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد إلكتروني آخر.',
      });
    }

    // 3. Strictly sanitize role: Only 'student' or 'owner' are allowed
    const sanitizedRole = (role === 'owner') ? 'owner' : 'student';

    // 4. Validate & Normalize Phone Number
    let cleanPhone = '';
    let cleanPhoneNumber = '';
    let cleanCountryCode = (phoneCountryCode || '+20').trim();

    const rawPhone = (phone || phoneNumber || '').trim();

    if (sanitizedRole === 'owner') {
      // Phone is mandatory for property owners
      if (!rawPhone) {
        return res.status(400).json({
          success: false,
          message: 'رقم الهاتف مطلوب لإنشاء حساب مالك العقار للتواصل بشأن عقاراتك وطلبات المعاينة.',
        });
      }

      if (cleanCountryCode === '+20') {
        const normalized = normalizeEgyptianPhone(rawPhone);
        if (!normalized) {
          return res.status(400).json({
            success: false,
            message: 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).',
          });
        }
        cleanPhone = normalized;
        cleanPhoneNumber = normalized;
      } else {
        const digits = rawPhone.replace(/\D/g, '');
        if (digits.length < 8 || digits.length > 15) {
          return res.status(400).json({
            success: false,
            message: 'يرجى إدخال رقم هاتف صالح يتكون من 8 إلى 15 رقماً.',
          });
        }
        cleanPhone = `${cleanCountryCode}${digits}`;
        cleanPhoneNumber = digits;
      }

      // Check phone uniqueness against memory store
      const duplicateInMemory = userStore.findByPhone(cleanPhone) || (cleanCountryCode === '+20' && toInternationalFormat(cleanPhone) ? userStore.findByPhone(toInternationalFormat(cleanPhone)) : null);
      if (duplicateInMemory) {
        return res.status(409).json({
          success: false,
          message: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر. يرجى استخدام رقم هاتف آخر أو تسجيل الدخول.',
        });
      }

      // Check phone uniqueness against MongoDB Atlas if connected
      try {
        const { User } = await import('../models/User.js');
        const intl = cleanCountryCode === '+20' ? toInternationalFormat(cleanPhone) : cleanPhone;
        const dbDuplicate = await User.findOne({
          $or: [
            { phone: cleanPhone },
            ...(intl ? [{ phone: intl }] : []),
            { phoneNumber: cleanPhoneNumber },
            { phoneNumber: cleanPhone },
          ],
        }).lean();
        if (dbDuplicate) {
          return res.status(409).json({
            success: false,
            message: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر. يرجى استخدام رقم هاتف آخر أو تسجيل الدخول.',
          });
        }
      } catch (dbErr) {
        // Fallback on memory store validation when disconnected
      }
    } else if (rawPhone) {
      // Optional phone for students - validate if provided
      if (cleanCountryCode === '+20') {
        const normalized = normalizeEgyptianPhone(rawPhone);
        if (normalized) {
          cleanPhone = normalized;
          cleanPhoneNumber = normalized;
        } else {
          cleanPhone = rawPhone;
          cleanPhoneNumber = rawPhone.replace(/\D/g, '');
        }
      } else {
        const digits = rawPhone.replace(/\D/g, '');
        cleanPhone = `${cleanCountryCode}${digits}`;
        cleanPhoneNumber = digits;
      }

      // If student provided a valid phone, ensure it is not already used
      if (cleanPhone) {
        const duplicateInMemory = userStore.findByPhone(cleanPhone);
        if (duplicateInMemory) {
          return res.status(409).json({
            success: false,
            message: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر.',
          });
        }
      }
    }

    // 5. Create user
    const newUser = userStore.createUser({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: sanitizedRole,
      phone: cleanPhone,
      phoneNumber: cleanPhoneNumber,
      phoneCountryCode: cleanCountryCode,
    });

    // 4. Generate JWT tokens (Short-lived Access Token + Rotated Refresh Token)
    const tokenPayload = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenObj = generateRefreshToken(tokenPayload);

    userStore.saveRefreshToken(newUser.id, {
      token: refreshTokenObj.token,
      jti: refreshTokenObj.jti,
      family: refreshTokenObj.family,
    });

    setRefreshTokenCookie(res, refreshTokenObj.token);

    const safeUser = userStore.toSafeUser(newUser);

    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح! أهلاً بك في مجتمع سكنلي.',
      data: {
        user: safeUser,
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenObj.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    let { email, phone, identifier, password } = req.body;

    if (identifier && typeof identifier === 'string') {
      const cleanId = identifier.trim();
      if (cleanId.includes('@')) {
        email = cleanId.toLowerCase();
      } else {
        phone = cleanId.replace(/\D/g, '');
      }
    }

    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني أو الهاتف وكلمة المرور.',
      });
    }

    // Find by email or phone
    let user = null;
    if (email) {
      user = userStore.findByEmail(email);
    } else if (phone) {
      user = userStore.findByPhone(phone);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد أو الهاتف وكلمة المرور.',
      });
    }

    // For password checking:
    // If the account has a password, verify with bcrypt
    // If it's a pure Google user without a password, prompt them to use Google login
    if (!user.password && user.isGoogleUser) {
      return res.status(400).json({
        success: false,
        message: 'هذا الحساب مرتبط بتسجيل الدخول عبر Google. يرجى المتابعة باستخدام زر Google.',
      });
    }

    const isMatch = userStore.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد أو الهاتف وكلمة المرور.',
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenObj = generateRefreshToken(tokenPayload);

    userStore.saveRefreshToken(user.id, {
      token: refreshTokenObj.token,
      jti: refreshTokenObj.jti,
      family: refreshTokenObj.family,
    });

    setRefreshTokenCookie(res, refreshTokenObj.token);

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      data: {
        user: userStore.toSafeUser(user),
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenObj.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق من Google غير متوفر.',
      });
    }

    let googlePayload = null;
    const activeClientId = process.env.GOOGLE_CLIENT_ID || config.googleClientId;

    // 1. Verify Google ID Token using official google-auth-library
    if (activeClientId) {
      try {
        const client = new OAuth2Client(activeClientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: activeClientId,
        });
        googlePayload = ticket.getPayload();
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'فشل التحقق من صحة رمز Google OAuth: ' + (err.message || 'رمز غير صالح أو منتهي الصلاحية'),
        });
      }
    } else {
      // Development fallback when GOOGLE_CLIENT_ID is not configured in .env
      // Decodes standard JWT payload structure for local testing without external API calls
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          googlePayload = JSON.parse(payloadJson);
        } else {
          const parsed = typeof credential === 'object' ? credential : JSON.parse(credential);
          googlePayload = parsed;
        }
      } catch {
        return res.status(400).json({
          success: false,
          message: 'رمز Google ID غير صالح أو تعذر التحقق منه.',
        });
      }
    }

    if (!googlePayload || !googlePayload.email) {
      return res.status(400).json({
        success: false,
        message: 'تعذر الحصول على البريد الإلكتروني من حساب Google.',
      });
    }

    // Verify email is verified by Google
    if (googlePayload.email_verified === false) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني لحساب Google غير موثق. يرجى توثيق بريدك أولاً.',
      });
    }

    const googleEmail = googlePayload.email.toLowerCase().trim();
    const googleName = googlePayload.name || 'طالب سكنلي';
    const googleSub = googlePayload.sub || `g-${Date.now()}`;
    const googlePicture = googlePayload.picture || '';

    // 2. Check if a user with this email or googleId already exists (prevents duplicate accounts)
    let user = userStore.findByEmail(googleEmail) || userStore.findByGoogleId(googleSub);

    if (user) {
      // Existing user: Link Google ID and update avatar if not present
      // Security rule: Never elevate, change, or mutate existing user's role!
      userStore.linkGoogleAccount(user.id, googleSub, googlePicture);
    } else {
      // New user registration via Google: STRICTLY student/tenant role only!
      // Regular public Google registration cannot create Owner or Admin accounts
      user = userStore.createStudentUser({
        fullName: googleName,
        email: googleEmail,
        googleId: googleSub,
        avatar: googlePicture,
        isGoogleUser: true,
      });
    }

    // 3. Issue Sakanly JWT tokens (Access Token + Rotated Refresh Token)
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenObj = generateRefreshToken(tokenPayload);

    userStore.saveRefreshToken(user.id, {
      token: refreshTokenObj.token,
      jti: refreshTokenObj.jti,
      family: refreshTokenObj.family,
    });

    setRefreshTokenCookie(res, refreshTokenObj.token);

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بحساب Google بنجاح.',
      data: {
        user: userStore.toSafeUser(user),
        token: accessToken,
        accessToken,
        refreshToken: refreshTokenObj.token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, phoneNumber, phoneCountryCode, avatar } = req.body;
    const targetUser = userStore.findById(req.user.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
    }

    const rawPhone = phone !== undefined ? phone : phoneNumber;
    let cleanPhone = undefined;
    let cleanPhoneNumber = undefined;
    let cleanCountryCode = phoneCountryCode;

    if (rawPhone !== undefined) {
      const trimmed = typeof rawPhone === 'string' ? rawPhone.trim() : '';
      if (trimmed) {
        const countryCode = (phoneCountryCode || targetUser.phoneCountryCode || '+20').trim();
        if (countryCode === '+20') {
          const normalized = normalizeEgyptianPhone(trimmed);
          if (!normalized) {
            return res.status(400).json({
              success: false,
              message: 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).',
            });
          }
          cleanPhone = normalized;
          cleanPhoneNumber = normalized;
          cleanCountryCode = '+20';
        } else {
          const digits = trimmed.replace(/\D/g, '');
          if (digits.length < 8 || digits.length > 15) {
            return res.status(400).json({
              success: false,
              message: 'يرجى إدخال رقم هاتف صالح يتكون من 8 إلى 15 رقماً.',
            });
          }
          cleanPhone = `${countryCode}${digits}`;
          cleanPhoneNumber = digits;
          cleanCountryCode = countryCode;
        }

        // Uniqueness check in-memory
        const existingUser = userStore.findByPhone(cleanPhone);
        if (existingUser && existingUser.id !== req.user.id) {
          return res.status(409).json({
            success: false,
            message: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر. يرجى استخدام رقم هاتف آخر.',
          });
        }

        // Uniqueness check in MongoDB Atlas
        try {
          const { User } = await import('../models/User.js');
          const intl = cleanCountryCode === '+20' ? toInternationalFormat(cleanPhone) : cleanPhone;
          const mongoDuplicate = await User.findOne({
            id: { $ne: req.user.id },
            $or: [
              { phone: cleanPhone },
              ...(intl ? [{ phone: intl }] : []),
              { phoneNumber: cleanPhoneNumber },
              { phoneNumber: cleanPhone },
            ],
          }).lean();
          if (mongoDuplicate) {
            return res.status(409).json({
              success: false,
              message: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر. يرجى استخدام رقم هاتف آخر.',
            });
          }
        } catch {
          // ignore DB error fallback
        }
      } else {
        cleanPhone = '';
        cleanPhoneNumber = '';
      }
    }

    const updated = userStore.updateUser(req.user.id, {
      ...(fullName ? { fullName: fullName.trim() } : {}),
      ...(cleanPhone !== undefined ? { phone: cleanPhone, phoneNumber: cleanPhoneNumber, phoneCountryCode: cleanCountryCode } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح.',
      data: {
        user: userStore.toSafeUser(updated),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الملف الشخصي: ' + (err.message || ''),
    });
  }
};

export const getVerificationStatus = (req, res) => {
  const user = userStore.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  }

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: Boolean(user.emailVerified || user.verificationDetails?.emailConfirmation?.isVerified),
      phone: user.phone,
      phoneVerified: Boolean(user.phoneVerified || user.verificationDetails?.phoneConfirmation?.isVerified),
      nationalIdNumber: user.nationalIdNumber || user.verificationDetails?.accountInfo?.nationalIdNumber || '',
      tradeName: user.tradeName || user.verificationDetails?.accountInfo?.tradeName || '',
      role: user.role,
      isVerified: Boolean(user.isVerified),
      verificationStatus: user.verificationStatus || (user.role === 'owner' ? 'not_started' : 'not_applicable'),
      rejectionReason: user.rejectionReason || '',
      needsCorrectionReason: user.needsCorrectionReason || '',
      submittedAt: user.submittedAt || null,
      verifiedAt: user.verifiedAt || null,
      reviewedAt: user.reviewedAt || null,
      reviewedBy: user.reviewedBy || null,
      verificationDetails: user.verificationDetails || {
        accountInfo: {
          fullName: user.fullName || '',
          nationalIdNumber: user.nationalIdNumber || '',
          tradeName: user.tradeName || '',
          governorate: 'القاهرة',
          address: '',
          completed: Boolean(user.fullName && user.nationalIdNumber?.length === 14),
        },
        emailConfirmation: {
          email: user.email || '',
          isVerified: Boolean(user.emailVerified || user.verificationDetails?.emailConfirmation?.isVerified),
          verifiedAt: user.emailVerifiedAt || null,
        },
        phoneConfirmation: {
          phone: user.phone || '',
          isVerified: Boolean(user.phoneVerified),
          verifiedAt: user.phoneVerifiedAt || null,
        },
        nationalId: {},
        livenessCheck: { status: 'not_started' },
        ownershipDocs: [],
        correctionRequests: [],
      },
      verificationHistory: user.verificationHistory || [],
    },
  });
};

export const sendEmailVerificationOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ميزة تأكيد البريد الإلكتروني مخصصة لملّاك العقارات فقط.' });
    }
    const result = await otpService.requestOwnerEmailVerificationOtp(req.user.id);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyEmailVerificationOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ميزة تأكيد البريد الإلكتروني مخصصة لملّاك العقارات فقط.' });
    }
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال رمز التحقق (OTP) المكون من 6 أرقام.' });
    }
    const result = await otpService.verifyOwnerEmailVerificationOtp(req.user.id, otp);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

export const sendPhoneVerificationOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ميزة توثيق الهاتف مخصصة لملّاك العقارات فقط.' });
    }
    const { phone } = req.body;
    const targetPhone = phone || req.user.phone;
    if (!targetPhone) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال رقم الهاتف المحمول.' });
    }
    const result = await otpService.requestOwnerPhoneVerificationOtp(req.user.id, targetPhone);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

export const verifyPhoneVerificationOtp = async (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'ميزة توثيق الهاتف مخصصة لملّاك العقارات فقط.' });
    }
    const { phone, otp } = req.body;
    const targetPhone = phone || req.user.phone;
    const result = await otpService.verifyOwnerPhoneVerificationOtp(req.user.id, targetPhone, otp);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

export const saveVerificationAccountInfo = (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'إجراء التوثيق متاح لملّاك العقارات فقط.' });
    }
    const { fullName, nationalIdNumber, tradeName, governorate, address } = req.body;
    if (!fullName || String(fullName).trim().length < 3) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال الاسم الرباعي المطابق لبطاقة الرقم القومي.' });
    }
    const cleanId = String(nationalIdNumber || '').replace(/\D/g, '');
    if (cleanId.length !== 14) {
      return res.status(400).json({ success: false, message: 'بطاقة الرقم القومي المصري يجب أن تتكون من 14 رقماً بالضبط.' });
    }
    const updated = userStore.saveVerificationAccountInfo(req.user.id, {
      fullName: fullName.trim(),
      nationalIdNumber: cleanId,
      tradeName: (tradeName || '').trim(),
      governorate: governorate || 'القاهرة',
      address: (address || '').trim(),
    });
    return res.status(200).json({
      success: true,
      message: 'تم حفظ وتوثيق بيانات الحساب بنجاح.',
      data: { user: userStore.toSafeUser(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const saveVerificationDoc = (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'إجراء التوثيق متاح لملّاك العقارات فقط.' });
    }
    const { docType, publicId, secureUrl, originalName, bytes, format } = req.body;
    if (!docType || (!publicId && !secureUrl)) {
      return res.status(400).json({ success: false, message: 'بيانات المستند غير مكتملة.' });
    }
    const updated = userStore.saveVerificationDoc(req.user.id, {
      docType,
      publicId,
      secureUrl,
      originalName,
      bytes,
      format,
    });
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل المستند في ملف التوثيق بنجاح.',
      data: { user: userStore.toSafeUser(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const removeVerificationDoc = (req, res, next) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'إجراء التوثيق متاح لملّاك العقارات فقط.' });
    }
    const { docType } = req.params;
    const { docId } = req.query;
    const updated = userStore.removeVerificationDoc(req.user.id, docType, docId);
    return res.status(200).json({
      success: true,
      message: 'تم إزالة المستند من ملف التوثيق.',
      data: { user: userStore.toSafeUser(updated) },
    });
  } catch (err) {
    next(err);
  }
};

export const submitVerification = (req, res) => {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      success: false,
      message: 'إجراء التوثيق متاح لملّاك العقارات فقط.',
    });
  }

  const user = userStore.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'المستخدم غير موجود.' });
  }

  if (user.verificationStatus === 'verified') {
    return res.status(400).json({
      success: false,
      message: 'حسابك معتمد وموثق بالفعل.',
    });
  }

  // Strict Production Check: Verify all 5 prerequisite steps are actually filled
  const details = user.verificationDetails || {};

  // 1. Account info check
  const hasAccountInfo = Boolean(
    details.accountInfo?.completed ||
    (user.fullName && user.nationalIdNumber && String(user.nationalIdNumber).length === 14)
  );
  if (!hasAccountInfo) {
    return res.status(400).json({
      success: false,
      message: 'المرحلة 1 غير مكتملة: يرجى استكمال بيانات الحساب والرقم القومي (14 رقماً).',
      missingStep: 1,
    });
  }

  // 2. Email verified check (Stage 2)
  const hasEmailVerified = Boolean(
    user.emailVerified || details.emailConfirmation?.isVerified
  );
  if (!hasEmailVerified) {
    return res.status(400).json({
      success: false,
      message: 'المرحلة 2 غير مكتملة: يرجى تأكيد البريد الإلكتروني برمز التحقق (OTP) أولاً.',
      missingStep: 2,
    });
  }

  // 3. National ID check (front and back)
  const hasIdFront = Boolean(details.nationalId?.frontDoc?.publicId || details.nationalId?.frontDoc?.secureUrl);
  const hasIdBack = Boolean(details.nationalId?.backDoc?.publicId || details.nationalId?.backDoc?.secureUrl);
  if (!hasIdFront || !hasIdBack) {
    return res.status(400).json({
      success: false,
      message: 'المرحلة 3 غير مكتملة: يجب رفع صورة وجه بطاقة الرقم القومي وصورة ظهرها.',
      missingStep: 3,
    });
  }

  // 4. Live selfie check
  const hasSelfie = Boolean(details.livenessCheck?.selfieDoc?.publicId || details.livenessCheck?.selfieDoc?.secureUrl);
  if (!hasSelfie) {
    return res.status(400).json({
      success: false,
      message: 'المرحلة 4 غير مكتملة: يرجى التقاط صورة سيلفي حية عبر الكاميرا لمطابقة ملامح الوجه.',
      missingStep: 4,
    });
  }

  // 5. Ownership document check
  const hasOwnershipDoc = Boolean(
    Array.isArray(details.ownershipDocs) && details.ownershipDocs.length > 0
  );
  if (!hasOwnershipDoc) {
    return res.status(400).json({
      success: false,
      message: 'المرحلة 5 غير مكتملة: يرجى رفع مستند يثبت علاقتك بالعقار (عقد ملكية أو توكيل أو إيصال مرافق).',
      missingStep: 5,
    });
  }

  const updated = userStore.submitVerification(req.user.id, req.body);
  return res.status(200).json({
    success: true,
    message: 'تم تقديم طلب التوثيق بنجاح! ملفك الآن قيد فحص وتدقيق إدارة منصة سكنلي.',
    data: {
      user: userStore.toSafeUser(updated),
    },
  });
};

export const reviewVerification = (req, res) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message: 'غير مصرح: مراجعة واعتماد طلبات التوثيق مخصصة لإدارة منصة سكنلي فقط.',
    });
  }

  const { userId, status, rejectionReason } = req.body;
  const targetId = userId || req.params?.id;

  if (!targetId) {
    return res.status(400).json({
      success: false,
      message: 'معرف المالك المستهدف مطلوب.',
    });
  }

  if (!['verified', 'rejected', 'in_progress', 'not_started', 'pending_review'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة التوثيق غير صالحة. الحالات المقبولة: verified, rejected, in_progress, pending_review, not_started.',
    });
  }

  if (status === 'rejected' && !rejectionReason) {
    return res.status(400).json({
      success: false,
      message: 'يرجى توضيح سبب الرفض لتنبيه المالك.',
    });
  }

  const updated = userStore.reviewVerification(targetId, { status, rejectionReason });
  if (!updated) {
    return res.status(404).json({
      success: false,
      message: 'حساب المالك المطلوب غير موجود.',
    });
  }

  return res.status(200).json({
    success: true,
    message: status === 'verified' ? 'تم اعتماد وتوثيق حساب المالك بنجاح.' : 'تم تحديث حالة التوثيق.',
    data: {

      user: userStore.toSafeUser(updated),
    },
  });
};

/**
 * 1. Request OTP / Reset Link for Password Reset (supports Phone or Email)
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { phone, email, identifier, method } = req.body;
    const targetIdentifier = identifier || email || phone;
    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال رقم الموبايل أو البريد الإلكتروني المسجل للمتابعة.',
      });
    }
    const resolvedMethod = method || (email ? 'email' : (phone ? 'phone' : undefined));
    const result = await otpService.requestPasswordReset(targetIdentifier, resolvedMethod);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Verify 6-digit OTP code and issue a signed resetToken (Phone or Email)
 */
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { phone, email, identifier, otp, method } = req.body;
    const targetIdentifier = identifier || email || phone;
    if (!targetIdentifier || !otp) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال رقم الموبايل أو البريد الإلكتروني ورمز التحقق المكون من 6 أرقام.',
      });
    }
    const resolvedMethod = method || (email ? 'email' : (phone ? 'phone' : undefined));
    const result = await otpService.verifyPasswordResetOtp(targetIdentifier, otp, resolvedMethod);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Resend OTP code with 60-second cooldown enforcement (Phone or Email)
 */
export const resendResetOtp = async (req, res, next) => {
  try {
    const { phone, email, identifier, method } = req.body;
    const targetIdentifier = identifier || email || phone;
    if (!targetIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال رقم الموبايل أو البريد الإلكتروني.',
      });
    }
    const resolvedMethod = method || (email ? 'email' : (phone ? 'phone' : undefined));
    const result = await otpService.requestPasswordReset(targetIdentifier, resolvedMethod);
    return res.status(result.status).json(result);
  } catch (err) {
    next(err);
  }
};

// In-memory set of consumed reset tokens to guarantee one-time use
const consumedResetTokens = new Set();

/**
 * 4. Reset Password with verified signed resetToken
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية جلسة استعادة كلمة المرور أو أنها غير مصرح بها. يرجى إعادة المحاولة من البداية.',
      });
    }

    if (consumedResetTokens.has(resetToken)) {
      return res.status(401).json({
        success: false,
        message: 'تم استخدام رمز إعادة تعيين كلمة المرور هذا بالفعل. يرجى طلب رمز تحقق جديد.',
      });
    }

    const decoded = verifyResetToken(resetToken);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'جلسة إعادة تعيين كلمة المرور منتهية الصلاحية (الصلاحية 15 دقيقة). يرجى البدء مجدداً.',
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمتا المرور غير متطابقتين. يرجى التأكد وإعادة المحاولة.',
      });
    }

    const updatedUser = userStore.updatePassword(decoded.userId, newPassword);
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود.',
      });
    }

    // Invalidate the token immediately so it cannot be replayed
    consumedResetTokens.add(resetToken);

    // Security practice: Revoke all existing sessions and refresh tokens on password reset
    userStore.revokeAllUserTokens(decoded.userId);

    return res.status(200).json({
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Refresh Session & Token Rotation (with Replay / Reuse Detection)
 */
export const refreshSession = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'رمز تجديد الجلسة غير متوفر. يرجى تسجيل الدخول مجدداً.',
      });
    }

    const decoded = verifyRefreshToken(rawRefreshToken);
    if (!decoded || !decoded.id) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        success: false,
        code: 'INVALID_REFRESH_TOKEN',
        message: 'انتهت صلاحية جلسة التجديد أو الرمز غير صالح. يرجى تسجيل الدخول مجدداً.',
      });
    }

    const user = userStore.findById(decoded.id);
    if (!user || user.suspended) {
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND_OR_SUSPENDED',
        message: 'المستخدم غير موجود أو الحساب معلق.',
      });
    }

    const storedToken = userStore.findRefreshToken(user.id, rawRefreshToken);

    // Reuse Detection: If token is not in active store or was already marked as revoked
    if (!storedToken || storedToken.isRevoked) {
      // Invalidate the entire token family
      userStore.revokeTokenFamily(user.id, decoded.family);
      res.clearCookie('refreshToken', { path: '/' });

      PlatformSettingsStore.logSecurityEvent({
        type: 'refresh_token_reuse_detected',
        ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
        user: user.email || user.id,
        role: user.role,
        description: `تم اكتشاف محاولة إعادة استخدام رمز تجديد ملغي أو مستهلك للحساب: ${user.email}. تم إبطال الجلسات المرتبطة فوراً لدواعي الأمان.`,
        severity: 'critical',
      });

      return res.status(403).json({
        success: false,
        code: 'TOKEN_REUSE_DETECTED',
        message: 'تم اكتشاف نشاط غير مصرح به وإلغاء صلاحية الجلسة لدواعي الأمان. يرجى إعادة تسجيل الدخول.',
      });
    }

    // Revoke the consumed refresh token
    userStore.revokeRefreshToken(user.id, decoded.jti);

    // Rotate: Issue new short-lived access token and new rotated refresh token in the same family
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload, decoded.family);

    userStore.saveRefreshToken(user.id, {
      token: newRefreshToken.token,
      jti: newRefreshToken.jti,
      family: newRefreshToken.family,
    });

    setRefreshTokenCookie(res, newRefreshToken.token);

    return res.status(200).json({
      success: true,
      message: 'تم تجديد الجلسة بنجاح.',
      data: {
        token: newAccessToken,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.token,
        user: userStore.toSafeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Logout & Session Revocation
 */
export const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (rawRefreshToken) {
      const decoded = verifyRefreshToken(rawRefreshToken);
      if (decoded && decoded.id && decoded.jti) {
        userStore.revokeRefreshToken(decoded.id, decoded.jti);
      }
    }

    if (req.user && req.user.id) {
      userStore.revokeAllUserTokens(req.user.id);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح وإلغاء صلاحية الجلسة.',
    });
  } catch (error) {
    next(error);
  }
};

