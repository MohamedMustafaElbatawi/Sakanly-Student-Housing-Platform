import mongoose from 'mongoose';
import { mockListings, mockPopularAreas } from '../data/mockListings.js';
import { Listing } from '../models/Listing.js';
import { isMongoConnected } from '../config/database.js';
import { matchesAnyLocation, normalizeListingLocation } from '../data/locationsData.js';

let currentListings = mockListings.map(l => ({ status: l.status || 'active', ...normalizeListingLocation(l) }));

const persistListingToDB = (listing) => {
  if (!isMongoConnected() || !listing) return;
  const filter = { id: listing.id };
  Listing.findOneAndUpdate(
    filter,
    { $set: listing },
    { upsert: true, returnDocument: 'after' }
  ).then(saved => {
    if (saved && saved._id) {
      listing._id = saved._id;
    }
  }).catch(err => {
    console.error('⚠️ [ListingsService] Failed to persist listing to MongoDB:', err.message);
  });
};

export class ListingsService {
  static async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbListings = await Listing.find({}).lean();
      if (dbListings && dbListings.length > 0) {
        for (const dbl of dbListings) {
          const normDbl = normalizeListingLocation(dbl);
          const idx = currentListings.findIndex(l => l.id === normDbl.id);
          if (idx >= 0) {
            currentListings[idx] = { ...currentListings[idx], ...normDbl };
          } else {
            currentListings.push(normDbl);
          }
        }
        console.log(`✅ [ListingsService] Hydrated ${dbListings.length} listings from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [ListingsService] Error syncing listings from MongoDB:', err.message);
    }
  }

  static getAll(filters = {}) {
    let result = [...currentListings];

    // Status filtering rules:
    if (filters.includeAllStatuses || filters.status === 'all') {
      result = result.filter(item => item.status !== 'deleted');
    } else if (filters.status) {
      result = result.filter(item => item.status === filters.status);
    } else if (filters.ownerId) {
      result = result.filter(item => item.status !== 'deleted');
    } else if (filters.includeDrafts) {
      result = result.filter(item => item.status !== 'deleted');
    } else {
      // Public student search: only active and published listings are visible to students (default to active for verified listings)
      result = result.filter(item => item.status === 'active' || item.status === 'published' || !item.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.city?.toLowerCase().includes(q) ||
        item.district?.toLowerCase().includes(q) ||
        item.address?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
      );
    }

    // Multi-location filtering (OR logic between selected locations, supporting governorate & district levels)
    let locationQueries = [];
    if (filters.locations) {
      if (Array.isArray(filters.locations)) {
        locationQueries = filters.locations.map(l => String(l).trim()).filter(Boolean);
      } else if (typeof filters.locations === 'string') {
        locationQueries = filters.locations.split(',').map(l => l.trim()).filter(Boolean);
      }
    } else if (filters.city) {
      locationQueries = [String(filters.city).trim()];
    } else if (filters.governorate) {
      locationQueries = [String(filters.governorate).trim()];
    }

    if (locationQueries.length > 0) {
      result = result.filter(item => matchesAnyLocation(item, locationQueries));
    }

    if (filters.accommodationType) {
      result = result.filter(item => item.accommodationType === filters.accommodationType);
    }

    if (filters.genderPreference) {
      result = result.filter(item => item.genderPreference === filters.genderPreference || item.genderPreference === 'any');
    }

    if (filters.minPrice) {
      result = result.filter(item => item.monthlyPrice >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(item => item.monthlyPrice <= Number(filters.maxPrice));
    }

    if (filters.isFurnished !== undefined) {
      const val = filters.isFurnished === 'true' || filters.isFurnished === true;
      result = result.filter(item => item.isFurnished === val);
    }

    if (filters.isVerified !== undefined) {
      const val = filters.isVerified === 'true' || filters.isVerified === true;
      result = result.filter(item => item.isVerified === val);
    }

    if (filters.ownerId) {
      result = result.filter(item => item.owner?.id === filters.ownerId);
    }

    // Sorting
    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.monthlyPrice - a.monthlyPrice);
    } else {
      // Default: featured first, then newest
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }

  static _cacheListing(listing) {
    if (!listing || !listing.id) return;
    const idx = currentListings.findIndex(l => l.id === listing.id);
    if (idx >= 0) {
      currentListings[idx] = listing;
    } else {
      currentListings.unshift(listing);
    }
  }

  static getById(id) {
    if (!id) return null;
    const strId = String(id);
    return currentListings.find(item => item.id === strId || String(item._id) === strId) || null;
  }

  static async getByIdAsync(id) {
    if (!id) return null;
    let found = this.getById(id);
    if (!found && isMongoConnected()) {
      try {
        const strId = String(id);
        const query = { $or: [{ id: strId }] };
        if (mongoose.isValidObjectId(strId)) {
          query.$or.push({ _id: strId });
        }
        const dbDoc = await Listing.findOne(query).lean();
        if (dbDoc) {
          found = dbDoc;
          const idx = currentListings.findIndex(l => l.id === dbDoc.id);
          if (idx >= 0) {
            currentListings[idx] = dbDoc;
          } else {
            currentListings.push(dbDoc);
          }
        }
      } catch (err) {
        console.error('⚠️ [ListingsService] Error fetching listing by ID from MongoDB:', err.message);
      }
    }
    return found || null;
  }

  static async getByOwner(ownerId) {
    if (isMongoConnected()) {
      try {
        const dbListings = await Listing.find({ 'owner.id': ownerId }).sort({ createdAt: -1 }).lean();
        if (dbListings && dbListings.length > 0) {
          return dbListings;
        }
      } catch (err) {
        console.error('⚠️ [ListingsService] Error fetching listings from MongoDB by owner:', err.message);
      }
    }
    return currentListings.filter(item => item.owner?.id === ownerId);
  }

  static async getStatsByOwner(ownerId) {
    let ownerListings = [];
    if (isMongoConnected()) {
      try {
        ownerListings = await Listing.find({ 'owner.id': ownerId }).lean();
      } catch (err) {
        console.error('⚠️ [ListingsService] Error getting stats from MongoDB:', err.message);
        ownerListings = currentListings.filter(item => item.owner?.id === ownerId);
      }
    }
    if (!ownerListings || ownerListings.length === 0) {
      ownerListings = currentListings.filter(item => item.owner?.id === ownerId);
    }
    const total = ownerListings.length;
    const active = ownerListings.filter(item => item.status === 'active' || item.status === 'published').length;
    const draft = ownerListings.filter(item => item.status === 'draft').length;
    const pendingReview = ownerListings.filter(item => item.status === 'pending_review' || item.status === 'pending').length;
    const rejected = ownerListings.filter(item => item.status === 'rejected').length;
    const rented = ownerListings.filter(item => item.status === 'rented').length;
    const paused = ownerListings.filter(item => item.status === 'paused').length;
    return {
      total,
      active,
      draft,
      pendingReview,
      rejected,
      rented,
      paused,
    };
  }

  static getIndividualBeds() {
    return currentListings.filter(item => item.accommodationType === 'individual_bed');
  }

  static getPopularAreas() {
    return mockPopularAreas;
  }

  static create(data) {
    const normalizedData = normalizeListingLocation(data);
    const newListing = {
      id: normalizedData.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: normalizedData.status || 'pending_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...normalizedData,
    };
    currentListings.unshift(newListing);
    persistListingToDB(newListing);
    return newListing;
  }

  static async createAsync(data) {
    const normalizedData = normalizeListingLocation(data);
    const newListing = {
      id: normalizedData.id || `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: normalizedData.status || 'pending_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...normalizedData,
      ...data,
    };
    if (isMongoConnected()) {
      try {
        const saved = await Listing.findOneAndUpdate(
          { id: newListing.id },
          { $set: newListing },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        ).lean();
        if (saved && saved._id) {
          newListing._id = saved._id;
        }
      } catch (err) {
        console.error('⚠️ [ListingsService] Error persisting listing to MongoDB:', err.message);
      }
    }
    const idx = currentListings.findIndex(l => l.id === newListing.id);
    if (idx >= 0) {
      currentListings[idx] = newListing;
    } else {
      currentListings.unshift(newListing);
    }
    return newListing;
  }

