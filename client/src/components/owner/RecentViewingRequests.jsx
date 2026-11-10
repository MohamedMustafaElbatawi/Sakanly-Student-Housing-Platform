import React, { useState } from 'react';
import { 
  CalendarClock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  Phone,
  GraduationCap
} from 'lucide-react';

export const RecentViewingRequests = ({
  requests = [],
  onRequestAction,
  onViewAll,
  maxItems = 15,
}) => {
  const [selectedRequest, setSelectedRequest] = useState(null);

  const displayedRequests = requests.slice(0, maxItems);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            تمت الموافقة
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-600" />
            مرفوض
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-amber-600" />
            في انتظار ردك
          </span>
        );
    }
  };

  return (
    <section className="w-full bg-white rounded-3xl border border-sakanly-border shadow-sm overflow-hidden flex flex-col font-cairo h-[520px] sm:h-[540px]">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50/80 to-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                طلبات المعاينة الأخيرة
              </h3>
              {pendingCount > 0 && (
                <span className="text-[11px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                  {pendingCount} بانتظارك
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              مواعيد الحضور المسجلة من الطلاب لمعاينة سكنك
            </p>
          </div>
        </div>

        {onViewAll && (
          <>
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-bold text-sakanly-primary hover:text-sakanly-primary-hover hover:underline hidden sm:flex items-center gap-1 shrink-0"
            >
              <span>عرض كل الطلبات ({requests.length})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={onViewAll}
              className="sm:hidden p-1.5 text-sakanly-primary hover:bg-teal-50 rounded-xl shrink-0 transition-colors"
              title="عرض كل الطلبات"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ─── Body: Requests List ─────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto sakanly-scrollbar space-y-3">
        {displayedRequests.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 space-y-2.5 h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-700">لا توجد طلبات معاينة حالياً</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
              عندما يقوم طالب بحجز موعد لمعاينة إحدى وحداتك، ستظهر تفاصيل الموعد هنا لتأكيده.
            </p>
          </div>
        ) : (
          displayedRequests.map((req) => (
            <div
              key={req.id}
              className="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/90 transition-all space-y-2.5"
            >
              {/* Top Row: Student info & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-teal-100 text-sakanly-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {req.studentName ? req.studentName.charAt(0) : <User className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-[13px] text-sakanly-dark truncate">
                      {req.studentName}
                    </h5>
                    {req.university && (
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-slate-400" />
                        {req.university}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(req.status)}
                </div>
              </div>

              {/* Property Title & Date */}
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 space-y-1">
                <div className="font-semibold text-slate-800 text-[11px] line-clamp-1">
                  🏠 {req.propertyTitle}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>📅 الموعد: <strong>{req.date}</strong></span>
                  {req.time && <span>⏰ {req.time}</span>}
                </div>
              </div>

              {/* Actions for Pending Requests */}
              {req.status === 'pending' ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onRequestAction && onRequestAction(req.id, 'accepted')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد الموعد</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestAction && onRequestAction(req.id, 'rejected')}
                    className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                  >
                    اعتذار
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(req)}
                    className="p-1.5 text-slate-500 hover:text-sakanly-primary hover:bg-white rounded-lg transition-colors"
                    title="تفاصيل الطلب"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-mono" dir="ltr">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {req.phone}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedRequest(req)}
                    className="text-sakanly-primary hover:underline font-bold"
                  >
                    تفاصيل
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── Footer: Summary ───────────────────────────────────── */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 rounded-b-3xl shrink-0">
        <div className="flex items-center gap-2">
          <span>إجمالي الطلبات: <strong className="text-slate-700">{requests.length}</strong></span>
          {pendingCount > 0 && (
            <span className="text-amber-700 font-bold">
              • {pendingCount} في انتظار ردك
            </span>
          )}
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[#0F766E] hover:underline font-bold text-xs flex items-center gap-1"
          >
            <span>عرض كل الطلبات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-sakanly-dark flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-sakanly-primary" />
                <span>تفاصيل طلب المعاينة</span>
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">اسم الطالب:</span>
                <span className="font-bold text-slate-800">{selectedRequest.studentName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">الكلية / الجامعة:</span>
                <span className="font-medium text-slate-800">{selectedRequest.university || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono text-slate-800 font-bold" dir="ltr">{selectedRequest.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">السكن المطلوب:</span>
                <span className="font-medium text-slate-800 max-w-[200px] truncate">{selectedRequest.propertyTitle}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">تاريخ ووقت المعاينة:</span>
                <span className="font-bold text-sakanly-primary">{selectedRequest.date} - {selectedRequest.time || 'صباحاً'}</span>
              </div>
              {selectedRequest.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">ملاحظات الطالب:</span>
                  <p className="text-slate-600 leading-relaxed">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
