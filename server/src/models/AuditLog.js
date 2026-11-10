import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adminId: {
      type: String,
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      default: '',
      index: true,
    },
    targetId: {
      type: String,
      default: '',
      index: true,
    },
    targetLabel: {
      type: String,
      default: '',
    },
    previousState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newState: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    timestamps: true,
  }
);

export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);