  static updateStatus(id, status, extraFields = {}) {
    const listing = currentListings.find(item => item.id === id);
    if (!listing) return null;
    listing.status = status;
    Object.assign(listing, extraFields);
    listing.updatedAt = new Date().toISOString();
    persistListingToDB(listing);
    return listing;
  }

  static async updateStatusAsync(id, status, extraFields = {}) {
    let listing = await this.getByIdAsync(id);
    if (!listing) return null;
    listing.status = status;
    Object.assign(listing, extraFields);
    listing.updatedAt = new Date().toISOString();
    if (isMongoConnected()) {
      try {
        const strId = String(id);
        const query = { $or: [{ id: strId }] };
        if (mongoose.isValidObjectId(strId)) {
          query.$or.push({ _id: strId });
        }
        await Listing.updateOne(query, { $set: listing });
      } catch (err) {
        console.error('⚠️ [ListingsService] Error updating listing status in MongoDB:', err.message);
      }
    }
    const idx = currentListings.findIndex(l => l.id === listing.id);
    if (idx >= 0) currentListings[idx] = listing;
    return listing;
  }

  static update(id, data) {
    const strId = String(id);
    let listing = currentListings.find(item => item.id === strId || String(item._id) === strId);
    if (!listing) return null;
    Object.assign(listing, data);
    listing.updatedAt = new Date().toISOString();
    persistListingToDB(listing);
    return listing;
  }

  static delete(id) {
    const index = currentListings.findIndex(item => item.id === id);
    if (index === -1) return false;
    currentListings.splice(index, 1);
    if (isMongoConnected()) {
      Listing.deleteOne({ id }).catch(err => {
        console.error('⚠️ [ListingsService] Error deleting listing from MongoDB:', err.message);
      });
    }
    return true;
  }
}
