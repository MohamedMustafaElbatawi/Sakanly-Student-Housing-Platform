import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Check, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  CalendarClock, 
  MessageSquare, 
  Building2, 
  AlertTriangle, 
  FileEdit, 
  ExternalLink,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

const formatNotificationDate = (dateString, fallbackTime = '') => {
  if (!dateString) return fallbackTime || 'الآن';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return fallbackTime || 'الآن';

    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = '';
    if (diffMins < 1) relative = 'الآن';
    else if (diffMins < 60) relative = `منذ ${diffMins} دقيقة`;
    else if (diffHours < 24) relative = `منذ ${diffHours} ساعة`;
    else if (diffDays === 1) relative = 'أمس';
    else if (diffDays < 7) relative = `منذ ${diffDays} أيام`;
    else {
      relative = d.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      });
    }

    const timeFormatted = d.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${relative} • ${timeFormatted}`;
  } catch {
    return fallbackTime || 'الآن';
  }
};

const getNotifMeta = (notif) => {
  const type = notif.type || 'info';
  const title = notif.title || '';

  if (type === 'success' || title.includes('اعتماد') || title.includes('الموافقة')) {
    return {
      icon: ShieldCheck,
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderAccent: 'border-r-emerald-500',
      actionLabel: 'عرض التفاصيل',
    };
  }

  if (type === 'request' || title.includes('معاينة') || notif.targetType === 'inquiry') {
    return {
      icon: CalendarClock,
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      borderAccent: 'border-r-amber-500',
      actionLabel: 'فحص الطلب',
    };
  }

  if (type === 'message' || title.includes('رسالة') || notif.targetType === 'conversation') {
    return {
      icon: MessageSquare,
      iconBg: 'bg-teal-100 text-[#0F766E] border-teal-200',
      badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
      borderAccent: 'border-r-[#0F766E]',
      actionLabel: 'فتح المحادثة',
    };
  }

  if (type === 'needs_correction' || title.includes('تعديل') || title.includes('استكمال')) {
    return {
      icon: FileEdit,
      iconBg: 'bg-orange-100 text-orange-700 border-orange-200',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
      borderAccent: 'border-r-orange-500',
      actionLabel: 'مراجعة المطلوب',
    };
  }

  if (type === 'warning' || title.includes('رفض')) {
    return {
      icon: AlertTriangle,
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      borderAccent: 'border-r-rose-500',
      actionLabel: 'معرفة السبب',
    };
  }

  if (type === 'verification' || title.includes('توثيق') || notif.targetType === 'verification') {
    return {
      icon: ShieldAlert,
      iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      borderAccent: 'border-r-indigo-500',
      actionLabel: 'ملف التوثيق',
    };
  }

  // Default: property or info
  return {
    icon: Building2,
    iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    borderAccent: 'border-r-slate-400',
    actionLabel: 'عرض العقار',
  };
};

export const OwnerNotifications = ({
  notifications = [],
  isLoading = false,
  error = '',
  onMarkAllAsRead,
  onMarkAsRead,
  onNotificationClick,
  onRefresh,
  onViewAll,
}) => {
  const [markingId, setMarkingId] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSingleMark = async (e, notif) => {
    e.stopPropagation();
    if (notif.isRead || markingId) return;
    setMarkingId(notif.id);
    try {
      if (onMarkAsRead) await onMarkAsRead(notif.id);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAll = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      if (onMarkAllAsRead) await onMarkAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleCardClick = (notif) => {
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notif);
    }
  };

  return (
    <section className="w-full bg-white rounded-3xl border border-sakanly-border shadow-sm overflow-hidden flex flex-col font-cairo h-[520px] sm:h-[540px]">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center text-[#0F766E]">
              <Bell className="w-4 h-4" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                الإشعارات والتنبيهات
              </h3>
              {unreadCount > 0 ? (
                <span className="text-[11px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  {unreadCount} جديد
                </span>
              ) : (
                <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                  مقروءة
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              متابعة طلبات الطلاب ومراجعة العقارات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onViewAll && (
            <>
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-bold text-sakanly-primary hover:text-sakanly-primary-hover hover:underline hidden sm:flex items-center gap-1"
              >
                <span>عرض كل الإشعارات</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onViewAll}
                className="sm:hidden p-1.5 text-sakanly-primary hover:bg-teal-50 rounded-xl transition-colors"
                title="عرض كل الإشعارات"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title="تحديث الإشعارات"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#0F766E]' : ''}`} />
            </button>
          )}

          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="text-[11px] font-bold text-[#0F766E] hover:text-[#0B3D3A] hover:bg-teal-50 px-2 py-1 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50"
              title="تعليم جميع الإشعارات كمقروءة"
            >
              {isMarkingAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">تعيين الكل كمقروء</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Body: Notifications List ──────────────────────────── */}
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto sakanly-scrollbar space-y-2.5">
        {/* Loading State */}
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 animate-pulse space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-slate-200 rounded w-24" />
                  <div className="h-2.5 bg-slate-200 rounded w-14" />
                </div>
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="py-8 px-4 text-center space-y-3 bg-rose-50/50 rounded-2xl border border-rose-100">
            <AlertTriangle className="w-6 h-6 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="px-3 py-1 bg-white border border-rose-200 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-50 transition-colors shadow-xs"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
        ) : notifications.length === 0 ? (
          /* Empty State */
          <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 border border-slate-100 space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
              <BellOff className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-700">لا توجد إشعارات جديدة</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              ستصلك هنا إشعارات فورية عند تقديم طلب معاينة جديد، وصول رسالة من طالب، أو اعتماد وتحديث حالة عقاراتك.
            </p>
          </div>
        ) : (
          /* Real Notifications Cards */
          notifications.map((notif) => {
            const meta = getNotifMeta(notif);
            const Icon = meta.icon;
            const timeStr = formatNotificationDate(notif.createdAt, notif.time);

            return (
              <div
                key={notif.id}
                onClick={() => handleCardClick(notif)}
                className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer text-right ${
                  notif.isRead
                    ? 'bg-white hover:bg-slate-50/80 border-slate-200/80 text-slate-600 shadow-xs'
                    : 'bg-teal-50/40 hover:bg-teal-50/70 border-teal-200 text-slate-800 shadow-xs ring-1 ring-teal-100/50'
                } ${meta.borderAccent ? `border-r-4 ${meta.borderAccent}` : ''}`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs sm:text-[13px] truncate ${
                          notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'
                        }`}
                      >
                        {notif.title}
                      </h4>

                      {/* Unread indicator / Mark Read Button */}
                      {!notif.isRead ? (
                        <button
                          type="button"
                          onClick={(e) => handleSingleMark(e, notif)}
                          disabled={markingId === notif.id}
                          className="shrink-0 p-1 text-slate-400 hover:text-teal-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-teal-200"
                          title="تعليم كمقروء"
                        >
                          {markingId === notif.id ? (
                            <Loader2 className="w-3 h-3 animate-spin text-[#0F766E]" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-teal-600 block group-hover:hidden" />
                          )}
                          <Check className="w-3 h-3 hidden group-hover:block text-teal-700" />
                        </button>
                      ) : (
                        <Check className="w-3 h-3 text-slate-300 shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span>{timeStr}</span>
                      </span>

                      <span className="text-[#0F766E] font-bold text-[10px] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>{meta.actionLabel}</span>
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Footer: Summary ───────────────────────────────────── */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 rounded-b-3xl shrink-0">
        <div className="flex items-center gap-2">
          <span>إجمالي الإشعارات: <strong className="text-slate-700">{notifications.length}</strong></span>
          {unreadCount > 0 && (
            <span className="text-[#0F766E] font-bold">
              • {unreadCount} غير مقروء
            </span>
          )}
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[#0F766E] hover:underline font-bold text-xs flex items-center gap-1"
          >
            <span>عرض كل الإشعارات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
