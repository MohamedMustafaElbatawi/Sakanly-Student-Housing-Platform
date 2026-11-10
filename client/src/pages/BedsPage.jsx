import React, { useState, useEffect, useMemo } from 'react';
import { Bed, ShieldCheck, WifiOff, RotateCw } from 'lucide-react';
import { BedCard } from '../components/property/BedCard.jsx';
import { propertyApi } from '../services/api.js';
import { egyptianGovernorates } from '../data/mockProperties.js';

export const BedsPage = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Filters specific to shared accommodation
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [maxPrice, setMaxPrice] = useState(0);

  useEffect(() => {
    document.title = 'الأسِرّة الفردية وسكن المشاركة في مصر | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchBeds = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await propertyApi.getIndividualBeds({ signal: controller.signal });
        setBeds(data || []);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Fetch beds error:', err);
        setError(err.message || 'تعذر الاتصال بخادم سكنلي لجلب الأسِرّة المتاحة.');
        setBeds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBeds();

    return () => {
      controller.abort();
    };
  }, [retryKey]);

  const filteredBeds = useMemo(() => {
    return beds.filter(item => {
      if (gender && item.genderPreference !== gender && item.genderPreference !== 'any') {
        return false;
      }
      if (city && item.city !== city) {
        return false;
      }
      if (maxPrice > 0 && item.monthlyPrice > maxPrice) {
        return false;
      }
      return true;
    });
  }, [beds, gender, city, maxPrice]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Hero Banner for Beds */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-amber-100">
            <Bed className="w-3.5 h-3.5" />
            <span>سكن طلابي اقتصادي ومريح</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold leading-snug">
            الأسِرّة الفردية والغرف المشتركة
          </h1>
          <p className="text-xs sm:text-[13px] text-amber-100 leading-relaxed">
            وفّر ميزانيتك الشهرية واحجز سريراً مستقلاً في غرفة مجهزة بالقرب من جامعتك. جميع أماكن الإقامة مفحوصة وتشمل مكاتب مذاكرة، إنترنت سريع، وأمان كامل.
          </p>
        </div>

        {/* Decorative Badge */}
        <div className="hidden sm:flex absolute left-8 bottom-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white text-amber-600 flex items-center justify-center font-bold text-lg">
            ج
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-amber-100">الأسعار تبدأ من</div>
            <div className="text-lg sm:text-xl font-bold">1,700 ج.م / شهر</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-sakanly-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Gender Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setGender('')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                gender === '' ? 'bg-sakanly-primary text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل ({beds.length})
            </button>
            <button
              onClick={() => setGender('male')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                gender === 'male' ? 'bg-sakanly-primary text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              شباب فقط
            </button>
            <button
              onClick={() => setGender('female')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                gender === 'female' ? 'bg-sakanly-primary text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              طالبات فقط
            </button>
          </div>

          {/* City Filter */}
          <select
            value={city}
            onChange={e => setCity(e.target.value)}
            className="text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
          >
            <option value="">جميع المناطق</option>
            {egyptianGovernorates.flatMap(gov =>
              gov.cities.map(c => <option key={c} value={c}>{c}</option>)
            )}
          </select>

          {/* Max Price Filter */}
          <select
            value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="text-xs font-bold py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer"
          >
            <option value="0">أي ميزانية للسرير</option>
            <option value="2000">أقل من 2,000 ج.م</option>
            <option value="3000">أقل من 3,000 ج.م</option>
            <option value="4000">أقل من 4,000 ج.م</option>
          </select>
        </div>

        {/* Results Counter */}
        <div className="text-xs text-sakanly-muted font-bold self-end md:self-center">
          متاح {filteredBeds.length} سرير فردي شاغر
        </div>
      </div>

      {/* Beds Listings Grid */}
      {loading ? (
        <div className="py-20 text-center" role="status">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">جارٍ تحميل الأسِرّة المتاحة...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-10 text-center space-y-4 shadow-sm" role="alert">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">تعذر الاتصال بخادم سكنلي</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => { setError(null); setRetryKey(k => k + 1); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      ) : filteredBeds.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sakanly-border p-12 text-center space-y-3">
          <p className="text-base font-bold text-sakanly-dark">لا توجد أسِرّة فردية تطابق هذه المعايير حالياً</p>
          <button
            onClick={() => { setGender(''); setCity(''); setMaxPrice(0); }}
            className="text-xs font-bold text-amber-600 hover:underline"
          >
            إلغاء التصفية وإظهار كافة الأسِرّة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredBeds.map(bed => (
            <BedCard key={bed.id} property={bed} />
          ))}
        </div>
      )}

      {/* Notice about Shared living etiquette */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-sakanly-dark flex items-start gap-3 text-xs sm:text-sm">
        <ShieldCheck className="w-5 h-5 text-sakanly-verified shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-1">إرشادات السكن المشترك في سكنلي:</strong>
          <span className="text-slate-600 leading-relaxed">
            نحرص على توفير سكن منظم وهادئ يشمل قواعد واضحة لمواعيد النوم والمذاكرة، وتوزيع عادل لفواتير الخدمات، ونظافة دورية للمطبخ والحمام المشترك لضمان راحة الجميع.
          </span>
        </div>
      </div>

    </div>
  );
};
