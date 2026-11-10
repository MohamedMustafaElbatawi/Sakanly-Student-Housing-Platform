import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicant: {
      id: { type: String, required: true, index: true },
      fullName: { type: String, required: true },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    listingId: {
      type: String,
      required: true,
      index: true,
    },
    listingTitle: {
      type: String,
      default: '',
    },
    moveInDate: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending_owner_confirmation', 'pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending_owner_confirmation',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Inquiry = mongoose.model('Inquiry', InquirySchema);

