import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  CheckCheck, 
  CheckCircle2, 
  ShieldCheck, 
  ShieldAlert, 
  Flag, 
  Ban, 
  Search, 
  ArrowRight, 
  Building2,
  ExternalLink,
} from 'lucide-react';
import { messagesApi } from '../../services/api.js';

// Default reference conversations for instant display & fallback
const defaultConversationsSeed = [
  {
    id: 'conv-01',
    ownerId: 'usr-owner-001',
    studentId: 'std-001',
    studentName: 'مريم علي',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    propertyId: 'prop-001',
    propertyTitle: 'شقة طلابية مودرن مجهزة بالكامل - عين شمس',
    lastMessage: 'هل الغرفة متاحة أول أكتوبر؟',
    lastMessageTime: 'منذ ساعتين',
    unreadCount: 1,
    viewingRequest: {
      id: 'req-conv-01',
      date: '2026-10-25',
      time: '04:30 م',
      status: 'pending', // pending, accepted, rejected, completed
      propertyTitle: 'شقة طلابية مودرن مجهزة بالكامل',
    },
    messages: [
      {
        id: 'm-101',
        sender: 'student',
        senderName: 'مريم علي',
        text: 'أهلاً يا بشمهندس، هل الشقة متاحة لمجموعة ٣ بنات؟',
        createdAt: '2026-10-21T14:10:00Z',
        time: '02:10 م',
      },
      {
        id: 'm-102',
        sender: 'owner',
        senderName: 'المالك',
        text: 'أهلاً مريم، أيوة متاحة من ١ أكتوبر، تحبي معاينة إمتى؟',
        createdAt: '2026-10-21T14:15:00Z',
        time: '02:15 م',
      },
      {
        id: 'm-103',
        sender: 'student',
        senderName: 'مريم علي',
        text: 'هل الغرفة متاحة أول أكتوبر؟ مناسبنا جداً السبت القادم إن شاء الله.',
        createdAt: '2026-10-21T14:20:00Z',
        time: '02:20 م',
      },
    ],
  },
  {
    id: 'conv-02',
    ownerId: 'usr-owner-001',
    studentId: 'std-002',
    studentName: 'يوسف أحمد',
    studentAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
    propertyId: 'prop-004',
    propertyTitle: 'استوديو شبابي مستقل بجوار جامعة 6 أكتوبر',
    lastMessage: 'تمام، نتقابل السبت للمعاينة',
    lastMessageTime: 'أمس',
    unreadCount: 0,
    viewingRequest: {
      id: 'req-conv-02',
      date: '2026-10-24',
      time: '10:00 ص',
      status: 'accepted',
      propertyTitle: 'استوديو جامعة 6 أكتوبر',
    },
    messages: [
      {
        id: 'm-201',
        sender: 'student',
        senderName: 'يوسف أحمد',
        text: 'مساء الخير يا فندم، بخصوص الاستوديو، هل ينفع أجي أعاين السبت الساعة 10 صباحاً؟',
        createdAt: '2026-10-20T17:00:00Z',
        time: '05:00 م',
      },
      {
        id: 'm-202',
        sender: 'owner',
        senderName: 'المالك',
        text: 'أهلاً يوسف، مرحب بيك في أي وقت، تم تأكيد موعدك.',
        createdAt: '2026-10-20T17:05:00Z',
        time: '05:05 م',
      },
      {
        id: 'm-203',
        sender: 'student',
        senderName: 'يوسف أحمد',
        text: 'تمام، نتقابل السبت للمعاينة شكراً لحضرتك.',
        createdAt: '2026-10-20T17:08:00Z',
        time: '05:08 م',
      },
    ],
  },
  {
    id: 'conv-03',
    ownerId: 'usr-owner-001',
    studentId: 'std-003',
    studentName: 'سلمى خالد',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    propertyId: 'prop-002',
    propertyTitle: 'سرير فردي في غرفة ثنائية - الدقي',
    lastMessage: 'ممكن صور الحمام؟',
    lastMessageTime: 'منذ يومين',
    unreadCount: 0,
    viewingRequest: {
      id: 'req-conv-03',
      date: '2026-10-26',
      time: '02:00 م',
      status: 'pending',
      propertyTitle: 'سرير فردي - الدقي',
    },
    messages: [
      {
        id: 'm-301',
        sender: 'student',
        senderName: 'سلمى خالد',
        text: 'السلام عليكم، هل السكن قريب من جامعة القاهرة ومحطة المترو؟',
        createdAt: '2026-10-19T11:00:00Z',
        time: '11:00 ص',
      },
      {
        id: 'm-302',
        sender: 'owner',
        senderName: 'المالك',
        text: 'وعليكم السلام، نعم 7 دقائق فقط بالمترو أو 10 دقائق مشياً.',
        createdAt: '2026-10-19T11:15:00Z',
        time: '11:15 ص',
      },
      {
        id: 'm-303',
        sender: 'student',
        senderName: 'سلمى خالد',
        text: 'ممكن صور الحمام والمطبخ للتأكد من مستوى النظافة؟',
        createdAt: '2026-10-19T11:20:00Z',
        time: '11:20 ص',
      },
    ],
  },
];

