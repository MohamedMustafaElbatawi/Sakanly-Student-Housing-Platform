import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { isMobileDevice, startGoogleRedirectLogin } from '../../utils/googleOAuth.js';

export const GoogleAuthButton = ({
  onSuccess,
  onError,
  disabled = false,
  text = 'المتابعة باستخدام Google',
  redirectTarget = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [gsiRendered, setGsiRendered] = useState(false);
  const wrapperRef = useRef(null);
  const googleBtnContainerRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const useRedirectFlow = isMobileDevice();

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  const handleGoogleCredentialResponse = async (response) => {
    if (response?.credential) {
      setLoading(true);
      try {
        await onSuccessRef.current(response.credential);
      } catch (err) {
        if (onErrorRef.current) {
          onErrorRef.current(err.message || 'فشل إتمام تسجيل الدخول عبر Google');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // On mobile browsers / WebViews, skip GIS popup iframe and use direct full-page Redirect Flow
    if (!googleClientId || useRedirectFlow) return;

    let checkInterval = null;
    let isCancelled = false;

    const initializeGsi = () => {
      if (isCancelled) return;
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            ux_mode: 'popup',
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render official Google Identity Services button using visible wrapper width
          const containerW =
            wrapperRef.current?.offsetWidth ||
            googleBtnContainerRef.current?.offsetWidth ||
            280;
          const computedWidth = Math.max(220, Math.min(containerW, 360));

          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: computedWidth,
            locale: 'ar',
          });

          setGsiRendered(true);

          if (checkInterval) clearInterval(checkInterval);
        } catch (err) {
          console.warn('Google Identity initialization error:', err);
        }
      }
    };

    const gsiScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');

    if (window.google?.accounts?.id) {
      initializeGsi();
    } else {
      if (gsiScript) {
        gsiScript.addEventListener('load', initializeGsi);
      }
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id) {
          initializeGsi();
        } else if (attempts > 50) {
          clearInterval(checkInterval);
        }
      }, 200);
    }

    return () => {
      isCancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      if (gsiScript) {
        gsiScript.removeEventListener('load', initializeGsi);
      }
    };
  }, [googleClientId, useRedirectFlow]);

  // Click handler for Mobile Redirect Flow, Desktop fallback, and Dev Demo Mode
  const handleClick = async () => {
    if (disabled || loading) return;

    // 1. Mobile (or when GIS script is unavailable while Client ID is configured):
    // Trigger full-page OAuth redirect synchronously from user interaction
    if (googleClientId && (useRedirectFlow || !window.google?.accounts?.id)) {
      setLoading(true);
      startGoogleRedirectLogin({
        clientId: googleClientId,
        redirectTarget,
      });
      return;
    }

    // 2. Desktop fallback when GIS is loaded but official iframe isn't rendered
    if (googleClientId && window.google?.accounts?.id) {
      setLoading(true);
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fall back cleanly to redirect instead of silently doing nothing
            startGoogleRedirectLogin({
              clientId: googleClientId,
              redirectTarget,
            });
          }
        });
      } catch {
        startGoogleRedirectLogin({
          clientId: googleClientId,
          redirectTarget,
        });
      }
      return;
    }

    // 3. Development / Demo Mode when VITE_GOOGLE_CLIENT_ID is not configured
    setLoading(true);
    try {
      const demoStudentEmail = 'student.google@university.edu.eg';
      const demoGooglePayload = {
        iss: 'https://accounts.google.com',
        sub: '109876543210987654321',
        email: demoStudentEmail,
        email_verified: true,
        name: 'مريم السيد (طالبة عبر Google)',
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        given_name: 'مريم',
        family_name: 'السيد',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(demoGooglePayload))));
      const simulatedGoogleCredential = `eyJhbGciOiJSUzI1NiIsImtpZCI6ImRlbW8ifQ.${b64Payload}.simulated_signature_for_dev`;

      await onSuccessRef.current(simulatedGoogleCredential);
    } catch (err) {
      if (onErrorRef.current) {
        onErrorRef.current(err.message || 'حدث خطأ أثناء الاتصال بحساب Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="w-full relative">
      {/* On Desktop with Client ID configured, render the official GIS popup button */}
      {googleClientId && !useRedirectFlow && (
        <div
          ref={googleBtnContainerRef}
          className={`w-full flex justify-center items-center min-h-[44px] ${
            gsiRendered ? 'opacity-100 relative' : 'opacity-0 pointer-events-none absolute inset-x-0 top-0'
          }`}
          style={{ width: '100%' }}
        />
      )}

      {/* Render custom styled Google button on Mobile (Redirect Flow), while GIS loads, or in Demo Mode */}
      {(useRedirectFlow || !googleClientId || !gsiRendered) && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || loading}
          aria-busy={loading}
          className="w-full relative flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] hover:border-slate-300 rounded-2xl font-cairo font-bold text-xs sm:text-sm shadow-2xs hover:shadow-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{loading ? 'جارٍ الاتصال بـ Google...' : text}</span>
        </button>
      )}
    </div>
  );
};
