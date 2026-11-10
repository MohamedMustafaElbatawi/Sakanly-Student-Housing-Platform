import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    listingIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Favorite = mongoose.model('Favorite', FavoriteSchema);

