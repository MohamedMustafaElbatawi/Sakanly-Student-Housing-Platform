import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl border border-sakanly-border p-8 shadow-card space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center mx-auto text-3xl font-bold font-cairo shadow-inner">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-sakanly-dark">الصفحة غير موجودة</h1>
          <p className="text-xs text-sakanly-muted leading-relaxed">
            عذراً، الصفحة التي تبحث عنها ربما تم تغيير مسارها أو حُذفت.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
          </Link>
          <Link
            to="/browse"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Compass className="w-4 h-4" />
            استكشف السكن
          </Link>
        </div>
      </div>
    </div>
  );
};
