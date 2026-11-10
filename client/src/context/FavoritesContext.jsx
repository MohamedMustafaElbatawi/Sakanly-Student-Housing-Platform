import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { mockProperties } from '../data/mockProperties.js';
import { useAuth } from './AuthContext.jsx';
import { favoritesApi } from '../services/api.js';

const FavoritesContext = createContext(undefined);

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, user, token } = useAuth();

  // Strictly user-isolated initial state; NEVER load from a global shared key
  const [favorites, setFavorites] = useState(() => {
    try {
      if (user?.id) {
        const saved = localStorage.getItem(`sakanly_favorites_${user.id}`);
        return saved ? JSON.parse(saved) : [];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Purge any legacy shared key if it exists in client storage
  useEffect(() => {
    try {
      localStorage.removeItem('sakanly_favorites');
    } catch {
      // ignore
    }
  }, []);

  // Fetch fresh favorites from Backend whenever authenticated user changes
  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated || !user?.id) {
      setFavorites([]);
      return;
    }

    // 1. Load user-isolated cache first
    try {
      const userSaved = localStorage.getItem(`sakanly_favorites_${user.id}`);
      if (userSaved && isMounted) {
        setFavorites(JSON.parse(userSaved));
      }
    } catch {
      // ignore
    }

    // 2. Fetch authoritative favorites from Backend API
    const loadBackendFavorites = async () => {
      try {
        const activeToken = token || localStorage.getItem('sakanly_token');
        const res = await favoritesApi.getFavorites(activeToken);
        if (isMounted && Array.isArray(res.favorites)) {
          setFavorites(res.favorites);
          localStorage.setItem(`sakanly_favorites_${user.id}`, JSON.stringify(res.favorites));
        }
      } catch {
        // Fallback to local user cache
      }
    };

    loadBackendFavorites();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, token]);

  // Persist strictly to user-specific localStorage key
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      try {
        localStorage.setItem(`sakanly_favorites_${user.id}`, JSON.stringify(favorites));
      } catch {
        // Ignore storage errors
      }
    }
  }, [favorites, isAuthenticated, user?.id]);

  const toggleFavorite = useCallback(async (id) => {
    if (!isAuthenticated || !user?.id || !id) return false;

    const strId = String(id);
    const isCurrentlyFav = favorites.includes(strId);
    const nextFavorites = isCurrentlyFav
      ? favorites.filter(item => item !== strId)
      : [...favorites, strId];

    // Optimistic UI update
    setFavorites(nextFavorites);
    try {
      localStorage.setItem(`sakanly_favorites_${user.id}`, JSON.stringify(nextFavorites));
    } catch {
      // ignore
    }

    // Sync with Backend
    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      if (isCurrentlyFav) {
        await favoritesApi.removeFavorite(strId, activeToken);
      } else {
        await favoritesApi.addFavorite(strId, activeToken);
      }
    } catch (err) {
      console.warn('[Favorites] Failed to sync with backend:', err);
    }

    return true;
  }, [favorites, isAuthenticated, user?.id, token]);

  const isFavorite = useCallback((id, mongoId) => {
    if (!isAuthenticated || !id) return false;
    const strId = String(id);
    return Boolean(
      favorites.includes(strId) ||
      (mongoId && favorites.includes(String(mongoId)))
    );
  }, [isAuthenticated, favorites]);

  const getFavoriteProperties = useCallback(() => {
    if (!isAuthenticated) return [];
    return mockProperties.filter(p => favorites.includes(p.id));
  }, [isAuthenticated, favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, getFavoriteProperties }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
