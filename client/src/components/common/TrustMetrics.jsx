import React from 'react';
import { ShieldCheck, GraduationCap, MessageSquareCheck, BadgePercent } from 'lucide-react';

export const TrustMetrics = () => {
  const metrics = [
    {
      id: 'listings',
      value: '+1,200',
      label: 'إعلان موثق',
      icon: ShieldCheck,
      iconColor: 'text-[#0F766E]',
      iconBg: 'bg-teal-50',
    },
    {
      id: 'universities',
      value: '+30',
      label: 'جامعة قريبة',
      icon: GraduationCap,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-amber-50',
    },
    {
      id: 'response-rate',
      value: '94%',
      label: 'معدل رد الملاك',
      icon: MessageSquareCheck,
      iconColor: 'text-[#10B981]',
      iconBg: 'bg-emerald-50',
    },
    {
      id: 'commission',
      value: '0 ج.م',
      label: 'عمولة للطلاب',
      icon: BadgePercent,
      iconColor: 'text-[#0F766E]',
      iconBg: 'bg-teal-50',
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 relative z-20 -mt-10 sm:-mt-14" dir="rtl">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-900/10 border border-slate-100 p-5 sm:p-7">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
          {metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3.5 sm:gap-4 p-2 sm:p-3 ${
                  idx > 1 ? 'pt-4 sm:pt-3' : ''
                } ${idx % 2 !== 0 ? 'sm:border-r sm:border-slate-100 lg:border-r-0' : ''}`}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-cairo font-bold text-lg sm:text-xl text-slate-900 tracking-tight leading-none mb-1">
                    {item.value}
                  </span>
                  <span className="text-xs sm:text-[13px] font-medium text-slate-500">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
