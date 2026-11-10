import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * ProtectedRoute component: Ensures route is only accessible to authenticated users.
 * If user is unauthenticated (guest), redirects smoothly to /login with state.from and optional message.
 */
export const ProtectedRoute = ({
  children,
  allowedRoles,
  message = 'سجّل دخولك للاستفادة من هذه الخدمة والمتابعة.',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-sakanly-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(returnUrl)}`}
        state={{
          from: returnUrl,
          message,
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
