import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react';

const formatFullArabicDate = (dateString) => {
  if (!dateString) return 'الآن';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'الآن';

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
        weekday: 'short',
        year: 'numeric',
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
    return 'الآن';
  }
};

const getCategory = (notif) => {
  const targetType = notif.targetType || '';
  const type = notif.type || '';
  const title = notif.title || '';

  if (targetType === 'listing' || title.includes('عقار') || title.includes('إعلان')) {
    return 'properties';
  }
  if (targetType === 'inquiry' || type === 'request' || title.includes('معاينة') || title.includes('طلب')) {
    return 'requests';
  }
  if (targetType === 'conversation' || type === 'message' || title.includes('رسالة') || title.includes('محادثة')) {
    return 'messages';
  }
  if (targetType === 'verification' || title.includes('توثيق') || title.includes('هوية') || title.includes('سند') || title.includes('حساب')) {
    return 'verification';
  }
  return 'general';
};

const getNotifStyle = (notif) => {
  const type = notif.type || 'info';
  const title = notif.title || '';
  const category = getCategory(notif);

  if (type === 'success' || title.includes('اعتماد') || title.includes('الموافقة') || title.includes('تم توثيق')) {
    return {
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accentBorder: 'border-r-emerald-500',
      actionText: 'عرض التفاصيل',
    };
  }

  if (category === 'requests' || type === 'request' || title.includes('معاينة')) {
    return {
      icon: CalendarClock,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      accentBorder: 'border-r-amber-500',
      actionText: 'فحص الطلب',
    };
  }

  if (category === 'messages' || type === 'message' || title.includes('رسالة')) {
    return {
      icon: MessageSquare,
      iconColor: 'text-[#0F766E]',
      iconBg: 'bg-teal-50 border-teal-200',
      badgeClass: 'bg-teal-100 text-[#0F766E] border-teal-200',
      accentBorder: 'border-r-[#0F766E]',
      actionText: 'فتح المحادثة',
    };
  }

  if (type === 'needs_correction' || title.includes('تعديل') || title.includes('استكمال')) {
    return {
      icon: FileEdit,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-50 border-orange-200',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      accentBorder: 'border-r-orange-500',
      actionText: 'مراجعة وتعديل',
    };
  }

  if (type === 'warning' || title.includes('تنبيه') || title.includes('تحذير') || type === 'error' || title.includes('رفض')) {
    return {
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-200',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      accentBorder: 'border-r-rose-500',
      actionText: 'معاينة السبب',
    };
  }

  if (category === 'properties' || title.includes('عقار')) {
    return {
      icon: Building2,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200',
      badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentBorder: 'border-r-indigo-500',
      actionText: 'إدارة العقار',
    };
  }

  return {
    icon: Bell,
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100 border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    accentBorder: 'border-r-slate-400',
    actionText: 'عرض الإشعار',
  };
};

