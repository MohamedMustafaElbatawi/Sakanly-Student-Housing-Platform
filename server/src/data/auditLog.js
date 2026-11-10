import { AuditLogModel } from '../models/AuditLog.js';
import { isMongoConnected } from '../config/database.js';

// Audit Log - Dual-mode store للإجراءات الإدارية
let auditLogs = [];

const persistAuditLogToDB = (entry) => {
  if (!isMongoConnected() || !entry) return;
  AuditLogModel.findOneAndUpdate(
    { id: entry.id },
    { $set: entry },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [AuditLog] Failed to persist audit log to MongoDB:', err.message);
  });
};

export const AuditLog = {
  async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbLogs = await AuditLogModel.find({}).sort({ createdAt: -1 }).limit(500).lean();
      if (dbLogs && dbLogs.length > 0) {
        auditLogs = dbLogs;
        console.log(`✅ [AuditLog] Hydrated ${dbLogs.length} audit logs from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [AuditLog] Error syncing audit logs from MongoDB:', err.message);
    }
  },

  add({ adminId, adminName, action, targetType, targetId, targetLabel, previousState, newState }) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      adminName,
      action, // 'verify_owner', 'reject_owner', 'suspend_user', 'unsuspend_user', 'delete_listing', 'activate_listing', 'pause_listing'
      targetType, // 'user', 'listing', 'inquiry'
      targetId,
      targetLabel,
      previousState: previousState || null,
      newState: newState || null,
      timestamp: new Date().toISOString(),
    };
    auditLogs.unshift(entry);
    if (auditLogs.length > 500) auditLogs = auditLogs.slice(0, 500); // Keep last 500
    persistAuditLogToDB(entry);
    return entry;
  },

  getAll({ limit = 50, offset = 0 } = {}) {
    return { logs: auditLogs.slice(offset, offset + limit), total: auditLogs.length };
  },

  getByAdmin(adminId) {
    return auditLogs.filter(l => l.adminId === adminId);
  },
};
