import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { messagesApi } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';

export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites } = useFavorites();
  const { user, token, isAuthenticated } = useAuth();
  const isOwner = Boolean(isAuthenticated && user && user.role === 'owner');

  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadMessages(0);
      return;
    }
    const fetchUnread = () => {
      const activeToken = token || localStorage.getItem('sakanly_token');
      messagesApi
        .getUnreadCount(activeToken)
        .then((count) => {
          setUnreadMessages(count || 0);
        })
        .catch(() => {});
    };
    fetchUnread();

    const socket = getSocket(token);
    const handleUpdate = () => fetchUnread();
    socket.on('new_message', handleUpdate);
    socket.on('conversation_updated', handleUpdate);
    socket.on('conversation_read', handleUpdate);

    return () => {
      socket.off('new_message', handleUpdate);
      socket.off('conversation_updated', handleUpdate);
      socket.off('conversation_read', handleUpdate);
    };
  }, [isAuthenticated, token]);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sakanly-border py-1.5 px-2 safe-area-bottom shadow-lg">
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        
        {/* 1. Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
              isActive ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">الرئيسية</span>
        </NavLink>

        {/* 2. Search / Browse */}
        <NavLink
          to="/browse"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
              isActive ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight">استكشاف</span>
        </NavLink>

        {/* 3. Messages */}
        <button
          type="button"
          aria-label="الرسائل والمحادثات"
          onClick={() => {
            if (!isAuthenticated) {
              navigate('/login?redirect=/messages', {
                state: {
                  from: '/messages',
                  message: 'سجّل دخولك للاطلاع على محادثاتك ورسائلك.',
                },
              });
              return;
            }
            navigate('/messages');
          }}
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg relative transition-colors ${
            location.pathname.startsWith('/messages') ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 mb-0.5" />
            {unreadMessages > 0 && isAuthenticated && (
              <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">الرسائل</span>
        </button>

        {/* 4. Favorites */}
        <button
          type="button"
          aria-label="المفضلة"
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
          className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg relative transition-colors ${
            location.search.includes('favoritesOnly=true') ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5 mb-0.5" />
            {favorites.length > 0 && isAuthenticated && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-sakanly-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-tight">المفضلة</span>
        </button>

        {/* 5. Account or Owner Dashboard */}
        {isOwner ? (
          <NavLink
            to="/owner-dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
                isActive ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5 text-teal-700" />
            <span className="text-[11px] leading-tight">لوحة المالك</span>
          </NavLink>
        ) : (
          <NavLink
            to={isAuthenticated ? "/profile" : "/login"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors ${
                isActive ? 'text-sakanly-primary font-bold' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight">{isAuthenticated ? 'حسابي' : 'دخول'}</span>
          </NavLink>
        )}

      </div>
    </nav>
  );
};

export default MobileBottomNav;
