import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    reportedBy: {
      type: String,
      required: true,
      index: true,
    },
    reporterName: {
      type: String,
      default: '',
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_admin_review', 'resolved', 'dismissed'],
      default: 'pending_admin_review',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model('Report', ReportSchema);

