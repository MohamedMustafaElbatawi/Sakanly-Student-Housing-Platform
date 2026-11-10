import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ScanFace, 
  Camera, 
  RotateCcw, 
  FileCheck, 
  Check, 
  Info,
  UserCheck,
  Smartphone,
  Mail,
  FileText,
  Send,
  Loader2,
  AlertTriangle,
  Trash2,
  UploadCloud,
  Eye,
  File,
  RefreshCw,
  MapPin,
  Building2,
  CheckCircle
} from 'lucide-react';
import { authApi, mediaApi } from '../../services/api.js';

export const OwnerVerificationView = ({ owner, token, onVerificationUpdated }) => {
  // Overall data state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [verificationData, setVerificationData] = useState(null);

  // Active stage tab (1 through 6)
  const [activeStage, setActiveStage] = useState(1);

  // Stage 1: Account Info Form
  const [accountForm, setAccountForm] = useState({
    fullName: '',
    nationalIdNumber: '',
    tradeName: '',
    governorate: 'القاهرة',
    address: '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  // Stage 2: Phone OTP State
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Stage 3: National ID Upload State
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  // Stage 4: Live Selfie State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Stage 5: Ownership Docs State
  const [ownershipDocType, setOwnershipDocType] = useState('عقد ملكية مسجل');
  const [uploadingOwnership, setUploadingOwnership] = useState(false);

  // Fetch latest verification status from backend
  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getVerificationStatus(token);
      setVerificationData(data);
      
      // Sync local account form
      const acc = data.verificationDetails?.accountInfo || {};
      setAccountForm({
        fullName: acc.fullName || data.fullName || '',
        nationalIdNumber: acc.nationalIdNumber || data.nationalIdNumber || '',
        tradeName: acc.tradeName || data.tradeName || '',
        governorate: acc.governorate || 'القاهرة',
        address: acc.address || '',
      });

      // Sync phone
      setPhoneInput(data.phone || data.verificationDetails?.phoneConfirmation?.phone || '');

      // Set initial active stage to first incomplete step
      const details = data.verificationDetails || {};
      const s1 = Boolean(acc.completed || (acc.fullName && acc.nationalIdNumber?.length === 14));
      const s2 = Boolean(data.emailVerified || details.emailConfirmation?.isVerified);
      const s3 = Boolean(details.nationalId?.frontDoc && details.nationalId?.backDoc);
      const s4 = Boolean(details.livenessCheck?.selfieDoc);
      const s5 = Boolean(Array.isArray(details.ownershipDocs) && details.ownershipDocs.length > 0);

      if (data.verificationStatus === 'verified' || data.verificationStatus === 'pending_review') {
        setActiveStage(6);
      } else if (!s1) setActiveStage(1);
      else if (!s2) setActiveStage(2);
      else if (!s3) setActiveStage(3);
      else if (!s4) setActiveStage(4);
      else if (!s5) setActiveStage(5);
      else setActiveStage(6);

    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'تعذر تحميل بيانات التوثيق.' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Timer countdown for OTP
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const currentStatus = verificationData?.verificationStatus || owner?.verificationStatus || 'not_started';
  const isVerified = currentStatus === 'verified';
  const isPending = currentStatus === 'pending_review';
  const isRejected = currentStatus === 'rejected';
  const isNeedsCorrection = currentStatus === 'needs_correction';

  const details = verificationData?.verificationDetails || {};
  const s1Complete = Boolean(details.accountInfo?.completed || (details.accountInfo?.fullName && details.accountInfo?.nationalIdNumber?.length === 14));
  const s2Complete = Boolean(verificationData?.emailVerified || details.emailConfirmation?.isVerified);
  const s3Complete = Boolean((details.nationalId?.frontDoc?.publicId || details.nationalId?.frontDoc?.secureUrl) && (details.nationalId?.backDoc?.publicId || details.nationalId?.backDoc?.secureUrl));
  const s4Complete = Boolean(details.livenessCheck?.selfieDoc?.publicId || details.livenessCheck?.selfieDoc?.secureUrl);
  const s5Complete = Boolean(Array.isArray(details.ownershipDocs) && details.ownershipDocs.length > 0);
  const allPrerequisitesComplete = s1Complete && s2Complete && s3Complete && s4Complete && s5Complete;

  // 6 Steps definition
  const steps = [
    { id: 1, title: 'بيانات الحساب', icon: UserCheck, isDone: s1Complete },
    { id: 2, title: 'تأكيد البريد', icon: Mail, isDone: s2Complete },
    { id: 3, title: 'بطاقة الهوية', icon: CreditCard, isDone: s3Complete },
    { id: 4, title: 'سيلفي حية', icon: ScanFace, isDone: s4Complete },
    { id: 5, title: 'مستند الملكية', icon: FileText, isDone: s5Complete },
    { id: 6, title: 'اعتماد الإدارة', icon: FileCheck, isDone: isVerified },
  ];

  // ================= STAGE 1 HANDLER =================
  const handleSaveAccountInfo = async (e) => {
    e.preventDefault();
    if (!accountForm.fullName.trim() || accountForm.fullName.trim().length < 3) {
      setActionFeedback({ type: 'error', message: 'يرجى كتابة الاسم الرباعي الرسمي.' });
      return;
    }
    const cleanId = accountForm.nationalIdNumber.replace(/\D/g, '');
    if (cleanId.length !== 14) {
      setActionFeedback({ type: 'error', message: 'بطاقة الرقم القومي المصري يجب أن تتكون من 14 رقماً بالضبط.' });
      return;
    }

    try {
      setSavingAccount(true);
      setActionFeedback(null);
      const res = await authApi.saveVerificationAccountInfo(token, accountForm);
      setActionFeedback({ type: 'success', message: 'تم حفظ وتأكيد بيانات الحساب بنجاح.' });
      if (onVerificationUpdated && res.data?.user) {
        onVerificationUpdated(res.data.user);
      }
      await fetchStatus();
      if (!s2Complete) setActiveStage(2);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل حفظ بيانات الحساب.' });
    } finally {
      setSavingAccount(false);
    }
  };

  // ================= STAGE 2 HANDLERS (Brevo Email OTP) =================
  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);
      setActionFeedback(null);
      const res = await authApi.sendEmailVerificationOtp(token);
      setOtpSent(true);
      setOtpTimer(res.cooldownSeconds || 60);
      setActionFeedback({
        type: 'success',
        message: res.message || 'تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني بنجاح.',
      });
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'فشل إرسال رمز التحقق إلى البريد الإلكتروني.',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.trim().length !== 6) {
      setActionFeedback({
        type: 'error',
        message: 'يرجى كتابة رمز التحقق المكون من 6 أرقام بدقة.',
      });
      return;
    }

    try {
      setVerifyingOtp(true);
      setActionFeedback(null);
      const res = await authApi.verifyEmailVerificationOtp(token, otpInput.trim());
      setActionFeedback({
        type: 'success',
        message: res.message || 'تم تأكيد وتوثيق بريدك الإلكتروني بنجاح!',
      });
      if (onVerificationUpdated && res.data?.user) {
        onVerificationUpdated(res.data.user);
      }
      await fetchStatus();
      if (!s3Complete) setActiveStage(3);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'فشل تأكيد رمز التحقق.',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ================= STAGE 3 HANDLERS =================
  const handleUploadIdDoc = async (file, docType) => {
    if (!file) return;
    const isFront = docType === 'national_id_front';
    const setter = isFront ? setUploadingFront : setUploadingBack;

    try {
      setter(true);
      setActionFeedback(null);
      const docs = await mediaApi.uploadVerificationDocument(file, docType, token);
      if (docs && docs.length > 0) {
        const doc = docs[0];
        await authApi.saveVerificationDoc(token, {
          docType,
          publicId: doc.public_id,
          secureUrl: doc.secure_url || doc.preview_url,
          originalName: doc.originalName || file.name,
          bytes: doc.bytes || file.size,
          format: doc.format,
        });
        setActionFeedback({ type: 'success', message: `تم رفع صورة ${isFront ? 'وجه' : 'ظهر'} بطاقة الهوية وتأمينها بنجاح.` });
        await fetchStatus();
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل رفع صورة بطاقة الرقم القومي.' });
    } finally {
      setter(false);
    }
  };

  const handleRemoveDoc = async (docType, docId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستند؟')) return;
    try {
      setActionFeedback(null);
      await authApi.removeVerificationDoc(token, docType, docId);
      setActionFeedback({ type: 'success', message: 'تم حذف المستند بنجاح.' });
      await fetchStatus();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل حذف المستند.' });
    }
  };

  // ================= STAGE 4 HANDLERS (Live Selfie) =================
  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم الوصول المباشر للكاميرا. يمكنك رفع صورة ملتقطة مباشرة من جهازك.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || 'تعذر تشغيل الكاميرا. يرجى التحقق من إعطاء إذن الكاميرا أو استخدام خيار رفع الصورة.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureLiveSelfie = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();

      try {
        setUploadingSelfie(true);
        setActionFeedback(null);
        const docs = await mediaApi.uploadVerificationDocument(file, 'liveness_selfie', token);
        if (docs && docs.length > 0) {
          const doc = docs[0];
          await authApi.saveVerificationDoc(token, {
            docType: 'liveness_selfie',
            publicId: doc.public_id,
            secureUrl: doc.secure_url || doc.preview_url,
            originalName: 'live_selfie_capture.jpg',
            bytes: doc.bytes || file.size,
            format: 'jpg',
          });
          setActionFeedback({ type: 'success', message: 'تم التقاط صورة السيلفي وتأمينها بنجاح لمطابقة ملامح الوجه.' });
          await fetchStatus();
          if (!s5Complete) setActiveStage(5);
        }
      } catch (err) {
        setActionFeedback({ type: 'error', message: err.message || 'فشل حفظ صورة السيلفي.' });
      } finally {
        setUploadingSelfie(false);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleSelfieFileUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingSelfie(true);
      setActionFeedback(null);
      const docs = await mediaApi.uploadVerificationDocument(file, 'liveness_selfie', token);
      if (docs && docs.length > 0) {
        const doc = docs[0];
        await authApi.saveVerificationDoc(token, {
          docType: 'liveness_selfie',
          publicId: doc.public_id,
          secureUrl: doc.secure_url || doc.preview_url,
          originalName: file.name,
          bytes: doc.bytes || file.size,
          format: doc.format,
        });
        setActionFeedback({ type: 'success', message: 'تم رفع صورة السيلفي بنجاح لمطابقة ملامح الوجه.' });
        await fetchStatus();
        if (!s5Complete) setActiveStage(5);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل رفع صورة السيلفي.' });
    } finally {
      setUploadingSelfie(false);
    }
  };

  // ================= STAGE 5 HANDLERS =================
  const handleUploadOwnershipDoc = async (file) => {
    if (!file) return;
    try {
      setUploadingOwnership(true);
      setActionFeedback(null);
      const docs = await mediaApi.uploadVerificationDocument(file, 'ownership_document', token);
      if (docs && docs.length > 0) {
        const doc = docs[0];
        await authApi.saveVerificationDoc(token, {
          docType: 'ownership_document',
          publicId: doc.public_id,
          secureUrl: doc.secure_url || doc.preview_url,
          originalName: `${ownershipDocType} - ${file.name}`,
          bytes: doc.bytes || file.size,
          format: doc.format,
        });
        setActionFeedback({ type: 'success', message: 'تم رفع وتأمين مستند الملكية بنجاح.' });
        await fetchStatus();
        setActiveStage(6);
      }
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل رفع مستند الملكية.' });
    } finally {
      setUploadingOwnership(false);
    }
  };

  // ================= STAGE 6 SUBMISSION =================
  const handleSubmitVerification = async () => {
    if (submitting || isVerified || isPending) return;
    if (!allPrerequisitesComplete) {
      setActionFeedback({
        type: 'error',
        message: 'يرجى استكمال جميع المراحل الخمس السابقة قبل إرسال الطلب للاعتماد.',
      });
      return;
    }

    try {
      setSubmitting(true);
      setActionFeedback(null);
      const res = await authApi.submitVerification(token, {
        submittedAt: new Date().toISOString(),
      });
      setActionFeedback({
        type: 'success',
        message: res.message || 'تم تقديم طلب التوثيق بنجاح! ملفك الآن قيد فحص وتدقيق إدارة منصة سكنلي.',
      });
      if (onVerificationUpdated && res.data?.user) {
        onVerificationUpdated(res.data.user);
      }
      await fetchStatus();
      setActiveStage(6);
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.message || 'فشل إرسال طلب التوثيق.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !verificationData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-sakanly-muted font-cairo">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
        <span className="text-sm font-bold">جارٍ تحميل ملف التوثيق المعتمد...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-cairo text-right" dir="rtl">

      {/* Alerts according to real backend state */}
      {isVerified && (
        <div className="p-4 sm:p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-emerald-950">حساب المالك موثق ومعتمد رسمياً 🎉</h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                تم اعتماد هويتك وسندات ملكيتك بنجاح من إدارة سكنلي. يمكنك الآن نشر وتفعيل كافة إعلاناتك واستقبال طلبات الطلاب مباشرة.
              </p>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-xs font-bold shrink-0 self-end sm:self-auto shadow-2xs">
            معتمد ونشط
          </span>
        </div>
      )}

      {isPending && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 text-amber-950 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-amber-950">طلب التوثيق قيد المراجعة الإدارية</h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                تم استلام ملفك ومستنداتك بنجاح، ويقوم فريق إدارة سكنلي بفحصها وتدقيقها الآن. يتم البت في الطلبات عادة خلال 24 ساعة.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold shrink-0 self-end sm:self-auto">
            بانتظار قرار الإدارة
          </span>
        </div>
      )}

      {isNeedsCorrection && (
        <div className="p-4 sm:p-5 bg-orange-50 border-2 border-orange-300 text-orange-950 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-orange-950">مطلوب استكمال أو تعديل مستندات</h3>
                <span className="text-[10px] bg-orange-200 text-orange-900 font-bold px-2 py-0.5 rounded-md">إجراء مطلوب</span>
              </div>
              <p className="text-xs sm:text-sm text-orange-900 font-medium mt-1 leading-relaxed">
                <strong>ملاحظة الإدارة:</strong> {verificationData?.needsCorrectionReason || 'يرجى مراجعة وتحديث المستندات المرفقة أدناه.'}
              </p>
              <p className="text-[11px] text-orange-700 mt-1">
                يمكنك تحديث المستندات المطلوبة في الخطوات أدناه، ثم الضغط على «إعادة تقديم الطلب» في الخطوة 6.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveStage(6)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs"
          >
            الانتقال للتقديم
          </button>
        </div>
      )}

      {isRejected && (
        <div className="p-4 sm:p-5 bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <XCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-rose-950">تم رفض طلب التوثيق</h3>
              <p className="text-xs sm:text-sm text-rose-900 font-medium mt-1">
                <strong>سبب الرفض:</strong> {verificationData?.rejectionReason || 'المستندات المرفقة غير صالحة أو غير مطابقة للبيانات الرسمية.'}
              </p>
              <p className="text-[11px] text-rose-700 mt-1">
                يرجى تصحيح البيانات والمستندات في الخطوات أدناه ثم إعادة التقديم للمراجعة.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveStage(6)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-xs"
          >
            إعادة التقديم
          </button>
        </div>
      )}

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs border ${
          actionFeedback.type === 'success'
            ? 'bg-teal-50 border-teal-200 text-[#0F766E]'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F766E]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-500 hover:text-slate-800 text-xs px-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Header & 6-Step Stepper */}
      <section className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-100">
                منظومة التحقق الآمنة
              </span>
              <h1 className="text-lg sm:text-[22px] font-bold text-[#0B3D3A]">
                توثيق حساب المالك (6 مراحل)
              </h1>
            </div>
            <p className="text-xs text-sakanly-muted mt-1">
              متابعة واستكمال خطوات توثيق الهوية وسندات الملكية لاعتماد حسابك وتمكين نشر العقارات للطلاب.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchStatus}
              className="p-2 border border-slate-200 hover:border-[#0F766E] text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-xs flex items-center gap-1.5"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* 6-Step Clickable RTL Stepper */}
        <div>
          <div className="overflow-x-auto pb-2 scrollbar-none">
            <div className="flex items-center justify-between min-w-[620px] sm:min-w-0">
              {steps.map((step, idx) => {
                const isSelected = activeStage === step.id;
                const isCompleted = step.isDone;

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        // Prevent skipping ahead to Stage 3 or higher if email verification (Stage 2) is incomplete
                        if (step.id > 2 && !s2Complete) {
                          setActionFeedback({
                            type: 'error',
                            message: 'يجب تأكيد البريد الإلكتروني برمز التحقق (OTP) أولاً قبل الانتقال للمراحل التالية.',
                          });
                          return;
                        }
                        setActiveStage(step.id);
                      }}
                      className="flex flex-col items-center text-center gap-2 relative group min-w-[80px] focus:outline-none"
                    >
                      {/* Step Circle */}
                      <div 
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-200 shadow-xs ${
                          isCompleted
                            ? 'bg-[#0F766E] text-white shadow-teal-700/20'
                            : isSelected
                            ? 'bg-[#0B3D3A] text-white ring-4 ring-teal-500/20 scale-105'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 group-hover:bg-slate-200'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-white stroke-[2.5]" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>

                      {/* Step Title */}
                      <div className="space-y-0.5">
                        <span 
                          className={`text-xs block font-bold whitespace-nowrap ${
                            isSelected
                              ? 'text-[#0B3D3A] underline decoration-[#0F766E] decoration-2 underline-offset-4'
                              : isCompleted 
                              ? 'text-[#0F766E]' 
                              : 'text-slate-400 font-medium'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] block text-slate-400">
                          {isCompleted ? 'مكتمل ✓' : isSelected ? 'قيد التعديل' : 'مطلوب'}
                        </span>
                      </div>
                    </button>

                    {/* Connecting Line */}
                    {idx < steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 bg-slate-200 relative -top-3">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            step.isDone ? 'bg-[#0F766E]' : 'bg-transparent'
                          }`} 
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Stage Workspaces */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-7 shadow-xs">

        {/* ─── STAGE 1: ACCOUNT DATA ────────────────────────────────────────── */}
        {activeStage === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 1: بيانات الحساب والرقم القومي
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    يجب مطابقة الاسم والرقم القومي المصري المكون من 14 رقماً مع بطاقة الهوية الرسمية.
                  </p>
                </div>
              </div>
              {s1Complete && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  البيانات مكتملة
                </span>
              )}
            </div>

            <form onSubmit={handleSaveAccountInfo} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الاسم الرباعي الرسمي (مطابق لبطاقة الرقم القومي) *
                </label>
                <input
                  type="text"
                  required
                  value={accountForm.fullName}
                  onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                  placeholder="مثال: أحمد محمد علي حسن"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الرقم القومي المصري (14 رقماً) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={accountForm.nationalIdNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setAccountForm({ ...accountForm, nationalIdNumber: clean });
                  }}
                  placeholder="مثال: 29801011234567"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono tracking-wider outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  الأرقام المدخلة: {accountForm.nationalIdNumber.length} من 14 رقماً
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الاسم التجاري أو اسم المكتب العقاري (اختياري)
                  </label>
                  <input
                    type="text"
                    value={accountForm.tradeName}
                    onChange={(e) => setAccountForm({ ...accountForm, tradeName: e.target.value })}
                    placeholder="مثال: إعمار للتسكين الجامعي"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    المحافظة الرئيسية *
                  </label>
                  <select
                    value={accountForm.governorate}
                    onChange={(e) => setAccountForm({ ...accountForm, governorate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 bg-white"
                  >
                    {['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'القليوبية', 'المنوفية', 'الغربية', 'أسيوط', 'بني سويف', 'الفيوم'].map((gov) => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  العنوان بالتفصيل *
                </label>
                <input
                  type="text"
                  required
                  value={accountForm.address}
                  onChange={(e) => setAccountForm({ ...accountForm, address: e.target.value })}
                  placeholder="مثال: 12 شارع عباس العقاد، مدينة نصر"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingAccount}
                  className="px-6 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {savingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>حفظ بيانات الحساب والمتابعة</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── STAGE 2: EMAIL OTP CONFIRMATION (BREVO) ────────────────────── */}
        {activeStage === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 2: تأكيد البريد الإلكتروني برمز OTP
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    التحقق المباشر من امتلاك البريد الإلكتروني لاستلام إشعارات التوثيق وحجوزات الطلاب والتواصل الرسمي.
                  </p>
                </div>
              </div>
              {s2Complete && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  البريد الإلكتروني موثق
                </span>
              )}
            </div>

            <div className="max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان البريد الإلكتروني المسجل لحسابك *
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    disabled
                    value={verificationData?.email || owner?.email || ''}
                    dir="ltr"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono bg-slate-50 text-slate-700 cursor-not-allowed outline-none select-all"
                  />
                  {!s2Complete && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={sendingOtp || otpTimer > 0}
                      className="px-4 py-2.5 bg-[#0B3D3A] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{otpTimer > 0 ? `انتظر ${otpTimer} ثانية` : (otpSent ? 'إعادة إرسال الرمز' : 'إرسال رمز التحقق')}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  * يتم إرسال رمز التحقق مباشرة إلى البريد الإلكتروني المسجل في حسابك عبر بوابة Brevo الرسمية.
                </p>
              </div>

              {s2Complete ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم توثيق بريدك الإلكتروني بنجاح. يمكنك الآن الانتقال للمرحلة التالية لرفع بطاقة الرقم القومي.</span>
                </div>
              ) : (
                otpSent && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-700">
                      أدخل رمز التحقق (6 أرقام) المرسل إلى بريدك (افحص صندوق الوارد و Spam):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        dir="ltr"
                        className="w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-center font-mono font-bold text-base tracking-widest outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpInput.length !== 6}
                        className="px-6 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>تأكيد الرمز</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      * صلاحية رمز التحقق 10 دقائق من وقت الإرسال.
                    </p>
                  </div>
                )
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={!s2Complete}
                  onClick={() => {
                    if (!s2Complete) {
                      setActionFeedback({
                        type: 'error',
                        message: 'يجب تأكيد البريد الإلكتروني برمز التحقق (OTP) أولاً قبل الانتقال للمرحلة 3.',
                      });
                      return;
                    }
                    setActiveStage(3);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    s2Complete
                      ? 'border border-[#0F766E] bg-teal-50 text-[#0F766E] hover:bg-teal-100 cursor-pointer shadow-xs'
                      : 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  الانتقال للخطوة 3: بطاقة الهوية ←
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STAGE 3: NATIONAL ID CARD (FRONT & BACK) ────────────────────── */}
        {activeStage === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 3: بطاقة الرقم القومي المصري
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    يرجى رفع صورة واضحة لوجه بطاقة الرقم القومي وظهرها (JPG, PNG, WebP) بحجم أقصى 5 ميجابايت.
                  </p>
                </div>
              </div>
              {s3Complete && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  تم رفع الوجه والظهر
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Front ID Box */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-[#0B3D3A] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0F766E]" />
                    <span>وجه البطاقة (Front)</span>
                  </h4>
                  {details.nationalId?.frontDoc && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      مرفوع ✓
                    </span>
                  )}
                </div>

                {details.nationalId?.frontDoc ? (
                  <div className="space-y-3">
                    <div className="h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={details.nationalId.frontDoc.secureUrl || `/api/v1/media/verification-document/${encodeURIComponent(details.nationalId.frontDoc.publicId)}`}
                        alt="وجه البطاقة"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.parentElement.innerHTML = '<span class="text-xs text-slate-500 font-bold">تم تأمين المستند بنجاح</span>';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {details.nationalId.frontDoc.originalName || 'بطاقة الهوية - وجه'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('national_id_front')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف وتغيير</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3 bg-white">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      اسحب صورة وجه البطاقة هنا، أو اضغط للاختيار
                    </p>
                    <label className="inline-block px-4 py-2 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingFront ? 'جارٍ الرفع والتأمين...' : 'اختيار صورة الوجه'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingFront}
                        onChange={(e) => handleUploadIdDoc(e.target.files?.[0], 'national_id_front')}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Back ID Box */}
              <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-[#0B3D3A] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0F766E]" />
                    <span>ظهر البطاقة (Back)</span>
                  </h4>
                  {details.nationalId?.backDoc && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      مرفوع ✓
                    </span>
                  )}
                </div>

                {details.nationalId?.backDoc ? (
                  <div className="space-y-3">
                    <div className="h-36 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      <img
                        src={details.nationalId.backDoc.secureUrl || `/api/v1/media/verification-document/${encodeURIComponent(details.nationalId.backDoc.publicId)}`}
                        alt="ظهر البطاقة"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.parentElement.innerHTML = '<span class="text-xs text-slate-500 font-bold">تم تأمين المستند بنجاح</span>';
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {details.nationalId.backDoc.originalName || 'بطاقة الهوية - ظهر'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('national_id_back')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف وتغيير</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3 bg-white">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      اسحب صورة ظهر البطاقة هنا، أو اضغط للاختيار
                    </p>
                    <label className="inline-block px-4 py-2 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                      {uploadingBack ? 'جارٍ الرفع والتأمين...' : 'اختيار صورة الظهر'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingBack}
                        onChange={(e) => handleUploadIdDoc(e.target.files?.[0], 'national_id_back')}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <p>
                <strong>تأمين المستندات:</strong> تحفظ جميع وثائق الهوية في مجلد مشفر ولا يمكن الوصول إليها إلا لمدققي إدارة سكنلي المصرح لهم.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStage(4)}
                className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                الانتقال للخطوة 4: سيلفي حية ←
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 4: LIVE SELFIE & FACE MATCH ───────────────────────────── */}
        {activeStage === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 4: التقاط صورة سيلفي حية
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    التقاط صورة شخصية مباشرة عبر كاميرا جهازك لمطابقة ملامح الوجه مع بطاقة الرقم القومي.
                  </p>
                </div>
              </div>
              {s4Complete && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  تم التقاط السيلفي
                </span>
              )}
            </div>

            {/* Camera Viewport or Preview */}
            <div className="max-w-md mx-auto">
              {details.livenessCheck?.selfieDoc ? (
                <div className="border border-slate-200 rounded-3xl p-5 text-center space-y-4 bg-slate-50">
                  <div className="w-40 h-40 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 shadow-md">
                    <img
                      src={details.livenessCheck.selfieDoc.secureUrl || `/api/v1/media/verification-document/${encodeURIComponent(details.livenessCheck.selfieDoc.publicId)}`}
                      alt="صورة السيلفي الحية"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0B3D3A]">تم التقاط الصورة الحية بنجاح</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      جاهزة للمطابقة اليدوية من إدارة سكنلي مع بطاقة الهوية.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc('liveness_selfie')}
                    className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                  >
                    إعادة التقاط صورة جديدة
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera Screen */}
                  <div className="w-full aspect-square bg-[#0B3D3A] rounded-3xl overflow-hidden relative flex flex-col items-center justify-center text-white border-2 border-teal-900 shadow-inner">
                    {cameraActive ? (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover -scale-x-100"
                        />
                        {/* Oval Face Guide */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-64 rounded-[50%] border-2 border-dashed border-teal-300/80 shadow-[0_0_20px_rgba(20,184,166,0.3)]" />
                        </div>
                        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 px-4">
                          <button
                            type="button"
                            onClick={captureLiveSelfie}
                            disabled={uploadingSelfie}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2"
                          >
                            {uploadingSelfie ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                            <span>التقاط الصورة الآن</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-3 py-2 bg-slate-800/80 text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-700"
                          >
                            إلغاء
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3 text-center p-6 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-teal-500/10 border-2 border-dashed border-teal-400/40 flex items-center justify-center text-teal-300">
                          <ScanFace className="w-10 h-10" />
                        </div>
                        <h4 className="font-bold text-sm text-teal-100">فحص الحيوية ومطابقة ملامح الوجه</h4>
                        <p className="text-xs text-teal-200/80 max-w-xs leading-relaxed">
                          اضغط لتشغيل الكاميرا الأمامية والتقاط صورة واضحة في إضاءة جيدة بدون نظارات شمسية أو أقنعة.
                        </p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-6 py-2.5 bg-[#0F766E] hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 mt-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>تشغيل الكاميرا والتقاط سيلفي</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {cameraError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Fallback to local photo upload */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 text-center space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      هل تواجه صعوبة في تشغيل الكاميرا؟
                    </p>
                    <label className="inline-block px-4 py-2 border border-slate-300 hover:border-[#0F766E] text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors bg-white">
                      {uploadingSelfie ? 'جارٍ الرفع...' : 'رفع صورة شخصية بديلة من جهازك'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingSelfie}
                        onChange={(e) => handleSelfieFileUpload(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Transparency Note */}
            <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200 text-teal-900 text-xs flex items-center gap-2.5 max-w-2xl mx-auto">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <p className="leading-relaxed">
                <strong>ملاحظة الشفافية:</strong> يتم فحص ومطابقة ملامح الوجه مع بطاقة الرقم القومي يدوياً وبدقة من قبل فريق إدارة منصة سكنلي، لضمان أعلى درجات الأمان وحماية الطلاب والملاك.
              </p>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveStage(5)}
                className="px-5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                الانتقال للخطوة 5: مستند الملكية ←
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 5: OWNERSHIP DOCUMENT ─────────────────────────────────── */}
        {activeStage === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 5: مستند إثبات الملكية أو إدارة العقار
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    رفع وثيقة رسمية تثبت صلتك بالعقار (عقد ملكية مسجل، توكيل رسمي ساري، إيصال مرافق، أو عقد إدارة).
                  </p>
                </div>
              </div>
              {s5Complete && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  تم إرفاق المستند
                </span>
              )}
            </div>

            {/* List of uploaded ownership documents */}
            {Array.isArray(details.ownershipDocs) && details.ownershipDocs.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700">المستندات المرفقة حالياً:</h4>
                <div className="space-y-2">
                  {details.ownershipDocs.map((doc, idx) => (
                    <div
                      key={doc.id || doc.publicId || idx}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-teal-100 text-[#0F766E] flex items-center justify-center shrink-0">
                          <File className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {doc.originalName || `مستند ملكية #${idx + 1}`}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.bytes ? `${Math.round(doc.bytes / 1024)} كيلوبايت` : 'PDF / صورة'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc('ownership_document', doc.id || doc.publicId)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-bold p-1"
                        title="حذف المستند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4 max-w-xl">
              <h4 className="text-xs font-bold text-[#0B3D3A]">إضافة مستند ملكية جديد:</h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نوع الوثيقة *
                </label>
                <select
                  value={ownershipDocType}
                  onChange={(e) => setOwnershipDocType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100 bg-white"
                >
                  <option value="عقد ملكية مسجل">عقد ملكية مسجل أو ابتدائي</option>
                  <option value="توكيل رسمي ساري">توكيل رسمي عام أو خاص لإدارة وتأجير العقار</option>
                  <option value="إيصال مرافق حديث">إيصال مرافق حديث (كهرباء أو مياه أو غاز)</option>
                  <option value="عقد إدارة وتشغيل">عقد إدارة وتشغيل أملاك موثق</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-3 bg-white">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">
                  اسحب ملف المستند هنا (PDF, JPG, PNG, WebP) بحجم أقصى 5 ميجابايت
                </p>
                <label className="inline-block px-4 py-2 bg-[#0F766E] hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors">
                  {uploadingOwnership ? 'جارٍ رفع وتأمين المستند...' : 'اختيار المستند'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={uploadingOwnership}
                    onChange={(e) => handleUploadOwnershipDoc(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveStage(6)}
                className="px-5 py-2.5 bg-[#0F766E] text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs"
              >
                الانتقال للخطوة 6: مراجعة وتقديم الطلب ←
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 6: REVIEW & SUBMISSION ────────────────────────────────── */}
        {activeStage === 6 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0B3D3A]">
                    المرحلة 6: مراجعة الملف واعتماد الإدارة
                  </h3>
                  <p className="text-xs text-sakanly-muted">
                    مراجعة اكتمال متطلبات التوثيق الخمس وإرسال الملف لمركز تحكم إدارة سكنلي للبت فيه.
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                isPending ? 'bg-amber-50 text-amber-800 border-amber-200' :
                isNeedsCorrection ? 'bg-orange-50 text-orange-900 border-orange-300' :
                isRejected ? 'bg-rose-50 text-rose-800 border-rose-200' :
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {isVerified ? 'معتمد وموثق' :
                 isPending ? 'قيد المراجعة' :
                 isNeedsCorrection ? 'مطلوب استكمال مستندات' :
                 isRejected ? 'مرفوض' : 'جاهز للإرسال'}
              </span>
            </div>

            {/* Checklist of 5 prerequisites */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700">قائمة متطلبات التوثيق:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  s1Complete ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {s1Complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold">1. بيانات الحساب والرقم القومي</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {details.accountInfo?.nationalIdNumber ? `الرقم: ${details.accountInfo.nationalIdNumber}` : 'غير مكتمل'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveStage(1)} className="text-[11px] text-[#0F766E] font-bold underline">
                    {s1Complete ? 'تعديل' : 'إكمال'}
                  </button>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  s2Complete ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {s2Complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold">2. تأكيد رقم الهاتف (OTP)</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {phoneInput || 'غير مؤكد'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveStage(2)} className="text-[11px] text-[#0F766E] font-bold underline">
                    {s2Complete ? 'عرض' : 'تأكيد'}
                  </button>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  s3Complete ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {s3Complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold">3. بطاقة الهوية (وجه وظهر)</p>
                      <span className="text-[10px] text-slate-500">
                        {s3Complete ? 'وجه وظهر مرفوعان' : 'ناقص'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveStage(3)} className="text-[11px] text-[#0F766E] font-bold underline">
                    {s3Complete ? 'تعديل' : 'رفع'}
                  </button>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  s4Complete ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {s4Complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold">4. صورة سيلفي حية</p>
                      <span className="text-[10px] text-slate-500">
                        {s4Complete ? 'ملتقطة ومحفوظة' : 'مطلوب التقاطها'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveStage(4)} className="text-[11px] text-[#0F766E] font-bold underline">
                    {s4Complete ? 'إعادة التقاط' : 'التقاط'}
                  </button>
                </div>

                <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 sm:col-span-2 ${
                  s5Complete ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {s5Complete ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div>
                      <p className="text-xs font-bold">5. مستند إثبات الملكية أو إدارة العقار</p>
                      <span className="text-[10px] text-slate-500">
                        {s5Complete ? `تم رفع (${details.ownershipDocs.length}) مستندات` : 'ناقص'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setActiveStage(5)} className="text-[11px] text-[#0F766E] font-bold underline">
                    {s5Complete ? 'إدارة المستندات' : 'رفع المستند'}
                  </button>
                </div>

              </div>
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSubmitVerification}
                disabled={submitting || isVerified || isPending || !allPrerequisitesComplete}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2.5 ${
                  isVerified
                    ? 'bg-emerald-600 text-white cursor-default'
                    : isPending
                    ? 'bg-amber-500 text-white cursor-not-allowed opacity-90'
                    : !allPrerequisitesComplete
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0F766E] hover:bg-teal-700 active:scale-[0.99] text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>جارٍ إرسال ملف التوثيق لمركز الإدارة...</span>
                  </>
                ) : isVerified ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <span>حسابك معتمد وموثق بالفعل</span>
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="w-5 h-5 text-white animate-pulse" />
                    <span>طلبك قيد مراجعة وتدقيق الإدارة حالياً</span>
                  </>
                ) : isNeedsCorrection || isRejected ? (
                  <>
                    <Send className="w-4 h-4" />
                    <span>إعادة تقديم طلب التوثيق للمراجعة الإدارية</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>تقديم طلب التوثيق للاعتماد والمراجعة الإدارية</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-2.5">
                * لن يتم نشر أو تفعيل عقاراتك على منصة سكنلي حتى يتم اعتماد هذا الطلب رسمياً من قِبل إدارة المنصة.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default OwnerVerificationView;