import { FavoritesStore } from '../data/mockFavoritesData.js';
import { ListingsService } from '../services/listingsService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class FavoritesController {
  static async getFavorites(req, res, next) {
    try {
      const listingIds = await FavoritesStore.getFavoritesAsync(req.user.id);
      const listings = [];
      for (const id of listingIds) {
        const listing = await ListingsService.getByIdAsync(id);
        if (listing) {
          listings.push(listing);
        }
      }

      return ApiResponse.success(res, {
        favorites: listingIds,
        properties: listings,
        total: listingIds.length,
      }, 'Favorites retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async addFavorite(req, res, next) {
    try {
      const { listingId } = req.body;
      if (!listingId) {
        return ApiResponse.error(res, 'معرف العقار مطلوب', 400);
      }

      const listing = await ListingsService.getByIdAsync(listingId);
      if (!listing) {
        return ApiResponse.error(res, 'العقار غير موجود', 404);
      }

      const canonicalId = listing.id || String(listingId);
      const updatedFavorites = await FavoritesStore.addFavoriteAsync(req.user.id, canonicalId);
      return ApiResponse.success(res, {
        favorites: updatedFavorites,
        listingId: canonicalId,
      }, 'تمت إضافة العقار إلى المفضلة بنجاح', 201);
    } catch (err) {
      next(err);
    }
  }

  static async removeFavorite(req, res, next) {
    try {
      const { listingId } = req.params;
      if (!listingId) {
        return ApiResponse.error(res, 'معرف العقار مطلوب', 400);
      }

      const listing = await ListingsService.getByIdAsync(listingId);
      const canonicalId = listing?.id || String(listingId);

      const updatedFavorites = await FavoritesStore.removeFavoriteAsync(req.user.id, canonicalId);
      return ApiResponse.success(res, {
        favorites: updatedFavorites,
        listingId: canonicalId,
      }, 'تمت إزالة العقار من المفضلة بنجاح');
    } catch (err) {
      next(err);
    }
  }
}
