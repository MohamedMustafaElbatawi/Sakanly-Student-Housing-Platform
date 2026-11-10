import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  MessageSquare, 
  Check, 
  CheckCheck, 
  Clock, 
  Sparkles,
  Building2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { messagesApi } from '../../services/api.js';

const QUICK_INQUIRIES = [
  'هل العقار متاح للمعاينة خلال هذا الأسبوع؟',
  'هل الإيجار الشهري شامل فواتير الكهرباء والغاز والإنترنت؟',
  'هل متوفر صور إضافية للمطبخ والحمام؟',
  'هل مبلغ التأمين قابل للتفاوض أو التقسيط؟'
];

export const DirectOwnerChatModal = ({ property, isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [notification, setNotification] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const isOwnerVerified = 
    property?.isVerified === true ||
    property?.owner?.verificationStatus === 'verified_owner' ||
    property?.owner?.verificationStatus === 'verified' ||
    property?.owner?.isVerified === true;

  // Initialize initial welcome message
  useEffect(() => {
    if (!isOpen || !property) return;

    const initialWelcome = {
      id: 'welcome-01',
      sender: 'owner',
      senderName: property.owner?.name || 'المالك',
      text: `أهلاً بك! أنا ${property.owner?.name || 'المالك'}، يسعدني الإجابة على استفساراتك حول هذا العقار (${property.title}). هل تود معرفة أي تفاصيل إضافية أو ترتيب موعد للمعاينة؟`,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialWelcome]);
    setInputText('');
    setNotification('');
  }, [isOpen, property]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen || !property) return null;

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!token) {
      setNotification('يرجى تسجيل الدخول أولاً للتواصل ومراسلة المالك.');
      return;
    }

    setIsSending(true);
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const studentMessage = {
      id: `local-${Date.now()}`,
      sender: 'student',
      senderName: user?.fullName || 'أنت (طالب)',
      text,
      time: formattedTime,
    };

    // Optimistically append message
    setMessages(prev => [...prev, studentMessage]);
    setInputText('');

    try {
      if (token) {
        // Send via Backend API
        if (!conversationId) {
          const conv = await messagesApi.initiateConversation({
            propertyId: property.id,
            propertyTitle: property.title,
            ownerId: property.owner?.id || 'usr-owner-001',
            initialMessage: text,
          }, token);
          if (conv?.id) {
            setConversationId(conv.id);
          }
        } else {
          await messagesApi.sendMessage(conversationId, text, token);
        }
      }

      setNotification('تم إرسال رسالتك بنجاح! سيصلك إشعار عند رد المالك.');
      setTimeout(() => setNotification(''), 4000);
    } catch {
      // Retained in local chat
      setNotification('تم إرسال الرسالة محلياً بنجاح للمعاينة.');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-sakanly-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={property.owner?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                alt={property.owner?.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-sakanly-dark truncate">
                  {property.owner?.name}
                </h3>

                {/* Owner Verification Badge */}
                {isOwnerVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>مالك موثق رسمياً</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    <ShieldAlert className="w-3 h-3 text-amber-600" />
                    <span>مالك غير موثق</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-sakanly-muted mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  سرعة الرد: {property.owner?.responseTime || 'خلال دقائق معدودة'}
                </span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">متصل الآن</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            aria-label="إغلاق المحادثة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Brief Strip */}
        <div className="px-4 py-2 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-sakanly-primary shrink-0" />
            <span className="font-semibold text-slate-800 truncate">{property.title}</span>
          </div>
          <span className="font-bold text-sakanly-primary font-cairo shrink-0 mr-2">
            {property.monthlyPrice?.toLocaleString('ar-EG')} ج.م / شهر
          </span>
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/40">
          
          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5 pb-2 border-b border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              استفسارات سريعة مقترحة (اضغط للإرسال فوراً):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INQUIRIES.map((inquiry, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(inquiry)}
                  className="text-[11px] bg-white hover:bg-teal-50 hover:text-sakanly-primary text-slate-700 border border-slate-200 hover:border-teal-300 px-2.5 py-1 rounded-xl transition-all shadow-2xs text-right"
                >
                  {inquiry}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isOwner = msg.sender === 'owner';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isOwner ? 'items-start' : 'items-end'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                    isOwner
                      ? 'bg-[#0B3D3A] text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                  <span>{msg.time}</span>
                  {!isOwner && <CheckCheck className="w-3 h-3 text-teal-600" />}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-50 border-t border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Composer Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 space-y-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب استفسارك المباشر للمالك هنا (اضغط Enter للإرسال)..."
              className="flex-1 resize-none bg-slate-50 border border-slate-200 focus:border-sakanly-primary focus:bg-white rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-hidden transition-all shadow-inner"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
              className="p-3 bg-sakanly-primary hover:bg-sakanly-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95"
              aria-label="إرسال الرسالة"
            >
              {isSending ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 rotate-180" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              محادثة آمنة ومباشرة مع المالك
            </span>
            <span>اضغط Shift+Enter لسطر جديد</span>
          </div>
        </div>

      </div>
    </div>
  );
};
