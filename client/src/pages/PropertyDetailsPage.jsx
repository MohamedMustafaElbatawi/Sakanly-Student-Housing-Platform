import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Heart, 
  Share2, 
  ShieldCheck, 
  ShieldAlert,
  Phone, 
  Calendar, 
  CheckCircle2, 
  GraduationCap, 
  ArrowRight, 
  AlertTriangle,
  MessageSquare,
  MessageCircle,
  Sparkles,
  Clock,
  XCircle,
  FileText,
  WifiOff,
  RefreshCw,
  Home
} from 'lucide-react';
import { PropertyGallery } from '../components/property/PropertyGallery.jsx';
import { PropertyCard } from '../components/property/PropertyCard.jsx';
import { ViewingRequestModal } from '../components/common/ViewingRequestModal.jsx';
import { DirectOwnerChatModal } from '../components/property/DirectOwnerChatModal.jsx';
import { AccommodationBadge, GenderBadge, VerifiedBadge } from '../components/common/Badge.jsx';
import { propertyApi, messagesApi } from '../services/api.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const handleStartChatWithOwner = async () => {
    if (!isAuthenticated) {
      requireLoginForAction('chat', 'سجّل دخولك للاستفادة من هذه الخدمة ومراسلة مالك العقار مباشرة.');
      return;
    }
    setStartingChat(true);
    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const conv = await messagesApi.initiateConversation(
        {
          propertyId: property.id,
          propertyTitle: property.title,
          propertyImage: property.images?.[0] || '',
          propertyPrice: property.monthlyPrice,
          propertyType: property.accommodationType,
          propertyCity: property.city,
          ownerId: property.owner?.id,
          ownerName: property.owner?.name,
          ownerAvatar: property.owner?.avatar,
          ownerPhone: property.contactPhone || property.owner?.phone,
        },
        activeToken
      );

      if (conv && conv.id) {
        navigate(`/messages/${conv.id}`);
      } else {
        navigate('/messages');
      }
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء فتح المحادثة مع المالك.');
    } finally {
      setStartingChat(false);
    }
  };

  // Helper to enforce login for guest users attempting protected actions
  const requireLoginForAction = (actionName, actionMessage) => {
    const returnPath = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, {
      state: {
        from: returnPath,
        action: actionName,
        message: actionMessage || 'سجّل دخولك للاستفادة من هذه الخدمة والمتابعة.',
      },
    });
  };

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setErrorInfo(null);
    window.scrollTo(0, 0);
    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const res = await propertyApi.getPropertyById(id, activeToken);
      if (res.listing) {
        setProperty(res.listing);
        setSimilarProperties(res.similar || []);
        setErrorInfo(null);
      } else {
        setProperty(null);
        setErrorInfo(res.error || { code: 'NOT_FOUND', message: 'عفواً، لم يتم العثور على هذا العقار' });
      }
    } catch (err) {
      console.error(err);
      setProperty(null);
      setErrorInfo({ code: 'NETWORK_ERROR', message: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, token]);

  useEffect(() => {
    if (property) {
      document.title = `${property.title} | سكنلي`;

      // Inject JSON-LD structured data for SEO
      const scriptId = 'property-jsonld-schema';
      let scriptTag = document.getElementById(scriptId);
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Accommodation',
        name: property.title,
        description: property.description || property.title,
        image: property.images || [],
        address: {
          '@type': 'PostalAddress',
          addressLocality: property.city || 'Cairo',
          streetAddress: property.address || property.location || '',
          addressCountry: 'EG',
        },
        offers: {
          '@type': 'Offer',
          price: property.monthlyPrice,
          priceCurrency: 'EGP',
          availability: 'https://schema.org/InStock',
        },
      });
    }

    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
      const scriptTag = document.getElementById('property-jsonld-schema');
      if (scriptTag) scriptTag.remove();
    };
  }, [property]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-sakanly-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-sakanly-muted">جارٍ تحميل بيانات السكن المختار...</p>
      </div>
    );
  }

  if (!property) {
    if (errorInfo?.code === 'LISTING_PENDING_REVIEW') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center border border-amber-200 shadow-sm">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              قيد المراجعة الإدارية
            </span>
            <h2 className="text-2xl font-black text-slate-800">الإعلان قيد الفحص والتدقيق</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              تم إرسال هذا العقار حديثاً وهو الآن قيد التدقيق الإداري من قِبل إدارة سكنلي للتأكد من استيفاء كافة الشروط والمستندات قبل إتاحته للطلاب.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لاستعراض الشقق والأسِرّة
            </Link>
            {user?.role === 'owner' && (
              <Link
                to="/owner-dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-all"
              >
                لوحة تحكم المالك
              </Link>
            )}
          </div>
        </div>
      );
    }

    if (errorInfo?.code === 'LISTING_REJECTED') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-sm">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
              إعلان غير متاح
            </span>
            <h2 className="text-2xl font-black text-slate-800">هذا العقار غير متاح حالياً</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              تم رفض هذا الإعلان أو إيقافه لمخالفته شروط ومعايير النشر المعتمدة على منصة سكنلي.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لاستعراض الشقق والأسِرّة
            </Link>
          </div>
        </div>
      );
    }

    if (errorInfo?.code === 'LISTING_DRAFT') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-3xl mx-auto flex items-center justify-center border border-slate-200 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
              مسودة خاصة
            </span>
            <h2 className="text-2xl font-black text-slate-800">هذا العقار مسودة خاصة</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              هذا الإعلان محفوظ كمسودة خاصة بمالك السكن ولم يتم نشره أو إرساله للمراجعة بعد.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لاستعراض الشقق والأسِرّة
            </Link>
          </div>
        </div>
      );
    }

    if (errorInfo?.code === 'LISTING_UNAVAILABLE') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl mx-auto flex items-center justify-center border border-teal-200 shadow-sm">
            <Home className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
              السكن غير متاح
            </span>
            <h2 className="text-2xl font-black text-slate-800">تم تأجير السكن أو إيقافه مؤقتاً</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              هذا السكن غير متاح للحجز في الوقت الحالي، ربما اكتمل عدد المقيمين به أو أوقفه المالك مؤقتاً.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لاستعراض الشقق والأسِرّة
            </Link>
          </div>
        </div>
      );
    }

    if (errorInfo?.code === 'NETWORK_ERROR') {
      return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5" dir="rtl">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-sm">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">تعذر الاتصال بالخادم</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              حدث خطأ أثناء محاولة جلب بيانات العقار من الخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fetchDetails}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </button>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-all"
            >
              العودة للاستعراض
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4" dir="rtl">
        <h2 className="text-2xl font-bold text-sakanly-dark">عفواً، لم يتم العثور على هذا العقار</h2>
        <p className="text-sm text-sakanly-muted">ربما تم تأجير السكن أو نقل الرابط أو تم حذف الإعلان.</p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-sakanly-primary text-white font-bold rounded-xl text-xs hover:bg-[#0B3D3A] transition-all shadow-sm"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لاستعراض الشقق والأسِرّة
        </Link>
      </div>
    );
  }

  const propertyId = property.id || property._id;
  const favorited = isFavorite(propertyId, property._id);

  const isOwnerVerified = 
    property.isVerified === true ||
    property.owner?.verificationStatus === 'verified_owner' ||
    property.owner?.verificationStatus === 'verified' ||
    property.owner?.isVerified === true;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between text-xs text-sakanly-muted">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 font-bold text-sakanly-dark hover:text-sakanly-primary transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </button>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-white border border-sakanly-border hover:bg-slate-50 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة'}</span>
          </button>

          {/* Favorite Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireLoginForAction('favorite', 'سجّل دخولك للاستفادة من هذه الخدمة وحفظ العقار في المفضلة.');
                return;
              }
              toggleFavorite(propertyId);
            }}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border transition-colors ${
              favorited
                ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold'
                : 'bg-white border-sakanly-border text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{favorited ? 'في المفضلة' : 'حفظ'}</span>
          </button>
        </div>
      </div>

      {/* Moderation Status Banner for Owner / Admin Preview */}
      {property.status && property.status !== 'active' && property.status !== 'published' && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
          property.status === 'rejected'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : property.status === 'pending_review' || property.status === 'pending'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}>
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">
              {property.status === 'rejected'
                ? 'معاينة خاصة: هذا الإعلان مرفوض من قِبل الإدارة وغير معروض للطلاب.'
                : property.status === 'pending_review' || property.status === 'pending'
                ? 'معاينة خاصة: هذا الإعلان قيد المراجعة الإدارية وسيكون متاحاً للطلاب فور اعتماده.'
                : `معاينة خاصة: حالة الإعلان الحالية (${property.status}).`}
            </p>
            {property.rejectionReason && (
              <p className="mt-1 font-medium">سبب الرفض المسجل: {property.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Gallery & Details (Left/Center) + Sticky Owner Action Box (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Gallery + Information */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Title and Header row */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <AccommodationBadge type={property.accommodationType} />
              <GenderBadge gender={property.genderPreference} />
              {property.isVerified && <VerifiedBadge text="سكن موثق ميدانياً" />}
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-sakanly-dark leading-snug">
              {property.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-sakanly-muted mt-2">
              <MapPin className="w-4 h-4 text-sakanly-primary shrink-0" />
              <span>{property.governorate} • {property.city} • {property.district} — {property.address}</span>
            </div>
          </div>

          {/* Interactive Image & Video Gallery */}
          <PropertyGallery
            images={property.images}
            video={property.video}
            media={property.media}
            title={property.title}
          />

          {/* Quick Key Specifications Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white rounded-2xl border border-sakanly-border shadow-sm">
            <div className="text-center p-2">
              <span className="block text-xs text-sakanly-muted mb-1">نوع السكن</span>
              <strong className="text-sm font-bold text-sakanly-dark">
                {property.accommodationType === 'individual_bed' ? 'سرير مستقل' : property.accommodationType === 'private_room' ? 'غرفة خاصة' : property.accommodationType === 'shared_room' ? 'غرفة مشتركة' : 'شقة كاملة'}
              </strong>
            </div>

            <div className="text-center p-2 border-r border-slate-100">
              <span className="block text-xs text-sakanly-muted mb-1">الأسِرّة المتاحة</span>
              <strong className="text-sm font-bold text-sakanly-primary">
                {property.availableBeds} من أصل {property.totalBeds}
              </strong>
            </div>

            <div className="text-center p-2 border-r border-slate-100">
              <span className="block text-xs text-sakanly-muted mb-1">الحمامات</span>
              <strong className="text-sm font-bold text-sakanly-dark">{property.bathrooms} حمام</strong>
            </div>

            <div className="text-center p-2 border-r border-slate-100">
              <span className="block text-xs text-sakanly-muted mb-1">المساحة الإجمالية</span>
              <strong className="text-sm font-bold text-sakanly-dark">{property.area || 100} م²</strong>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-sakanly-border p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-base text-sakanly-dark">وصف السكن والتفاصيل</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities & Services */}
          <div className="bg-white rounded-2xl border border-sakanly-border p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-sakanly-dark">المرافق والتجهيزات المتوفرة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Universities & Proximities */}
          <div className="bg-white rounded-2xl border border-sakanly-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-sakanly-dark">الجامعات والمعالم القريبة</h3>
              <span className="text-xs text-sakanly-primary font-bold">بالمواصلات ومترو الأنفاق</span>
            </div>

            <div className="space-y-2.5">
              {property.nearbyUniversities.map((uni, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className="w-5 h-5 text-sakanly-primary" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{uni.name}</span>
                  </div>
                  <span className="text-xs text-slate-600 font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {uni.distance}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Trust Guarantee Banner */}
          <div className="p-5 rounded-2xl bg-teal-50/80 border border-teal-200 text-sakanly-dark flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-sakanly-verified shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <h4 className="font-bold">ضمان سكنلي للأمان المالي</h4>
              <p className="text-slate-600 leading-relaxed">
                لا تقم بدفع أي مبالغ نقدية أو تحويلات عبر المحافظ الإلكترونية إلا بعد المعاينة الشخصية لمطابقة الشقة مع الصور وتوقيع عقد إيجار رسمي.
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Sticky Action & Owner Profile Card */}
        <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-4">
          
          {/* Main Booking Card */}
          <div className="bg-white rounded-3xl border border-sakanly-border p-6 shadow-card space-y-5">
            
            {/* 1. Owner Official Verification Status Banner (أعلى الكارت) */}
            {isOwnerVerified ? (
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                        مالك موثق رسمياً
                      </h4>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[11px] text-emerald-800/90 truncate mt-0.5">
                      تم فحص الهوية الوطنية وسند الملكية
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  معتمد ✓
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      مالك غير موثق
                    </h4>
                    <p className="text-[11px] text-amber-800/90 truncate mt-0.5">
                      لم يستكمل توثيق الأوراق الرسمية بعد
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 shadow-2xs">
                  تنبيه أمان
                </span>
              </div>
            )}

            {/* Price Box */}
            <div className="pb-4 border-b border-sakanly-border">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-sakanly-muted font-bold">الإيجار الشهري</span>
                <span className="text-xl sm:text-2xl font-bold text-sakanly-primary font-cairo">
                  {property.monthlyPrice.toLocaleString('ar-EG')}
                  <span className="text-xs text-sakanly-muted font-normal mr-1">ج.م / شهرياً</span>
                </span>
              </div>

              {/* Deposit and Bills breakdown */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span>مبلغ التأمين المسترد:</span>
                  <span className="font-bold">{property.deposit.toLocaleString('ar-EG')} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>فواتير الخدمات المقدرة:</span>
                  <span className="font-bold">
                    {property.utilitiesCost ? `${property.utilitiesCost} ج.م / شهرياً` : 'شاملة في الإيجار'}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>عمولة السمسار:</span>
                  <span>0 ج.م (مجاناً للطلاب)</span>
                </div>
              </div>
            </div>

            {/* CTAs (طلب معاينة + إظهار الهاتف + تواصل شات مع المالك) */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    requireLoginForAction('viewing_request', 'سجّل دخولك للاستفادة من هذه الخدمة وطلب معاينة السكن.');
                    return;
                  }
                  setModalOpen(true);
                }}
                className="w-full py-3.5 px-4 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white font-bold rounded-xl text-sm shadow-md shadow-sakanly-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                طلب معاينة أو حجز مجاني
              </button>

              {/* Direct Call / Whatsapp */}
              {(() => {
                const contactPhone = property.contactPhone || property.owner?.phone;
                const whatsappPhone = property.whatsappPhone || contactPhone;
                const isApprovedListing = property.status === 'active' || property.status === 'published';
                const allowsContactPhone = property.showContactPhone !== false && Boolean(contactPhone) && isApprovedListing;

                return (
                  <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0B3D3A] flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-[#0F766E]" />
                        <span>تواصل مع المالك</span>
                      </h4>
                      {allowsContactPhone && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          متاح للاتصال
                        </span>
                      )}
                    </div>

                    {allowsContactPhone ? (
                      !showPhone ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              requireLoginForAction('show_phone', 'سجّل دخولك للاستفادة من هذه الخدمة والاطلاع على أرقام تواصل المالك.');
                              return;
                            }
                            setShowPhone(true);
                          }}
                          className="w-full py-2.5 px-3 bg-white hover:bg-teal-50 text-[#0F766E] font-bold rounded-xl text-xs border border-teal-200 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>إظهار أرقام التواصل (اتصال وواتساب)</span>
                        </button>
                      ) : (
                        <div className="space-y-2.5 animate-fade-in">
                          {/* Phone Display */}
                          <div className="p-2.5 bg-white rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">رقم الهاتف:</span>
                            <span className="font-mono font-bold text-sm text-[#0F766E]" dir="ltr">
                              {contactPhone}
                            </span>
                          </div>

                          {/* Call & WhatsApp Action Buttons */}
                          <div className="grid grid-cols-2 gap-2">
                            <a
                              href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                              className="py-2.5 px-3 bg-[#0F766E] hover:bg-[#0B3D3A] text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                              title="اتصال هاتفي مباشر"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>اتصال بالمالك</span>
                            </a>

                            <a
                              href={`https://wa.me/${(whatsappPhone || contactPhone).replace(/\D/g, '')}?text=${encodeURIComponent(
                                `مرحباً، أود الاستفسار عن سكن "${property.title}" المعروض على منصة سكنلي.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                              title="محادثة واتساب مباشرة"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>تواصل عبر واتساب</span>
                            </a>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="p-2.5 bg-white/80 rounded-xl border border-slate-200/80 text-center text-[11px] text-slate-500 space-y-1">
                        <p className="font-bold text-slate-700">🔒 رقم هاتف المالك محجوب بناءً على رغبته</p>
                        <p className="text-[10px] text-slate-400">
                          يمكنك مراسلة المالك بأمان عبر شات المنصة بالأسفل أو إرسال طلب معاينة.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Direct Chat with Owner */}
              <button
                type="button"
                onClick={handleStartChatWithOwner}
                disabled={startingChat}
                className="w-full py-3 px-4 bg-[#0B3D3A] hover:bg-[#072a28] text-white font-bold rounded-xl text-xs sm:text-sm border border-teal-900 transition-all shadow-md shadow-[#0B3D3A]/20 active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-60"
              >
                {startingChat ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                ) : (
                  <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{startingChat ? 'جارٍ فتح المحادثة...' : 'تواصل شات مع المالك'}</span>
              </button>
            </div>

            {/* Owner Profile Preview */}
            <div className="pt-4 border-t border-sakanly-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={property.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(property.owner?.name || 'مالك العقار')}&background=0B3D3A&color=fff`}
                  alt={property.owner?.name || 'مالك العقار'}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(property.owner?.name || 'مالك العقار')}&background=0B3D3A&color=fff`;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-sakanly-dark truncate">
                      {property.owner?.name || 'مالك العقار'}
                    </h4>
                    {isOwnerVerified ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>موثق</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        <span>غير موثق</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-sakanly-muted mt-0.5">
                    عضو منذ {property.owner?.memberSince || '2026'} • سرعة الرد: {property.owner?.responseTime || 'خلال ساعات'}
                  </p>
                </div>
              </div>

              {/* Quick Chat Button icon */}
              <button
                type="button"
                onClick={handleStartChatWithOwner}
                disabled={startingChat}
                className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-sakanly-primary border border-teal-200 transition-colors shrink-0 disabled:opacity-60"
                title="تواصل شات مع المالك"
                aria-label="تواصل شات مع المالك"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Safety Reminder */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              تنبيه الأمان الطلابي
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              المعاينات تتم نهاراً وبصحبة زميل أو ولي الأمر. لا تتردد في الإبلاغ عن أي إعلان يخالف المعايير.
            </p>
          </div>

        </div>

      </div>

      {/* Similar Listings Carousel / Grid */}
      {similarProperties.length > 0 && (
        <section className="pt-10 border-t border-sakanly-border space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-sakanly-dark">
              وحدات سكنية أخرى في نفس المنطقة ({property.city})
            </h3>
            <Link to={`/browse?city=${encodeURIComponent(property.city)}`} className="text-xs font-bold text-sakanly-primary hover:underline">
              عرض المزيد
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarProperties.map(sim => (
              <PropertyCard key={sim.id} property={sim} />
            ))}
          </div>
        </section>
      )}

      {/* Viewing Request Modal */}
      <ViewingRequestModal
        property={property}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

    </div>
  );
};
