import { verifyToken } from '../utils/token.js';
import { userStore } from '../data/mockUsers.js';

export const requireAuth = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
    token = req.cookies.accessToken || req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح: يرجى تسجيل الدخول أولاً.',
    });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية الجلسة أو الرمز غير صالح، يرجى تسجيل الدخول مجدداً.',
    });
  }

  const user = userStore.findById(decoded.id);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'المستخدم غير موجود.',
    });
  }

  req.user = userStore.toSafeUser(user);
  next();
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_FORBIDDEN',
        message: 'ليس لديك الصلاحية الكافية للوصول إلى هذا المورد. هذه الميزة مخصصة لملّاك العقارات فقط.',
      });
    }
    // super_admin can access everything
    if (req.user.role === 'super_admin') return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'ROLE_FORBIDDEN',
        message: 'ليس لديك الصلاحية الكافية للوصول إلى هذا المورد. هذه الميزة مخصصة لملّاك العقارات فقط.',
      });
    }
    next();
  };
};

export const optionalAuth = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
    token = req.cookies.accessToken || req.cookies.token;
  }

  if (!token) {
    return next();
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next();
  }

  const user = userStore.findById(decoded.id);
  if (user) {
    req.user = userStore.toSafeUser(user);
  }
  next();
};

