import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../services/api.js';

const AdminAuthContext = createContext(null);

const ADMIN_TOKEN_KEY = 'sakanly_super_admin_token';
const ADMIN_USER_KEY = 'sakanly_super_admin_user';

export const AdminAuthProvider = ({ children }) => {
  const getInitial = () => {
    try {
      const sessToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
      const sessUser = sessionStorage.getItem(ADMIN_USER_KEY);
      if (sessToken && sessUser) {
        const parsed = JSON.parse(sessUser);
        if (parsed?.role === 'super_admin') return { token: sessToken, user: parsed };
      }
      const localToken = localStorage.getItem('sakanly_token');
      const localUser = localStorage.getItem('sakanly_user');
      if (localToken && localUser) {
        const parsed = JSON.parse(localUser);
        if (parsed?.role === 'super_admin') {
          sessionStorage.setItem(ADMIN_TOKEN_KEY, localToken);
          sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(parsed));
          return { token: localToken, user: parsed };
        }
      }
    } catch {
      // ignore
    }
    return { token: null, user: null };
  };

  const initial = getInitial();
  const [adminToken, setAdminToken] = useState(initial.token);
  const [adminUser, setAdminUser] = useState(initial.user);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    Boolean(initial.token && initial.user?.role === 'super_admin')
  );

  // Sync if storage changes
  useEffect(() => {
    const checkSync = () => {
      try {
        const sessToken = sessionStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem('sakanly_token');
        const sessUser = sessionStorage.getItem(ADMIN_USER_KEY) || localStorage.getItem('sakanly_user');
        if (sessToken && sessUser) {
          const parsed = JSON.parse(sessUser);
          if (parsed?.role === 'super_admin') {
            setAdminToken(sessToken);
            setAdminUser(parsed);
            setIsAdminAuthenticated(true);
            return;
          }
        }
      } catch {
        // ignore
      }
    };
    checkSync();
    window.addEventListener('storage', checkSync);
    return () => window.removeEventListener('storage', checkSync);
  }, []);

  const adminLogin = useCallback((token, user) => {
    if (user?.role !== 'super_admin') {
      throw new Error('غير مصرح: هذا الحساب ليس لديه صلاحيات Super Admin.');
    }
    try {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Could not save admin session to sessionStorage:', e);
    }
    setAdminToken(token);
    setAdminUser(user);
    setIsAdminAuthenticated(true);
  }, []);

  const adminLogout = useCallback(() => {
    authApi.logout().catch(() => {});
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_USER_KEY);
      const localUser = localStorage.getItem('sakanly_user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        if (parsed?.role === 'super_admin') {
          localStorage.removeItem('sakanly_token');
          localStorage.removeItem('sakanly_user');
        }
      }
    } catch (e) {
      console.warn('Could not clear admin session:', e);
    }
    setAdminToken(null);
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isAdminAuthenticated,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