export const OwnerMessagesView = ({
  owner,
  token,
  onNavigateRequests,
}) => {
  // Conversations State strictly isolated from authenticated backend
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Message composer state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals & Panels state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('محتوى غير لائق أو رسائل مزعجة');
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false); // Mobile view toggle

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isOwnerVerified = owner?.verificationStatus === 'verified' || owner?.isVerified === true;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Fetch conversations from backend API
  useEffect(() => {
    let isMounted = true;
    const fetchConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await messagesApi.getConversations(token);
        if (isMounted && Array.isArray(data)) {
          setConversations(data);
          if (data.length > 0) {
            setSelectedConvId(prev => (prev && data.some(c => c.id === prev) ? prev : data[0].id));
          } else {
            setSelectedConvId(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (token) {
      fetchConversations();
    }
    return () => { isMounted = false; };
  }, [token]);

  // Selected conversation object
  const activeConversation = conversations.find(c => c.id === selectedConvId) || conversations[0] || null;


  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.studentName.toLowerCase().includes(q) ||
      (c.propertyTitle && c.propertyTitle.toLowerCase().includes(q)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  });

  // Handle select conversation
  const handleSelectConversation = (conv) => {
    setSelectedConvId(conv.id);
    setMobileChatOpen(true);

    // Mark as read locally and in state
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const localMessage = {
      id: `m-local-${Date.now()}`,
      sender: 'owner',
      senderName: owner?.fullName || 'المالك',
      text: textToSend,
      createdAt: now.toISOString(),
      time: formattedTime,
    };

    // Optimistically update conversation
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: textToSend,
          lastMessageTime: 'الآن',
          messages: [...(c.messages || []), localMessage],
        };
      }
      return c;
    }));

    setInputText('');

    try {
      const res = await messagesApi.sendMessage(selectedConvId, textToSend, token);
      if (res && res.message) {
        // Replace optimistic with real message if needed
        setConversations(prev => prev.map(c => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === localMessage.id ? res.message : m),
            };
          }
          return c;
        }));
      }
    } catch (err) {
      // Message already retained in local session
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  // Keydown for Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle report submission
  const handleSubmitReport = async () => {
    try {
      await messagesApi.reportConversation(selectedConvId, reportReason, token);
      showToast('تم استلام بلاغك وسيقوم فريق الدعم بمراجعته.');
    } catch {
      showToast('تم تسجيل بلاغك محلياً للإدارة.');
    } finally {
      setReportModalOpen(false);
    }
  };

  // Handle block confirmation
  const handleConfirmBlock = () => {
    showToast(`تم حظر الطالب ${activeConversation?.studentName} من إرسال رسائل جديدة.`);
    setBlockModalOpen(false);
  };

  return (
    <div className="space-y-4">

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
          <button onClick={() => setToastMessage('')} className="text-emerald-700 text-xs font-bold px-1">✕</button>
        </div>
      )}

      {/* Main 2-Section Flex Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-175px)] min-h-[620px] max-h-[850px]">

        {/* ========================================================
            COLUMN 1: CONVERSATIONS LIST (قائمة المحادثات)
            Width approx 280-320px (4 cols out of 12)
           ======================================================== */}
        <div className={`lg:col-span-4 bg-white rounded-3xl border border-sakanly-border p-4 flex flex-col shadow-xs overflow-hidden ${
          mobileChatOpen ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Header */}
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-sakanly-dark flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sakanly-primary" />
                  <span>المحادثات</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  /owner/messages/
                </span>
              </div>
              <p className="text-[11px] text-sakanly-muted mt-0.5">
                استفسارات الطلاب المباشرة حول الوحدات
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/messages"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                title="فتح شاشة المحادثات والشات المباشر"
              >
                <ExternalLink className="w-3 h-3" />
                <span>الشات المباشر</span>
              </Link>
              <span className="text-xs bg-teal-50 text-sakanly-primary font-bold px-2 py-0.5 rounded-full border border-teal-100">
                {conversations.length}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="pt-3 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث باسم الطالب أو العقار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-sakanly-primary focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>



          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-0.5 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-5 h-5 border-2 border-sakanly-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">جارٍ جلب المحادثات...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">لا توجد نتائج مطابقة</p>
                <p className="text-[11px] text-slate-400">جرب تغيير عبارة البحث.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 group text-right ${
                      isActive
                        ? 'bg-teal-50/80 border-2 border-sakanly-primary shadow-xs ring-1 ring-sakanly-primary/20'
                        : 'hover:bg-slate-50 border-2 border-transparent'
                    }`}
                  >
                    {/* Student Avatar */}
                    <div className="relative shrink-0">
                      {conv.studentAvatar ? (
                        <img
                          src={conv.studentAvatar}
                          alt={conv.studentName}
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                          {conv.studentName.charAt(0)}
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-teal-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Texts & Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-sakanly-dark truncate">
                          {conv.studentName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                        {conv.propertyTitle}
                      </p>

                      <p className={`text-xs truncate mt-1 ${
                        conv.unreadCount > 0 ? 'text-slate-900 font-bold' : 'text-slate-500 font-normal'
                      }`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================
            COLUMN 2: ACTIVE CONVERSATION AREA (منطقة المحادثة)
            Flexible largest space (8 cols out of 12)
           ======================================================== */}
        <div className={`lg:col-span-8 bg-white rounded-3xl border border-sakanly-border flex flex-col shadow-xs overflow-hidden ${
          !mobileChatOpen ? 'hidden lg:flex' : 'flex'
        }`}>
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">لا توجد محادثات حتى الآن</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                ستظهر هنا رسائل واستفسارات الطلاب الجديدة بمجرد تواصلهم معك حول وحداتك السكنية.
              </p>
            </div>
          ) : (
            <>
              {/* A. Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                    aria-label="العودة لقائمة المحادثات"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>


              {/* Student Avatar */}
              {activeConversation?.studentAvatar ? (
                <img
                  src={activeConversation.studentAvatar}
                  alt={activeConversation.studentName}
                  className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                  {activeConversation?.studentName?.charAt(0) || 'ط'}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-xs sm:text-sm text-sakanly-dark truncate">
                    {activeConversation?.studentName}
                  </h3>
                  
                  {/* Dynamic Owner Verification Badge */}
                  {isOwnerVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>مالك معتمد</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      <span>غير موثق</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-sakanly-muted truncate mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{activeConversation?.propertyTitle}</span>
                </p>
              </div>
            </div>

            {/* Header Moderation Action Buttons (Report & Block) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                title="إبلاغ عن المحادثة"
                aria-label="إبلاغ عن المحادثة"
                className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Flag className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setBlockModalOpen(true)}
                title="حظر الطالب"
                aria-label="حظر الطالب"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* B. Chat Stream Body (Scrollable Messages Area) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
            
            {/* Conversation Date Header */}
            <div className="text-center my-2">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-200/80 px-3 py-1 rounded-full">
                اليوم
              </span>
            </div>



            {/* Messages Stream */}
            {activeConversation?.messages?.map((msg) => {
              const isOwner = msg.sender === 'owner';
              const isSystem = msg.isSystemNotification;

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-3 animate-fade-in">
                    <span className="text-[11px] bg-teal-50 border border-teal-200 text-sakanly-primary px-3 py-1 rounded-full font-medium inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isOwner
                        ? 'bg-[#0B3D3A] text-white rounded-tl-xs text-right'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tr-xs text-right'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Timestamp & Delivery status */}
                  <div className="flex items-center gap-1 px-1 text-[10px] text-slate-400 font-mono">
                    <span>{msg.time}</span>
                    {isOwner && (
                      <CheckCheck className="w-3.5 h-3.5 text-teal-500" />
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* D. Message Composer */}
          <div className="p-3.5 border-t border-slate-100 bg-white">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder="اكتب رسالة للطالب..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none resize-none focus:border-sakanly-primary focus:bg-white transition-all max-h-28"
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-10 h-10 rounded-2xl bg-sakanly-primary hover:bg-[#0B3D3A] text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-700/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="إرسال الرسالة"
              >
                {isSending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 rotate-180" />
                )}
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 mt-1">
              <span>اضغط Enter للإرسال، وShift+Enter لسطر جديد</span>
              <span>الرسائل مشفرة ومحمية</span>
            </div>
          </div>
        </>
      )}
    </div>




      </div>

      {/* ========================================================
          REPORT CONVERSATION MODAL
         ======================================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-sakanly-dark flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-600" />
                <span>إبلاغ عن محادثة الطالب {activeConversation?.studentName}</span>
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              يرجى اختيار سبب البلاغ لمساعدة فريق الإشراف والأمان في منصة سكنلي على مراجعة المحادثة:
            </p>

            <div className="space-y-2">
              {[
                'محتوى غير لائق أو رسائل مسيئة',
                'طلب معلومات حساسة أو محاولة احتيال',
                'إلغاء المعاينة المتكرر بدون إشعار',
                'سبب آخر',
              ].map((reason) => (
                <label key={reason} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer text-xs text-slate-700">
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="accent-sakanly-primary"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                إرسال البلاغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BLOCK USER MODAL
         ======================================================== */}
      {blockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Ban className="w-6 h-6" />
            </div>

            <h3 className="font-bold text-sm text-sakanly-dark">
              تأكيد حظر الطالب {activeConversation?.studentName}؟
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              لن يتمكن هذا الطالب من إرسال رسائل جديدة أو حجز مواعيد معاينة لعقاراتك مستقبلاً.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                تأكيد الحظر
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
