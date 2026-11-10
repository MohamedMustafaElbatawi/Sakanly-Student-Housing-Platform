import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  ArrowRight,
  Building,
  Home,
  User,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Paperclip,
  Smile,
} from 'lucide-react';
import { messagesApi, mediaApi, propertyApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getSocket } from '../services/socket.js';

export const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();

  // SEO / Page Title
  useEffect(() => {
    document.title = 'المحادثات والرسائل | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(conversationId || null);
  const [activeConv, setActiveConv] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Photo Attachment State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Typing & Online States
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Keep selectedConvId in sync with URL parameter
  useEffect(() => {
    if (conversationId && conversationId !== selectedConvId) {
      setSelectedConvId(conversationId);
    }
  }, [conversationId]);

  // Load all user's conversations
  const fetchConversations = async () => {
    if (!isAuthenticated) return;
    setLoadingList(true);
    setLoadError('');
    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const list = await messagesApi.getConversations(activeToken);
      setConversations(list || []);

      // On desktop, auto-select first conversation if none selected
      if (!selectedConvId && list && list.length > 0 && window.innerWidth >= 1024) {
        setSelectedConvId(list[0].id);
        navigate(`/messages/${list[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setLoadError(err.message || 'فشل جلب قائمة المحادثات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [isAuthenticated, token]);

  // Fetch active conversation details & mark as read
  useEffect(() => {
    if (!selectedConvId || !isAuthenticated) {
      setActiveConv(null);
      return;
    }

    let isMounted = true;
    const fetchActiveConversation = async () => {
      setLoadingConv(true);
      try {
        const activeToken = token || localStorage.getItem('sakanly_token');
        const conv = await messagesApi.getConversationById(selectedConvId, activeToken);
        if (isMounted) {
          setActiveConv(conv);
          // Update unread count in conversations list locally
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConvId
                ? {
                    ...c,
                    unreadCount: 0,
                    unreadCountStudent: user?.role === 'student' ? 0 : c.unreadCountStudent,
                    unreadCountOwner: user?.role === 'owner' ? 0 : c.unreadCountOwner,
                  }
                : c
            )
          );
        }
      } catch (err) {
        console.error('Error loading active conversation:', err);
      } finally {
        if (isMounted) setLoadingConv(false);
      }
    };

    fetchActiveConversation();

    return () => {
      isMounted = false;
    };
  }, [selectedConvId, isAuthenticated, token]);

  // Real-time Socket.IO Connection & Listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    const activeToken = token || localStorage.getItem('sakanly_token');
    const socket = getSocket(activeToken);

    if (selectedConvId) {
      socket.emit('join_conversation', selectedConvId);
    }

    const handleNewMessage = ({ conversationId: msgConvId, message, conversation: updatedConv }) => {
      // 1. If message belongs to active open chat:
      if (selectedConvId && msgConvId === selectedConvId) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          // Avoid duplicate messages
          if (prev.messages?.some((m) => m.id === message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), message],
            lastMessage: message.text || (message.attachments?.length ? '📷 صورة مرفقة' : ''),
            lastMessageTime: 'الآن',
          };
        });

        // Mark as read immediately on viewing
        const currentToken = token || localStorage.getItem('sakanly_token');
        messagesApi.markAsRead(selectedConvId, currentToken).catch(() => {});
      }

      // 2. Update conversations list
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === msgConvId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          const target = { ...updated[existingIdx] };
          target.lastMessage = message.text || (message.attachments?.length ? '📷 صورة مرفقة' : '');
          target.lastMessageTime = 'الآن';
          if (selectedConvId !== msgConvId) {
            target.unreadCount = (target.unreadCount || 0) + 1;
            if (user?.role === 'owner') {
              target.unreadCountOwner = (target.unreadCountOwner || 0) + 1;
            } else {
              target.unreadCountStudent = (target.unreadCountStudent || 0) + 1;
            }
          }
          // Move to top
          updated.splice(existingIdx, 1);
          return [target, ...updated];
        } else if (updatedConv) {
          return [updatedConv, ...prev];
        }
        return prev;
      });
    };

    const handleConversationRead = ({ conversationId: readConvId, readByUserId }) => {
      if (selectedConvId && readConvId === selectedConvId && readByUserId !== user?.id) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          const updatedMsgs = (prev.messages || []).map((m) => ({ ...m, read: true }));
          return { ...prev, messages: updatedMsgs };
        });
      }
    };

    const handleUserTyping = ({ conversationId: typingConvId, isTyping }) => {
      if (selectedConvId && typingConvId === selectedConvId) {
        setIsOtherTyping(Boolean(isTyping));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_read', handleConversationRead);
    socket.on('user_typing', handleUserTyping);

    return () => {
      if (selectedConvId) {
        socket.emit('leave_conversation', selectedConvId);
      }
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_read', handleConversationRead);
      socket.off('user_typing', handleUserTyping);
    };
  }, [selectedConvId, isAuthenticated, token, user?.id, user?.role]);

  // Auto-scroll to bottom of messages stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages, isOtherTyping]);

  // Handle typing indicator emission
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    const activeToken = token || localStorage.getItem('sakanly_token');
    const socket = getSocket(activeToken);

    if (selectedConvId && socket) {
      socket.emit('typing', { conversationId: selectedConvId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId: selectedConvId, isTyping: false });
      }, 2000);
    }
  };

  // Image Selection & Safe Preview
  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يسمح فقط بإرفاق الصور (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('الحد الأقصى لحجم الصورة هو 10MB.');
      return;
    }

    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleClearImage = () => {
    if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send Message Handler
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !selectedFile) || sending || !selectedConvId) return;

    setSending(true);
    let attachments = [];

    try {
      const activeToken = token || localStorage.getItem('sakanly_token');

      // 1. Upload photo attachment if chosen
      if (selectedFile) {
        setUploadingAttachment(true);
        const uploaded = await mediaApi.uploadMedia([selectedFile], { folderType: 'property_image' }, activeToken);
        if (uploaded && uploaded.length > 0) {
          attachments = uploaded.map((u) => ({
            url: u.secure_url || u.url,
            secure_url: u.secure_url || u.url,
            public_id: u.public_id,
            format: u.format || 'jpg',
            bytes: u.bytes,
            name: selectedFile.name,
            resource_type: 'image',
          }));
        }
      }

      // 2. Send message payload to Backend
      const res = await messagesApi.sendMessage(
        selectedConvId,
        {
          text: messageText.trim(),
          attachments,
        },
        activeToken
      );

      // 3. Reset states
      setMessageText('');
      handleClearImage();

      // 4. Update UI optimistically
      if (res?.message) {
        setActiveConv((prev) => {
          if (!prev) return prev;
          if (prev.messages?.some((m) => m.id === res.message.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), res.message],
            lastMessage: res.message.text || '📷 صورة مرفقة',
            lastMessageTime: 'الآن',
          };
        });
      }

      // 5. Turn off typing status
      const socket = getSocket(activeToken);
      if (socket) socket.emit('typing', { conversationId: selectedConvId, isTyping: false });
    } catch (err) {
      alert(err.message || 'فشل إرسال الرسالة. يرجى التحقق من اتصالك.');
    } finally {
      setSending(false);
      setUploadingAttachment(false);
      chatInputRef.current?.focus();
    }
  };

  // Filter conversations by search term
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const otherName = user?.role === 'owner' ? c.studentName : c.ownerName;
      return (
        (otherName && otherName.toLowerCase().includes(q)) ||
        (c.propertyTitle && c.propertyTitle.toLowerCase().includes(q)) ||
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    });
  }, [conversations, searchQuery, user?.role]);

  // Group messages by day for beautiful separators
  const groupedMessages = useMemo(() => {
    if (!activeConv || !activeConv.messages) return [];
    const groups = [];
    let currentDay = '';

    activeConv.messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || Date.now());
      const dayKey = msgDate.toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      if (dayKey !== currentDay) {
        currentDay = dayKey;
        groups.push({ type: 'day_divider', dateString: dayKey });
      }
      groups.push({ type: 'message', data: msg });
    });

    return groups;
  }, [activeConv?.messages]);

  // Determine other party details
  const otherParty = useMemo(() => {
    if (!activeConv) return null;
    const isOwner = user?.role === 'owner';
    return {
      name: isOwner ? activeConv.studentName || 'الطالب' : activeConv.ownerName || 'مالك العقار',
      avatar: isOwner ? activeConv.studentAvatar : activeConv.ownerAvatar,
      phone: activeConv.ownerPhone || '',
      roleLabel: isOwner ? 'طالب جامعي' : 'مالك معتمد',
    };
  }, [activeConv, user?.role]);

  return (
    <div className="min-h-[calc(100vh-75px)] bg-slate-50 flex flex-col font-cairo" dir="rtl">
      <div className="max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex-1 flex flex-col">
        {/* Main 2-Column Chat Container */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex-1 flex overflow-hidden min-h-[580px] lg:min-h-[660px]">
          {/* =========================================================
              COLUMN 1: Conversations List
              (Hidden on mobile when a chat is open)
             ========================================================= */}
          <aside
            className={`
              w-full lg:w-[380px] shrink-0 border-l border-slate-200 flex flex-col bg-white
              ${selectedConvId ? 'hidden lg:flex' : 'flex'}
            `}
          >
            {/* Conversations Header */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-slate-800">المحادثات والرسائل</h1>
                    <p className="text-[11px] text-slate-500">
                      تواصل مباشر وموثق بين الطلاب وملاك العقارات
                    </p>
                  </div>
                </div>

                {conversations.length > 0 && (
                  <span className="text-xs font-bold text-[#0F766E] bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                    {conversations.length} محادثة
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ابحث باسم الطرف الآخر أو العقار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0F766E] focus:ring-2 focus:ring-teal-500/15 outline-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversations Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingList ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
                  <span className="text-xs font-bold">جارٍ تحميل المحادثات...</span>
                </div>
              ) : loadError ? (
                <div className="p-6 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">{loadError}</p>
                  <button
                    type="button"
                    onClick={fetchConversations}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة المحاولة</span>
                  </button>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 text-center text-slate-400 px-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">لا توجد محادثات بعد</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {user?.role === 'owner'
                      ? 'عندما يتواصل معك طالب بشأن أحد عقاراتك، ستظهر محادثته هنا.'
                      : 'تصفح العقارات واضغط «تواصل شات مع المالك» لبدء محادثتك الأولى.'}
                  </p>
                  {user?.role !== 'owner' && (
                    <Link
                      to="/browse"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline pt-2"
                    >
                      <span>تصفح السكن الطلابي</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConvId === conv.id;
                  const isOwner = user?.role === 'owner';
                  const otherName = isOwner
                    ? conv.studentName || 'طالب سكنلي'
                    : conv.ownerName || 'مالك العقار';
                  const otherAvatar = isOwner ? conv.studentAvatar : conv.ownerAvatar;
                  const unread = isOwner
                    ? conv.unreadCountOwner ?? conv.unreadCount ?? 0
                    : conv.unreadCountStudent ?? conv.unreadCount ?? 0;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConvId(conv.id);
                        navigate(`/messages/${conv.id}`);
                      }}
                      className={`
                        p-3.5 flex items-start gap-3 cursor-pointer transition-all border-r-4 select-none
                        ${
                          isSelected
                            ? 'bg-teal-50/60 border-r-[#0F766E]'
                            : 'border-r-transparent hover:bg-slate-50/80'
                        }
                      `}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {otherAvatar ? (
                          <img
                            src={otherAvatar}
                            alt={otherName}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                otherName
                              )}&background=0F766E&color=fff`;
                            }}
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-teal-100 text-[#0F766E] font-bold text-sm flex items-center justify-center border border-teal-200">
                            {otherName.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info & Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h3 className="font-bold text-xs text-slate-800 truncate">
                            {otherName}
                          </h3>
                          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                            {conv.lastMessageTime || ''}
                          </span>
                        </div>

                        {/* Property Title Tag */}
                        {conv.propertyTitle && (
                          <p className="text-[10px] text-[#0F766E] truncate font-medium flex items-center gap-1 mb-1">
                            <Building className="w-3 h-3 shrink-0 opacity-70" />
                            <span className="truncate">{conv.propertyTitle}</span>
                          </p>
                        )}

                        {/* Last Message Preview */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-500 truncate font-normal">
                            {conv.lastMessage || 'بدء المحادثة'}
                          </p>
                          {unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#0F766E] text-white text-[10px] font-bold flex items-center justify-center shrink-0 animate-scale-up">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* =========================================================
              COLUMN 2: Active Selected Conversation Pane
              (Visible full screen on mobile when a chat is selected)
             ========================================================= */}
          <main
            className={`
              flex-1 flex flex-col bg-white min-w-0
              ${!selectedConvId ? 'hidden lg:flex' : 'flex'}
            `}
          >
            {selectedConvId && activeConv ? (
              <>
                {/* 1. Chat Top Header */}
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back Button on Mobile */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConvId(null);
                        navigate('/messages');
                      }}
                      className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                      title="الرجوع لقائمة المحادثات"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Participant Avatar */}
                    <div className="relative shrink-0">
                      {otherParty?.avatar ? (
                        <img
                          src={otherParty.avatar}
                          alt={otherParty.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 text-[#0F766E] font-bold text-sm flex items-center justify-center">
                          {otherParty?.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>

                    {/* Participant Name & Status */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {otherParty?.name}
                        </h2>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                          {otherParty?.roleLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        {isOtherTyping ? 'يكتب الآن...' : 'متصل بالمنصة'}
                      </p>
                    </div>
                  </div>

                  {/* Right Header CTAs */}
                  <div className="flex items-center gap-2">
                    {activeConv.propertyId && (
                      <Link
                        to={`/property/${activeConv.propertyId}`}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F766E] text-xs font-bold border border-teal-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>صفحة العقار</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* 2. Property Mini-Card Banner */}
                {activeConv.propertyId && (
                  <div className="p-2.5 sm:p-3 bg-teal-50/50 border-b border-teal-100 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {activeConv.propertyImage ? (
                        <img
                          src={activeConv.propertyImage}
                          alt={activeConv.propertyTitle}
                          className="w-12 h-10 rounded-lg object-cover shrink-0 border border-teal-200"
                        />
                      ) : (
                        <div className="w-12 h-10 rounded-lg bg-teal-100 text-[#0F766E] flex items-center justify-center shrink-0">
                          <Home className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-slate-800 truncate">
                          {activeConv.propertyTitle}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {activeConv.propertyType === 'entire_apartment'
                            ? 'شقة كاملة'
                            : activeConv.propertyType === 'private_room'
                            ? 'غرفة خاصة'
                            : activeConv.propertyType === 'individual_bed'
                            ? 'سرير فردي'
                            : 'سكن مشترك'}
                          {activeConv.propertyPrice > 0 && (
                            <span className="text-[#0F766E] font-bold mr-2">
                              • {activeConv.propertyPrice.toLocaleString()} ج.م / شهرياً
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/property/${activeConv.propertyId}`}
                      className="text-xs font-bold text-[#0F766E] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>عرض تفاصيل العقار</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* 3. Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
                  {loadingConv ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0F766E]" />
                      <span className="text-xs font-bold">جارٍ تحميل الرسائل...</span>
                    </div>
                  ) : groupedMessages.length === 0 ? (
                    <div className="py-20 text-center text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">
                        لا توجد رسائل سابقة في هذه المحادثة
                      </p>
                      <p className="text-[11px] text-slate-400">
                        أرسل استفسارك الأول للمالك وسيتلقى إشعاراً فورياً للرد عليك.
                      </p>
                    </div>
                  ) : (
                    groupedMessages.map((item, index) => {
                      if (item.type === 'day_divider') {
                        return (
                          <div key={`day-${index}`} className="flex items-center justify-center my-3">
                            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-full text-[10px] font-bold shadow-2xs">
                              {item.dateString}
                            </span>
                          </div>
                        );
                      }

                      const msg = item.data;
                      const isCurrentUser =
                        (user?.role === 'owner' && msg.sender === 'owner') ||
                        (user?.role === 'student' && msg.sender === 'student') ||
                        msg.senderId === user?.id;

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex flex-col ${
                            isCurrentUser ? 'items-start' : 'items-end'
                          }`}
                        >
                          {/* Bubble Container */}
                          <div
                            className={`
                              max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs space-y-1.5 transition-all
                              ${
                                isCurrentUser
                                  ? 'bg-[#0B3D3A] text-white rounded-tr-xs'
                                  : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                              }
                            `}
                          >
                            {/* Sender Name if not current user */}
                            {!isCurrentUser && (
                              <p className="text-[10px] font-bold text-[#0F766E]">
                                {msg.senderName}
                              </p>
                            )}

                            {/* Attached Image if present */}
                            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div className="space-y-1 rounded-xl overflow-hidden pt-0.5">
                                {msg.attachments.map((att, aIdx) => (
                                  <a
                                    key={aIdx}
                                    href={att.secure_url || att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block relative rounded-lg overflow-hidden border border-white/20"
                                  >
                                    <img
                                      src={att.secure_url || att.url}
                                      alt="مرفق"
                                      className="max-h-60 w-full object-cover rounded-lg hover:opacity-95 transition-opacity"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Message Text */}
                            {msg.text && (
                              <p className="text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            )}

                            {/* Timestamp & Read Receipt */}
                            <div
                              className={`flex items-center gap-1 justify-end text-[10px] ${
                                isCurrentUser ? 'text-teal-200/70' : 'text-slate-400'
                              }`}
                            >
                              <span>{msg.time || ''}</span>
                              {isCurrentUser && (
                                <span>
                                  {msg.read ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Live typing indicator */}
                  {isOtherTyping && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse py-1">
                      <div className="w-6 h-6 rounded-full bg-teal-100 text-[#0F766E] font-bold text-[10px] flex items-center justify-center">
                        {otherParty?.name.charAt(0)}
                      </div>
                      <div className="bg-white border border-slate-200 rounded-full px-3 py-1 flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-bounce" />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#0F766E] animate-bounce"
                          style={{ animationDelay: '0.4s' }}
                        />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 4. Chat Input Bar (Sticky at Bottom) */}
                <div className="p-3 sm:p-4 border-t border-slate-200 bg-white space-y-2">
                  {/* Selected image preview before sending */}
                  {imagePreviewUrl && (
                    <div className="relative inline-flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                      <img
                        src={imagePreviewUrl}
                        alt="معاينة الصورة"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="text-[11px] text-slate-600 font-bold truncate max-w-[150px]">
                        {selectedFile?.name}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="p-1 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                        title="إلغاء الصورة"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hidden file input for photos */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelected}
                    className="hidden"
                  />

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploadingAttachment}
                      className="p-2.5 text-slate-500 hover:text-[#0F766E] hover:bg-teal-50 rounded-xl border border-slate-200 transition-colors shrink-0 disabled:opacity-50"
                      title="إرفاق صورة"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 relative">
                      <input
                        ref={chatInputRef}
                        type="text"
                        placeholder="اكتب رسالتك هنا... (اضغط Enter للإرسال)"
                        value={messageText}
                        onChange={handleInputChange}
                        disabled={sending}
                        className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F766E] focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={(!messageText.trim() && !selectedFile) || sending || uploadingAttachment}
                      className="px-4 py-2.5 bg-[#0B3D3A] hover:bg-[#072a28] active:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {sending || uploadingAttachment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 rotate-180" />
                          <span className="hidden sm:inline">إرسال</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              /* No Conversation Selected State (Desktop empty placeholder) */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-slate-800">
                  اختر محادثة لعرض تفاصيلها
                </h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  يمكنك متابعة رسائلك السابقة أو الرد على استفسارات الطلاب وملاك السكن من القائمة الجانبية.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