export const OwnerNotificationsView = ({
  notifications = [],
  isLoading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefresh,
  setActiveTab,
}) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Counts
  const totalCount = notifications.length;
  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  const readCount = totalCount - unreadCount;

  // Filter Categories counts
  const categoryCounts = useMemo(() => {
    const counts = {
      all: totalCount,
      unread: unreadCount,
      properties: 0,
      requests: 0,
      messages: 0,
      verification: 0,
    };

    notifications.forEach((n) => {
      const cat = getCategory(n);
      if (counts[cat] !== undefined) {
        counts[cat] += 1;
      }
    });

    return counts;
  }, [notifications, totalCount, unreadCount]);

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Filter Tab
      if (activeFilter === 'unread' && notif.isRead) return false;
      if (activeFilter === 'properties' && getCategory(notif) !== 'properties') return false;
      if (activeFilter === 'requests' && getCategory(notif) !== 'requests') return false;
      if (activeFilter === 'messages' && getCategory(notif) !== 'messages') return false;
      if (activeFilter === 'verification' && getCategory(notif) !== 'verification') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const title = (notif.title || '').toLowerCase();
        const message = (notif.message || notif.description || '').toLowerCase();
        return title.includes(query) || message.includes(query);
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Handlers
  const handleMarkAll = async () => {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      if (onMarkAllAsRead) {
        await onMarkAllAsRead();
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSingleRead = async (e, notifId) => {
    e.stopPropagation();
    if (processingId) return;
    setProcessingId(notifId);
    try {
      if (onMarkAsRead) {
        await onMarkAsRead(notifId);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotificationAction = (notif) => {
    // If unread, mark read in background
    if (!notif.isRead && onMarkAsRead) {
      onMarkAsRead(notif.id);
    }

    const cat = getCategory(notif);
    if (cat === 'properties') {
      if (setActiveTab) setActiveTab('properties');
      else navigate('/owner/properties');
    } else if (cat === 'requests') {
      if (setActiveTab) setActiveTab('requests');
      else navigate('/owner-dashboard');
    } else if (cat === 'messages') {
      if (setActiveTab) setActiveTab('messages');
      else navigate('/owner/messages');
    } else if (cat === 'verification') {
      if (setActiveTab) setActiveTab('verification');
      else navigate('/owner/verification');
    } else {
      if (setActiveTab) setActiveTab('overview');
      else navigate('/owner-dashboard');
    }
  };

  const filterTabs = [
    { id: 'all', label: 'الكل', count: categoryCounts.all },
    { id: 'unread', label: 'غير مقروءة', count: categoryCounts.unread, isHighlight: categoryCounts.unread > 0 },
    { id: 'properties', label: 'العقارات', count: categoryCounts.properties },
    { id: 'requests', label: 'طلبات المعاينة', count: categoryCounts.requests },
    { id: 'messages', label: 'الرسائل', count: categoryCounts.messages },
    { id: 'verification', label: 'الحساب والتوثيق', count: categoryCounts.verification },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & High-Level Metrics */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#0F766E] shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-sakanly-dark tracking-tight">
                  الإشعارات
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 animate-pulse">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-sakanly-muted mt-1 leading-relaxed">
                تابع جميع التحديثات المتعلقة بحسابك وعقاراتك وطلبات الطلاب في مكان واحد.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
              title="تحديث قائمة الإشعارات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markingAll || isLoading}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-xs ${
                unreadCount > 0
                  ? 'bg-sakanly-primary hover:bg-sakanly-primary-hover text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {markingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              <span>تعيين الكل كمقروء</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 sm:pt-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500">إجمالي الإشعارات</span>
              <p className="text-lg font-black text-slate-800">{totalCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-amber-800">إشعارات غير مقروءة</span>
              <p className="text-lg font-black text-amber-900">{unreadCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="min-[360px]:col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-emerald-800">تمت قراءتها</span>
              <p className="text-lg font-black text-emerald-900">{readCount}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#0B3D3A] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.isHighlight
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في نصوص الإشعارات..."
              className="w-full pr-9 pl-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-sakanly-primary rounded-xl text-xs text-slate-800 transition-colors placeholder:text-slate-400 outline-hidden font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-3">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 bg-white rounded-2xl border border-slate-100 flex items-start gap-4">
                <div className="w-11 h-11 bg-slate-200 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="w-1/3 h-4 bg-slate-200 rounded-md" />
                  <div className="w-3/4 h-3 bg-slate-200 rounded-md" />
                  <div className="w-1/4 h-3 bg-slate-200 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNotifications.length === 0 && (
          <div className="bg-white rounded-3xl border border-sakanly-border p-10 sm:p-14 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <BellOff className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                {searchQuery || activeFilter !== 'all' ? 'لا توجد نتائج مطابقة' : 'صندوق الإشعارات فارغ'}
              </h3>
              <p className="text-xs text-sakanly-muted leading-relaxed">
                {searchQuery
                  ? `لم نجد أي إشعار يحتوي على كلمة "${searchQuery}". جرّب البحث بكلمة أخرى.`
                  : activeFilter !== 'all'
                  ? 'لا توجد إشعارات حالياً تحت هذا التصنيف المحدد.'
                  : 'ستظهر هنا جميع الإشعارات والتحديثات اللحظية فور تلقيها.'}
              </p>
            </div>
            {(activeFilter !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                إلغاء الفلترة وعرض الكل
              </button>
            )}
          </div>
        )}

        {/* Active Cards List */}
        {!isLoading && filteredNotifications.map((notif) => {
          const style = getNotifStyle(notif);
          const IconComp = style.icon;
          const isUnread = !notif.isRead;
          const isThisProcessing = processingId === notif.id;

          return (
            <div
              key={notif.id}
              onClick={() => handleNotificationAction(notif)}
              className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer text-right flex flex-col sm:flex-row items-start justify-between gap-4 border-r-4 ${
                style.accentBorder
              } ${
                isUnread
                  ? 'bg-amber-50/30 hover:bg-amber-50/60 border-amber-200/80 shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-sakanly-border/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Visual Icon */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${style.iconBg} ${style.iconColor} group-hover:scale-105 transition-transform`}>
                  <IconComp className="w-5 h-5" />
                </div>

                {/* Text Content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`text-sm sm:text-base font-bold text-slate-900 group-hover:text-sakanly-primary transition-colors ${
                      isUnread ? 'font-black' : 'font-semibold'
                    }`}>
                      {notif.title}
                    </h3>

                    {/* Unread Pill */}
                    {isUnread && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        غير مقروء
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words line-clamp-3 sm:line-clamp-none">
                    {notif.message || notif.description}
                  </p>

                  {/* Metadata: Date and Relative Time */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatFullArabicDate(notif.createdAt || notif.date)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                {isUnread && (
                  <button
                    type="button"
                    onClick={(e) => handleSingleRead(e, notif.id)}
                    disabled={isThisProcessing}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-colors flex items-center gap-1.5"
                    title="تحديد كمقروء"
                  >
                    {isThisProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>تحديد كمقروء</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleNotificationAction(notif)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 group-hover:bg-[#0B3D3A] text-slate-700 group-hover:text-white transition-all flex items-center gap-1 shrink-0"
                >
                  <span>{style.actionText}</span>
                  <ChevronLeft className="w-3.5 h-3.5 rotate-0" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

