import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCw,
  Phone,
  Mail,
  KeyRound,
  MessageSquareCode
} from 'lucide-react';
import { authApi } from '../services/api.js';
import sakanlyLogo from '../assets/sakanly-logo.png';

export const VerifyResetOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const identifier = location.state?.identifier || location.state?.phone || location.state?.email || '';
  const method = location.state?.method || (identifier.includes('@') ? 'email' : 'phone');
  const initialCooldown = location.state?.cooldownSeconds || 60;
  const initialMessage = location.state?.message || '';

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(initialMessage);
  const [cooldown, setCooldown] = useState(initialCooldown);

  const inputsRef = useRef([]);

  // Redirect if no identifier in state
  useEffect(() => {
    if (!identifier) {
      navigate('/forgot-password', { replace: true });
    }
  }, [identifier, navigate]);

  // Focus first input on load
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    const char = cleaned ? cleaned[cleaned.length - 1] : '';

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);
    setError('');

    // Auto advance if digit entered
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    setError('');

    const focusIdx = Math.min(pastedData.length, 5);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('يرجى إدخال جميع خانات رمز التحقق (6 أرقام).');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp(identifier, code, method);
      if (res.resetToken) {
        // Navigate securely to step 3 with resetToken in state
        navigate('/reset-password', {
          state: {
            identifier,
            method,
            resetToken: res.resetToken,
            message: 'تم تأكيد الرمز بنجاح! يمكنك الآن تعيين كلمة المرور الجديدة.',
          },
        });
      } else {
        throw new Error('تعذر إتمام التحقق. يرجى إعادة المحاولة.');
      }
    } catch (err) {
      setError(err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await authApi.resendResetOtp(identifier, method);
      setInfoMessage(res.message || (method === 'email'
        ? 'تم إرسال رمز تحقق ورابط استعادة جديد إلى بريدك الإلكتروني.'
        : 'تم إرسال رمز تحقق جديد إلى هاتفك المحمول.'));
      setCooldown(res.cooldownSeconds || 60);
      setOtpDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'فشل إعادة إرسال الرمز. يرجى الانتظار والمحاولة مجدداً.');
    } finally {
      setResending(false);
    }
  };

  const isEmail = method === 'email';

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
            to="/forgot-password"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-teal-200 hover:text-white bg-white/10 hover:bg-white/15 py-1.5 px-3 rounded-xl transition-colors backdrop-blur-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>تغيير الوسيلة</span>
          </Link>
        </div>

        {/* Center: Value Proposition */}
        <div className="relative z-10 my-4 sm:my-6 lg:my-auto py-2 sm:py-4 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-900/60 border border-teal-500/30 text-teal-200 text-xs font-semibold backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>الخطوة الثانية: تأكيد الهوية</span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            تأكيد الملكية لحماية حسابك
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {isEmail
              ? 'أرسلنا رمز تحقق ورابط استعادة مباشر إلى بريدك الإلكتروني للتأكد من هويتك ومنع أي وصول غير مصرح به.'
              : 'أرسلنا رمز تحقق عبر رسالة نصية قصيرة SMS إلى هاتفك المحمول للتأكد من هويتك ومنع أي وصول غير مصرح به.'}
          </p>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-xs text-teal-200/90 font-medium">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
              {isEmail ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[11px] text-slate-300">{isEmail ? 'البريد الإلكتروني' : 'رقم الموبايل'}</div>
              <div className="font-bold text-white text-sm" dir="ltr">{identifier}</div>
            </div>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="hidden sm:flex relative z-10 pt-4 border-t border-teal-900/40 items-center justify-between text-xs text-teal-300/80">
          <span className="text-[11px] text-teal-200/90 font-medium">
            منصة سكن الطلاب الأولى في مصر
          </span>
          <span className="text-[11px] text-slate-400">
            خطوة 2 من 3
          </span>
        </div>
      </section>

      {/* Left Column: Form Card */}
      <section 
        aria-label="نموذج تأكيد رمز التحقق"
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:py-6 lg:px-8"
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-card space-y-5">
          
          {/* Header Title */}
          <div className="space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] border border-teal-100 flex items-center justify-center mb-3">
              <MessageSquareCode className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
              {isEmail ? 'تأكيد البريد الإلكتروني' : 'تأكيد رقم الموبايل'}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
              أدخل رمز التحقق المكون من 6 أرقام المرسل إلى{' '}
              <strong className="text-slate-700 font-bold" dir="ltr">{identifier}</strong>.
            </p>
          </div>

          {/* Info Banner */}
          {infoMessage && (
            <div
              role="status"
              className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 animate-fade-in font-medium"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoMessage}</span>
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

          {/* OTP Inputs Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                رمز التحقق (OTP)
              </label>

              {/* 6 Digit Inputs */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={loading}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-sakanly-primary focus:ring-2 focus:ring-sakanly-primary/30 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                    aria-label={`الخانة ${idx + 1} من رمز التحقق`}
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.some(d => !d)}
              aria-busy={loading}
              className="w-full h-11 sm:h-12 px-4 bg-[#0F766E] hover:bg-[#0B3D3A] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>جارٍ التحقق من الرمز...</span>
                </span>
              ) : (
                <span>تأكيد الرمز والمتابعة</span>
              )}
            </button>
          </form>

          {/* Resend Cooldown Section */}
          <div className="pt-2 flex flex-col items-center justify-center gap-2 text-xs">
            {cooldown > 0 ? (
              <p className="text-slate-500 font-medium">
                يمكنك إعادة إرسال الرمز بعد{' '}
                <span className="font-bold text-sakanly-primary font-mono">{cooldown}</span> ثانية
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 font-bold text-sakanly-primary hover:text-sakanly-dark hover:underline transition-colors disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>إعادة إرسال الرمز</span>
              </button>
            )}

            {isEmail && (
              <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-1">
                نصيحة: يمكنك أيضاً النقر مباشرة على رابط الاستعادة الموجود داخل رسالة البريد الإلكتروني.
              </p>
            )}
          </div>

          {/* Return link */}
          <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to="/forgot-password"
              className="font-semibold text-slate-500 hover:text-sakanly-primary transition-colors"
            >
              تغيير {isEmail ? 'البريد' : 'رقم الهاتف'}
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 font-bold text-sakanly-primary hover:underline"
            >
              <span>تسجيل الدخول</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};

export default VerifyResetOtpPage;
