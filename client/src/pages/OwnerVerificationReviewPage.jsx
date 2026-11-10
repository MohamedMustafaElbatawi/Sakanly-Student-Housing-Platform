import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ExternalLink,
  Download,
  UserCheck,
  Smartphone,
  Mail,
  Calendar,
  MapPin,
  Building,
  FileText,
  ScanFace,
  CreditCard,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  File,
  X,
  Info,
  CheckCheck
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
  verified: {
    label: 'معتمد وموثق',
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
  needs_correction: {
    label: 'مطلوب استكمال مستندات',
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
  not_started: {
    label: 'غير مبدوء',
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    icon: Clock,
  },
};

const maskNationalId = (id) => {
  if (!id || typeof id !== 'string') return '—';
  const clean = id.trim();
  if (clean.length !== 14) return clean;
  // Show first 4 digits, mask middle 6 digits, show last 4 digits
  return `${clean.slice(0, 4)}******${clean.slice(10)}`;
};

export const OwnerVerificationReviewPage = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const { adminToken, adminUser, isAdminAuthenticated } = useAdminAuth();

  // Data & Fetching State
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI Interactive State
  const [isMasked, setIsMasked] = useState(true);
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [activeOwnershipDocIdx, setActiveOwnershipDocIdx] = useState(0);
  const [toast, setToast] = useState(null);

  // Decision & Action Modals State
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [correctionModal, setCorrectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedCorrectionChips, setSelectedCorrectionChips] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Professional Lightbox Viewer State
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

  // 1. Guard & Authentication Check
  useEffect(() => {
    if (!isAdminAuthenticated || !adminToken) {
      navigate('/control-center/login', { replace: true });
    }
  }, [isAdminAuthenticated, adminToken, navigate]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  }, []);

  // 2. Fetch Verification Documents
  const fetchDocs = useCallback(async (isSilent = false) => {
    if (!adminToken || !ownerId) return;
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError('');

    try {
      const res = await adminApi.getOwnerVerificationDocs(adminToken, ownerId);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'تعذر استرجاع ملف توثيق المالك من الخادم.');
      }
      setData(res.data);
    } catch (err) {
      // Sanitized error logging without leaking private URLs or personal data
      console.error('[Admin Verification Review] Error fetching documents for owner:', ownerId);
      setError(err.message || 'حدث خطأ أثناء تحميل مستندات التوثيق.');
      showToast(err.message || 'تعذر تحميل مستندات التوثيق', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [adminToken, ownerId, showToast]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Copy National ID
  const handleCopyNationalId = (idNumber) => {
    if (!idNumber) return;
    navigator.clipboard.writeText(idNumber);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  // ─── Lightbox Controls ───────────────────────────────────────────────────────
  const openLightbox = (url, title) => {
    if (!url) return;
    setLightbox({
      isOpen: true,
      url,
      title: title || 'معاينة المستند',
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
      zoom: Math.min(Math.max(prev.zoom + delta, 0.5), 4),
    }));
  };

  const handleRotate = () => {
    setLightbox((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const resetLightboxView = () => {
    setLightbox((prev) => ({
      ...prev,
      zoom: 1,
      rotation: 0,
      pan: { x: 0, y: 0 },
    }));
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === '+' || e.key === '=') handleZoom(0.25);
      if (e.key === '-' || e.key === '_') handleZoom(-0.25);
      if (e.key === '0') resetLightboxView();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.isOpen]);

  // Pan Mouse Handlers
  const handleMouseDown = (e) => {
    if (lightbox.zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - lightbox.pan.x, y: e.clientY - lightbox.pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
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

  // ─── Verification Decision Actions ──────────────────────────────────────────
  const handleApproveConfirm = async () => {
    if (!ownerId) return;
    setIsProcessing(true);
    try {
      await adminApi.verifyOwner(adminToken, ownerId);
      showToast(`تم اعتماد وتوثيق هوية المالك ${data?.owner?.fullName || ''} بنجاح.`);
      setApproveModal(false);
      await fetchDocs(true);
    } catch (err) {
      showToast(err.message || 'فشل اعتماد الحساب', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!ownerId || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await adminApi.rejectOwner(adminToken, ownerId, rejectionReason.trim());
      showToast(`تم رفض طلب التوثيق وإشعار المالك بالسبب.`);
      setRejectModal(false);
      setRejectionReason('');
      await fetchDocs(true);
    } catch (err) {
      showToast(err.message || 'فشل رفض الطلب', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCorrectionConfirm = async () => {
    if (!ownerId || !correctionReason.trim()) return;
    setIsProcessing(true);
    try {
      await adminApi.requestOwnerCorrection(adminToken, ownerId, correctionReason.trim(), selectedCorrectionChips);
      showToast(`تم إرسال طلب استكمال وتعديل المستندات للمالك.`);
      setCorrectionModal(false);
      setCorrectionReason('');
      setSelectedCorrectionChips([]);
      await fetchDocs(true);
    } catch (err) {
      showToast(err.message || 'فشل إرسال طلب الاستكمال', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const addCorrectionChip = (chipText) => {
    if (!selectedCorrectionChips.includes(chipText)) {
      setSelectedCorrectionChips((prev) => [...prev, chipText]);
      setCorrectionReason((prev) => {
        const cleaned = prev.trim();
        return cleaned ? `${cleaned}\n• ${chipText}` : `• ${chipText}`;
      });
    }
  };

  // ─── Extract Structured Document URLs ───────────────────────────────────────
  const owner = data?.owner || {};
  const accountInfo = data?.accountInfo || {};
  const nationalId = data?.nationalId || {};
  const livenessCheck = data?.livenessCheck || {};
  const ownershipDocs = Array.isArray(data?.ownershipDocs) ? data.ownershipDocs : [];
  const verificationHistory = Array.isArray(data?.verificationHistory) ? data.verificationHistory : [];

  const frontDoc = nationalId?.frontDoc;
  const backDoc = nationalId?.backDoc;
  const selfieDoc = livenessCheck?.selfieDoc;

  const frontUrl = frontDoc?.signedUrl || frontDoc?.previewUrl || frontDoc?.secureUrl || '';
  const backUrl = backDoc?.signedUrl || backDoc?.previewUrl || backDoc?.secureUrl || '';
  const selfieUrl = selfieDoc?.signedUrl || selfieDoc?.previewUrl || selfieDoc?.secureUrl || '';

  const currentStatus = owner.verificationStatus || 'pending_review';
  const currentMeta = statusMeta[currentStatus] || statusMeta.pending_review;
  const StatusIcon = currentMeta.icon;

  const nationalIdNumber = accountInfo.nationalIdNumber || owner.nationalIdNumber || '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo text-[#1E293B] pb-32 selection:bg-[#0F766E] selection:text-white" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="mr-3 text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* ─── 1. TOP HEADER & BREADCRUMBS ───────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Title & Back Navigation */}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 font-medium">
                <Link to="/control-center?tab=overview" className="hover:text-slate-600">مركز القيادة</Link>
                <span>/</span>
                <Link to="/control-center?tab=verification" className="hover:text-slate-600">توثيق الملاك</Link>
                <span>/</span>
                <span className="text-[#0F766E] font-bold">مراجعة الطلب</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/control-center?tab=verification')}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center shrink-0"
                  title="العودة لقائمة توثيق الملاك"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0B3D3A] flex items-center gap-2.5">
                    <ShieldCheck className="w-6 h-6 text-[#0F766E]" />
                    <span>مراجعة وفحص مستندات توثيق المالك</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    فحص الهوية ومطابقة ملامح الوجه والتحقق القانوني من وثائق ملكية العقار
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Status Pill & Refresh Action */}
            <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
              <button
                type="button"
                onClick={() => fetchDocs(true)}
                disabled={isRefreshing || isLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-200 disabled:opacity-50"
                title="تحديث الروابط الموقعة واسترجاع المستندات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
                <span>{isRefreshing ? 'جارٍ التحديث...' : 'تحديث الروابط'}</span>
              </button>

              <div className={`px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs ${currentMeta.bg}`}>
                <span className={`w-2 h-2 rounded-full ${currentMeta.dot} animate-pulse`} />
                <StatusIcon className="w-4 h-4" />
                <span>{currentMeta.label}</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-3xl p-16 shadow-xs border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-[#0F766E] animate-spin" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800">جارٍ جلب وتأمين مستندات المالك...</h3>
              <p className="text-xs text-slate-400">
                يتم توليد الروابط الموقعة الآمنة (Cloudinary Signed URLs) لتمكين المعاينة الخاصة
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-bold text-base text-rose-900">تعذر تحميل بيانات ومستندات الطلب</h3>
              <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => fetchDocs()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة الآن</span>
              </button>
              <button
                onClick={() => navigate('/control-center?tab=verification')}
                className="px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all border border-slate-200"
              >
                العودة للقائمة
              </button>
            </div>
          </div>
        )}

        {/* Main Review Sections (Rendered when data is available) */}
        {!isLoading && !error && data && (
          <>
            {/* ─── 2. APPLICATION SUMMARY METRIC STRIP ─────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-[#0F766E] flex items-center justify-center shrink-0 font-black text-lg">
                  {owner.avatar ? (
                    <img src={owner.avatar} alt={owner.fullName} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span>{owner.fullName ? owner.fullName.charAt(0) : 'م'}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{owner.fullName}</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
                    <span>{owner.email}</span>
                    <span>•</span>
                    <span dir="ltr">{owner.phone || 'لا يوجد هاتف'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-500 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                <div>
                  <span className="block text-[11px] text-slate-400 font-bold">معرّف الحساب:</span>
                  <span className="font-mono text-slate-700 font-bold" dir="ltr">{owner.id}</span>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <span className="block text-[11px] text-slate-400 font-bold">تاريخ التقديم:</span>
                  <span className="text-slate-700 font-bold">{formatDate(owner.submittedAt || owner.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* ─── 3. OWNER PROFILE & PERSONAL INFORMATION ─────────────────────── */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">البيانات الشخصية ومعلومات الهوية الرسمية</h3>
                    <p className="text-xs text-slate-400">البيانات المسجلة بواسطة المالك لمطابقتها مع المستندات</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">القسم 1 من 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
                
                {/* Full Name */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>الاسم الرباعي المسجل:</span>
                  </span>
                  <p className="font-bold text-slate-800 text-sm">
                    {accountInfo.fullName || owner.fullName || '—'}
                  </p>
                </div>

                {/* National ID Number with Masking Toggle */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>الرقم القومي المصري (14 رقم):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMasked(!isMasked)}
                      className="text-[#0F766E] hover:text-[#0B3D3A] font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{isMasked ? 'إظهار الرقم' : 'إخفاء'}</span>
                    </button>
                  </span>
                  
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-slate-900 font-black tracking-wider text-sm" dir="ltr">
                      {isMasked ? maskNationalId(nationalIdNumber) : (nationalIdNumber || 'غير مسجل')}
                    </p>
                    {nationalIdNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyNationalId(nationalIdNumber)}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="نسخ الرقم القومي"
                      >
                        {hasCopiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Phone & OTP State */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      <span>رقم الهاتف المعتمد:</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      owner.phoneVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {owner.phoneVerified ? 'مؤكد برمز OTP ✓' : 'غير مؤكد'}
                    </span>
                  </span>
                  <p className="font-mono text-slate-900 font-bold" dir="ltr">
                    {owner.phone || 'غير مسجل'}
                  </p>
                </div>

                {/* Email Confirmation */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>البريد الإلكتروني:</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      مفعل ومؤكد ✓
                    </span>
                  </span>
                  <p className="font-mono text-slate-900 font-bold truncate">
                    {owner.email || '—'}
                  </p>
                </div>

                {/* Governorate & Address */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>المحافظة ومحل الإقامة:</span>
                  </span>
                  <p className="font-bold text-slate-800">
                    {accountInfo.governorate || 'القاهرة'} — {accountInfo.address || 'لم يُحدد العنوان التفصيلي'}
                  </p>
                </div>

                {/* Trade Name / Agency */}
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>الاسم التجاري أو الوكالة:</span>
                  </span>
                  <p className="font-bold text-slate-800">
                    {accountInfo.tradeName || 'مالك فردي (بدون اسم تجاري)'}
                  </p>
                </div>

              </div>
            </section>

            {/* ─── 4. NATIONAL ID CARDS REVIEW (FRONT & BACK SIDE-BY-SIDE) ────── */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">مستندات بطاقة الرقم القومي (وجه وظهر)</h3>
                    <p className="text-xs text-slate-400">فحص سريان البطاقة ووضوح الأرقام ومطابقة الصورة الشخصية</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">القسم 2 من 4</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 4.1 Front Card */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-slate-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                      <h4 className="font-bold text-sm text-slate-900">وجه بطاقة الرقم القومي (Front)</h4>
                    </div>
                    {frontDoc && (
                      <span className="text-[11px] text-slate-400 font-mono">{frontDoc.originalName || 'front_id.jpg'}</span>
                    )}
                  </div>

                  {frontUrl ? (
                    <div className="space-y-3">
                      <div className="h-72 sm:h-80 w-full rounded-2xl bg-slate-900/5 border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                        <img
                          src={frontUrl}
                          alt="وجه بطاقة الرقم القومي"
                          className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.parentElement) {
                              e.target.parentElement.innerHTML = '<div class="p-6 text-center text-xs text-rose-600 font-bold">تعذر تحميل صورة وجه البطاقة. قد تكون الرابط الموقّع منتهي الصلاحية، يرجى الضغط على زر "تحديث الروابط" بالأعلى.</div>';
                            }
                          }}
                        />

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openLightbox(frontUrl, 'وجه بطاقة الرقم القومي')}
                            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                          >
                            <ZoomIn className="w-4 h-4 text-[#0F766E]" />
                            <span>تكبير وفحص</span>
                          </button>
                          <a
                            href={frontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-lg"
                            title="فتح بحجم أصلي في نافذة مستقلة"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>انقر على زر "تكبير وفحص" لاستخدام المكبر والتحريك</span>
                        <button
                          type="button"
                          onClick={() => openLightbox(frontUrl, 'وجه بطاقة الرقم القومي')}
                          className="text-[#0F766E] font-bold hover:underline"
                        >
                          عرض بالـ Lightbox ←
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-72 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 gap-2">
                      <CreditCard className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">لم يتم رفع وجه البطاقة حتى الآن</p>
                    </div>
                  )}
                </div>

                {/* 4.2 Back Card */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-slate-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                      <h4 className="font-bold text-sm text-slate-900">ظهر بطاقة الرقم القومي (Back)</h4>
                    </div>
                    {backDoc && (
                      <span className="text-[11px] text-slate-400 font-mono">{backDoc.originalName || 'back_id.jpg'}</span>
                    )}
                  </div>

                  {backUrl ? (
                    <div className="space-y-3">
                      <div className="h-72 sm:h-80 w-full rounded-2xl bg-slate-900/5 border border-slate-200 overflow-hidden relative group flex items-center justify-center">
                        <img
                          src={backUrl}
                          alt="ظهر بطاقة الرقم القومي"
                          className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-300"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            if (e.target.parentElement) {
                              e.target.parentElement.innerHTML = '<div class="p-6 text-center text-xs text-rose-600 font-bold">تعذر تحميل صورة ظهر البطاقة. يرجى الضغط على زر "تحديث الروابط" بالأعلى.</div>';
                            }
                          }}
                        />

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => openLightbox(backUrl, 'ظهر بطاقة الرقم القومي')}
                            className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
                          >
                            <ZoomIn className="w-4 h-4 text-[#0F766E]" />
                            <span>تكبير وفحص</span>
                          </button>
                          <a
                            href={backUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-lg"
                            title="فتح بحجم أصلي في نافذة مستقلة"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>تحقق من تاريخ الانتهاء والمهنة والحالة الاجتماعية</span>
                        <button
                          type="button"
                          onClick={() => openLightbox(backUrl, 'ظهر بطاقة الرقم القومي')}
                          className="text-[#0F766E] font-bold hover:underline"
                        >
                          عرض بالـ Lightbox ←
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-72 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 gap-2">
                      <CreditCard className="w-10 h-10 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">لم يتم رفع ظهر البطاقة حتى الآن</p>
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* ─── 5. LIVE SELFIE & FACIAL COMPARISON SECTION ──────────────────── */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <ScanFace className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">مطابقة صورة السيلفي الحية مع الصورة الشخصية</h3>
                    <p className="text-xs text-slate-400">مقارنة بصرية دقيقة للتأكد من أن مقدم الطلب هو صاحب البطاقة الحقيقي</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">القسم 3 من 4</span>
              </div>

              {/* Auditor Responsibility Banner */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs leading-relaxed text-[#0B3D3A]">
                <Info className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">تنبيه مسؤول المراجعة والتدقيق:</strong>
                  <span>
                    يُرجى التحقق البصري الدقيق من تطابق ملامح الوجه (شكل الأنف، محيط العينين، خط الفك) بين صورة وجه البطاقة أعلاه وصورة السيلفي الحية أدناه. <strong>المنصة لا تصدر قراراً آلياً بصحة الهوية؛ فالمسؤولية القانونية لاعتماد الهوية تقع حصرياً على عاتق المراجع البشري المصرح له.</strong>
                  </span>
                </div>
              </div>

              {/* Side-by-side Facial Comparison Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Reference ID Card Face */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-slate-50/40 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">الصورة الشخصية المرجعية (من وجه البطاقة):</span>
                  {frontUrl ? (
                    <div className="h-64 sm:h-72 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img src={frontUrl} alt="مرجع البطاقة" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => openLightbox(frontUrl, 'الصورة المرجعية من بطاقة الرقم القومي')}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span>تكبير وجه البطاقة</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                      وجه البطاقة غير متوفر
                    </div>
                  )}
                </div>

                {/* Live Selfie Image */}
                <div className="border border-slate-200 rounded-3xl p-5 bg-slate-50/40 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block">صورة السيلفي الحية (التقاط مباشر عبر الكاميرا):</span>
                  {selfieUrl ? (
                    <div className="h-64 sm:h-72 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img src={selfieUrl} alt="صورة السيلفي الحية" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => openLightbox(selfieUrl, 'صورة السيلفي الحية للمالك')}
                        className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span>تكبير صورة السيلفي</span>
                      </button>
                    </div>
                  ) : (
                    <div className="h-64 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                      لم يتم التقاط صورة سيلفي حية
                    </div>
                  )}
                </div>

              </div>
            </section>

            {/* ─── 6. PROPERTY OWNERSHIP DOCUMENTS SECTION ─────────────────────── */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">مستندات إثبات ملكية العقار أو عقد الإدارة</h3>
                    <p className="text-xs text-slate-400">
                      عقود البيع، التوكيلات الرسمية الموثقة بالشهر العقاري، أو إيصالات المرافق
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-[#0F766E] rounded-full border border-teal-100">
                    {ownershipDocs.length} {ownershipDocs.length === 1 ? 'مستند مرفق' : 'مستندات مرفقة'}
                  </span>
                  <span className="text-xs font-bold text-slate-400 font-mono">القسم 4 من 4</span>
                </div>
              </div>

              {ownershipDocs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">لم يقم المالك بإرفاق أي مستند ملكية حتى الآن</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    يجب أن يقدم المالك عقد ملكية أو تفويض رسمي قبل اعتماد نشر الإعلانات.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Document Selector Tabs (if multiple docs) */}
                  {ownershipDocs.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
                      {ownershipDocs.map((doc, idx) => (
                        <button
                          key={doc.id || doc.publicId || idx}
                          type="button"
                          onClick={() => setActiveOwnershipDocIdx(idx)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                            activeOwnershipDocIdx === idx
                              ? 'bg-[#0B3D3A] text-white border-[#0B3D3A] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{doc.originalName || `مستند ملكية #${idx + 1}`}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Document Viewer Canvas */}
                  {(() => {
                    const activeDoc = ownershipDocs[activeOwnershipDocIdx] || ownershipDocs[0];
                    if (!activeDoc) return null;
                    const docUrl = activeDoc.signedUrl || activeDoc.previewUrl || activeDoc.secureUrl || '';
                    const isPdf = Boolean(
                      (activeDoc.format && activeDoc.format.toLowerCase() === 'pdf') ||
                      (activeDoc.originalName && activeDoc.originalName.toLowerCase().endsWith('.pdf')) ||
                      (activeDoc.publicId && activeDoc.publicId.toLowerCase().endsWith('.pdf'))
                    );

                    return (
                      <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50/30 space-y-4">
                        
                        {/* Doc Metadata & Actions Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{activeDoc.originalName || 'مستند إثبات الملكية'}</h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                النوع: {isPdf ? 'ملف PDF رسمي' : 'صورة مستند'} • {activeDoc.bytes ? `${(activeDoc.bytes / (1024 * 1024)).toFixed(2)} MB` : 'مرفوع عبر Cloudinary'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {!isPdf && docUrl && (
                              <button
                                type="button"
                                onClick={() => openLightbox(docUrl, activeDoc.originalName || 'مستند ملكية')}
                                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-[#0F766E]" />
                                <span>تكبير بالـ Lightbox</span>
                              </button>
                            )}

                            {docUrl && (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#0B3D3A] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح بالحجم الكامل</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Document View Canvas */}
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex items-center justify-center min-h-[420px] max-h-[750px]">
                          {isPdf ? (
                            <iframe
                              src={docUrl}
                              title="معاينة مستند PDF"
                              className="w-full h-[650px] border-0"
                            />
                          ) : docUrl ? (
                            <div
                              onClick={() => openLightbox(docUrl, activeDoc.originalName)}
                              className="w-full h-[500px] flex items-center justify-center bg-slate-950/5 cursor-zoom-in relative group p-4"
                            >
                              <img
                                src={docUrl}
                                alt="مستند الملكية"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-xs"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                <ZoomIn className="w-5 h-5" />
                                <span>انقر لتكبير المستند وفحصه</span>
                              </div>
                            </div>
                          ) : (
                            <div className="py-20 text-center text-slate-400 text-xs">
                              لا يتوفر رابط معاينة لهذا المستند
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}
            </section>

            {/* ─── 7. VERIFICATION AUDIT TRAIL ─────────────────────────────────── */}
            {verificationHistory.length > 0 && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0F766E]" />
                  <span>سجل الإجراءات والتدقيق السابق لطلب التوثيق</span>
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {verificationHistory.map((h, i) => (
                    <div key={i} className="py-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{h.reason || h.action}</span>
                        <span className="text-slate-400 text-[11px]">بواسطة: {h.adminName || 'إدارة المنصة'}</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px] shrink-0">{formatDate(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </main>

      {/* ─── 8. STICKY BOTTOM DECISION BAR ─────────────────────────────────────── */}
      {!isLoading && !error && data && (
        <aside className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-5 z-40 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Context Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0B3D3A] text-white flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                  اتخاذ القرار الإداري النهائي لطلب المالك
                </h4>
                <p className="text-[11px] text-slate-400">
                  الحالة الحالية: <span className="font-bold text-slate-700">{currentMeta.label}</span> • لن يتم اتخاذ أي إجراء تلقائي دون تأكيدك
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
              
              {/* 1. Request Correction Button */}
              {currentStatus !== 'verified' && (
                <button
                  type="button"
                  onClick={() => {
                    setCorrectionModal(true);
                    setCorrectionReason(owner.needsCorrectionReason || '');
                    setSelectedCorrectionChips([]);
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>طلب استكمال وتعديل</span>
                </button>
              )}

              {/* 2. Reject Button */}
              {currentStatus !== 'rejected' && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal(true);
                    setRejectionReason(owner.rejectionReason || '');
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>رفض الطلب</span>
                </button>
              )}

              {/* 3. Approve Button */}
              {currentStatus !== 'verified' && (
                <button
                  type="button"
                  onClick={() => setApproveModal(true)}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد وتوثيق الهوية</span>
                </button>
              )}

            </div>

          </div>
        </aside>
      )}

      {/* ─── MODAL 1: APPROVE CONFIRMATION DIALOG ──────────────────────────────── */}
      {approveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-black text-lg text-slate-900">تأكيد اعتماد وتوثيق هوية المالك</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل قمت بفحص صورة بطاقة الرقم القومي ومطابقة ملامح الوجه مع السيلفي الحي والتحقق من صحة مستندات الملكية؟
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
              <strong>الأثر المترتب:</strong> سيحصل المالك على شارة "مالك موثق" وسيتمكن من نشر وتفعيل العقارات فوراً مع إرسال إشعار تهنئة له.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApproveModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>نعم، اعتماد الهوية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REQUEST CORRECTION DIALOG ─────────────────────────────────── */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <span>طلب استكمال / تصحيح مستندات التوثيق</span>
              </h3>
              <button onClick={() => setCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              اختر النواقص الشائعة من القوائم السريعة أدناه أو اكتب ملاحظاتك التفصيلية التي ستصل للمالك في لوحته:
            </p>

            {/* Quick Correction Checklist Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 block">نواقص متكررة شائعة (انقر للإضافة):</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'صورة وجه بطاقة الرقم القومي غير واضحة وباهتة',
                  'صورة ظهر بطاقة الرقم القومي مقطوعة الأطراف',
                  'صورة السيلفي الحية غير واضحة الملامح أو معتمة',
                  'ملامح السيلفي غير مطابقة للصورة الشخصية بالبطاقة',
                  'مستند الملكية غير موثق بالشهر العقاري أو غير مكتمل',
                  'الاسم المسجل بالحساب لا يطابق الاسم بالبطاقة القومية',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => addCorrectionChip(chip)}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-900 text-slate-700 rounded-lg border border-slate-200 transition-colors text-right"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الملاحظات والتوجيهات للمالك:</label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                rows={4}
                placeholder="يرجى إعادة رفع صورة واضحة ومقروءة لوجه البطاقة مع التأكد من إضاءة جيدة..."
                className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCorrectionModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCorrectionConfirm}
                disabled={isProcessing || !correctionReason.trim()}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                <span>إرسال طلب الاستكمال</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: REJECT CONFIRMATION DIALOG ───────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>تأكيد رفض طلب التوثيق</span>
              </h3>
              <button onClick={() => setRejectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              يرجى تحديد سبب الرفض بوضوح ليتم تسجيله في سجل المراجعة وإبلاغ المالك به رسمياً:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">سبب الرفض المسجل:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="المستندات المقدمة مزورة أو منتهية الصلاحية، أو لا تطابق صاحب الحساب..."
                className="w-full p-3.5 border border-slate-200 rounded-2xl text-xs sm:text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                <span>تأكيد الرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROFESSIONAL LIGHTBOX MODAL (ZOOM, PAN, ROTATE) ───────────────────── */}
      {lightbox.isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 sm:px-6 bg-black/40 text-white z-10 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-bold text-sm truncate">{lightbox.title}</span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {Math.round(lightbox.zoom * 100)}%
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleZoom(0.25)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="تكبير (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-0.25)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="تصغير (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="تدوير 90 درجة"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={resetLightboxView}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
                title="إعادة ضبط الحجم (0)"
              >
                1:1
              </button>
              <a
                href={lightbox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="فتح بحجم أصلي في نافذة جديدة"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={closeLightbox}
                className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-colors ml-2"
                title="إغلاق (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Image View Canvas (Pan & Zoom) */}
          <div
            className={`flex-1 overflow-hidden flex items-center justify-center p-4 relative ${
              lightbox.zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleMouseDown}
          >
            <img
              src={lightbox.url}
              alt={lightbox.title}
              draggable={false}
              style={{
                transform: `translate(${lightbox.pan.x}px, ${lightbox.pan.y}px) scale(${lightbox.zoom}) rotate(${lightbox.rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                maxHeight: '85vh',
                maxWidth: '90vw',
              }}
              className="object-contain select-none shadow-2xl rounded-lg"
            />
          </div>

          {/* Bottom Hint */}
          <div className="text-center py-2.5 text-xs text-white/50 bg-black/40 border-t border-white/10">
            استخدم أزرار التكبير والتدوير أعلاه، أو اسحب الصورة بالماوس عند التكبير للتحريك • اضغط ESC للإغلاق
          </div>
        </div>
      )}

    </div>
  );
};

