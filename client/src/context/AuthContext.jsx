import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sakanly_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('sakanly_token') || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem('sakanly_token', token);
      } else {
        localStorage.removeItem('sakanly_token');
      }

      if (user) {
        localStorage.setItem('sakanly_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('sakanly_user');
      }
    } catch (err) {
      console.warn('LocalStorage access warning in AuthContext:', err);
    }
  }, [token, user]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.data) {
        const receivedToken = response.data.token;
        const receivedUser = response.data.user;
        setToken(receivedToken);
        setUser(receivedUser);

        // Synchronize Super Admin session if the authenticated account is super_admin
        if (receivedUser?.role === 'super_admin') {
          try {
            sessionStorage.setItem('sakanly_super_admin_token', receivedToken);
            sessionStorage.setItem('sakanly_super_admin_user', JSON.stringify(receivedUser));
          } catch {
            // ignore
          }
        }

        return { success: true, user: receivedUser, token: receivedToken };
      }
      throw new Error(response.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data) {
        setToken(response.data.token);
        setUser(response.data.user);
        return { success: true, user: response.data.user, message: response.message };
      }
      throw new Error(response.message || 'فشل إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth(credential);
      if (response.success && response.data) {
        const receivedToken = response.data.token;
        const receivedUser = response.data.user;
        setToken(receivedToken);
        setUser(receivedUser);

        if (receivedUser?.role === 'super_admin') {
          try {
            sessionStorage.setItem('sakanly_super_admin_token', receivedToken);
            sessionStorage.setItem('sakanly_super_admin_user', JSON.stringify(receivedUser));
          } catch {
            // ignore
          }
        }

        return { success: true, user: receivedUser, token: receivedToken, message: response.message };
      }
      throw new Error(response.message || 'فشل تسجيل الدخول باستخدام Google');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('sakanly_token');
      localStorage.removeItem('sakanly_user');
      localStorage.removeItem('sakanly_favorites');
      sessionStorage.removeItem('sakanly_super_admin_token');
      sessionStorage.removeItem('sakanly_super_admin_user');
      sessionStorage.clear();
    } catch {
      // ignore
    }
  };


  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('sakanly_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
