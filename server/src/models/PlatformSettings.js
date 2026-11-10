import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: '127.0.0.1',
    },
    user: {
      type: String,
      default: 'system',
    },
    role: {
      type: String,
      default: 'none',
    },
    description: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'danger', 'critical'],
      default: 'info',
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  { _id: false }
);

const PlatformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_settings',
      unique: true,
      index: true,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    securityLogs: {
      type: [SecurityLogSchema],
      default: () => [],
    },
  },
  {
    timestamps: true,
  }
);

export const PlatformSettings = mongoose.model('PlatformSettings', PlatformSettingsSchema);
