import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    phoneCountryCode: {
      type: String,
      default: '+20',
      trim: true,
    },
    password: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['student', 'owner', 'admin', 'super_admin'],
      default: 'student',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: [
        'not_applicable',
        'not_started',
        'in_progress',
        'pending_review',
        'verified',
        'rejected',
        'needs_correction',
      ],
      default: 'not_started',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    needsCorrectionReason: {
      type: String,
      default: '',
    },
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: '',
    },
    suspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendReason: {
      type: String,
      default: '',
    },
    unsuspendedAt: {
      type: Date,
      default: null,
    },
    passwordUpdatedAt: {
      type: Date,
      default: null,
    },
    nationalIdNumber: {
      type: String,
      default: '',
    },
    tradeName: {
      type: String,
      default: '',
    },
    verificationDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    verificationHistory: {
      type: [mongoose.Schema.Types.Mixed],
      default: () => [],
    },
    refreshTokens: {
      type: [
        {
          token: { type: String, required: true },
          jti: { type: String, required: true },
          family: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          isRevoked: { type: Boolean, default: false },
          createdAt: { type: Date, default: () => new Date() },
        },
      ],
      default: () => [],
    },
  },
  {
    timestamps: true,
  }
);

// Safe partial unique index: ensures no two users share the same non-empty phone,
// while completely ignoring legacy accounts or students where phone is empty/null/missing.
UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      phone: { $exists: true, $type: 'string', $gt: '' },
    },
  }
);

UserSchema.index(
  { phoneNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      phoneNumber: { $exists: true, $type: 'string', $gt: '' },
    },
  }
);

export const User = mongoose.model('User', UserSchema);

