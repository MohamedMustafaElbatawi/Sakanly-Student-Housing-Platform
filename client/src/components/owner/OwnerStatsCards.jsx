import React from 'react';
import { Building2, CheckCircle2, CalendarClock, MessageSquare } from 'lucide-react';

export const OwnerStatsCards = ({
  totalProperties = 0,
  activeProperties = 0,
  viewingRequestsCount = 0,
  unreadMessagesCount = 0,
  onCardClick,
}) => {
  const cards = [
    {
      id: 'properties',
      title: 'إجمالي العقارات',
      value: totalProperties,
      unit: 'وحدات معروضة',
      description: 'جميع الشقق والأسِرّة المسجلة',
      icon: Building2,
      iconBg: 'bg-teal-50 text-sakanly-primary',
    },
    {
      id: 'active_properties',
      title: 'العقارات النشطة',
      value: activeProperties,
      unit: 'عقار نشط',
      description: 'جاهزة للحجز الفوري ومعروضة للطلاب',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      id: 'requests',
      title: 'طلبات المعاينة',
      value: viewingRequestsCount,
      unit: 'طلب معاينة',
      description: 'طلبات جديدة بحاجة لتأكيد الموعد',
      icon: CalendarClock,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'messages',
      title: 'الرسائل غير المقروءة',
      value: unreadMessagesCount,
      unit: 'محادثة',
      description: 'استفسارات الطلاب عن السكن',
      icon: MessageSquare,
      iconBg: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onCardClick && onCardClick(card.id)}
            className="bg-white rounded-2xl border border-sakanly-border p-3.5 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            {/* Header with Title and Icon */}
            <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
              <span className="text-xs sm:text-[13px] font-bold text-slate-600 group-hover:text-sakanly-primary transition-colors truncate">
                {card.title}
              </span>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg} transition-transform group-hover:scale-105`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>

            {/* Value and Unit */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-lg sm:text-2xl font-extrabold text-sakanly-dark font-cairo">
                  {card.value.toLocaleString('ar-EG')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                  {card.unit}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-sakanly-muted line-clamp-1">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
