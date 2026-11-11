import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Bed,
  HelpCircle,
  PlusCircle,
  Menu,
  X,
  Heart,
  User,
  LogOut,
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { messagesApi } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import sakanlyLogo from '../../assets/sakanly-logo.png';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { user, token, isAuthenticated, logout } = useAuth();

  const isHome = location.pathname === '/';
  const isActive = (path) => location.pathname === path;

  // Track scroll state for smooth navbar transitions
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Handle Owner Dashboard Access logic
  const handleOwnerAccess = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);

    if (isAuthenticated && user?.role === 'owner') {
      // Logged in owner -> direct access
      navigate('/owner-dashboard');
    } else if (isAuthenticated && user?.role === 'super_admin') {
      navigate('/control-center');
    } else if (isAuthenticated) {
      // Logged in student -> route guard displays helpful unauthorized notice
      navigate('/owner-dashboard');
    } else {
      // Unauthenticated guest -> redirect to login with return destination
      navigate('/login?redirect=/owner-dashboard', { state: { from: '/owner-dashboard' } });
    }
  };

  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return;
    }
    let isMounted = true;
    const fetchUnread = () => {
      const activeToken = token || localStorage.getItem('sakanly_token');
      messagesApi
        .getUnreadCount(activeToken)
        .then((count) => {
          if (isMounted) {
            setUnreadMessages(count || 0);
          }
        })
        .catch(() => { });
    };
    fetchUnread();

    const socket = getSocket(token);
    const handleUpdate = () => fetchUnread();
    socket?.on('new_message', handleUpdate);
    socket?.on('conversation_updated', handleUpdate);
    socket?.on('conversation_read', handleUpdate);

    return () => {
      isMounted = false;
      socket?.off('new_message', handleUpdate);
      socket?.off('conversation_updated', handleUpdate);
      socket?.off('conversation_read', handleUpdate);
    };
  }, [isAuthenticated, token]);

  // Determine navbar styling based on route and scroll position
  const isTransparentHero = isHome && !scrolled;

  const headerClasses = isHome
    ? `fixed top-0 inset-x-0 z-50 h-[75px] transition-all duration-300 ${scrolled
      ? 'bg-[#0B3D3A]/95 backdrop-blur-md shadow-lg border-b border-white/10 text-white'
      : 'bg-transparent text-white'
    }`
    : 'sticky top-0 inset-x-0 z-50 h-[75px] bg-white/95 backdrop-blur-md border-b border-sakanly-border shadow-sm text-sakanly-text';

  const isOwnerUser = Boolean(isAuthenticated && user && user.role === 'owner');
  const isStudentUser = Boolean(isAuthenticated && user && user.role === 'student');

  return (
    <header className={headerClasses} dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-[75px]">

          {/* Right Section: Official Sakanly Logo */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center group py-1" aria-label="سكنلي Sakanly - الصفحة الرئيسية">
              <img
                src={sakanlyLogo}
                alt="سكنلي Sakanly"
                className="w-[125px] sm:w-[135px] md:w-[155px] lg:w-[175px] h-[36px] sm:h-[40px] md:h-[44px] object-contain group-hover:opacity-95 transition-all rounded-lg"
              />
            </Link>
          </div>

          {/* Center Navigation Links (Desktop: 14px font, relaxed gap) */}
          <nav className="hidden md:flex items-center gap-7 sm:gap-8">
            <Link
              to="/"
              className={`text-[14px] font-semibold transition-all relative py-1 ${isTransparentHero || (isHome && scrolled)
                ? isActive('/')
                  ? 'text-[#F59E0B] font-bold'
                  : 'text-white/90 hover:text-white'
                : isActive('/')
                  ? 'text-sakanly-primary font-bold'
                  : 'text-sakanly-text hover:text-sakanly-primary'
                }`}
            >
              الرئيسية
              {isActive('/') && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#F59E0B] rounded-full" />
              )}
            </Link>

            <Link
              to="/browse"
              className={`text-[14px] font-semibold transition-all relative py-1 ${isTransparentHero || (isHome && scrolled)
                ? isActive('/browse')
                  ? 'text-[#F59E0B] font-bold'
                  : 'text-white/90 hover:text-white'
                : isActive('/browse')
                  ? 'text-sakanly-primary font-bold'
                  : 'text-sakanly-text hover:text-sakanly-primary'
                }`}
            >
              تصفح السكن
              {isActive('/browse') && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#F59E0B] rounded-full" />
              )}
            </Link>

            <Link
              to="/beds"
              className={`text-[14px] font-semibold transition-all relative py-1 flex items-center gap-1.5 ${isTransparentHero || (isHome && scrolled)
                ? isActive('/beds')
                  ? 'text-[#F59E0B] font-bold'
                  : 'text-white/90 hover:text-white'
                : isActive('/beds')
                  ? 'text-sakanly-primary font-bold'
                  : 'text-sakanly-text hover:text-sakanly-primary'
                }`}
            >
              أسرّة فردية
              {isActive('/beds') && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#F59E0B] rounded-full" />
              )}
            </Link>

            <Link
              to="/how-it-works"
              className={`text-[14px] font-semibold transition-all relative py-1 ${isTransparentHero || (isHome && scrolled)
                ? isActive('/how-it-works')
                  ? 'text-[#F59E0B] font-bold'
                  : 'text-white/90 hover:text-white'
                : isActive('/how-it-works')
                  ? 'text-sakanly-primary font-bold'
                  : 'text-sakanly-text hover:text-sakanly-primary'
                }`}
            >
              كيف نعمل؟
              {isActive('/how-it-works') && (
                <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#F59E0B] rounded-full" />
              )}
            </Link>
          </nav>

          {/* Left Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">

            {/* Favorites Icon */}
            <button
              type="button"
              aria-label="قائمة المفضلة"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login?redirect=/browse?favoritesOnly=true', {
                    state: {
                      from: '/browse?favoritesOnly=true',
                      action: 'favorites',
                      message: 'سجّل دخولك للاستفادة من هذه الخدمة واستعراض قائمة المفضلة.',
                    },
                  });
                  return;
                }
                navigate('/browse?favoritesOnly=true');
              }}
              className={`relative p-2 rounded-full transition-colors hidden sm:flex ${isTransparentHero || (isHome && scrolled)
                ? 'text-white/80 hover:text-white hover:bg-white/10'
                : 'text-slate-600 hover:text-sakanly-primary hover:bg-slate-100'
              }`}
              title="المفضلة"
              >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && isAuthenticated && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#F59E0B] text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Direct Messages Icon Button */}
            {isAuthenticated && (
              <Link
                to="/messages"
                aria-label="المحادثات والرسائل"
                className={`relative p-2 rounded-full transition-colors hidden sm:flex ${isTransparentHero || (isHome && scrolled)
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-[#0F766E] hover:bg-slate-100'
                  }`}
                title="المحادثات والرسائل"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#0F766E] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-up">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            )}

            {/* Dedicated Owner Access Button on Navbar (Visible for Owner or Guest, hidden for Student) */}
            {!isStudentUser && (
              isOwnerUser ? (
                <Link
                  to="/owner-dashboard"
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-teal-800 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-98 shrink-0"
                >
                  <LayoutDashboard className="w-4 h-4 text-teal-200 shrink-0" />
                  <span>لوحة تحكم المالك</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleOwnerAccess}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-[13px] font-bold transition-all shrink-0 ${isTransparentHero || (isHome && scrolled)
                    ? 'text-white hover:bg-white/10 border border-white/20'
                    : 'text-[#0F766E] hover:text-[#0B3D3A] hover:bg-teal-50 border border-teal-600/30'
                    }`}
                  title="الوصول إلى لوحة تحكم المالك"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>لوحة تحكم المالك</span>
                </button>
              )
            )}

            {/* User Profile Dropdown or Login Link */}
            {isAuthenticated && user ? (
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  type="button"
                  aria-label="قائمة حساب المستخدم"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all ${isTransparentHero || (isHome && scrolled)
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    : 'border-teal-200 bg-teal-50 text-sakanly-primary hover:bg-teal-100/70'
                    }`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-sakanly-primary text-white flex items-center justify-center text-[10px]">
                      {user.fullName?.charAt(0) || 'م'}
                    </div>
                  )}
                  <span className="max-w-[100px] truncate">{user.fullName?.split(' ')[0]}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-fade-in text-right font-cairo"
                    dir="rtl"
                  >
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {user.fullName?.charAt(0) || 'م'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-slate-900">{user.fullName}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${user.role === 'super_admin'
                          ? 'bg-emerald-950 text-emerald-300'
                          : user.role === 'owner'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-teal-100 text-teal-800'
                          }`}>
                          {user.role === 'super_admin' ? 'صاحب المنصة (Super Admin)' : user.role === 'owner' ? 'مالك عقار' : 'طالب جامعي'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Links inside Dropdown */}
                    <div className="p-1.5 space-y-0.5 text-xs">
                      {user.role === 'super_admin' ? (
                        <Link
                          to="/control-center"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-[#0F766E] hover:bg-teal-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#0F766E]" />
                          <span>مركز تحكم المنصة</span>
                        </Link>
                      ) : user.role === 'owner' ? (
                        <>
                          <Link
                            to="/owner-dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold text-[#0F766E] hover:bg-teal-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#0F766E]" />
                            <span>لوحة تحكم المالك</span>
                          </Link>
                          <Link
                            to="/owner/properties"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Building2 className="w-4 h-4 text-slate-500" />
                            <span>عقاراتي</span>
                          </Link>
                          <Link
                            to="/owner/verification"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-500" />
                            <span>توثيق المالك</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/browse?favoritesOnly=true"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Heart className="w-4 h-4 text-slate-500" />
                            <span>السكن المحفوظ (المفضلة)</span>
                          </Link>
                          <Link
                            to="/browse"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Compass className="w-4 h-4 text-slate-500" />
                            <span>تصفح السكن</span>
                          </Link>
                        </>
                      )}

                      <Link
                        to="/messages"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-teal-50 hover:text-[#0F766E] font-medium transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <span>المحادثات والرسائل</span>
                        </div>
                        {unreadMessages > 0 && (
                          <span className="text-[10px] font-bold bg-[#0F766E] text-white px-1.5 py-0.2 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>

                      <div className="border-t border-slate-100 my-1" />

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className={`text-sm font-semibold transition-colors hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg ${isTransparentHero || (isHome && scrolled)
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-sakanly-text hover:text-sakanly-primary'
                  }`}
              >
                تسجيل الدخول
              </Link>
            )}

            {/* Gold CTA Button: «اعرض عقارك مجاناً» - Only visible in Owner interface */}
            {/* {isOwnerUser && (
              <button
                type="button"
                onClick={handleOwnerAccess}
                className="inline-flex items-center justify-center text-xs sm:text-sm font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 active:bg-amber-500 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
              >
                <span>اعرض عقارك مجاناً</span>
              </button>
            )} */}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors focus:outline-none ${isTransparentHero || (isHome && scrolled)
                ? 'text-white hover:bg-white/10'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/20 bg-[#0B3D3A] text-white px-5 pt-4 pb-6 space-y-3 shadow-2xl animate-fade-in font-cairo">

          {/* Mobile Owner Dashboard Button for Owners only */}
          {isOwnerUser && (
            <button
              type="button"
              onClick={handleOwnerAccess}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold text-emerald-200 bg-emerald-950/70 border border-emerald-500/40 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                <span>لوحة تحكم المالك</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                لوحة التحكم
              </span>
            </button>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${isActive('/') ? 'text-[#F59E0B] bg-white/10' : 'text-white/90 hover:bg-white/5'
              }`}
          >
            <Home className="w-5 h-5 text-[#F59E0B]" />
            الرئيسية
          </Link>
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${isActive('/browse') ? 'text-[#F59E0B] bg-white/10' : 'text-white/90 hover:bg-white/5'
              }`}
          >
            <Compass className="w-5 h-5 text-[#F59E0B]" />
            تصفح السكن
          </Link>
          <Link
            to="/beds"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold ${isActive('/beds') ? 'text-[#F59E0B] bg-white/10' : 'text-white/90 hover:bg-white/5'
              }`}
          >
            <div className="flex items-center gap-3">
              <Bed className="w-5 h-5 text-[#F59E0B]" />
              أسرّة فردية
            </div>
            <span className="bg-[#F59E0B] text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              اقتصادي
            </span>
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold ${isActive('/how-it-works') ? 'text-[#F59E0B] bg-white/10' : 'text-white/90 hover:bg-white/5'
              }`}
          >
            <HelpCircle className="w-5 h-5 text-[#F59E0B]" />
            كيف نعمل؟
          </Link>

          {/* Account actions in mobile drawer */}
          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.fullName?.charAt(0) || 'م'}
                    </div>
                  )}
                  <div>
                    <span className="block text-xs font-bold text-white">{user.fullName}</span>
                    <span className="block text-[10px] text-teal-200">
                      {user.role === 'owner' ? 'مالك عقار' : 'طالب جامعي'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/20 text-xs font-bold text-rose-300 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl transition-colors"
              >
                انضم إلينا
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
