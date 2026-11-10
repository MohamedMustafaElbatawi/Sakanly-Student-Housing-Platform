import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { authApi } from '../services/api.js';
import sakanlyLogo from '../assets/sakanly-logo.png';

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const resetToken = location.state?.resetToken || searchParams.get('token');
  const identifier = location.state?.identifier || location.state?.phone || location.state?.email || searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Criteria validation
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!hasMinLength) {
      setError('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين. يرجى التأكد وإعادة المحاولة.');
      return;
    }

    if (!resetToken) {
      setError('رمز إعادة التعيين مفقود أو منتهي الصلاحية. يرجى بدء العملية مجدداً.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          state: {
            successMessage: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
          },
        });
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ كلمة المرور. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  // If navigated directly without verified reset token
  if (!resetToken && !success) {
    return (
      <div className="min-h-screen bg-sakanly-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">جلسة التحقق غير متوفرة</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            لا يمكنك الوصول إلى هذه الصفحة مباشرة دون تأكيد رمز التحقق المرسل إلى هاتفك.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-sakanly-dark text-white rounded-2xl font-bold hover:bg-sakanly-primary transition-all shadow-md hover:shadow-lg"
          >
            بدء استعادة كلمة المرور
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sakanly-bg flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Right Side: Brand Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-sakanly-dark via-[#093532] to-[#062624] text-white rounded-3xl shadow-xl min-h-[560px] relative overflow-hidden border border-emerald-950/40">
          <div className="relative z-10">
            <div className="mb-8">
              <img 
                src={sakanlyLogo} 
                alt="Sakanly Logo" 
                className="w-44 h-auto object-contain brightness-0 invert drop-shadow-sm select-none" 
              />
            </div>
            
            <h2 className="text-2xl font-bold leading-tight mb-4">
              حسابك في أمان تام مع سكنلي
            </h2>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-6">
              نحن نطبق أعلى معايير الحماية والتشفير لضمان سرية وأمان بياناتك وحسابك الشخصي.
            </p>

            <div className="space-y-4 pt-4 border-t border-emerald-800/40 text-xs text-emerald-200/90">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>تشفير كلمات المرور وحمايتها من الاختراق</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <span>إبطال الجلسات السابقة تلقائياً لتعزيز الأمان</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 text-xs text-emerald-300/60 flex items-center justify-between border-t border-emerald-900/40">
            <span>منصة سكن الطلاب الأولى في مصر</span>
            <span>خطوة 3 من 3</span>
          </div>
        </div>

        {/* Left Side: Reset Password Form Card */}
        <div className="lg:col-span-7 w-full bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl relative">
          
          {/* Mobile Logo Only */}
          <div className="lg:hidden flex justify-center mb-6">
            <img 
              src={sakanlyLogo} 
              alt="Sakanly Logo" 
              className="w-36 h-auto object-contain select-none" 
            />
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-sakanly-primary text-xs font-semibold mb-3 border border-emerald-100">
              <Lock className="w-3.5 h-3.5" />
              <span>الخطوة الأخيرة: تعيين كلمة المرور</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              إنشاء كلمة مرور جديدة
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              اختر كلمة مرور قوية لحماية حسابك{identifier ? ` المرتبط بـ ${identifier}` : ''}.
            </p>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">تم تغيير كلمة المرور بنجاح!</p>
                <p className="text-xs text-emerald-700 mt-0.5">جارٍ نقلك إلى صفحة تسجيل الدخول...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            
            {/* New Password */}
            <div>
              <label 
                htmlFor="new-password"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2"
              >
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sakanly-primary/30 focus:border-sakanly-primary focus:bg-white transition-all text-left font-sans"
                  disabled={loading || success}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirm-password"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2"
              >
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-11 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sakanly-primary/30 focus:border-sakanly-primary focus:bg-white transition-all text-left font-sans"
                  disabled={loading || success}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <span className="font-semibold text-slate-600 block mb-1">شروط كلمة المرور:</span>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  hasMinLength ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {hasMinLength ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                </div>
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  6 أحرف أو أرقام على الأقل
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  passwordsMatch ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {passwordsMatch ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3" />}
                </div>
                <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                  تطابق كلمتي المرور
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success || !hasMinLength || !passwordsMatch}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-sakanly-dark text-white rounded-2xl font-bold hover:bg-sakanly-primary active:scale-[0.99] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sakanly-dark disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جارٍ حفظ كلمة المرور...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>تم الحفظ بنجاح</span>
                </>
              ) : (
                <span>حفظ كلمة المرور</span>
              )}
            </button>
          </form>

          {/* Return to Login */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-sakanly-primary transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لتسجيل الدخول</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
};
