import mongoose from 'mongoose';

const MessageSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ['student', 'owner', 'system', 'admin'], required: true },
    senderId: { type: String, default: '' },
    senderName: { type: String, default: '' },
    text: { type: String, default: '' },
    attachments: [
      {
        url: { type: String },
        secure_url: { type: String },
        public_id: { type: String },
        format: { type: String },
        bytes: { type: Number },
        name: { type: String },
        resource_type: { type: String, default: 'image' },
      },
    ],
    createdAt: { type: String, default: () => new Date().toISOString() },
    time: { type: String, default: '' },
    read: { type: Boolean, default: false },
    isSystemNotification: { type: Boolean, default: false },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      default: 'مالك العقار',
    },
    ownerAvatar: {
      type: String,
      default: '',
    },
    ownerPhone: {
      type: String,
      default: '',
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      default: 'طالب سكنلي',
    },
    studentAvatar: {
      type: String,
      default: '',
    },
    propertyId: {
      type: String,
      default: '',
      index: true,
    },
    propertyTitle: {
      type: String,
      default: 'وحدة سكنية للطلاب',
    },
    propertyImage: {
      type: String,
      default: '',
    },
    propertyPrice: {
      type: Number,
      default: 0,
    },
    propertyType: {
      type: String,
      default: 'entire_apartment',
    },
    propertyCity: {
      type: String,
      default: 'القاهرة',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageTime: {
      type: String,
      default: '',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    unreadCountStudent: {
      type: Number,
      default: 0,
    },
    unreadCountOwner: {
      type: Number,
      default: 0,
    },
    viewingRequest: {
      id: { type: String },
      date: { type: String },
      time: { type: String },
      status: { type: String, default: 'pending' },
      propertyTitle: { type: String },
    },
    messages: {
      type: [MessageSubSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Conversation = mongoose.model('Conversation', ConversationSchema);
