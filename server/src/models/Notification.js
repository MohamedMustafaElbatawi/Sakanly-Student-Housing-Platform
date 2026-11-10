import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['request', 'success', 'verification', 'info', 'warning', 'system', 'message', 'needs_correction'],
      default: 'info',
    },
    targetId: {
      type: String,
      default: null,
    },
    targetType: {
      type: String,
      enum: ['listing', 'inquiry', 'conversation', 'verification', 'system', null],
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', NotificationSchema);

