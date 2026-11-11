import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  BedDouble, 
  ChevronLeft, 
  Sparkles,
  ArrowRight,
  Info,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton.jsx';
import { consumeGoogleRedirectCallback } from '../utils/googleOAuth.js';
import sakanlyLogo from '../assets/sakanly-logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, login, loginWithGoogle } = useAuth();
  const { adminLogin, isAdminAuthenticated } = useAdminAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || location.state?.from;
  const isOwnerRedirect = redirectTarget?.includes('owner');

  // SEO Document Title
  useEffect(() => {
    document.title = 'تسجيل الدخول | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  // Input states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Async submission states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');

  // 1. If already authenticated and visits /login, redirect automatically based on verified backend role
  useEffect(() => {
    // If super admin
    if (isAdminAuthenticated || user?.role === 'super_admin') {
      navigate('/control-center', { replace: true });
      return;
    }
    // If ordinary user/student or owner
    if (user && token) {
      if (user.role === 'owner') {
        navigate(redirectTarget || '/owner-dashboard', { replace: true });
      } else {
        navigate(redirectTarget && !redirectTarget.includes('owner') ? redirectTarget : '/browse', { replace: true });
      }
    }
  }, [user, token, isAdminAuthenticated, redirectTarget, navigate]);

  // Validate fields on the fly after first submission attempt
  const validateInputs = (idVal, pwdVal) => {
    let isValid = true;
    const cleanId = (idVal !== undefined ? idVal : identifier).trim();
    const cleanPwd = (pwdVal !== undefined ? pwdVal : password);

    if (!cleanId) {
      setIdentifierError('يرجى إدخال رقم الموبايل أو البريد الإلكتروني.');
      isValid = false;
    } else if (cleanId.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanId)) {
        setIdentifierError('يرجى إدخال بريد إلكتروني صالح (مثال: student@example.com).');
        isValid = false;
      } else {
        setIdentifierError('');
      }
    } else {
      // Validate phone number
      const phoneDigits = cleanId.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setIdentifierError('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً.');
        isValid = false;
      } else {
        setIdentifierError('');
      }
    }

    if (!cleanPwd) {
      setPasswordError('يرجى إدخال كلمة السر.');
      isValid = false;
    } else if (cleanPwd.length < 6) {
      setPasswordError('يجب ألا تقل كلمة السر عن 6 أحرف أو أرقام.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleIdentifierChange = (val) => {
    setIdentifier(val);
    if (formSubmitted) {
      validateInputs(val, password);
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (formSubmitted) {
      validateInputs(identifier, val);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    setFormSubmitted(true);
    setError('');
    setSuccessMessage('');

    if (!validateInputs()) {
      return;
    }

    setLoading(true);

    try {
      const cleanId = identifier.trim();
      const isEmail = cleanId.includes('@');
      const credentials = isEmail
        ? { email: cleanId.toLowerCase(), password }
        : { phone: cleanId, password };

      const res = await login(credentials);
      const verifiedRole = res.user?.role;

      // 1. Super Admin: Route to /control-center
      if (verifiedRole === 'super_admin') {
        if (adminLogin && res.token) {
          adminLogin(res.token, res.user);
        }
        setSuccessMessage('مرحباً بك يا صاحب المنصة! جارٍ التوجيه إلى مركز التحكم...');
        setTimeout(() => {
          navigate('/control-center', { replace: true });
        }, 500);
        return;
      }

      setSuccessMessage('تم تسجيل الدخول بنجاح! مرحباً بك في سكنلي.');

      // 2. Owner: Route to /owner-dashboard
      // 3. User / Student: Route to home or browse or redirect destination
      const targetPath = verifiedRole === 'owner'
        ? (redirectTarget || '/owner-dashboard')
        : (redirectTarget && !redirectTarget.includes('owner') ? redirectTarget : '/browse');

      setTimeout(() => {
        navigate(targetPath);
      }, 750);
    } catch (err) {
      setError(err.message || 'بيانات الدخول غير صحيحة. يرجى التأكد وإعادة المحاولة.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential, nonce = null, overrideRedirectTarget = null) => {
    if (loading) return;
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await loginWithGoogle(credential, nonce);
      const verifiedRole = res.user?.role;
      const effectiveRedirectTarget = overrideRedirectTarget || redirectTarget;

      // 1. Super Admin: Route to /control-center
      if (verifiedRole === 'super_admin') {
        if (adminLogin && res.token) {
          adminLogin(res.token, res.user);
        }
        setSuccessMessage('مرحباً بك يا صاحب المنصة! جارٍ التوجيه إلى مركز التحكم...');
        setTimeout(() => {
          navigate('/control-center', { replace: true });
        }, 500);
        return;
      }

      setSuccessMessage(res.message || 'تم تسجيل الدخول بحساب Google بنجاح!');

      const targetPath = verifiedRole === 'owner'
        ? (effectiveRedirectTarget || '/owner-dashboard')
        : (effectiveRedirectTarget && !effectiveRedirectTarget.includes('owner') ? effectiveRedirectTarget : '/browse');

      setTimeout(() => {
        navigate(targetPath, { replace: true });
      }, 750);
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول عبر Google.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Google OAuth Redirect Flow callback (mobile browsers / fallback)
  const handledGoogleRedirectRef = useRef(false);
  useEffect(() => {
    if (handledGoogleRedirectRef.current) return;
    const callbackResult = consumeGoogleRedirectCallback();
    if (!callbackResult) return;

    handledGoogleRedirectRef.current = true;
    if (callbackResult.error) {
      setError(callbackResult.error);
      return;
    }

    if (callbackResult.idToken) {
      handleGoogleSuccess(
        callbackResult.idToken,
        callbackResult.nonce,
        callbackResult.redirectTarget || null
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] font-cairo overflow-x-hidden w-full max-w-full" dir="rtl">
      
      {/* ========================================================
          RIGHT SECTION: BRAND SHOWCASE (50% Desktop)
          Background: Deep Petrol #0B3D3A
         ======================================================== */}
      <section 
        aria-label="واجهة هوية سكنلي"
        className="w-full lg:w-1/2 bg-[#0B3D3A] text-white px-4 sm:px-10 lg:px-12 pt-6 sm:pt-8 lg:pt-8 pb-6 sm:pb-8 flex flex-col justify-between relative overflow-hidden shrink-0"
      >
        {/* Subtle Ambient Background Gradients (positioned to keep top-right logo background perfectly pure #0B3D3A) */}
        <div className="absolute top-1/2 -right-36 w-96 h-96 bg-[#0F766E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Official Sakanly Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center group" aria-label="سكنلي Sakanly - الصفحة الرئيسية">
            <img
              src={sakanlyLogo}
              alt="سكنلي Sakanly"
              className="w-[165px] sm:w-[185px] lg:w-[195px] h-auto object-contain group-hover:opacity-95 transition-all"
            />
          </Link>

          <Link
            to="/browse"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-teal-200 hover:text-white bg-white/10 hover:bg-white/15 py-1.5 px-3 rounded-xl transition-colors backdrop-blur-xs"
          >
            <span>استعراض السكن</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Center: Hero Value Proposition */}
        <div className="relative z-10 my-4 sm:my-6 lg:my-auto py-2 sm:py-4 space-y-4 lg:space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/60 border border-teal-500/30 text-teal-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>بدون سماسرة وبدون عمولات خفية</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            أهلاً بيك في بيتك الثاني.
          </h1>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed">
            حساب واحد للبحث والحفظ والمراسلة وطلب المعاينة.
          </p>

          {/* Feature Showcase Cards (Static Display Elements) */}
          <div className="hidden sm:grid pt-2 grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div
              className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5 cursor-default select-none"
            >
              <Building2 className="w-5 h-5 text-teal-300" />
              <span className="text-xs font-bold text-white">تصفح العقارات</span>
              <span className="text-[11px] text-slate-300">شقق وغرف مستقلة</span>
            </div>

            <div
              className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5 cursor-default select-none"
            >
              <BedDouble className="w-5 h-5 text-teal-300" />
              <span className="text-xs font-bold text-white">الأسرّة الفردية</span>
              <span className="text-[11px] text-slate-300">سكن طلابي اقتصادي</span>
            </div>

            <div
              className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5 cursor-default select-none"
            >
              <ShieldCheck className="w-5 h-5 text-teal-300" />
              <span className="text-xs font-bold text-white">توثيق المالك</span>
              <span className="text-[11px] text-slate-300">اعتماد الهوية والملكية</span>
            </div>
          </div>
        </div>

        {/* Bottom Note (Desktop & Tablet) */}
        <div className="hidden sm:flex relative z-10 pt-4 border-t border-teal-900/40 items-center justify-between text-xs text-teal-300/80">
          <span className="text-[11px] text-teal-200/90 font-medium">
            منصة سكن الطلاب الأولى في مصر
          </span>

          <span className="text-[11px] text-slate-400">
            جميع الحقوق محفوظة © {new Date().getFullYear()} سكنلي
          </span>
        </div>
      </section>

      {/* ========================================================
          LEFT SECTION: LOGIN FORM (50% Desktop)
          Background: #F8FAFC, Card Surface: White
         ======================================================== */}
      <section 
        aria-label="نموذج تسجيل الدخول"
        className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6 lg:py-6 lg:px-8 overflow-hidden"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 lg:p-7 shadow-card space-y-4 sm:space-y-4.5">
          
          {/* 1. Header Tabs: [تسجيل الدخول] / [حساب جديد] */}
          <div className="flex items-center border-b border-slate-100 pb-2">
            <div className="flex-1 text-center py-2 text-sm font-bold text-[#0F766E] border-b-2 border-[#0F766E] cursor-default transition-all">
              تسجيل الدخول
            </div>
            <Link
              to={`/register${location.search}`}
              className="flex-1 text-center py-2 text-sm font-semibold text-slate-400 hover:text-slate-700 hover:border-b-2 hover:border-slate-300 transition-all"
            >
              حساب جديد
            </Link>
          </div>

          {/* 2. Main Title */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
              ادخل على حسابك
            </h2>
            <p className="text-xs text-slate-500">
              أدخل رقم هاتفك أو بريدك الإلكتروني للمتابعة في منصة سكنلي.
            </p>
          </div>

          {/* Owner Redirect Notice if user was redirected from protected owner action */}
          {isOwnerRedirect && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-[#0F766E] rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
              <ShieldCheck className="w-5 h-5 shrink-0 text-[#0F766E]" />
              <div className="leading-relaxed">
                هذه الصفحة تتطلب تسجيل الدخول بحساب <strong>مالك عقار</strong> معتمد.
              </div>
            </div>
          )}

          {/* Guest Action Login Notice if redirected from protected student/guest action */}
          {location.state?.message && !isOwnerRedirect && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <div className="leading-relaxed">
                {location.state.message}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              role="status"
              className="p-3.5 bg-emerald-50 text-emerald-800 text-xs sm:text-[13px] rounded-xl border border-emerald-200 flex items-center gap-2.5 animate-fade-in font-medium"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Global Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 text-[#EF4444] text-xs sm:text-[13px] rounded-xl border border-rose-200 flex items-start gap-2.5 animate-fade-in font-medium"
            >
              <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* 3. Credentials Login Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4">
            
            {/* Phone or Email Field */}
            <div>
              <label 
                htmlFor="login-identifier" 
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                رقم الموبايل أو البريد الإلكتروني
              </label>
              <div className="relative">
                {identifier.includes('@') ? (
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                )}
                <input
                  id="login-identifier"
                  type="text"
                  disabled={loading}
                  placeholder="010XXXXXXXX أو student@sakanly.com"
                  dir="ltr"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className={`w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border rounded-xl outline-none text-right transition-all font-medium ${
                    identifierError 
                      ? 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] bg-rose-50/20' 
                      : 'border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                  } disabled:bg-slate-50 disabled:cursor-not-allowed`}
                />
              </div>
              {identifierError && (
                <p className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{identifierError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label 
                  htmlFor="login-password" 
                  className="text-xs font-bold text-slate-700"
                >
                  كلمة السر
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-[#0F766E] hover:underline font-semibold transition-colors"
                >
                  نسيت كلمة السر؟
                </Link>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  disabled={loading}
                  placeholder="••••••••"
                  dir="ltr"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full pr-10 pl-10 py-2.5 text-xs sm:text-sm bg-white border rounded-xl outline-none text-right transition-all font-medium ${
                    passwordError 
                      ? 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] bg-rose-50/20' 
                      : 'border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                  } disabled:bg-slate-50 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg focus:outline-none"
                  aria-label={showPassword ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordError && (
                <p className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 animate-fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            {/* Primary Submit Button: دخول */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11 sm:h-12 px-4 bg-[#0F766E] hover:bg-[#0B3D3A] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1 sm:mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جارٍ تسجيل الدخول...</span>
                </span>
              ) : (
                <span>دخول</span>
              )}
            </button>
          </form>

          {/* 4. Visual Divider: أو */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-[#E2E8F0] w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 font-medium shrink-0">
              أو
            </span>
          </div>

          {/* 5. Google OAuth Login Button */}
          <div>
            <GoogleAuthButton
              text="المتابعة باستخدام Google"
              redirectTarget={redirectTarget || ''}
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
              disabled={loading}
            />
          </div>

          {/* Security & Encryption Tag */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال محمي ومشفر بالكامل عبر بروتوكول HTTPS</span>
          </div>

        </div>
      </section>

    </div>
  );
};
