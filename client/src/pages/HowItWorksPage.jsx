import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  FileCheck, 
  Users, 
  ArrowLeft 
} from 'lucide-react';

export const HowItWorksPage = () => {
  useEffect(() => {
    document.title = 'كيف تعمل منصة سكنلي للطلاب والملاك؟ | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);
  return (
    <div className="space-y-16 py-10 sm:py-16">
      
      {/* 1. Header Banner */}
      <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
        <span className="bg-teal-50 text-sakanly-primary border border-teal-200 text-xs font-bold px-3 py-1 rounded-full inline-block">
          دليل منصة سكنلي
        </span>
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-sakanly-dark leading-snug">
          سكن جامعي بدون تعقيد.. <br />
          <span className="text-sakanly-primary">كيف تعمل المنصة للطلاب والملّاك؟</span>
        </h1>
        <p className="text-xs sm:text-[14px] text-slate-600 leading-relaxed max-w-2xl mx-auto">
          نهدف إلى تحويل تجربة البحث عن سكن جامعي في مصر من معاناة إرهاق السماسرة وضياع العربون إلى تجربة رقمية سهلة، موثوقة، ومحمية بالكامل.
        </p>
      </div>

      {/* 2. Student Journey vs Owner Journey */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Student Journey Card */}
          <div className="bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-sakanly-border">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-sakanly-dark">رحلة الطالب والمغترب</h3>
                <p className="text-xs text-sakanly-muted">خطواتك للحصول على سريرك أو غرفتك</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sakanly-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">تحديد الجامعة والميزانية</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    استخدم فلتر الجامعات والمدن (مدينة نصر، الدقي، 6 أكتوبر، التجمع) مع تحديد ميزانيتك الشهرية بالضبط لاختيار السكن الأنسب لمصاريفك.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sakanly-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">فحص الصور والتجهيزات الواقعية</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    شاهد تصويراً حقيقياً للغرف، مكاتب المذاكرة، سرعة الواي فاي، وحالة الحمام والمطبخ المشترك بدون تجميل خادع.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sakanly-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">طلب معاينة مجانية نهارية</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    حدد الموعد المناسب لزيارة الشقة بصحبة زميل أو ولي الأمر للتأكد من هدوء المكان وملاءمته قبل دفع أي أموال.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-sakanly-primary text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">التعاقد واستلام السكن</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    توقيع عقد إيجار رسمي نموذجي يحفظ وديعة التأمين ويحدد الفواتير، بدون أي عمولة بحث لمنصة سكنلي.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/browse"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-sakanly-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-sakanly-primary-hover transition-colors"
              >
                <span>ابدأ البحث الآن عن سكنك</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Owner Journey Card */}
          <div className="bg-white rounded-3xl border border-sakanly-border p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-sakanly-border">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-sakanly-dark">رحلة أصحاب السكن والملّاك</h3>
                <p className="text-xs text-sakanly-muted">تأجير آمن ومستقر طوال العام الدراسي</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">تسجيل بيانات العقار والأسِرّة</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    سجل شقتك، عدد الغرف والأسِرّة الشاغرة، الإيجار الشهري، والمرافق المتاحة عبر لوحة تحكم سهلة في دقائق.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">فحص وتوثيق الوحدة مجاناً</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    يقوم فريق سكنلي بمراجعة تفاصيل العقار ومنحه شارة "مالك موثق" التي تضاعف ثقة الطلاب وطلبات الحجز 5 مرات.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">استقبال طلبات الطلاب الجادين</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    استلم طلبات المعاينة مع بيانات قيد الطالب الجامعي وتواصل معه مباشرة بدون إزعاج الاتصالات العشوائية.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm text-sakanly-dark">إشغال كامل وعائد منتظم</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    ضمان إشغال أسِرّة وغرف شقتك مع بداية العام الدراسي بعقود سنوية أو فصلية منتظمة.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/owner-dashboard"
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-amber-700 transition-colors"
              >
                <span>دخول بوابة أصحاب السكن</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Safety Measures */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">ميثاق الأمان والشفافية</span>
            <h2 className="text-xl sm:text-2xl font-bold">كيف نضمن سلامة الطلاب وحقوق الملاك؟</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تعتمد منصة سكنلي معايير صارمة تتجاوز مجرد عرض إعلانات سكن عشوائية:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">التحقق من الهوية والقيد</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                نتحقق من هوية صاحب العقار القانونية وبطاقة القيد الجامعي للطالب لضمان سلامة مجتمع السكن.
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <FileCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">عقود استرداد التأمين</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                صياغة شروط واضحة لاسترداد التأمين عند إخلاء السكن بنهاية الترم دون مماطلة أو خصومات تعسفية.
              </p>
            </div>

            <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
              <Users className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm text-white">رقابة الإعلانات المستمرة</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                إزالة أي إعلان فوراً في حال ورود شكاوى متكررة من الطلاب عن سوء الصيانة أو عدم مطابقة الواقع.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
