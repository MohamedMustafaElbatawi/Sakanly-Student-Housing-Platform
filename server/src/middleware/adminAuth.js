import { verifyToken } from '../utils/token.js';
import { userStore } from '../data/mockUsers.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';

export const requireSuperAdmin = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && (req.cookies.adminToken || req.cookies.accessToken || req.cookies.token)) {
    token = req.cookies.adminToken || req.cookies.accessToken || req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'يرجى تسجيل الدخول بحساب الإدارة.' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: 'انتهت صلاحية الجلسة الإدارية.' });
  }
  const user = userStore.findById(decoded.id);
  if (!user || user.role !== 'super_admin') {
    // Log unauthorized attempt in console and Security Events Store
    console.warn(`[ADMIN SECURITY] Unauthorized access attempt by user: ${decoded?.id} (role: ${decoded?.role}) at ${new Date().toISOString()} - IP: ${req.ip}`);
    PlatformSettingsStore.logSecurityEvent({
      type: 'unauthorized_admin_access',
      ip: req.ip || req.connection?.remoteAddress || '127.0.0.1',
      user: decoded?.email || decoded?.id || 'unknown',
      role: decoded?.role || 'unauthorized',
      description: `محاولة وصول غير مصرح بها للمسار الإداري: ${req.originalUrl}`,
      severity: 'danger',
    });
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'الوصول مرفوض: هذا المورد مخصص لإدارة المنصة فقط.' });
  }
  req.user = userStore.toSafeUser(user);
  req.adminUser = req.user; // alias for clarity
  next();
};
