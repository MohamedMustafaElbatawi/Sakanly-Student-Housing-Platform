// Google OAuth helper utilities for Desktop (GIS Popup) & Mobile (OAuth2 Redirect)

const GOOGLE_OAUTH_STATE_KEY = 'sakanly_google_oauth_state';
const REDIRECT_CALLBACK_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cache parsed callback by raw hash so React StrictMode double-effects do not lose or re-consume state
let cachedHashKey = null;
let cachedCallbackResult = null;

export const isMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches &&
    window.innerWidth <= 1024;
  return Boolean(isMobileUA || isIPadOS || isCoarsePointer);
};

const generateRandomToken = () => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getGoogleRedirectUri = () => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/login`;
};

export const startGoogleRedirectLogin = ({ clientId, redirectTarget = '' } = {}) => {
  if (!clientId || typeof window === 'undefined') return;

  const state = generateRandomToken();
  const nonce = generateRandomToken();
  const searchRedirect = new URLSearchParams(window.location.search).get('redirect') || '';
  const resolvedRedirectTarget = redirectTarget || searchRedirect;

  try {
    sessionStorage.setItem(
      GOOGLE_OAUTH_STATE_KEY,
      JSON.stringify({
        state,
        nonce,
        redirectTarget: resolvedRedirectTarget,
        createdAt: Date.now(),
      })
    );
  } catch {
    // Continue even if sessionStorage is restricted; nonce/state check will report safely
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    state,
    prompt: 'select_account',
  });

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

export const consumeGoogleRedirectCallback = () => {
  if (typeof window === 'undefined') return null;

  const rawHash = window.location.hash || '';
  if (!rawHash) return null;

  if (cachedHashKey === rawHash) {
    return cachedCallbackResult;
  }

  const hashParams = new URLSearchParams(rawHash.startsWith('#') ? rawHash.slice(1) : rawHash);
  const idToken = hashParams.get('id_token');
  const oauthError = hashParams.get('error');
  const returnedState = hashParams.get('state');

  if (!idToken && !oauthError) {
    return null;
  }

  // Strip OAuth tokens/params from URL immediately so credentials never stay in browser history
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  } catch {
    // ignore
  }

  let stored = null;
  try {
    const rawStored = sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    if (rawStored) {
      stored = JSON.parse(rawStored);
    }
    sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
  } catch {
    stored = null;
  }

  let result;
  if (oauthError) {
    result = {
      error:
        oauthError === 'access_denied'
          ? 'تم إلغاء تسجيل الدخول عبر Google.'
          : 'تعذر إتمام تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.',
      redirectTarget: stored?.redirectTarget || '',
    };
  } else if (!stored || !stored.state || stored.state !== returnedState) {
    result = {
      error: 'تعذر التحقق من أمان جلسة Google (انتهت الصلاحية أو تعذر التحقق). يرجى المحاولة مرة أخرى.',
      redirectTarget: '',
    };
  } else if (stored.createdAt && Date.now() - stored.createdAt > REDIRECT_CALLBACK_TTL_MS) {
    result = {
      error: 'انتهت صلاحية طلب تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.',
      redirectTarget: stored.redirectTarget || '',
    };
  } else {
    const payload = decodeJwtPayload(idToken);
    if (!payload || (stored.nonce && payload.nonce !== stored.nonce)) {
      result = {
        error: 'فشل التحقق من رمز Google ID. يرجى المحاولة مرة أخرى.',
        redirectTarget: stored.redirectTarget || '',
      };
    } else {
      result = {
        idToken,
        nonce: stored.nonce,
        redirectTarget: stored.redirectTarget || '',
      };
    }
  }

  cachedHashKey = rawHash;
  cachedCallbackResult = result;
  return result;
};

