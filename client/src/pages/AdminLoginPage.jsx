import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { adminApi } from '../services/adminApi.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAdminAuth();

  useEffect(() => {
    document.title = 'تسجيل دخول الإدارة العليا | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await adminApi.login(form.email.trim(), form.password);
      const user = res.data?.user;
      const token = res.data?.token;

      if (!user || user.role !== 'super_admin') {
        setError('غير مصرح: هذا الحساب لا يملك صلاحيات الإدارة الرئيسية (Super Admin).');
        return;
      }

      adminLogin(token, user);
      navigate('/control-center', { replace: true });
    } catch (err) {
      setError(err.message || 'بيانات الدخول غير صحيحة أو تعذر الاتصال بالخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B3D3A] flex items-center justify-center p-4 font-cairo selection:bg-[#0F766E] selection:text-white" dir="rtl">
      <div className="w-full max-w-md">
        {/* Platform Identity */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0F766E] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-teal-600/40">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">مركز التحكم الرئيسي</h1>
          <p className="text-teal-200 text-xs sm:text-sm mt-1.5">
            منصة سكنلي — بوابة إدارة المنصة والأمان (Super Admin)
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-6">
            <h2 className="text-base sm:text-lg font-bold text-[#1E293B]">تسجيل دخول الإدارة العليا</h2>
            <p className="text-xs text-slate-400 mt-1">
              الرجاء إدخال بيانات الاعتماد المعتمدة الخاصة بصاحب المنصة
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800 leading-relaxed animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1.5">البريد الإلكتروني المعتمد</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@sakanly.com"
                  required
                  dir="ltr"
                  className="w-full pr-10 pl-3.5 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E293B] mb-1.5">كلمة المرور المشفرة</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••••••"
                  required
                  dir="ltr"
                  className="w-full pr-10 pl-10 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 p-1"
                  tabIndex={-1}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !form.email || !form.password}
              className="w-full py-3 px-4 bg-[#0B3D3A] hover:bg-[#0F766E] text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 text-xs sm:text-sm"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>دخول مركز التحكم</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              هذه المنطقة مؤمنة ومخصصة فقط لصاحب منصة سكنلي.<br />
              يتم رصد وتسجيل كل محاولة دخول غير مصرح بها فورياً.
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-teal-200 hover:text-white text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للموقع العام</span>
          </button>
        </div>
      </div>
    </div>
  );
};

