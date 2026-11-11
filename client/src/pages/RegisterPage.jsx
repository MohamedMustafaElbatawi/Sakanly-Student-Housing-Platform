import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone,
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  Info 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton.jsx';
import sakanlyLogo from '../assets/sakanly-logo.png';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const initialRole = searchParams.get('role') === 'owner' ? 'owner' : 'student';

  const COUNTRY_CODES = [
    { code: '+20', country: 'مصر', flag: '🇪🇬' },
    { code: '+966', country: 'السعودية', flag: '🇸🇦' },
    { code: '+971', country: 'الإمارات', flag: '🇦🇪' },
    { code: '+965', country: 'الكويت', flag: '🇰🇼' },
    { code: '+962', country: 'الأردن', flag: '🇯🇴' },
    { code: '+974', country: 'قطر', flag: '🇶🇦' },
    { code: '+968', country: 'عُمان', flag: '🇴🇲' },
    { code: '+973', country: 'البحرين', flag: '🇧🇭' },
  ];

  useEffect(() => {
    document.title = 'إنشاء حساب جديد | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  const [role, setRole] = useState(initialRole);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    phoneCountryCode: '+20',
    password: '',
    confirmPassword: '',
    termsAccepted: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isOwner = role === 'owner';

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return 'يرجى إدخال الاسم بالكامل.';
    }
    if (formData.fullName.trim().length < 3) {
      return 'يجب أن يتكون الاسم من 3 أحرف على الأقل.';
    }

    if (!formData.email.trim()) {
      return 'يرجى إدخال البريد الإلكتروني.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'يرجى إدخال بريد إلكتروني صالح (مثال: user@example.com).';
    }

    // Phone validation (Mandatory for Property Owner)
    if (isOwner) {
      if (!formData.phone.trim()) {
        return 'يرجى إدخال رقم الهاتف للتواصل.';
      }
      const rawDigits = formData.phone.trim().replace(/\D/g, '');
      if (formData.phoneCountryCode === '+20') {
        const isEgyptianValid = /^01[0125]\d{8}$/.test(rawDigits) || /^1[0125]\d{8}$/.test(rawDigits);
        if (!isEgyptianValid) {
          return 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).';
        }
      } else {
        if (rawDigits.length < 8 || rawDigits.length > 15) {
          return 'يرجى إدخال رقم هاتف صالح يتكون من 8 إلى 15 رقماً.';
        }
      }
    }

    if (!formData.password) {
      return 'يرجى كتابة كلمة المرور.';
    }
    if (formData.password.length < 6) {
      return 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام.';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'كلمتا المرور غير متطابقتين. يرجى التأكد وإعادة المحاولة.';
    }

    if (!formData.termsAccepted) {
      return isOwner
        ? 'يرجى الموافقة على شروط الاستخدام وميثاق النشر والمصداقية للمتابعة.'
        : 'يرجى الموافقة على الشروط والأحكام وميثاق الأمان الطلابي للمتابعة.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Normalize Egyptian phone before sending
    let normalizedPhone = formData.phone.trim();
    if (isOwner && formData.phoneCountryCode === '+20') {
      const digits = normalizedPhone.replace(/\D/g, '');
      if (digits.startsWith('1') && digits.length === 10) {
        normalizedPhone = '0' + digits;
      } else if (digits.startsWith('20') && digits.length === 12) {
        normalizedPhone = '0' + digits.slice(2);
      } else {
        normalizedPhone = digits;
      }
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role,
        phone: isOwner ? normalizedPhone : undefined,
        phoneNumber: isOwner ? normalizedPhone : undefined,
        phoneCountryCode: isOwner ? formData.phoneCountryCode : undefined,
        termsAccepted: formData.termsAccepted,
      });

      setSuccessMessage(res.message || (isOwner ? 'تم إنشاء حساب المالك بنجاح!' : 'تم إنشاء حساب الطالب بنجاح!'));
      
      setTimeout(() => {
        if (isOwner) {
          navigate('/owner-dashboard');
        } else {
          navigate('/browse');
        }
      }, 1400);
    } catch (err) {
      setError(err.message || 'تعذر إنشاء الحساب، يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle(credential);
      setSuccessMessage(res.message || 'تم تسجيل الدخول بنجاح عبر Google!');
      setTimeout(() => {
        navigate('/browse');
      }, 1200);
    } catch (err) {
      setError(err.message || 'فشل التسجيل بحساب Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] font-cairo" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-card space-y-6">
        
        {/* Navigation Tabs: [تسجيل الدخول] / [حساب جديد] */}
        <div className="flex items-center border-b border-slate-100 pb-2">
          <Link
            to={`/login${location.search}`}
            className="flex-1 text-center py-2 text-sm font-semibold text-slate-400 hover:text-slate-700 hover:border-b-2 hover:border-slate-300 transition-all"
          >
            تسجيل الدخول
          </Link>
          <div className="flex-1 text-center py-2 text-sm font-bold text-[#0F766E] border-b-2 border-[#0F766E] cursor-default transition-all">
            حساب جديد
          </div>
        </div>

        {/* Header with Official Sakanly Logo */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center justify-center mx-auto group" aria-label="سكنلي Sakanly - الصفحة الرئيسية">
            <img
              src={sakanlyLogo}
              alt="سكنلي Sakanly"
              className="w-[195px] sm:w-[215px] h-auto max-h-[56px] object-contain rounded-xl p-1.5 bg-[#0B3D3A] shadow-sm group-hover:opacity-95 transition-all"
            />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-sakanly-dark">
            {isOwner ? 'إنشاء حساب مالك جديد' : 'إنشاء حساب طالب جديد'}
          </h1>
          <p className="text-xs text-sakanly-muted">
            {isOwner
              ? 'سجل كمالك عقار لإدارة سكن الطلاب واستقبال طلبات المعاينة'
              : 'سجل الآن لحفظ إعلاناتك المفضلة وطلب معاينات مجانية للسكن الطلابي'}
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            اختر نوع الحساب:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Student Role Card */}
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                !isOwner
                  ? 'border-sakanly-primary bg-teal-50/70 text-sakanly-dark ring-2 ring-sakanly-primary/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                !isOwner ? 'bg-[#0F766E] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs">طالب جامعي</span>
                <span className="block text-[10px] text-slate-400">البحث وحجز السكن</span>
              </div>
            </button>

            {/* 2. Owner Role Card */}
            <button
              type="button"
              onClick={() => { setRole('owner'); setError(''); }}
              className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                isOwner
                  ? 'border-[#0B3D3A] bg-[#0B3D3A]/5 text-[#0B3D3A] ring-2 ring-[#0B3D3A]/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isOwner ? 'bg-[#0B3D3A] text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-xs">مالك عقار</span>
                <span className="block text-[10px] text-slate-400">نشر وإدارة السكن</span>
              </div>
            </button>
          </div>
        </div>

        {/* Owner Verification Notice */}
        {isOwner && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs animate-fade-in">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>سياسة الأمان للملّاك:</strong> يتطلب نشر العقارات واعتمادها للطلاب استكمال خطوات توثيق الهوية والملكية ومراجعتها من الإدارة.
            </p>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs sm:text-[13px] rounded-xl border border-emerald-200 flex items-center gap-2.5 animate-fade-in font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage} جارٍ التوجيه تلقائياً...</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-700 text-xs sm:text-[13px] rounded-xl border border-rose-200 flex items-start gap-2.5 animate-fade-in font-medium">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Google OAuth Section (For Students) */}
        {!isOwner && (
          <div className="space-y-3">
            <GoogleAuthButton
              text="المتابعة باستخدام Google (طالب)"
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
              disabled={loading}
            />

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium shrink-0">
                أو التسجيل بالبريد الإلكتروني
              </span>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الاسم بالكامل
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="text"
                required
                disabled={loading}
                placeholder={isOwner ? 'مثال: م. أحمد الشناوي' : 'مثال: يوسف أحمد رضوان'}
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type="email"
                required
                disabled={loading}
                placeholder={isOwner ? 'owner@example.com' : 'student@example.com'}
                dir="ltr"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none text-right transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone Number Field (Required for Owner) */}
          {isOwner && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span>رقم الهاتف</span>
                <span className="text-rose-500 mr-1">*</span>
              </label>
              
              <div className="flex items-center gap-2">
                {/* Country Code Selector (Default: Egypt +20) */}
                <div className="relative w-28 shrink-0">
                  <select
                    disabled={loading}
                    value={formData.phoneCountryCode}
                    onChange={e => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                    className="w-full py-2.5 px-2 bg-slate-50 hover:bg-slate-100 border border-sakanly-border rounded-xl text-xs font-bold text-slate-700 focus:border-sakanly-primary outline-none transition-colors cursor-pointer text-center font-mono"
                    aria-label="كود الدولة"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Local Phone Input */}
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    disabled={loading}
                    placeholder={formData.phoneCountryCode === '+20' ? '01XXXXXXXXX' : 'XXXXXXXX'}
                    dir="ltr"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 text-xs sm:text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none text-right font-mono transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Helper Explanatory Text */}
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 leading-normal">
                <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>سيُستخدم رقم الهاتف للتواصل معك بشأن عقاراتك وطلبات المعاينة.</span>
              </p>
            </div>
          )}

          {/* Password Field with Show/Hide Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="6 أحرف أو أرقام على الأقل"
                dir="ltr"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full pr-10 pl-10 py-2.5 text-xs sm:text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none text-right transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field with Show/Hide Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="أعد إدخال كلمة المرور"
                dir="ltr"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full pr-10 pl-10 py-2.5 text-xs sm:text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none text-right transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label={showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                disabled={loading}
                checked={formData.termsAccepted}
                onChange={e => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="w-4 h-4 mt-0.5 accent-sakanly-primary rounded cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                أوافق على{' '}
                <span className="font-semibold text-slate-800">
                  {isOwner ? 'ميثاق المالك وشروط نشر الإعلانات' : 'ميثاق الأمان الطلابي'}
                </span>
                {' '}و{' '}
                <span className="font-semibold text-slate-800">شروط الاستخدام والخصوصية</span>
                {' '}لمنصة سكنلي.
              </span>
            </label>
          </div>

          {/* Submit Button with Loading State */}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className={`w-full py-3 px-4 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${
              isOwner
                ? 'bg-[#0B3D3A] hover:bg-[#072927]'
                : 'bg-sakanly-primary hover:bg-sakanly-primary-hover'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>جارٍ إنشاء الحساب...</span>
              </>
            ) : (
              <span>{isOwner ? 'إنشاء حساب مالك جديد' : 'إنشاء حساب طالب مجاناً'}</span>
            )}
          </button>
        </form>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>بياناتك محمية ومشفرة وفق أعلى معايير الخصوصية</span>
        </div>

        {/* Existing User Link */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="font-bold text-sakanly-primary hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
