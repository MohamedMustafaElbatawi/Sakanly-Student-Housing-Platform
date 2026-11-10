import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  MapPin,
  Calendar,
  Bed,
  Home,
  Phone,
  Mail,
  FileText,
  Edit3,
  Video,
  Image as ImageIcon,
  Info,
  CheckCheck,
  Sparkles,
  Layers,
  Compass,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../services/adminApi.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

// ─── Formatters & Style Constants ─────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const statusMeta = {
  active: {
    label: 'نشط ومعروض للطلاب',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  published: {
    label: 'منشور ومعتمد',
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  pending_review: {
    label: 'قيد المراجعة الإدارية',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  pending: {
    label: 'قيد المراجعة الإدارية',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  needs_correction: {
    label: 'مطلوب تعديل من المالك',
    bg: 'bg-orange-50 text-orange-900 border-orange-200',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
  },
  rejected: {
    label: 'مرفوض',
    bg: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
  },
  paused: {
    label: 'موقوف مؤقتاً',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  draft: {
    label: 'مسودة',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: FileText,
  },
};

const accommodationLabels = {
  private_room: 'غرفة خاصة مستقلة',
  shared_room: 'غرفة مشتركة',
  entire_apartment: 'شقة كاملة مستقلة',
  individual_bed: 'سرير فردي في غرفة',
};

const genderPreferenceLabels = {
  female: 'طالبات فقط (بنات)',
  male: 'طلاب فقط (شباب)',
  any: 'متاح للجميع (طلاب أو طالبات)',
};

// ─── Component: ListingModerationReviewPage ──────────────────────────────────
export const ListingModerationReviewPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { adminToken, adminUser, isAdminAuthenticated } = useAdminAuth();

  // Data & Fetching State
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Copy ID State
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Gallery & Media State
  const [mediaList, setMediaList] = useState([]);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [brokenMediaMap, setBrokenMediaMap] = useState({});

  // Lightbox Viewer State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    url: '',
    title: '',
    zoom: 1,
    rotation: 0,
    pan: { x: 0, y: 0 },
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Action Modals State
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [correctionModal, setCorrectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedCorrectionChips, setSelectedCorrectionChips] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Guard & Authentication
  useEffect(() => {
    if (!isAdminAuthenticated || !adminToken) {
      navigate('/control-center/login', { replace: true });
    }
  }, [isAdminAuthenticated, adminToken, navigate]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // 2. Fetch Listing Details
  const fetchListing = useCallback(async (isSilent = false) => {
    if (!adminToken || !listingId) return;
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError('');

    try {
      const res = await adminApi.getListingById(adminToken, listingId);
      if (!res.success || !res.data?.listing) {
        throw new Error(res.message || 'تعذر استرجاع بيانات العقار من الخادم.');
      }
      const item = res.data.listing;
      setListing(item);

      // Extract and normalize all media
      const items = [];
      if (Array.isArray(item.media) && item.media.length > 0) {
        item.media.forEach((m) => {
          if (typeof m === 'string') {
            items.push({ type: 'image', url: m });
          } else if (m && (m.secure_url || m.url || m.previewUrl)) {
            const isVid =
              m.resource_type === 'video' ||
              Boolean((m.secure_url || m.url).toLowerCase().match(/\.(mp4|webm|mov|ogg)$/));
            items.push({
              type: isVid ? 'video' : 'image',
              url: m.secure_url || m.url || m.previewUrl,
              publicId: m.public_id || m.publicId,
            });
          }
        });
      }
      if (Array.isArray(item.images)) {
        item.images.forEach((imgUrl) => {
          if (!items.some((x) => x.url === imgUrl)) {
            items.push({ type: 'image', url: imgUrl });
          }
        });
      }
      if (item.video || item.videoUrl) {
        const vUrl = item.video || item.videoUrl;
        if (!items.some((x) => x.url === vUrl)) {
          items.unshift({ type: 'video', url: vUrl });
        }
      }
      setMediaList(items);
      setActiveMediaIdx(0);
    } catch (err) {
      console.error('[Admin Review] Error loading listing:', listingId);
      setError(err.message || 'حدث خطأ أثناء تحميل بيانات العقار.');
      showToast(err.message || 'تعذر تحميل الإعلان', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminToken, listingId, showToast]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  // Copy Listing ID
  const handleCopyId = () => {
    if (!listing?.id) return;
    navigator.clipboard.writeText(listing.id);
    setHasCopiedId(true);
    showToast('تم نسخ معرّف الإعلان إلى الحافظة.', 'success');
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  // ─── Lightbox Controls ───────────────────────────────────────────────────────
  const openLightbox = (url, title) => {
    if (!url) return;
    setLightbox({
      isOpen: true,
      url,
      title: title || 'معاينة الصورة',
      zoom: 1,
      rotation: 0,
      pan: { x: 0, y: 0 },
    });
  };

  const closeLightbox = () => {
    setLightbox({
      isOpen: false,
      url: '',
      title: '',
      zoom: 1,
      rotation: 0,
      pan: { x: 0, y: 0 },
    });
  };

  const handleZoom = (delta) => {
    setLightbox((prev) => ({
      ...prev,
      zoom: Math.min(Math.max(0.5, prev.zoom + delta), 4),
    }));
  };

  const handleRotate = () => {
    setLightbox((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handleResetView = () => {
    setLightbox((prev) => ({
      ...prev,
      zoom: 1,
      rotation: 0,
      pan: { x: 0, y: 0 },
    }));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightbox.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === '+' || e.key === '=') handleZoom(0.25);
      if (e.key === '-') handleZoom(-0.25);
      if (e.key === 'r' || e.key === 'R') handleRotate();
      if (e.key === '0') handleResetView();
      if (e.key === 'ArrowRight' && mediaList.length > 1) {
        const nextIdx = (activeMediaIdx + 1) % mediaList.length;
        if (mediaList[nextIdx].type !== 'video') {
          setActiveMediaIdx(nextIdx);
          setLightbox((prev) => ({ ...prev, url: mediaList[nextIdx].url }));
        }
      }
      if (e.key === 'ArrowLeft' && mediaList.length > 1) {
        const prevIdx = (activeMediaIdx - 1 + mediaList.length) % mediaList.length;
        if (mediaList[prevIdx].type !== 'video') {
          setActiveMediaIdx(prevIdx);
          setLightbox((prev) => ({ ...prev, url: mediaList[prevIdx].url }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen, activeMediaIdx, mediaList]);

  // Mouse drag for pan
  const handleMouseDown = (e) => {
    if (lightbox.zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - lightbox.pan.x,
      y: e.clientY - lightbox.pan.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || lightbox.zoom <= 1) return;
    setLightbox((prev) => ({
      ...prev,
      pan: {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // ─── Administrative Decision Actions ──────────────────────────────────────────
  const handleApproveConfirm = async () => {
    if (!adminToken || !listing?.id || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminApi.updateListingStatus(adminToken, listing.id, 'active');
      if (!res.success) {
        throw new Error(res.message || 'تعذر اعتماد ونشر الإعلان.');
      }
      showToast(`تمت الموافقة ونشر إعلان "${listing.title}" بنجاح.`);
      setApproveModal(false);
      // Navigate back to moderation queue after brief toast confirmation
      setTimeout(() => {
        navigate('/control-center?tab=moderation', { replace: true });
      }, 1200);
    } catch (err) {
      showToast(err.message || 'فشلت عملية الموافقة', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!adminToken || !listing?.id || !rejectionReason.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await adminApi.updateListingStatus(
        adminToken,
        listing.id,
        'rejected',
        rejectionReason.trim()
      );
      if (!res.success) {
        throw new Error(res.message || 'تعذر رفض الإعلان.');
      }
      showToast(`تم رفض الإعلان وإشعار المالك بالسبب بنجاح.`);
      setRejectModal(false);
      setTimeout(() => {
        navigate('/control-center?tab=moderation', { replace: true });
      }, 1200);
    } catch (err) {
      showToast(err.message || 'فشلت عملية رفض الإعلان', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCorrectionConfirm = async () => {
    if (!adminToken || !listing?.id || isProcessing) return;
    const finalReason = [
      correctionReason.trim(),
      selectedCorrectionChips.length > 0 ? `النواقص المحددة: ${selectedCorrectionChips.join('، ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (!finalReason) {
      showToast('يرجى توضيح التعديلات أو اختيار الملاحظات المطلوبة.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await adminApi.updateListingStatus(
        adminToken,
        listing.id,
        'needs_correction',
        '',
        finalReason
      );
      if (!res.success) {
        throw new Error(res.message || 'تعذر إرسال طلب التعديل.');
      }
      showToast(`تم إرسال طلب التعديل للمالك بنجاح.`);
      setCorrectionModal(false);
      setTimeout(() => {
        navigate('/control-center?tab=moderation', { replace: true });
      }, 1200);
    } catch (err) {
      showToast(err.message || 'فشلت عملية طلب التعديل', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCorrectionChip = (chip) => {
    setSelectedCorrectionChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const currentMedia = mediaList[activeMediaIdx] || null;
  const currentStatus = statusMeta[listing?.status] || {
    label: listing?.status || 'غير محدد',
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-400',
    icon: Info,
  };
  const StatusIcon = currentStatus.icon;

  const priceVal = listing?.monthlyPrice || listing?.price || 0;
  const depositVal = listing?.deposit || 0;
  const utilitiesVal = listing?.utilitiesCost || 0;

  // Has valid coordinates for map
  const hasCoordinates =
    listing?.coordinates &&
    typeof listing.coordinates.lat === 'number' &&
    typeof listing.coordinates.lng === 'number' &&
    !isNaN(listing.coordinates.lat) &&
    !isNaN(listing.coordinates.lng);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 text-[#1E293B]">
      {/* ─── Top Global App Bar / Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/control-center?tab=moderation')}
              className="p-2 -mr-2 text-slate-500 hover:text-[#0F766E] hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="العودة إلى طابور مراجعة الإعلانات"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">طابور المراجعة</span>
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-bold">فحص ومراجعة إعلان عقار</span>
                <span className="text-[11px] text-slate-300">•</span>
                <span className="text-[11px] font-mono font-bold text-slate-600 truncate">
                  {listingId}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-[#1E293B] truncate mt-0.5">
                {listing?.title || 'جارٍ تحميل بيانات العقار...'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fetchListing(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 text-slate-500 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
            </button>

            {listing && (
              <a
                href={`/property/${listing.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-slate-600 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="معاينة في صفحة العقار الحية"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">معاينة الطالب</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
            <p className="text-xs font-bold text-slate-600">جارٍ جلب وتدقيق تفاصيل الإعلان من قاعدة البيانات...</p>
          </div>
        ) : error || !listing ? (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">تعذر العثور على الإعلان المطلوب</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {error || 'لم يتم العثور على العقار برقم المعرف المحدد، ربما تم حذفه أو أن المعرف غير صالح.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/control-center?tab=moderation')}
              className="px-5 py-2.5 bg-[#0B3D3A] text-white rounded-xl text-xs font-bold hover:bg-[#0F766E] transition-colors"
            >
              العودة لطابور المراجعة
            </button>
          </div>
        ) : (
          <>
            {/* ─── Banner: Listing Overview & Status Bar ────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStatus.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                    <span>{currentStatus.label}</span>
                  </span>

                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="انقر لنسخ المعرف"
                  >
                    <span>ID: {listing.id}</span>
                    {hasCopiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  </button>

                  {listing.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      <ShieldCheck className="w-3 h-3 text-teal-600" />
                      <span>عقار معتمد</span>
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-black text-[#1E293B] leading-tight">
                  {listing.title}
                </h2>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {listing.governorate ? `${listing.governorate} — ` : ''}{listing.city} {listing.district ? `(${listing.district})` : ''}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ الإرسال: {formatDate(listing.submittedAt || listing.createdAt)}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{mediaList.length} وسائط مرفوعة</span>
                  </span>
                </div>
              </div>

              {/* Owner Micro Card in Banner */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200/70 p-3.5 flex items-center gap-3 shrink-0 self-start md:self-center">
                <div className="w-11 h-11 rounded-xl bg-[#0B3D3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {listing.owner?.name ? listing.owner.name.substring(0, 2) : 'مالك'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {listing.owner?.name || 'غير محدد'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px]">
                    {listing.owner?.phone || 'بدون هاتف'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {listing.owner?.isVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        <span>مالك موثق</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>توثيق معلق</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Previous Rejection / Correction Banner if any ──────────────────── */}
            {listing.rejectionReason && (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 text-xs text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>سبب الرفض المسجل مسبقاً لهذا الإعلان:</span>
                </div>
                <p className="pr-6 text-[11px] leading-relaxed text-rose-700">{listing.rejectionReason}</p>
              </div>
            )}
            {listing.correctionReason && (
              <div className="bg-orange-50 border border-orange-200 rounded-3xl p-4 text-xs text-orange-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-orange-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-orange-600" />
                  <span>ملاحظات التعديل المطلوبة من المالك:</span>
                </div>
                <p className="pr-6 text-[11px] leading-relaxed text-orange-800">{listing.correctionReason}</p>
              </div>
            )}

            {/* ─── Grid: Media & Specs (2 Columns Layout) ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ─── Right / Main Column: Media & Full Specs (7 Cols) ───────────── */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Large Media Player & Gallery Section */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#0F766E]" />
                      <h3 className="text-sm font-bold text-[#1E293B]">معرض الصور والفيديو</h3>
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {mediaList.length} ملف
                      </span>
                    </div>

                    {currentMedia && currentMedia.type !== 'video' && (
                      <button
                        onClick={() => openLightbox(currentMedia.url, `${listing.title} - صورة ${activeMediaIdx + 1}`)}
                        className="px-3 py-1.5 text-xs font-bold text-[#0F766E] bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>ملء الشاشة</span>
                      </button>
                    )}
                  </div>

                  {/* Main Display Stage */}
                  <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-950 overflow-hidden relative border border-slate-200 flex items-center justify-center group">
                    {currentMedia ? (
                      currentMedia.type === 'video' ? (
                        <video
                          src={currentMedia.url}
                          controls
                          className="w-full h-full object-contain bg-black"
                          poster={listing.images?.[0]}
                        />
                      ) : brokenMediaMap[currentMedia.url] ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                          <AlertTriangle className="w-10 h-10 text-amber-400" />
                          <p className="text-xs font-bold text-slate-300">تعذر تحميل هذه الصورة من المصدر</p>
                          <p className="text-[10px] text-slate-500 max-w-xs break-all">{currentMedia.url}</p>
                        </div>
                      ) : (
                        <img
                          src={currentMedia.url}
                          alt={listing.title}
                          onError={() => setBrokenMediaMap((prev) => ({ ...prev, [currentMedia.url]: true }))}
                          onClick={() => openLightbox(currentMedia.url, `${listing.title} - صورة ${activeMediaIdx + 1}`)}
                          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Building2 className="w-12 h-12 stroke-[1.5]" />
                        <p className="text-xs">لا توجد صور أو وسائط مرفوعة في هذا الإعلان</p>
                      </div>
                    )}

                    {/* Navigation Arrows on Stage */}
                    {mediaList.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveMediaIdx((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                          title="السابق"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setActiveMediaIdx((prev) => (prev + 1) % mediaList.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                          title="التالي"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Media Counter Badge */}
                    {mediaList.length > 0 && (
                      <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 font-mono">
                        {currentMedia?.type === 'video' ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-teal-400" />}
                        <span>{activeMediaIdx + 1} / {mediaList.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails Carousel */}
                  {mediaList.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                      {mediaList.map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveMediaIdx(idx)}
                          className={`relative w-18 h-18 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                            activeMediaIdx === idx
                              ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 scale-102'
                              : 'border-slate-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {m.type === 'video' ? (
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white">
                              <Video className="w-5 h-5 text-amber-400" />
                              <span className="text-[8px] mt-0.5 font-bold">فيديو</span>
                            </div>
                          ) : (
                            <img src={m.url} alt="" className="w-full h-full object-cover" />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-mono px-1 rounded">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Full Description Card */}
                {listing.description && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B] border-b border-slate-100 pb-3">
                      <FileText className="w-4 h-4 text-[#0F766E]" />
                      <span>الوصف الكامل للإعلان كما كتبه المالك</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                      {listing.description}
                    </p>
                  </div>
                )}

                {/* 3. Amenities & Facilities (المميزات والخدمات) */}
                {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B] border-b border-slate-100 pb-3">
                      <Sparkles className="w-4 h-4 text-[#0F766E]" />
                      <span>المميزات والخدمات المتوفرة بالسكن ({listing.amenities.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {listing.amenities.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Nearby Universities (الجامعات المحيطة) */}
                {Array.isArray(listing.nearbyUniversities) && listing.nearbyUniversities.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B] border-b border-slate-100 pb-3">
                      <Compass className="w-4 h-4 text-[#0F766E]" />
                      <span>الجامعات والمؤسسات التعليمية القريبة</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {listing.nearbyUniversities.map((u, idx) => (
                        <div
                          key={idx}
                          className="bg-teal-50/60 border border-teal-100 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="font-bold text-teal-950">{u.name}</div>
                          {u.distance && (
                            <span className="text-[11px] font-semibold text-teal-700 bg-white px-2 py-0.5 rounded-lg border border-teal-100 shrink-0">
                              {u.distance}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Left Column: Financials, Housing Specs, Location & Owner (5 Cols) ─ */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Financial Breakdown Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#1E293B]">التفاصيل والالتزامات المالية</h3>
                    <span className="text-[11px] text-[#0F766E] font-bold">تسعير الوحدة</span>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#0B3D3A] text-white p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-teal-200 font-bold block">الإيجار الشهري المعلن</span>
                        <span className="text-xl sm:text-2xl font-black mt-0.5 block">
                          {priceVal.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      <span className="text-xs bg-white/10 px-2.5 py-1 rounded-xl text-teal-100">شهرياً</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">مبلغ التأمين المسترد</span>
                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                          {depositVal > 0 ? `${depositVal.toLocaleString('ar-EG')} ج.م` : 'بدون تأمين'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">تكلفة المرافق الشهرية</span>
                        <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                          {utilitiesVal > 0 ? `${utilitiesVal.toLocaleString('ar-EG')} ج.م` : 'مشمولة في الإيجار'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Housing Specifications Grid */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B] border-b border-slate-100 pb-3">
                    <Layers className="w-4 h-4 text-[#0F766E]" />
                    <span>مواصفات وتجهيز السكن</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">نوع الإقامة</span>
                      <span className="font-bold text-slate-800">
                        {accommodationLabels[listing.accommodationType] || listing.accommodationType || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">الأسرة المتاحة / الإجمالي</span>
                      <span className="font-bold text-slate-800">
                        {listing.availableBeds ?? 1} متاح من إجمالي {listing.totalBeds ?? 1} أسِرّة
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">عدد الغرف والحمامات</span>
                      <span className="font-bold text-slate-800">
                        {listing.bedrooms ?? 1} غرف نوم • {listing.bathrooms ?? 1} حمامات
                      </span>
                    </div>

                    {listing.area > 0 && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-500">المساحة الإجمالية</span>
                        <span className="font-bold text-slate-800">{listing.area} متر مربع</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">تفضيل الجنس</span>
                      <span className="font-bold text-slate-800">
                        {genderPreferenceLabels[listing.genderPreference] || listing.genderPreference || 'متاح للجميع'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-slate-500">حالة الفرش والتأثيث</span>
                      <span className="font-bold text-slate-800">
                        {listing.isFurnished ? 'مفروش بالكامل ومجهز' : 'غير مفروش'}
                      </span>
                    </div>

                    {listing.availableFrom && (
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <span className="text-slate-500">تاريخ الإتاحة والتسكين</span>
                        <span className="font-bold text-slate-800">{formatDate(listing.availableFrom)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Location & Map Section */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B] border-b border-slate-100 pb-3">
                    <MapPin className="w-4 h-4 text-[#0F766E]" />
                    <span>الموقع الجغرافي المسجل</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      <span className="font-bold text-slate-900">المحافظة والمدينة: </span>
                      {listing.governorate ? `${listing.governorate} — ` : ''}{listing.city} {listing.district ? `(${listing.district})` : ''}
                    </p>
                    {listing.address && (
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                        <span className="font-bold text-slate-800">العنوان التفصيلي: </span>
                        {listing.address}
                      </p>
                    )}

                    {/* Google Map Link / Coordinates if available */}
                    {hasCoordinates && (
                      <div className="pt-2">
                        <a
                          href={`https://www.google.com/maps?q=${listing.coordinates.lat},${listing.coordinates.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>فتح الموقع الجغرافي على Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Authoritative Owner Profile Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-bold text-[#1E293B]">بيانات مالك العقار</h3>
                    {listing.owner?.isVerified ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>معتمد وموثق</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>توثيق معلق</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B3D3A] text-white flex items-center justify-center font-bold text-base shrink-0">
                        {listing.owner?.name ? listing.owner.name.substring(0, 2) : 'مالك'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#1E293B] truncate">{listing.owner?.name || 'غير محدد'}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          معرّف المالك: {listing.owner?.id || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs pt-1">
                      {listing.owner?.phone && (
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>الهاتف:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800 dir-ltr">{listing.owner.phone}</span>
                        </div>
                      )}
                      {listing.owner?.email && (
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>البريد:</span>
                          </span>
                          <span className="font-mono text-slate-800 text-[11px] truncate max-w-[200px]">{listing.owner.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Link to Owner Verification Dossier */}
                    {listing.owner?.id && (
                      <Link
                        to={`/control-center/owner-verification/${listing.owner.id}`}
                        className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>فحص مستندات وهوية المالك (ملف التوثيق)</span>
                      </Link>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700">تنويه إداري: </span>
                      توثيق حساب المالك لا يغني عن فحص مواصفات وصور هذا الإعلان والتحقق من التزامه بمعايير النشر.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Fixed Bottom Decision Bar (شريط قرارات الإدارة الثابت) ─────────────── */}
      {listing && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl p-4 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStatus.bg}`}>
                <span className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
                <span>الحالة: {currentStatus.label}</span>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-bold truncate max-w-sm">
                {listing.title}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => navigate('/control-center?tab=moderation')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors shrink-0"
              >
                إلغاء / رجوع
              </button>

              <button
                onClick={() => {
                  setCorrectionModal(true);
                  setCorrectionReason(listing.correctionReason || '');
                  setSelectedCorrectionChips([]);
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-white hover:bg-orange-50 border-2 border-orange-500 text-orange-700 text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                <span>طلب تعديل</span>
              </button>

              <button
                onClick={() => {
                  setRejectModal(true);
                  setRejectionReason(listing.rejectionReason || '');
                }}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-white hover:bg-rose-50 border-2 border-rose-500 text-rose-700 text-xs font-bold rounded-2xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض الإعلان</span>
              </button>

              <button
                onClick={() => setApproveModal(true)}
                disabled={isProcessing || listing.status === 'active'}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ المعالجة...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>موافقة ونشر الإعلان</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Decision Modals ───────────────────────────────────────────────────── */}
      {/* 1. Approve Confirm Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-[#1E293B]">تأكيد اعتماد ونشر العقار</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من مطابقة جميع بيانات وصور إعلان «{listing?.title}»؟ سيتم تفعيل العقار ونشره فوراً ليظهر للطلاب في نتائج البحث العام.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApproveModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleApproveConfirm}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>نعم، نشر الإعلان الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Request Correction Modal */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                <Edit3 className="w-5 h-5 shrink-0" />
                <span>طلب استكمال وتعديل بيانات الإعلان</span>
              </div>
              <button onClick={() => setCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              سيتم تغيير حالة الإعلان إلى «مطلوب تعديل» وإخطار المالك بالملاحظات لإعادة تحديث العقار وإرساله مجدداً:
            </p>

            {/* Quick chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">اقتراحات سريعة للملاحظات:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'صور غير واضحة أو ناقصة',
                  'الموقع الجغرافي أو العنوان غير دقيق',
                  'توضيح استهلاك المرافق (كهرباء/مياه)',
                  'تعديل تفاصيل عدد الأسِرّة المتاحة',
                  'تصحيح السعر ليتطابق مع مواصفات الوحدة',
                ].map((chip) => {
                  const isSelected = selectedCorrectionChips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleCorrectionChip(chip)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              rows={4}
              placeholder="اكتب التوجيهات أو الملاحظات التفصيلية للمالك هنا..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCorrectionModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCorrectionConfirm}
                disabled={isProcessing || (!correctionReason.trim() && selectedCorrectionChips.length === 0)}
                className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>إرسال طلب التعديل للمالك</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <XCircle className="w-5 h-5 shrink-0" />
                <span>رفض نشر الإعلان</span>
              </div>
              <button onClick={() => setRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              يرجى كتابة سبب رفض الإعلان بدقة لتسجيله في سجل التدقيق وإرساله كإشعار للمالك:
            </p>

            <textarea
              rows={3}
              placeholder="مثال: الإعلان مكرر، أو البيانات تخالف سياسات النشر على المنصة..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={isProcessing || !rejectionReason.trim()}
                className="px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>تأكيد رفض الإعلان</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Lightbox Fullscreen Viewer ────────────────────────────────────────── */}
      {lightbox.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between animate-fade-in select-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Lightbox Header Bar */}
          <div className="p-4 flex items-center justify-between text-white bg-black/40 backdrop-blur-md border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={closeLightbox}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="إغلاق (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-slate-200 truncate max-w-md">
                {lightbox.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom(0.25)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(-0.25)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="تدوير 90 درجة (R)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-xs font-mono font-bold"
                title="إعادة ضبط (0)"
              >
                {Math.round(lightbox.zoom * 100)}%
              </button>
            </div>
          </div>

          {/* Lightbox Image Stage with Pan & Zoom */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
            onMouseDown={handleMouseDown}
            style={{ cursor: lightbox.zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.title}
              draggable={false}
              className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-100 shadow-2xl"
              style={{
                transform: `translate(${lightbox.pan.x}px, ${lightbox.pan.y}px) scale(${lightbox.zoom}) rotate(${lightbox.rotation}deg)`,
              }}
            />

            {/* Next / Previous Overlay Buttons inside Lightbox */}
            {mediaList.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIdx = (activeMediaIdx - 1 + mediaList.length) % mediaList.length;
                    if (mediaList[prevIdx].type !== 'video') {
                      setActiveMediaIdx(prevIdx);
                      setLightbox((prev) => ({ ...prev, url: mediaList[prevIdx].url }));
                    }
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="الصورة السابقة"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIdx = (activeMediaIdx + 1) % mediaList.length;
                    if (mediaList[nextIdx].type !== 'video') {
                      setActiveMediaIdx(nextIdx);
                      setLightbox((prev) => ({ ...prev, url: mediaList[nextIdx].url }));
                    }
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
                  title="الصورة التالية"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Footer Instruction Bar */}
          <div className="p-3 text-center text-[11px] text-slate-400 bg-black/40 backdrop-blur-md border-t border-white/10">
            استخدم الأسهم للتنقل • عجلة الفأرة أو الأزرار للتكبير والتصغير • اسحب الصورة للتحريك عند التكبير • اضغط Esc للخروج
          </div>
        </div>
      )}

      {/* ─── Floating Toast Notification ───────────────────────────────────────── */}
      {toast && (
        <div
          role="status"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

