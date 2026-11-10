import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import {
  Building2,
  PlusCircle,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  MessageSquare,
  User,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Edit3,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { propertyApi, notificationsApi, messagesApi, authApi } from '../services/api.js';
import { mockProperties } from '../data/mockProperties.js';

// Modular Components
import { OwnerSidebar } from '../components/owner/OwnerSidebar.jsx';
import { OwnerDashboardHeader } from '../components/owner/OwnerDashboardHeader.jsx';
import { OwnerStatsCards } from '../components/owner/OwnerStatsCards.jsx';
import { OwnerPropertiesList } from '../components/owner/OwnerPropertiesList.jsx';
import { RecentViewingRequests } from '../components/owner/RecentViewingRequests.jsx';
import { OwnerNotifications } from '../components/owner/OwnerNotifications.jsx';
import { CreatePropertyModal } from '../components/owner/CreatePropertyModal.jsx';
import { AddPropertyWizard } from '../components/owner/AddPropertyWizard.jsx';
import { OwnerVerificationView } from '../components/owner/OwnerVerificationView.jsx';
import { OwnerMessagesView } from '../components/owner/OwnerMessagesView.jsx';
import { OwnerNotificationsView } from '../components/owner/OwnerNotificationsView.jsx';

export const OwnerDashboardPage = ({ initialTab = 'overview' }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, token, updateUser } = useAuth();

  // Set Page Title
  useEffect(() => {
    document.title = 'لوحة تحكم المالك | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  const location = useLocation();

  // Navigation & UI state
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname === '/owner/properties' || location.pathname === '/owner/properties/') {
      return 'properties';
    }
    if (location.pathname === '/owner/properties/new' || location.pathname === '/owner/add-property') {
      return 'add-property';
    }
    if (location.pathname === '/owner-dashboard/notifications' || location.pathname === '/owner/notifications' || location.pathname === '/owner/notifications/') {
      return 'notifications';
    }
    if (location.pathname === '/owner/verification') {
      return 'verification';
    }
    if (location.pathname === '/owner/messages' || location.pathname === '/owner/messages/') {
      return 'messages';
    }
    return initialTab;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Owner profile phone editing state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneEditValue, setPhoneEditValue] = useState(user?.phone || '');
  const [phoneCountryCodeEdit, setPhoneCountryCodeEdit] = useState(user?.phoneCountryCode || '+20');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Keep activeTab in sync if route changes
  useEffect(() => {
    if (location.pathname === '/owner/properties' || location.pathname === '/owner/properties/') {
      setActiveTab('properties');
    } else if (location.pathname === '/owner/properties/new' || location.pathname === '/owner/add-property') {
      setActiveTab('add-property');
    } else if (location.pathname === '/owner-dashboard/notifications' || location.pathname === '/owner/notifications' || location.pathname === '/owner/notifications/') {
      setActiveTab('notifications');
    } else if (location.pathname === '/owner/verification') {
      setActiveTab('verification');
    } else if (location.pathname === '/owner/messages' || location.pathname === '/owner/messages/') {
      setActiveTab('messages');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [location.pathname, initialTab]);

  // Determine owner profile info (Strictly extracted from authenticated user)
  const currentOwner = {
    id: user?.id,
    fullName: user?.fullName || 'مالك العقار',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    isVerified: Boolean(user?.isVerified),
    verificationStatus: user?.verificationStatus || (user?.isVerified ? 'verified' : 'not_started'),
    rejectionReason: user?.rejectionReason || null,
    role: user?.role || 'owner',
  };

  // Data states strictly isolated per logged-in owner (no hardcoded fallback to another owner)
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load strictly isolated owner dashboard data from Backend
  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      const activeToken = token || localStorage.getItem('sakanly_token');
      try {
        // 1. Fetch strictly this owner's properties
        const myProps = await propertyApi.getMyProperties(activeToken);
        if (isMounted) {
          setProperties(Array.isArray(myProps) ? myProps : []);
        }

        // 2. Fetch viewing requests for this owner's listings
        const myInquiries = await propertyApi.getMyInquiries(activeToken);
        if (isMounted && Array.isArray(myInquiries)) {
          const formatted = myInquiries.map(inq => ({
            id: inq.id,
            studentName: inq.applicant?.fullName || 'طالب سكنلي',
            university: inq.applicant?.university || 'جامعة عين شمس',
            phone: inq.applicant?.phone || '',
            date: inq.moveInDate || inq.createdAt?.split('T')[0] || '2026-10-25',
            time: '04:00 م',
            propertyId: inq.listingId,
            propertyTitle: inq.listingTitle || 'سكن طلابي',
            status: inq.status === 'accepted' ? 'accepted' : inq.status === 'rejected' ? 'rejected' : 'pending',
            createdAt: inq.createdAt,
            notes: inq.message || '',
          }));
          setRequests(formatted);
        }

        // 3. Fetch notifications for this owner
        const notifRes = await notificationsApi.getNotifications(activeToken);
        if (isMounted && Array.isArray(notifRes?.notifications)) {
          setNotifications(notifRes.notifications);
        }

        // 4. Fetch conversations for this owner
        const convRes = await messagesApi.getConversations(activeToken);
        if (isMounted && Array.isArray(convRes)) {
          const mappedMsgs = convRes.map(c => ({
            id: c.id,
            studentName: c.studentName,
            propertyTitle: c.propertyTitle,
            lastMessage: c.lastMessage,
            time: c.lastMessageTime,
            unread: Boolean(c.unreadCount > 0),
          }));
          setMessages(mappedMsgs);
        }
      } catch (err) {
        console.warn('Dashboard data fetch warning:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    };

    const activeToken = token || localStorage.getItem('sakanly_token');
    if (activeToken) {
      fetchDashboardData();
    } else {
      setIsLoadingData(false);
    }
    return () => { isMounted = false; };
  }, [token, user?.id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Property Handlers
  const handleSaveProperty = async (propertyData) => {
    if (editingProperty) {
      // Edit existing
      await propertyApi.updateListing(propertyData.id, propertyData, token);
      setProperties(prev => prev.map(p => p.id === propertyData.id ? propertyData : p));
      showToast('تم تحديث بيانات العقار بنجاح!');
      setEditingProperty(null);
    } else {
      // Add new
      const created = await propertyApi.createListing(propertyData, token);
      setProperties(prev => [created, ...prev]);
      showToast('تمت إضافة السكن الجديد بنجاح!');
    }
  };

  const handleTogglePropertyStatus = async (id, newStatus) => {
    await propertyApi.updateListingStatus(id, newStatus, token);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    showToast(newStatus === 'paused' ? 'تم إيقاف عرض الإعلان مؤقتاً.' : 'تم إعادة تفعيل الإعلان بنجاح!');
  };

  const handleDeleteProperty = async (id) => {
    await propertyApi.deleteListing(id, token);
    setProperties(prev => prev.filter(p => p.id !== id));
    showToast('تم حذف العقار من قائمتك.');
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setCreateModalOpen(true);
  };

  // Request Handlers with Backend Persistence
  const handleRequestAction = async (id, newStatus) => {
    try {
      const backendStatus = newStatus === 'accepted' ? 'accepted' : 'rejected';
      await propertyApi.updateInquiryStatus(id, backendStatus, token);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      showToast(newStatus === 'accepted' ? 'تم قبول موعد المعاينة وإخطار الطالب.' : 'تم الاعتذار عن موعد المعاينة.');
    } catch (err) {
      showToast('تعذر تحديث حالة الطلب: ' + (err.message || ''));
    }
  };

  // Notification Handlers with Backend Persistence
  const handleMarkNotifAsRead = async (notifId) => {
    try {
      await notificationsApi.markAsRead(notifId, token);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      showToast('تم تعيين جميع الإشعارات كمقروءة.');
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = (notif) => {
    handleMarkNotifAsRead(notif.id);
    const targetType = notif.targetType;
    const title = notif.title || '';

    if (targetType === 'listing' || title.includes('عقار')) {
      setActiveTab('properties');
    } else if (targetType === 'inquiry' || title.includes('معاينة')) {
      setActiveTab('requests');
    } else if (targetType === 'conversation' || title.includes('رسالة')) {
      setActiveTab('messages');
    } else if (targetType === 'verification' || title.includes('توثيق') || title.includes('هوية')) {
      setActiveTab('verification');
    } else {
      setActiveTab('overview');
    }
  };

  const refreshNotifications = async () => {
    const activeToken = token || localStorage.getItem('sakanly_token');
    if (!activeToken) return;
    try {
      const res = await notificationsApi.getNotifications(activeToken);
      if (Array.isArray(res?.notifications)) {
        setNotifications(res.notifications);
        showToast('تم تحديث الإشعارات.');
      }
    } catch (err) {
      console.warn('Error refreshing notifications:', err);
    }
  };

  const handleStartEditPhone = () => {
    setPhoneEditValue(currentOwner.phone || '');
    setPhoneCountryCodeEdit(user?.phoneCountryCode || '+20');
    setPhoneError('');
    setIsEditingPhone(true);
  };

  const handleCancelEditPhone = () => {
    setIsEditingPhone(false);
    setPhoneError('');
  };

  const handleSaveOwnerPhone = async () => {
    if (isSavingPhone) return;
    setPhoneError('');
    const raw = (phoneEditValue || '').trim();
    if (!raw) {
      setPhoneError('رقم الهاتف مطلوب للتواصل.');
      return;
    }

    const cCode = (phoneCountryCodeEdit || '+20').trim();
    let normalizedPhone = raw;

    if (cCode === '+20') {
      const digits = raw.replace(/\D/g, '');
      const isValidEg = /^01[0125]\d{8}$/.test(digits) || /^1[0125]\d{8}$/.test(digits);
      if (!isValidEg) {
        setPhoneError('يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
        return;
      }
      if (digits.startsWith('1') && digits.length === 10) {
        normalizedPhone = '0' + digits;
      } else if (digits.startsWith('20') && digits.length === 12) {
        normalizedPhone = '0' + digits.slice(2);
      } else {
        normalizedPhone = digits;
      }
    } else {
      const digits = raw.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        setPhoneError('يرجى إدخال رقم هاتف صالح يتكون من 8 إلى 15 رقماً.');
        return;
      }
      normalizedPhone = `${cCode}${digits}`;
    }

    setIsSavingPhone(true);
    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const res = await authApi.updateProfile(activeToken, {
        phone: normalizedPhone,
        phoneNumber: normalizedPhone,
        phoneCountryCode: cCode,
      });

      if (res?.data?.user && updateUser) {
        updateUser(res.data.user);
      }
      setIsEditingPhone(false);
      showToast('تم تحديث رقم الهاتف للتواصل بنجاح!');
    } catch (err) {
      setPhoneError(err.message || 'تعذر تحديث رقم الهاتف.');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  // Calculated Stats
  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => (p.status || (p.isVerified ? 'active' : 'pending')) === 'active').length;
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const unreadMessagesCount = messages.filter(m => m.unread).length;
  const unreadNotifsCount = notifications.filter(n => !n.isRead).length;

  const tabTitles = {
    overview: 'نظرة عامة',
    properties: 'عقاراتي',
    'add-property': 'إضافة عقار جديد',
    requests: 'طلبات المعاينة',
    messages: 'الرسائل والمحادثات',
    notifications: 'الإشعارات',
    verification: 'توثيق المالك',
    profile: 'الملف الشخصي',
  };

  // Security guard 1: Unauthenticated guest must be redirected to login
  if (!isAuthenticated) {
    const returnPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(returnPath)}`}
        state={{
          from: returnPath,
          message: 'سجّل دخولك بحساب مالك عقار للاستفادة من لوحة التحكم.',
        }}
        replace
      />
    );
  }

  // Security guard 2: If super_admin tries to access owner dashboard
  if (user?.role === 'super_admin') {
    return (
      <div className="min-h-[80vh] bg-sakanly-bg flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-card text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto border border-teal-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-sakanly-dark">
              حساب صاحب المنصة (Super Admin)
            </h2>
            <p className="text-xs sm:text-sm text-sakanly-muted leading-relaxed">
              أنت مسجل حالياً بصلاحية <strong>صاحب المنصة ({user.fullName})</strong>. لوحة تحكم المالك مخصصة لملّاك العقارات فقط. لإدارة المنصة بالكامل، يرجى الانتقال إلى مركز القيادة الرئيسي.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/control-center"
              className="w-full py-2.5 px-4 bg-[#0F766E] hover:bg-[#0B3D3A] text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs"
            >
              الانتقال إلى مركز تحكم المنصة (/control-center)
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login?redirect=/owner-dashboard', { state: { from: '/owner-dashboard' } });
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            >
              تسجيل الخروج والتبديل لحساب مالك
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Security guard 3: If student or any non-owner tries to access owner dashboard
  if (user?.role !== 'owner') {
    return (
      <div className="min-h-[80vh] bg-sakanly-bg flex items-center justify-center p-4 font-cairo" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-card text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-sakanly-dark">
              غير مصرح بالدخول — مخصص للملاك فقط
            </h2>
            <p className="text-xs sm:text-sm text-sakanly-muted leading-relaxed">
              أنت مسجل حالياً بحساب <strong>طالب جامعي ({user.fullName})</strong>. لوحة تحكم المالك مخصصة لأصحاب ومؤجري العقارات فقط لإدارة إعلاناتهم ومتابعة التوثيق.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/browse"
              className="w-full py-2.5 px-4 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-xs"
            >
              العودة لتصفح السكن
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login?redirect=/owner-dashboard', { state: { from: '/owner-dashboard' } });
              }}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
            >
              تسجيل الخروج والتبديل لحساب مالك
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sakanly-bg flex flex-col md:flex-row font-cairo" dir="rtl">

      {/* 1. Sidebar Component (Permanent Desktop ~265px, Drawer on Mobile) */}
      <OwnerSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        owner={currentOwner}
        unreadMessagesCount={unreadMessagesCount}
        pendingRequestsCount={pendingRequestsCount}
        unreadNotifsCount={unreadNotifsCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header with Breadcrumbs & Action Button */}
        <OwnerDashboardHeader
          ownerName={currentOwner.fullName}
          activeTabTitle={tabTitles[activeTab]}
          onOpenCreate={() => { setEditingProperty(null); setActiveTab('add-property'); }}
          onToggleMobileMenu={() => setMobileOpen(true)}
        />

        {/* Workspace Body */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">

          {/* Toast Alert Feedback */}
          {toastMessage && (
            <div
              role="status"
              className="p-3.5 bg-emerald-50 text-emerald-800 text-xs sm:text-sm rounded-2xl border border-emerald-200 flex items-center justify-between shadow-sm animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage('')} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
                ✕
              </button>
            </div>
          )}

          {/* Owner Verification Lifecycle Alert Banner */}
          {currentOwner.verificationStatus !== 'verified' && (
            <div className={`p-4 rounded-3xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in ${currentOwner.verificationStatus === 'pending_review'
              ? 'bg-amber-50/90 border-amber-200 text-amber-900'
              : currentOwner.verificationStatus === 'rejected'
                ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                : 'bg-teal-50/90 border-teal-200 text-teal-950'
              }`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${currentOwner.verificationStatus === 'pending_review'
                  ? 'bg-amber-100 text-amber-700 border-amber-300'
                  : currentOwner.verificationStatus === 'rejected'
                    ? 'bg-rose-100 text-rose-700 border-rose-300'
                    : 'bg-teal-100 text-sakanly-primary border-teal-300'
                  }`}>
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs sm:text-sm">
                      {currentOwner.verificationStatus === 'pending_review'
                        ? 'طلب توثيق المالك قيد المراجعة الإدارية'
                        : currentOwner.verificationStatus === 'rejected'
                          ? 'تم رفض طلب توثيق المالك'
                          : 'توثيق حساب المالك مطلوب لنشر العقارات'}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentOwner.verificationStatus === 'pending_review'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : currentOwner.verificationStatus === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                      {currentOwner.verificationStatus === 'pending_review'
                        ? 'قيد التدقيق'
                        : currentOwner.verificationStatus === 'rejected'
                          ? 'مرفوض'
                          : 'غير موثق'}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {currentOwner.verificationStatus === 'pending_review'
                      ? 'مستنداتك وسندات الملكية قيد الفحص والتدقيق من قِبل إدارة سكنلي. لا يمكن تفعيل نشر أي عقار للطلاب حتى يتم اعتماد التوثيق.'
                      : currentOwner.verificationStatus === 'rejected'
                        ? `سبب الرفض: "${currentOwner.rejectionReason || 'يرجى تصحيح المستندات وإعادة رفعها'}". يرجى تحديث البيانات لإعادة المراجعة.`
                        : 'لحماية الطلاب الجامعيين ومنع الإعلانات الوهمية، يُشترط توثيق هوية المالك وسند ملكية العقار قبل السماح بنشر العقارات في الموقع.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs flex items-center gap-1.5 ${currentOwner.verificationStatus === 'rejected'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-sakanly-primary hover:bg-sakanly-primary-hover text-white'
                  }`}
              >
                <span>
                  {currentOwner.verificationStatus === 'rejected'
                    ? 'إعادة تقديم التوثيق'
                    : currentOwner.verificationStatus === 'pending_review'
                      ? 'متابعة حالة الطلب'
                      : 'استكمال التوثيق الآن'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}

          {/* ========================================================
              TAB 1: OVERVIEW (نظرة عامة)
             ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Responsive Statistics Cards */}
              <OwnerStatsCards
                totalProperties={totalProperties}
                activeProperties={activeProperties}
                viewingRequestsCount={pendingRequestsCount}
                unreadMessagesCount={unreadMessagesCount}
                onCardClick={(tab) => {
                  if (tab === 'properties' || tab === 'active_properties') setActiveTab('properties');
                  if (tab === 'requests') setActiveTab('requests');
                  if (tab === 'messages') setActiveTab('messages');
                }}
              />

              {/* SECTION 1: إدارة قائمة العقارات والوحدات (Prominent full-width section) */}
              <div className="w-full">
                <OwnerPropertiesList
                  properties={properties}
                  owner={currentOwner}
                  onOpenCreate={() => { setEditingProperty(null); setActiveTab('add-property'); }}
                  onToggleStatus={handleTogglePropertyStatus}
                  onDeleteProperty={handleDeleteProperty}
                  onEditProperty={handleEditProperty}
                  onNavigateVerification={() => setActiveTab('verification')}
                />
              </div>

              {/* SECTIONS 2 & 3: الأقسام الرئيسية المتساوية في الأهمية والمستوى (Grid on Desktop, Vertical on Tablet/Mobile) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                {/* ثانياً: الإشعارات والتنبيهات */}
                <div className="w-full flex">
                  <OwnerNotifications
                    notifications={notifications}
                    isLoading={isLoadingData}
                    onMarkAllAsRead={handleMarkAllNotifsAsRead}
                    onMarkAsRead={handleMarkNotifAsRead}
                    onNotificationClick={handleNotificationClick}
                    onRefresh={refreshNotifications}
                    onViewAll={() => setActiveTab('notifications')}
                  />
                </div>

                {/* ثالثاً: طلبات المعاينة الأخيرة */}
                <div className="w-full flex">
                  <RecentViewingRequests
                    requests={requests}
                    onRequestAction={handleRequestAction}
                    onViewAll={() => setActiveTab('requests')}
                    maxItems={20}
                  />
                </div>

              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: PROPERTIES (عقاراتي)
             ======================================================== */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              <OwnerPropertiesList
                properties={properties}
                owner={currentOwner}
                onOpenCreate={() => { setEditingProperty(null); setActiveTab('add-property'); }}
                onToggleStatus={handleTogglePropertyStatus}
                onDeleteProperty={handleDeleteProperty}
                onEditProperty={handleEditProperty}
                onNavigateVerification={() => setActiveTab('verification')}
              />
            </div>
          )}

          {/* ========================================================
              TAB: ADD PROPERTY WIZARD (إضافة عقار جديد - 5 مراحل)
             ======================================================== */}
          {activeTab === 'add-property' && (
            <AddPropertyWizard
              onCancel={() => {
                if (location.pathname === '/owner/properties/new' || location.pathname === '/owner/add-property') {
                  navigate('/owner-dashboard');
                } else {
                  setActiveTab('properties');
                }
              }}
              onSuccess={(newProperty) => {
                setProperties(prev => [newProperty, ...prev]);
                if (location.pathname === '/owner/properties/new' || location.pathname === '/owner/add-property') {
                  navigate('/owner-dashboard');
                } else {
                  setActiveTab('properties');
                }
                showToast('تم إرسال إعلانك بنجاح وجارٍ مراجعته وعرضه للطلاب!');
              }}
              onNavigateVerification={() => {
                if (location.pathname === '/owner/properties/new' || location.pathname === '/owner/add-property') {
                  navigate('/owner/verification');
                } else {
                  setActiveTab('verification');
                }
              }}
              owner={currentOwner}
              token={token}
            />
          )}

          {/* ========================================================
              TAB 3: VIEWING REQUESTS (طلبات المعاينة)
             ======================================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-sakanly-dark flex items-center gap-2">
                      <CalendarClock className="w-5 h-5 text-sakanly-primary" />
                      <span>جميع طلبات المعاينة الواردة</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
                        {requests.length}
                      </span>
                    </h2>
                    <p className="text-xs text-sakanly-muted mt-0.5">
                      إدارة وتأكيد مواعيد حضور الطلاب الجامعيين لمعاينة الشقق والأسِرّة
                    </p>
                  </div>
                </div>

                <RecentViewingRequests
                  requests={requests}
                  onRequestAction={handleRequestAction}
                  maxItems={50}
                />
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: MESSAGES (الرسائل والمحادثات)
             ======================================================== */}
          {activeTab === 'messages' && (
            <OwnerMessagesView
              owner={currentOwner}
              token={token}
              onNavigateRequests={() => setActiveTab('requests')}
            />
          )}

          {/* ========================================================
              TAB: NOTIFICATIONS (الإشعارات المستقلة)
             ======================================================== */}
          {activeTab === 'notifications' && (
            <OwnerNotificationsView
              notifications={notifications}
              isLoading={isLoadingData}
              onMarkAsRead={handleMarkNotifAsRead}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onRefresh={refreshNotifications}
              setActiveTab={setActiveTab}
            />
          )}

          {/* ========================================================
              TAB 5: VERIFICATION (توثيق المالك)
             ======================================================== */}
          {activeTab === 'verification' && (
            <OwnerVerificationView
              owner={currentOwner}
              token={token}
              onVerificationUpdated={(updatedUser) => {
                if (updateUser) updateUser(updatedUser);
              }}
            />
          )}

          {/* ========================================================
              TAB 6: PROFILE (الملف الشخصي للمالك)
             ======================================================== */}
          {activeTab === 'profile' && (
            <div className=" bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                {currentOwner.avatar ? (
                  <img
                    src={currentOwner.avatar}
                    alt={currentOwner.fullName}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-sakanly-primary/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center font-bold text-2xl">
                    {currentOwner.fullName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-sakanly-dark">{currentOwner.fullName}</h3>
                  <p className="text-xs text-sakanly-muted">{currentOwner.email}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    حساب مالك معتمد على منصة سكنلي
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    disabled
                    value={currentOwner.fullName}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="text"
                      disabled
                      value={currentOwner.email}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">رقم الهاتف للتواصل</label>
                      {!isEditingPhone ? (
                        <button
                          type="button"
                          onClick={handleStartEditPhone}
                          className="text-[#0F766E] hover:text-[#0B3D3A] font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCancelEditPhone}
                          disabled={isSavingPhone}
                          className="text-slate-400 hover:text-slate-600 font-bold text-[11px] flex items-center gap-0.5"
                        >
                          <X className="w-3 h-3" />
                          <span>إلغاء</span>
                        </button>
                      )}
                    </div>

                    {!isEditingPhone ? (
                      <input
                        type="text"
                        disabled
                        value={currentOwner.phone || 'لم يُحدد'}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
                        dir="ltr"
                      />
                    ) : (
                      <div className="space-y-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <select
                            disabled={isSavingPhone}
                            value={phoneCountryCodeEdit}
                            onChange={e => setPhoneCountryCodeEdit(e.target.value)}
                            className="w-24 p-2 bg-white border border-slate-200 focus:border-sakanly-primary rounded-xl text-xs font-mono font-bold text-slate-700 outline-none"
                            aria-label="كود الدولة"
                          >
                            <option value="+20">🇪🇬 +20</option>
                            <option value="+966">🇸🇦 +966</option>
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+965">🇰🇼 +965</option>
                            <option value="+962">🇯🇴 +962</option>
                          </select>

                          <input
                            type="tel"
                            disabled={isSavingPhone}
                            value={phoneEditValue}
                            onChange={e => {
                              setPhoneEditValue(e.target.value);
                              if (phoneError) setPhoneError('');
                            }}
                            placeholder={phoneCountryCodeEdit === '+20' ? '01XXXXXXXXX' : 'XXXXXXXX'}
                            className="flex-1 p-2 bg-white border border-slate-200 focus:border-sakanly-primary rounded-xl text-xs font-mono text-slate-800 outline-none"
                            dir="ltr"
                          />
                        </div>

                        {phoneError && (
                          <div className="p-2 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-[11px] flex items-center gap-1 font-medium animate-fade-in">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{phoneError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEditPhone}
                            disabled={isSavingPhone}
                            className="px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveOwnerPhone}
                            disabled={isSavingPhone}
                            className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-sakanly-primary hover:bg-sakanly-primary-hover rounded-lg transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50"
                          >
                            {isSavingPhone ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            <span>حفظ الرقم</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between">
                  <span>نوع الحساب الحالي: <strong>مالك عقار (Owner)</strong></span>
                  <span className="text-emerald-700 font-bold">نشط وموثق</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Create / Edit Property Modal */}
      <CreatePropertyModal
        isOpen={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingProperty(null); }}
        onSubmit={handleSaveProperty}
        initialData={editingProperty}
        ownerName={currentOwner.fullName}
        owner={currentOwner}
      />

    </div>
  );
};
