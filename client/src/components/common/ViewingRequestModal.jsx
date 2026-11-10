import React, { useState, useEffect } from 'react';
import { X, Calendar, Phone, Mail, User, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { propertyApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export const ViewingRequestModal = ({ property, isOpen, onClose }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    moveInDate: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const [submitting, setSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.moveInDate) {
      setErrorMessage('يرجى ملء جميع الحقول الإلزامية (الاسم، الهاتف، وتاريخ المعاينة).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await propertyApi.submitViewingRequest({
        ...formData,
        listingId: property.id,
      }, token);
      setSuccessResult(res.data || res);
    } catch (err) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setFormData({ fullName: '', phone: '', email: '', moveInDate: '', message: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto border border-sakanly-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sakanly-border bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-sakanly-dark">طلب معاينة / حجز مبدئي</h3>
            <p className="text-xs text-sakanly-muted line-clamp-1">{property.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-bold text-sakanly-dark">تم إرسال طلبك بنجاح!</h4>
                <p className="text-sm text-slate-600 mt-1">
                  تم تسجيل موعد المعاينة وإخطار المالك ({property.owner.name}) للتأكيد.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 text-right text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الطلب التجريبي:</span>
                  <span className="font-mono font-bold text-sakanly-primary">{successResult.requestId || 'REQ-2026-99'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الموعد المطلوب:</span>
                  <span className="font-semibold">{formData.moveInDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم المتقدم:</span>
                  <span className="font-semibold">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">الإيجار الشهري:</span>
                  <span className="font-bold text-sakanly-dark">{property.monthlyPrice.toLocaleString('ar-EG')} ج.م / شهرياً</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs text-right">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  ملاحظة النموذج الأولي (Demo Prototype)
                </div>
                هذا نموذج طلب معاينة تفاعلي للتجربة. لا يتم خصم أي أموال حقيقية في هذه النسخة.
              </div>

              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white font-bold rounded-xl transition-colors text-sm"
              >
                حسناً، تم
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Property Snapshot */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-sakanly-border">
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-sakanly-dark truncate">{property.title}</h4>
                  <p className="text-xs text-sakanly-muted">{property.city} • {property.district}</p>
                  <p className="text-xs font-bold text-sakanly-primary mt-0.5">
                    {property.monthlyPrice.toLocaleString('ar-EG')} ج.م <span className="text-[10px] text-slate-500 font-normal">/ شهرياً</span>
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {errorMessage}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم بالكامل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد عبد الله محمود"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary focus:ring-1 focus:ring-sakanly-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الهاتف / واتساب <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="010XXXXXXXX"
                      dir="ltr"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary focus:ring-1 focus:ring-sakanly-primary outline-none text-right transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني الجامعي / الشخصي
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="student@university.edu.eg"
                      dir="ltr"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pr-9 pl-3 py-2 text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary focus:ring-1 focus:ring-sakanly-primary outline-none text-right transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Preferred Move-in Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ المعاينة أو الانتقال المفضل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={formData.moveInDate}
                    onChange={e => setFormData({ ...formData, moveInDate: e.target.value })}
                    className="w-full pr-9 pl-3 py-2 text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary focus:ring-1 focus:ring-sakanly-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات أو استفسار خاص للمالك (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: طالب بكلية الهندسة أرغب في الاستقرار لعام دراسي كامل..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 text-sm bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Trust Callout */}
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs">
                <ShieldCheck className="w-4 h-4 text-sakanly-verified shrink-0" />
                <span>ضمان سكنلي: لن يطلب منك المالك أي مبالغ مقدمة قبل المعاينة الفعلية.</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-sakanly-primary hover:bg-sakanly-primary-hover disabled:opacity-50 rounded-xl shadow-md shadow-sakanly-primary/20 transition-all"
                >
                  {submitting ? 'جارٍ الإرسال...' : 'تأكيد طلب المعاينة'}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
