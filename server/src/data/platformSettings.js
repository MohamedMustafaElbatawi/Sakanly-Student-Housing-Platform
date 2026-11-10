import { PlatformSettings } from '../models/PlatformSettings.js';
import { isMongoConnected } from '../config/database.js';

// Platform Settings Store (Dual-mode with persistent MongoDB Atlas defaults)

let settings = {
  platformName: 'منصة سكنلي - Sakanly',
  platformTagline: 'المنصة الطلابية الأولى لسكن آمن وموثوق بمحيط الجامعات المصرية',
  platformFeePercentage: 0, // 0% free student access
  maintenanceMode: false,
  allowStudentRegistration: true,
  allowOwnerRegistration: true,
  requireOwnerVerificationForListing: true,
  autoApproveVerifiedOwnerListings: false,
  contactEmail: 'support@sakanly.com',
  contactPhone: '01000000001',
  termsVersion: '2026.1',
  securityPolicy: {
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 60,
    enforceStrongPasswords: true,
    allowDirectMessaging: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'usr-super-admin-root',
};

// Security events store for tracking access attempts & sensitive actions
let securityEvents = [
  {
    id: `sec-${Date.now()}-01`,
    type: 'system_boot',
    ip: '127.0.0.1',
    user: 'system',
    role: 'system',
    description: 'تم إقلاع خادم سكنلي وتهيئة بروتوكولات الأمان والحماية.',
    severity: 'info',
    timestamp: new Date().toISOString(),
  },
];

const persistSettingsToDB = () => {
  if (!isMongoConnected()) return;
  PlatformSettings.findOneAndUpdate(
    { key: 'global_settings' },
    { $set: { key: 'global_settings', settings, securityLogs: securityEvents } },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [PlatformSettingsStore] Failed to persist settings to MongoDB:', err.message);
  });
};

export const PlatformSettingsStore = {
  async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const doc = await PlatformSettings.findOne({ key: 'global_settings' }).lean();
      if (doc) {
        if (doc.settings && Object.keys(doc.settings).length > 0) {
          settings = { ...settings, ...doc.settings };
        }
        if (Array.isArray(doc.securityLogs) && doc.securityLogs.length > 0) {
          securityEvents = doc.securityLogs;
        }
        console.log(`✅ [PlatformSettingsStore] Hydrated platform settings & security logs from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [PlatformSettingsStore] Error syncing settings from MongoDB:', err.message);
    }
  },

  getSettings() {
    return { ...settings };
  },

  updateSettings(newSettings, adminUser) {
    settings = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser?.id || settings.updatedBy,
    };
    persistSettingsToDB();
    return { ...settings };
  },

  logSecurityEvent({ type, ip = '::1', user = 'unknown', role = 'none', description, severity = 'warning' }) {
    const event = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      ip,
      user,
      role,
      description,
      severity,
      timestamp: new Date().toISOString(),
    };
    securityEvents.unshift(event);
    if (securityEvents.length > 300) {
      securityEvents = securityEvents.slice(0, 300);
    }
    persistSettingsToDB();
    return event;
  },

  getSecurityEvents(limit = 100) {
    return securityEvents.slice(0, limit);
  },
};
