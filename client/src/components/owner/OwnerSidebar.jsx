import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CalendarCheck, 
  MessageSquare, 
  Bell,
  ShieldCheck, 
  UserCircle2, 
  X, 
  ExternalLink, 
  LogOut, 
  ChevronLeft 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import sakanlyLogo from '../../assets/sakanly-logo.png';

export const OwnerSidebar = ({
  activeTab,
  setActiveTab,
  owner,
  unreadMessagesCount = 0,
  pendingRequestsCount = 0,
  unreadNotifsCount = 0,
  mobileOpen = false,
  setMobileOpen,
  onLogout,
}) => {
  const navigate = useNavigate();
  const navItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: LayoutDashboard,
    },
    {
      id: 'properties',
      label: 'عقاراتي',
      icon: Building2,
    },
    {
      id: 'requests',
      label: 'طلبات المعاينة',
      icon: CalendarCheck,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'messages',
      label: 'الرسائل',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      badgeColor: 'bg-teal-400 text-slate-950 font-bold',
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'verification',
      label: 'التوثيق',
      icon: ShieldCheck,
      verifiedDot: owner?.isVerified,
    },
    {
      id: 'profile',
      label: 'الملف الشخصي',
      icon: UserCircle2,
    },
  ];

  const handleNavClick = (tabId) => {
    if (tabId === 'properties') {
      navigate('/owner/properties');
    } else if (tabId === 'overview') {
      navigate('/owner-dashboard');
    } else if (tabId === 'notifications') {
      navigate('/owner-dashboard/notifications');
    } else if (tabId === 'verification') {
      navigate('/owner/verification');
    } else if (tabId === 'messages') {
      navigate('/owner/messages');
    }
    setActiveTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-5 text-white bg-[#0B3D3A] overflow-y-auto selection:bg-amber-400 selection:text-slate-900">
      {/* Top Header & Owner Info */}
      <div className="space-y-6">
        {/* Brand / Logo & Mobile Close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link to="/" className="inline-flex items-center group py-0.5" aria-label="سكنلي Sakanly - الصفحة الرئيسية">
            <img
              src={sakanlyLogo}
              alt="سكنلي Sakanly"
              className="w-[135px] sm:w-[145px] h-auto max-h-[38px] object-contain group-hover:opacity-95 transition-opacity"
            />
          </Link>

          {/* Close button for Mobile Drawer */}
          {setMobileOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Owner Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center gap-3">
          {owner?.avatar ? (
            <img
              src={owner.avatar}
              alt={owner.fullName || 'المالك'}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-teal-400/40 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-teal-700/60 text-white flex items-center justify-center font-bold text-lg shrink-0">
              {owner?.fullName ? owner.fullName.charAt(0) : 'م'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm text-white truncate">
              {owner?.fullName || 'م. أحمد الشناوي'}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              {owner?.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  مالك معتمد
                </span>
              ) : owner?.verificationStatus === 'pending_review' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  قيد المراجعة
                </span>
              ) : owner?.verificationStatus === 'rejected' ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-rose-300 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  التوثيق مرفوض
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-200/90 font-semibold">
                  غير موثق
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="روابط لوحة المالك">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === 'add-property' && item.id === 'properties');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-[#0B3D3A] font-bold shadow-md shadow-black/10'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-[#0F766E]' : 'text-teal-300/80'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronLeft className="w-3.5 h-3.5 text-[#0F766E]" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-6 border-t border-white/10 space-y-2">
        <Link
          to="/browse"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-teal-300" />
            معاينة الموقع كطالب
          </span>
          <span className="text-[10px] text-white/40">sakanly.com</span>
        </Link>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed / Permanent Sidebar */}
      <aside className="hidden md:block w-[265px] shrink-0 min-h-[calc(100vh-64px)] border-l border-slate-200/50 shadow-sm">
        <div className="sticky top-16 h-[calc(100vh-64px)] overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" dir="rtl">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
