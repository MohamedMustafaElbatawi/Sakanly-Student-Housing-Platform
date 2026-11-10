import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    titleEn: {
      type: String,
      default: '',
      trim: true,
    },
    governorate: {
      type: String,
      default: '',
      index: true,
    },
    city: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      default: '',
      index: true,
    },
    address: {
      type: String,
      default: '',
    },
    accommodationType: {
      type: String,
      enum: ['private_room', 'shared_room', 'entire_apartment', 'individual_bed'],
      default: 'shared_room',
      index: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      index: true,
    },
    deposit: {
      type: Number,
      default: 0,
    },
    utilitiesCost: {
      type: Number,
      default: 0,
    },
    bedrooms: {
      type: Number,
      default: 1,
    },
    bathrooms: {
      type: Number,
      default: 1,
    },
    area: {
      type: Number,
      default: 0,
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      default: 'any',
      index: true,
    },
    availableBeds: {
      type: Number,
      default: 1,
    },
    totalBeds: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    video: {
      url: { type: String, default: null },
      secure_url: { type: String, default: null },
      public_id: { type: String, default: null },
      format: { type: String, default: null },
      bytes: { type: Number, default: 0 },
      duration: { type: Number, default: 0 },
      thumbnail_url: { type: String, default: null },
    },
    media: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    amenities: {
      type: [String],
      default: [],
    },
    nearbyUniversities: {
      type: [
        {
          name: { type: String, required: true },
          distance: { type: String, default: '' },
          timeMinutes: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    contactPhone: {
      type: String,
      default: null,
      trim: true,
    },
    whatsappPhone: {
      type: String,
      default: null,
      trim: true,
    },
    showContactPhone: {
      type: Boolean,
      default: true,
    },
    isFurnished: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'published', 'draft', 'pending', 'pending_review', 'rented', 'paused', 'rejected', 'deleted', 'needs_correction'],
      default: 'active',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    correctionReason: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    owner: {
      id: { type: String, required: true, index: true },
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      avatar: { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
      rating: { type: Number, default: 5 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const Listing = mongoose.model('Listing', ListingSchema);

