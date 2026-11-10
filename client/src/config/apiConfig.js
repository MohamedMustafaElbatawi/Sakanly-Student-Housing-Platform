// Sakanly Centralized API Configuration
// Clean separation of Development (Vite proxy / localhost) and Production

const resolveApiBaseUrl = () => {
  // If explicitly provided via environment variable (e.g. from .env or deployment platform):
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    // If it's a relative path like '/api/v1' or '/api':
    if (clean.startsWith('/')) {
      if (clean === '/api') return '/api/v1';
      return clean;
    }
    // If it's a full URL (e.g. https://sakanly-backend.vercel.app):
    if (!clean.endsWith('/api/v1')) {
      if (clean.endsWith('/api')) {
        return `${clean}/v1`;
      }
      return `${clean}/api/v1`;
    }
    return clean;
  }

  // Fallback default:
  // In local Vite dev or reverse-proxy production, relative '/api/v1' routes through Vite's dev proxy
  // avoiding CORS, ERR_CONNECTION_REFUSED, and IPv4/IPv6 localhost vs 127.0.0.1 mismatch.
  return '/api/v1';
};

const resolveSocketUrl = () => {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && typeof envSocket === 'string' && envSocket.trim()) {
    return envSocket.trim().replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_BASE_URL;
  if (envApi && typeof envApi === 'string' && envApi.includes('://')) {
    return envApi.replace(/\/api(\/v1)?\/?$/, '').replace(/\/+$/, '');
  }

  // Fallback to current browser window origin for socket.io client
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

export const API_BASE_URL = resolveApiBaseUrl();
export const SOCKET_SERVER_URL = resolveSocketUrl();

export default {
  API_BASE_URL,
  SOCKET_SERVER_URL,
};

