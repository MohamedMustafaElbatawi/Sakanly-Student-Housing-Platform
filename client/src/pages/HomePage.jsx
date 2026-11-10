import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  Bed,
  MapPin,
  Users,
  ArrowLeft,
  BadgePercent,
  Lock
} from 'lucide-react';
import { HeroSearch } from '../components/search/HeroSearch.jsx';
import { TrustMetrics } from '../components/common/TrustMetrics.jsx';
import { SharedBedsPromo } from '../components/promo/SharedBedsPromo.jsx';
import { PropertyCard } from '../components/property/PropertyCard.jsx';
import { BedCard } from '../components/property/BedCard.jsx';
import { propertyApi } from '../services/api.js';

export const HomePage = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [individualBeds, setIndividualBeds] = useState([]);
  const [popularAreas, setPopularAreas] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, bedsRes, areasRes] = await Promise.all([
          propertyApi.getProperties(),
          propertyApi.getIndividualBeds(),
          propertyApi.getPopularAreas(),
        ]);
        setFeaturedProperties(propsRes.listings.filter(p => p.featured).slice(0, 4));
        setIndividualBeds(bedsRes.slice(0, 3));
        setPopularAreas(areasRes);
      } catch (err) {
        console.error('Failed to load home data', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-x-hidden" dir="rtl">

      {/* 1. Hero Section With Photographic Background & Dark Petrol Overlay */}
      <div className="relative">
        <section
          className="relative min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] pt-28 pb-24 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32 bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: "url('/cairo-student-hero.jpg')"
          }}
        >
          {/* Dark Petrol Overlay (rgba(11, 61, 58, 0.88)) */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: 'rgba(11, 61, 58, 0.88)'
            }}
          />

          {/* Hero Content Container */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">

            {/* Top Glass Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-semibold mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>السكن اللي يليق بطموحك</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-cairo font-bold tracking-tight leading-[1.25] sm:leading-[1.2] mb-4 sm:mb-5">
              <span className="block text-white text-2xl sm:text-3xl lg:text-[34px]">
                ابدأ حياتك الجامعية
              </span>
              <span className="block text-2xl sm:text-3xl lg:text-[36px] mt-1 sm:mt-1.5 text-white">
                من <span className="text-[#F59E0B]">المكان الصح</span>
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-white/85 text-[13.5px] sm:text-[14.5px] max-w-2xl mx-auto leading-relaxed mb-7 sm:mb-9 font-normal">
              سكن موثق بالكامل قريب من جامعتك، بأسعار واضحة وتواصل مباشر مع المالك.
            </p>

            {/* Search Bar */}
            <HeroSearch />

          </div>
        </section>

        {/* Overlapping Trust Metrics Card */}
        <TrustMetrics />
      </div>


      {/* 2. Popular Student Neighborhoods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sakanly-primary text-xs font-bold mb-1">
              <MapPin className="w-4 h-4" />
              <span>المواقع الاستراتيجية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-sakanly-dark">
              أشهر مناطق السكن الطلابي في مصر
            </h2>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sakanly-primary hover:text-teal-700 transition-colors"
          >
            <span>استعراض جميع المناطق</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Areas Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {popularAreas.map(area => (
            <Link
              key={area.id}
              to={`/browse?city=${encodeURIComponent(area.name)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-slate-800 border border-sakanly-border shadow-sm hover:shadow-card-hover transition-all duration-300"
            >
              <img
                src={area.image}
                alt={area.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white flex flex-col justify-end">
                <span className="text-[10px] text-teal-300 font-bold">{area.governorate}</span>
                <h3 className="font-bold text-sm sm:text-base leading-snug group-hover:text-teal-200 transition-colors">
                  {area.name}
                </h3>
                <span className="text-[11px] text-slate-300 mt-1">
                  تبدأ من <strong className="text-white font-bold">{area.minPrice} ج</strong>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>


      {/* 3. Featured Verified Housing Units */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sakanly-primary text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-sakanly-verified" />
              <span>مختارة بعناية ومفحوصة</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-sakanly-dark">
              وحدات سكنية مميزة وموصى بها
            </h2>
          </div>
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sakanly-primary hover:text-teal-700 transition-colors"
          >
            <span>شاهد كل الشقق المتاحة ({featuredProperties.length}+)</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProperties.map(property => (
            <PropertyCard key={property.id} property={property} featured />
          ))}
        </div>
      </section>


      {/* 4. Dedicated Individual Beds & Co-Living Section */}
      <section className="bg-[#F8FAFC] border-y border-sakanly-border py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-16">

          {/* Split Promo Banner for Shared Beds */}
          <SharedBedsPromo />

          {/* Individual Beds Section Header & Grid */}
          <div className="pt-2">

            {/* Modern Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-slate-200/60">
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-xs font-bold mb-2 shadow-sm">
                  <Bed className="w-3.5 h-3.5" />
                  <span>عروض مباشرة للطلاب</span>
                </div>
                <h3 className="font-cairo font-bold text-xl sm:text-2xl text-[#0B3D3A] tracking-tight">
                  اختار سريرك.. وابدأ حياتك الجامعية
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-1.5 max-w-xl">
                  مساحات مريحة، سكن موثوق، وأسعار تناسب ميزانيتك
                </p>
              </div>

              <Link
                to="/beds"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#0F766E] bg-teal-50 hover:bg-[#0F766E] hover:text-white border border-teal-200/80 shadow-sm transition-all duration-200 group self-start sm:self-end shrink-0"
              >
                <span>اكتشف كل الأسرّة</span>
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Balanced Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {individualBeds.map(bed => (
                <BedCard key={bed.id} property={bed} />
              ))}
            </div>
          </div>

        </div>
      </section>


      {/* 5. Trust and Safety Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 text-sakanly-primary text-xs font-bold bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            <ShieldCheck className="w-4 h-4 text-sakanly-verified" />
            <span>لماذا سكنلي الخيار الموثوق للطلاب وأولياء الأمور؟</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-sakanly-dark">
            سكن جامعي يحفظ حقوقك ويوفر راحة بالك
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-600">
            صممنا المنصة لحل مشاكل السكن الطلابي التقليدي في مصر بكل شفافية.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sakanly-border shadow-card hover:border-teal-300 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center mb-3.5">
              <ShieldCheck className="w-5 h-5 text-sakanly-verified" />
            </div>
            <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">معاينة وتوثيق هوية المالك</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              نتأكد من صحة مستندات العقار وهوية صاحب السكن قبل عرض أي إعلان على المنصة لمنع أي محاولات احتيال.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sakanly-border shadow-card hover:border-teal-300 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center mb-3.5">
              <BadgePercent className="w-5 h-5 text-sakanly-primary" />
            </div>
            <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">صفر عمولة على الطلاب</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              البحث والتواصل وحجز المعاينات مجاني بالكامل للطلاب بدون سماسرة أو مصاريف استعلام خفية.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sakanly-border shadow-card hover:border-teal-300 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center mb-3.5">
              <Lock className="w-5 h-5 text-sakanly-primary" />
            </div>
            <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">عقود سكن نموذجية واضحة</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              نوفر نماذج عقود إيجار محددة تضمن استرداد مبلغ التأمين، وتوضح التزامات الفواتير والصيانة بدقة.
            </p>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-sakanly-border shadow-card hover:border-teal-300 transition-colors">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center mb-3.5">
              <Users className="w-5 h-5 text-sakanly-primary" />
            </div>
            <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">بيئة طلابية محترمة وهادئة</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              فصل كامل بين سكن الشباب وسكن الطالبات، مع اشتراط القيد الجامعي لضمان جو مناسب للمذاكرة والتحصيل.
            </p>
          </div>

        </div>
      </section>


      {/* 6. How it works (Student Journey) */}
      <section className="bg-slate-100/70 border-y border-sakanly-border py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-sakanly-dark">
              كيف تجد سكنك في 3 خطوات بسيطة؟
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-600 mt-2">
              تجربة سهلة تبدأ من هاتفك المحمول وتنتهي باستلام مفتاح غرفتك.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-sakanly-border shadow-sm text-center relative">
              <div className="w-9 h-9 rounded-full bg-sakanly-primary text-white font-bold flex items-center justify-center mx-auto mb-3.5 text-sm">
                1
              </div>
              <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">ابحث وحدد ميزانيتك</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                حدد جامعتك أو المنطقة المطلوبة، واختر بين سرير فردي، غرفة خاصة، أو شقة كاملة تناسب ميزانيتك الشهرية.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-sakanly-border shadow-sm text-center relative">
              <div className="w-9 h-9 rounded-full bg-sakanly-primary text-white font-bold flex items-center justify-center mx-auto mb-3.5 text-sm">
                2
              </div>
              <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">اطلب معاينة مجانية</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                اختر الموعد المناسب لمعاينة السكن وتحدث مباشرة مع المالك الموثق للاستفسار عن أي تفاصيل بدون وسطاء.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-sakanly-border shadow-sm text-center relative">
              <div className="w-9 h-9 rounded-full bg-sakanly-primary text-white font-bold flex items-center justify-center mx-auto mb-3.5 text-sm">
                3
              </div>
              <h3 className="font-bold text-[15px] sm:text-base text-sakanly-dark mb-1.5">وقّع العقد وانتقل لسكنك</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                بعد المعاينة والرضا التام، يتم إبرام عقد الإيجار الرسمي واستلام مفاتيح وحدتك لبدء عامك الدراسي بنجاح.
              </p>
            </div>

          </div>

          <div className="mt-8 text-center">
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-xs font-bold text-sakanly-primary hover:underline"
            >
              <span>تعرف على المزيد عن رحلة الطالب ودليل الأمان للمغتربين</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>


      {/* 7. Owner Call-to-action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-l from-sakanly-dark via-teal-900 to-sakanly-primary rounded-3xl p-6 sm:p-10 lg:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">

          <div className="space-y-3.5 max-w-xl text-center md:text-right">
            <span className="bg-teal-800/80 text-teal-200 border border-teal-600/50 text-xs font-bold px-3 py-1 rounded-full inline-block">
              أصحاب العقارات والشقق السكنية
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold leading-snug">
              هل لديك شقة أو سرير شاغر بالقرب من جامعة مصرية؟
            </h2>
            <p className="text-xs sm:text-[13px] text-teal-100 leading-relaxed">
              سجل سكنك الآن على منصة سكنلي واصل لآلاف الطلاب الجادين والمغتربين. نساعدك في التأجير السريع، التحقق من هوية الطلاب، وإدارة المعاينات باحترافية.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            {/* <Link
              to="/owner-dashboard"
              className="px-5 py-3 bg-sakanly-accent hover:bg-sakanly-accent-hover text-slate-950 font-bold rounded-xl text-center text-xs sm:text-sm shadow-lg transition-transform active:scale-95"
            >
              أضف عقارك مجاناً
            </Link> */}
            <Link
              to="/how-it-works"
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center text-xs sm:text-sm border border-white/20 transition-colors"
            >
              كيف نعمل مع الملّاك؟
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
};
