import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import sakanlyLogo from '../../assets/sakanly-logo.png';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0B3D3A] text-[#F8FAFC] pt-7 pb-20 sm:pb-8 md:pt-8 md:pb-7 border-t border-white/10" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 lg:gap-7 pb-5 sm:pb-6 border-b border-white/10">

          {/* Column 1: Brand Info (2 Columns on Desktop) */}
          <div className="lg:col-span-2 space-y-2.5">
            {/* Official Sakanly Logo */}
            <Link
              to="/"
              className="inline-flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              aria-label="سكنلي Sakanly - الصفحة الرئيسية"
            >
              <img
                src={sakanlyLogo}
                alt="سكنلي Sakanly"
                className="w-[155px] sm:w-[175px] h-auto max-h-[46px] object-contain group-hover:opacity-95 transition-all"
              />
            </Link>

            {/* Platform Brief Description (11.5px, compact & neat) */}
            <p className="text-[11.5px] sm:text-[12px] text-slate-300/85 leading-relaxed max-w-sm">
              منصة رقمية موثوقة لمساعدة طلاب الجامعات والمغتربين في مصر على إيجاد شقق طلابية، غرف خاصة، وأسِرّة فردية بأسعار شفافة وبدون وسطاء أو عمولات خفية.
            </p>

            {/* Field Verification Trust Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>فحص ميداني للوحدات والتحقق من هوية المُلّاك</span>
            </div>

            {/* Social Media Links with Clean SVGs */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[11px] text-slate-400 ml-1">تابعنا:</span>

              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="فيسبوك"
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-[#F59E0B] text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="إنستغرام"
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-[#F59E0B] text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="لينكد إن"
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-[#F59E0B] text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="إكس"
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-[#F59E0B] text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-cairo font-bold text-[12.5px] sm:text-[13px] text-white flex items-center gap-1.5 border-r-2 border-[#F59E0B] pr-2 mb-1.5">
              روابط سريعة
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11.5px] sm:text-[12px]">
              <li>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>الرئيسية</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/browse"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>تصفح السكن والغرف</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/beds"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>الأسِرّة الفردية الاقتصادية</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>كيف نعمل؟ (دليل الطالب)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/owner-dashboard"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>بوابة أصحاب العقارات</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-amber-400 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>تسجيل الدخول</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Areas */}
          <div className="space-y-2">
            <h4 className="font-cairo font-bold text-[12.5px] sm:text-[13px] text-white flex items-center gap-1.5 border-r-2 border-[#F59E0B] pr-2 mb-1.5">
              أشهر مناطق السكن
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11.5px] sm:text-[12px]">
              <li>
                <Link
                  to="/browse?city=مدينة+نصر"
                  className="text-slate-300 hover:text-teal-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-teal-300 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>مدينة نصر (عين شمس، الأزهر)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?city=الدقي"
                  className="text-slate-300 hover:text-teal-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-teal-300 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>الدقي (جامعة القاهرة)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?city=مدينة+6+أكتوبر"
                  className="text-slate-300 hover:text-teal-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-teal-300 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>مدينة 6 أكتوبر (MUST, MSA)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?city=القاهرة+الجديدة"
                  className="text-slate-300 hover:text-teal-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-teal-300 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>التجمع الخامس (AUC, GUC)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/browse?city=الشيخ+زايد"
                  className="text-slate-300 hover:text-teal-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm inline-flex items-center gap-1 group py-0.5"
                >
                  <ChevronLeft className="w-3 h-3 text-slate-500 group-hover:text-teal-300 group-hover:-translate-x-0.5 transition-all duration-300" />
                  <span>الشيخ زايد (جامعة النيل)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust, Safety & Contact */}
          <div className="space-y-2">
            <h4 className="font-cairo font-bold text-[12.5px] sm:text-[13px] text-white flex items-center gap-1.5 border-r-2 border-[#F59E0B] pr-2 mb-1.5">
              الأمان والمساعدة
            </h4>
            <div className="space-y-1.5 text-[11.5px] sm:text-[12px]">
              <div className="flex items-center gap-1.5 text-slate-300/90 py-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>عقود نموذجية وإيصالات رسمية</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300/90 py-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>تقييمات موثقة من الطلاب المقيمين</span>
              </div>

              <div className="pt-1.5 space-y-1 border-t border-white/5">
                <a
                  href="mailto:support@sakanly.eg"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm py-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span dir="ltr">support@sakanly.eg</span>
                </a>
                <a
                  href="tel:+20224508890"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-amber-400 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm py-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span dir="ltr">+20 2 2450 8890</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Policies */}
        <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-2.5 text-[11px] text-slate-400 text-center md:text-right">

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1">
            <span className="font-medium text-slate-300">
              سكنلي | Sakanly &copy; {currentYear}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[10.5px]">
              جميع الحقوق محفوظة لمنصة سكنلي مصر
            </span>
          </div>

          {/* Legal / Policy Links */}
          <div className="flex items-center gap-3 text-[11px]">
            <Link
              to="/how-it-works"
              className="text-slate-400 hover:text-amber-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            >
              شروط الاستخدام
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              to="/how-it-works"
              className="text-slate-400 hover:text-amber-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            >
              سياسة الخصوصية
            </Link>
            <span className="text-slate-600">•</span>
            <Link
              to="/how-it-works"
              className="text-slate-400 hover:text-amber-300 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm"
            >
              دليل الأمان
            </Link>
          </div>

        </div>

        {/* Concise Prototype Note */}
        <div className="pt-1.5 text-center">
          <p className="text-[10px] text-slate-500 max-w-xl mx-auto">
            منصة تجريبية مخصصة لتسهيل تجربة السكن الجامعي في مصر.
          </p>
        </div>

      </div>
    </footer>
  );
};
