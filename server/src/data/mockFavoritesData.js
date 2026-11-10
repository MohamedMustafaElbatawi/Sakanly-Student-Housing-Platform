import { Favorite } from '../models/Favorite.js';
import { isMongoConnected } from '../config/database.js';

// User Favorites In-Memory Store
// Maps userId -> Set of listingIds
const userFavoritesMap = new Map();

// Seed initial favorites
userFavoritesMap.set('usr-student-001', new Set(['prop-001']));
userFavoritesMap.set('usr-email-001', new Set(['prop-004']));

const persistFavoriteToDB = (userId, listingIds) => {
  if (!isMongoConnected() || !userId) return;
  Favorite.findOneAndUpdate(
    { userId },
    { $set: { userId, listingIds: Array.from(listingIds) } },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [FavoritesStore] Failed to persist favorite to MongoDB:', err.message);
  });
};

export class FavoritesStore {
  static async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbFavorites = await Favorite.find({}).lean();
      if (dbFavorites && dbFavorites.length > 0) {
        for (const fav of dbFavorites) {
          userFavoritesMap.set(fav.userId, new Set(fav.listingIds || []));
        }
        console.log(`✅ [FavoritesStore] Hydrated ${dbFavorites.length} user favorites from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [FavoritesStore] Error syncing favorites from MongoDB:', err.message);
    }
  }

  static getFavorites(userId) {
    if (!userFavoritesMap.has(userId)) {
      userFavoritesMap.set(userId, new Set());
    }
    return Array.from(userFavoritesMap.get(userId));
  }

  static async getFavoritesAsync(userId) {
    if (!userId) return [];
    if (!userFavoritesMap.has(userId) && isMongoConnected()) {
      try {
        const dbDoc = await Favorite.findOne({ userId }).lean();
        if (dbDoc && Array.isArray(dbDoc.listingIds)) {
          userFavoritesMap.set(userId, new Set(dbDoc.listingIds));
        }
      } catch (err) {
        console.error('⚠️ [FavoritesStore] Error fetching favorites from DB:', err.message);
      }
    }
    return this.getFavorites(userId);
  }

  static addFavorite(userId, listingId) {
    if (!userFavoritesMap.has(userId)) {
      userFavoritesMap.set(userId, new Set());
    }
    const set = userFavoritesMap.get(userId);
    set.add(listingId);
    persistFavoriteToDB(userId, set);
    return Array.from(set);
  }

  static async addFavoriteAsync(userId, listingId) {
    if (!userId || !listingId) return [];
    await this.getFavoritesAsync(userId);
    const set = userFavoritesMap.get(userId) || new Set();
    set.add(listingId);
    userFavoritesMap.set(userId, set);
    if (isMongoConnected()) {
      try {
        await Favorite.findOneAndUpdate(
          { userId },
          { $set: { userId, listingIds: Array.from(set) } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err) {
        console.error('⚠️ [FavoritesStore] Error persisting favorite to DB:', err.message);
      }
    }
    return Array.from(set);
  }

  static removeFavorite(userId, listingId) {
    if (!userFavoritesMap.has(userId)) {
      userFavoritesMap.set(userId, new Set());
    }
    const set = userFavoritesMap.get(userId);
    set.delete(listingId);
    persistFavoriteToDB(userId, set);
    return Array.from(set);
  }

  static async removeFavoriteAsync(userId, listingId) {
    if (!userId || !listingId) return [];
    await this.getFavoritesAsync(userId);
    const set = userFavoritesMap.get(userId) || new Set();
    set.delete(listingId);
    userFavoritesMap.set(userId, set);
    if (isMongoConnected()) {
      try {
        await Favorite.findOneAndUpdate(
          { userId },
          { $set: { userId, listingIds: Array.from(set) } },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (err) {
        console.error('⚠️ [FavoritesStore] Error persisting favorite deletion to DB:', err.message);
      }
    }
    return Array.from(set);
  }

  static isFavorite(userId, listingId) {
    if (!userFavoritesMap.has(userId)) return false;
    return userFavoritesMap.get(userId).has(listingId);
  }
}
