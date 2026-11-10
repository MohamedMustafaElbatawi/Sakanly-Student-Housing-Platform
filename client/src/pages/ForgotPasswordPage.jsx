import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { authApi } from '../services/api.js';
import sakanlyLogo from '../assets/sakanly-logo.png';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [inputError, setInputError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleOnlyInfo, setGoogleOnlyInfo] = useState(null);

  // Validate phone input
  const validatePhone = (val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      setInputError('يرجى إدخال رقم الموبايل.');
      return false;
    }
    if (clean.length !== 11 || !clean.startsWith('01')) {
      setInputError('يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً (مثال: 01012345678).');
      return false;
    }
    setInputError('');
    return true;
  };

  // Validate email input
  const validateEmail = (val) => {
    const clean = val.trim();
    if (!clean) {
      setInputError('يرجى إدخال البريد الإلكتروني.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setInputError('يرجى إدخال بريد إلكتروني صالح (مثال: student@example.com).');
      return false;
    }
    setInputError('');
    return true;
  };

  const handlePhoneChange = (val) => {
    setPhone(val);
    setError('');
    setGoogleOnlyInfo(null);
    if (inputError) validatePhone(val);
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    setError('');
    setGoogleOnlyInfo(null);
    if (inputError) validateEmail(val);
  };

  const switchMethod = (newMethod) => {
    setMethod(newMethod);
    setInputError('');
    setError('');
    setGoogleOnlyInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGoogleOnlyInfo(null);

    const isEmail = method === 'email';
    const isValid = isEmail ? validateEmail(email) : validatePhone(phone);
    if (!isValid) return;

    setLoading(true);
    const identifier = isEmail ? email.trim().toLowerCase() : phone.replace(/\D/g, '');

    try {
      const res = await authApi.forgotPassword({
        identifier,
        method,
        phone: !isEmail ? identifier : undefined,
        email: isEmail ? identifier : undefined,
      });

      // Navigate to OTP verification step
      navigate('/verify-reset-otp', {
        state: {
          identifier,
          method,
          phone: !isEmail ? identifier : '',
          email: isEmail ? identifier : '',
          cooldownSeconds: res.cooldownSeconds || 60,
          message: res.message || (isEmail
            ? 'تم إرسال رمز التحقق ورابط الاستعادة إلى بريدك الإلكتروني.'
            : 'تم إرسال رمز التحقق إلى هاتفك المحمول.'),
        },
      });
    } catch (err) {
      // Check if account is a Google-only user
      if (err.isGoogleOnly || err.response?.data?.isGoogleOnly) {
        setGoogleOnlyInfo({
          email: isEmail ? identifier : '',
          message: err.message || 'هذا الحساب مسجل باستخدام Google ولا يحتوي على كلمة مرور محلية. يمكنك تسجيل الدخول مباشرة بضغطة زر عبر حساب Google دون الحاجة لكلمة مرور.',
        });
      } else {
        setError(err.message || 'حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC] font-cairo" dir="rtl">
      
      {/* Right Column: Brand Showcase */}
      <section 
        aria-label="هوية سكنلي"
        className="w-full lg:w-1/2 bg-[#0B3D3A] text-white px-6 sm:px-10 lg:px-12 pt-6 sm:pt-8 lg:pt-8 pb-6 sm:pb-8 flex flex-col justify-between relative overflow-hidden shrink-0"
      >
        <div className="absolute top-1/2 -right-36 w-96 h-96 bg-[#0F766E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center group" aria-label="سكنلي Sakanly - الصفحة الرئيسية">
            <img
              src={sakanlyLogo}
              alt="سكنلي Sakanly"
              className="w-[160px] sm:w-[180px] lg:w-[190px] h-auto object-contain hover:opacity-95 transition-opacity select-none"
            />
          </Link>

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-teal-200 hover:text-white bg-white/10 hover:bg-white/15 py-1.5 px-3 rounded-xl transition-colors backdrop-blur-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لتسجيل الدخول</span>
          </Link>
        </div>

        {/* Center: Value Proposition */}
        <div className="relative z-10 my-4 sm:my-6 lg:my-auto py-2 sm:py-4 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/60 border border-teal-500/30 text-teal-200 text-xs font-semibold backdrop-blur-xs">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>استعادة آمنة ومحمية للحساب</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            لا تقلق، استعادة حسابك في سكنلي سريعة ومحمية.
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            يمكنك الآن استعادة حسابك بسهولة سواءً عبر إرسال رمز تحقق برسالة نصية SMS إلى رقم هاتفك المحمول، أو عبر رابط ورمز تأكيد إلى بريدك الإلكتروني المسجل.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-teal-200/90 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              تشفير كامل للبيانات
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-teal-400" />
              رسائل SMS سريعة
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-teal-400" />
              روابط بريد آمنة
            </span>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="hidden sm:flex relative z-10 pt-4 border-t border-teal-900/40 items-center justify-between text-xs text-teal-300/80">
          <span className="text-[11px] text-teal-200/90 font-medium">
            منصة سكن الطلاب الأولى في مصر
          </span>
          <span className="text-[11px] text-slate-400">
            جميع الحقوق محفوظة © {new Date().getFullYear()} سكنلي
          </span>
        </div>
      </section>

      {/* Left Column: Form Card */}
      <section 
        aria-label="نموذج استعادة كلمة المرور"
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:py-6 lg:px-8"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-card space-y-5">
          
          {/* Header Title */}
          <div className="space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
              نسيت كلمة المرور؟
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
              اختر وسيلة الاستعادة المفضلة المرتبطة بحسابك وسنساعدك في استعادة الوصول.
            </p>
          </div>

          {/* Recovery Method Tabs */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => switchMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                method === 'phone'
                  ? 'bg-white text-sakanly-dark shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>رقم الموبايل</span>
            </button>
            <button
              type="button"
              onClick={() => switchMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                method === 'email'
                  ? 'bg-white text-sakanly-dark shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>البريد الإلكتروني</span>
            </button>
          </div>

          {/* Google-Only Account Card */}
          {googleOnlyInfo && (
            <div className="p-4 bg-sky-50 border border-sky-200 text-sky-950 rounded-2xl space-y-3 animate-fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-sky-900">حساب مسجل عبر Google</h4>
                  <p className="text-xs text-sky-800 leading-relaxed">{googleOnlyInfo.message}</p>
                </div>
              </div>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white text-sky-900 hover:bg-sky-100 border border-sky-300 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                <span>الانتقال لتسجيل الدخول بـ Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-rose-50 text-[#EF4444] text-xs sm:text-[13px] rounded-xl border border-rose-200 flex items-start gap-2.5 animate-fade-in font-medium"
            >
              <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            
            {/* Phone Input */}
            {method === 'phone' && (
              <div>
                <label 
                  htmlFor="forgot-phone" 
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  رقم الموبايل
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="forgot-phone"
                    type="tel"
                    disabled={loading}
                    placeholder="010XXXXXXXX"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border rounded-xl outline-none text-right transition-all font-medium ${
                      inputError 
                        ? 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] bg-rose-50/20' 
                        : 'border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                    } disabled:bg-slate-50 disabled:cursor-not-allowed`}
                  />
                </div>
                {inputError && (
                  <p className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inputError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Email Input */}
            {method === 'email' && (
              <div>
                <label 
                  htmlFor="forgot-email" 
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    id="forgot-email"
                    type="email"
                    disabled={loading}
                    placeholder="student@example.com"
                    dir="ltr"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border rounded-xl outline-none text-left transition-all font-medium ${
                      inputError 
                        ? 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] bg-rose-50/20' 
                        : 'border-[#E2E8F0] focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]'
                    } disabled:bg-slate-50 disabled:cursor-not-allowed`}
                  />
                </div>
                {inputError && (
                  <p className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inputError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11 sm:h-12 px-4 bg-[#0F766E] hover:bg-[#0B3D3A] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{method === 'email' ? 'جارٍ إرسال رابط ورمز التحقق...' : 'جارٍ إرسال رمز التحقق...'}</span>
                </span>
              ) : (
                <span>{method === 'email' ? 'إرسال رابط ورمز التحقق' : 'إرسال رمز التحقق'}</span>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لتسجيل الدخول</span>
            </Link>
          </div>

          {/* Security Tag */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>اتصال محمي ومشفر بالكامل عبر بروتوكول HTTPS</span>
          </div>

        </div>
      </section>

    </div>
  );
};

export default ForgotPasswordPage;
