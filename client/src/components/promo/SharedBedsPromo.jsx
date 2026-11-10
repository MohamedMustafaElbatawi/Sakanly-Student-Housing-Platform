import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export const SharedBedsPromo = () => {
  const features = [
    'اختر زملاءك',
    'كل السكنات موثقة',
    'فواتير شاملة بدون مفاجآت',
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
      {/* 1. Tag / Badge Above Card (Right-aligned, 14px, SemiBold, #0F766E) */}
      <div className="mb-3 text-right">
        <span className="font-cairo font-semibold text-[14px] text-[#0F766E] inline-flex items-center gap-1.5">
          حلول تناسب ميزانيتك
        </span>
      </div>

      {/* 2. Split Promo Banner Card */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-stretch">
          
          {/* Right Side on Desktop: Content Area (Order 2 on mobile, Order 1 on desktop RTL) */}
          <div className="order-2 lg:order-1 lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center text-right">
            
            {/* Headline (Section H2 Scale: 22-26px desktop, 20-22px mobile) */}
            <h2 className="font-cairo font-bold text-xl sm:text-2xl lg:text-[26px] leading-[1.3] text-[#0B3D3A] mb-3">
              <span className="block">سريرك الخاص،</span>
              <span className="block">ومجتمع يشبهك</span>
            </h2>

            {/* Description (12-14px) */}
            <p className="font-cairo font-normal text-xs sm:text-[13.5px] text-[#64748B] leading-relaxed max-w-md mb-6">
              وفّر في الإيجار من غير ما تتنازل عن الراحة. أسرّة فردية في سكنات مشتركة مع طلاب من جامعتك.
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-7">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#F0FDFA] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#0F766E] stroke-[2.5]" />
                  </div>
                  <span className="font-cairo font-medium text-xs sm:text-[13px] text-[#1E293B]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <div>
              <Link
                to="/beds"
                className="w-full sm:w-auto inline-flex items-center justify-center text-center px-6 py-2.5 sm:py-3 bg-[#0B3D3A] hover:bg-[#0F766E] text-white font-cairo font-bold text-xs sm:text-sm rounded-full shadow-sm hover:shadow transition-colors duration-200 active:scale-95"
              >
                اكتشف الأسرّة المتاحة
              </Link>
            </div>

          </div>

          {/* Left Side on Desktop: Image Area (Order 1 on mobile, Order 2 on desktop RTL) */}
          <div className="order-1 lg:order-2 lg:w-1/2 relative min-h-[260px] sm:min-h-[340px] lg:min-h-[440px] overflow-hidden bg-slate-100">
            <img
              src="/shared-beds-promo.jpg"
              alt="غرفة سكن طلابي مشتركة بأسرّة خشبية ومساحة دراسة"
              className="w-full h-full object-cover object-center absolute inset-0"
              loading="lazy"
            />

            {/* Floating Price Capsule (Bottom-Left Corner) */}
            <div className="absolute bottom-5 left-5 z-10 bg-white rounded-2xl shadow-lg px-4 py-2.5 border border-slate-100/80 backdrop-blur-sm">
              <span className="block font-cairo font-normal text-[10px] text-[#64748B] leading-none mb-1">
                تبدأ من
              </span>
              <span className="block font-cairo font-bold text-[18px] sm:text-[20px] text-[#0B3D3A] leading-tight">
                2,200 ج.م / شهر
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
