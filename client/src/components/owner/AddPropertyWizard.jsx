import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  DoorClosed, 
  Users, 
  Bed, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  BedDouble, 
  Save, 
  ArrowRight,
  Eye,
  Sparkles,
  Wifi,
  Wind,
  BookOpen,
  ShieldCheck,
  Building,
  Info,
  ShieldAlert,
  Loader2,
  Video,
  Plus,
  RefreshCw,
  X,
  Phone,
  MessageCircle,
  Smartphone,
  Film,
  Play
} from 'lucide-react';
import { propertyApi, mediaApi } from '../../services/api.js';
import { getOptimizedImageUrl, isVideoMedia, getVideoPosterUrl, formatFileSize } from '../../utils/cloudinary.js';

export const validateEgyptianPhoneInput = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  let digits = phone.trim().replace(/\D/g, '');
  if (digits.startsWith('0020') && digits.length === 14) digits = digits.slice(3);
  else if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);
  else if (digits.startsWith('1') && digits.length === 10) digits = '0' + digits;
  return /^01[0125]\d{8}$/.test(digits);
};

// Real Egyptian Governorates and University Cities
const governoratesData = [
  {
    name: 'القاهرة',
    cities: ['مدينة نصر', 'التجمع الخامس (القاهرة الجديدة)', 'مصر الجديدة', 'العباسية', 'المعادي', 'وسط البلد', 'حلوان', 'عين شمس', 'الزيتون'],
  },
  {
    name: 'الجيزة',
    cities: ['الدقي والمهندسين', 'مدينة 6 أكتوبر', 'الشيخ زايد', 'ميدان الجيزة (جامعة القاهرة)', 'فيصل والهرم', 'العجوزة'],
  },
  {
    name: 'الإسكندرية',
    cities: ['الشاطبي (المجمع النظري)', 'الأزاريطة (المجمع الطبي)', 'سيدي جابر', 'سموحة', 'كامب شيزار', 'العصافرة وميامي'],
  },
  {
    name: 'الدقهلية',
    cities: ['المنصورة (حي الجامعة)', 'المشاية السفلية', 'طلخا'],
  },
  {
    name: 'الشرقية',
    cities: ['الزقازيق (محيط الجامعة)', 'العاشر من رمضان'],
  },
  {
    name: 'القليوبية',
    cities: ['بنها (مجمع الكليات)', 'شبرا الخيمة', 'طوخ'],
  },
  {
    name: 'أسيوط',
    cities: ['مدينة أسيوط (محيط الجامعة القديمة والجديدة)', 'حي الوليدية'],
  },
];

const housingTypes = [
  {
    id: 'entire_apartment',
    title: 'شقة كاملة',
    subtitle: 'شقة مستقلة بالكامل مخصصة لمجموعة طلاب',
    icon: Building2,
    badge: 'سكن مستقل',
  },
  {
    id: 'private_room',
    title: 'غرفة خاصة',
    subtitle: 'غرفة مستقلة لشخص واحد داخل سكن طلابي',
    icon: DoorClosed,
    badge: 'خصوصية كاملة',
  },
  {
    id: 'shared_room',
    title: 'غرفة مشتركة',
    subtitle: 'غرفة مجهزة لشخصين أو أكثر مع زملاء سكن',
    icon: Users,
    badge: 'اقتصادي واجتماعي',
  },
  {
    id: 'individual_bed',
    title: 'سرير فردي',
    subtitle: 'حجز سرير خاص داخل غرفة مشتركة مجهزة',
    icon: Bed,
    badge: 'الأكثر طلباً',
  },
];

const availableAmenitiesList = [
  'واي فاي فائق السرعة (ألياف ضوئية)',
  'تكييف هواء سبليت',
  'مكتب دراسة ومقعد مريح',
  'غسالة ملابس أوتوماتيكية',
  'سخان مياه غاز طبيعي',
  'مطبخ مجهز بالكامل بثلاجة وبوتاجاز',
  'حراسة وأمن 24/7 وكاميرات مراقبة',
  'مصعد حديث',
  'شرفة / بلكونة بإطلالة هادئة',
  'خدمة نظافة أسبوعية للمرافق المشتركة',
  'دواليب ملابس خاصة لكل سرير',
  'مياه مفلترة',
];

// Optional sample images for fast demo testing
const curatedSampleImages = [
  { label: 'صالة ومعيشة مودرن', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80' },
  { label: 'غرفة نوم طلابية راقية', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80' },
  { label: 'غرفة دراسة بسريرين', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'مكتب للمذاكرة وإضاءة هادئة', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80' },
];

export const AddPropertyWizard = ({
  onCancel,
  onSuccess,
  onNavigateVerification,
  owner,
  token,
}) => {
  const navigate = useNavigate();

  // Stepper state: 1 to 5
  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState([1]);

  // Clean initial state without pre-filled fake numbers or hardcoded locations
  const [formData, setFormData] = useState(() => {
    try {
      const savedDraft = localStorage.getItem('sakanly_property_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object') {
          return {
            accommodationType: parsed.accommodationType || '',
            title: parsed.title || '',
            description: parsed.description || '',
            bedrooms: parsed.bedrooms || '',
            bathrooms: parsed.bathrooms || '',
            area: parsed.area || '',
            totalBeds: parsed.totalBeds || '',
            availableBeds: parsed.availableBeds || '',
            genderPreference: parsed.genderPreference || 'any',
            amenities: Array.isArray(parsed.amenities) ? parsed.amenities : [],
            governorate: parsed.governorate || '',
            city: parsed.city || '',
            district: parsed.district || '',
            address: parsed.address || '',
            monthlyPrice: parsed.monthlyPrice || '',
            deposit: parsed.deposit || '',
            utilitiesCost: parsed.utilitiesCost || '',
            images: Array.isArray(parsed.images) ? parsed.images : [],
            contactPhone: parsed.contactPhone || owner?.phone || '',
            whatsappPhone: parsed.whatsappPhone || '',
            useSamePhoneForWhatsapp: parsed.useSamePhoneForWhatsapp !== false,
            showContactPhone: parsed.showContactPhone !== false,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      accommodationType: '',
      title: '',
      description: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      totalBeds: '',
      availableBeds: '',
      genderPreference: 'any',
      amenities: [],
      governorate: '',
      city: '',
      district: '',
      address: '',
      monthlyPrice: '',
      deposit: '',
      utilitiesCost: '',
      images: [],
      video: null,
      media: [],
      contactPhone: owner?.phone || '',
      whatsappPhone: '',
      useSamePhoneForWhatsapp: true,
      showContactPhone: true,
    };
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [fileRejections, setFileRejections] = useState([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const stepsConfig = [
    { number: 1, title: 'نوع السكن' },
    { number: 2, title: 'التفاصيل' },
    { number: 3, title: 'الموقع والسعر' },
    { number: 4, title: 'الصور والفيديو' },
    { number: 5, title: 'بيانات التواصل' },
    { number: 6, title: 'المعاينة' },
  ];

  // Dynamic available cities based on selected governorate
  const activeGovernorateObj = governoratesData.find(g => g.name === formData.governorate);
  const availableCities = activeGovernorateObj ? activeGovernorateObj.cities : [];

  const isOwnerVerified = owner?.verificationStatus === 'verified' || owner?.isVerified === true;

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Real Draft saving via Backend API + LocalStorage
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // 1. Save to local storage for instant offline recovery
      const cleanDraft = {
        ...formData,
        images: (formData.images || []).filter(url => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))),
      };
      localStorage.setItem('sakanly_property_draft', JSON.stringify(cleanDraft));

      // 2. Persist to backend with status 'draft' (allowed for unverified owners)
      const draftPayload = {
        title: formData.title.trim() || 'مسودة عقار جديد',
        governorate: formData.governorate || 'القاهرة',
        city: formData.city || 'مدينة نصر',
        district: formData.district.trim() || 'حي غير محدد',
        address: formData.address.trim() || '',
        accommodationType: formData.accommodationType || 'entire_apartment',
        genderPreference: formData.genderPreference || 'any',
        monthlyPrice: Number(formData.monthlyPrice) || 0,
        deposit: Number(formData.deposit) || 0,
        utilitiesCost: Number(formData.utilitiesCost) || 0,
        bedrooms: Number(formData.bedrooms) || 1,
        bathrooms: Number(formData.bathrooms) || 1,
        area: Number(formData.area) || 50,
        totalBeds: Number(formData.totalBeds) || 1,
        availableBeds: Number(formData.availableBeds) || 1,
        description: formData.description.trim() || 'مسودة قيد الاستكمال بواسطة المالك.',
        images: formData.images.length > 0 ? formData.images : [],
        amenities: formData.amenities,
        contactPhone: formData.contactPhone?.trim() || null,
        whatsappPhone: formData.useSamePhoneForWhatsapp
          ? (formData.contactPhone?.trim() || null)
          : (formData.whatsappPhone?.trim() || null),
        showContactPhone: Boolean(formData.showContactPhone),
        status: 'draft',
        isVerified: false,
      };

      await propertyApi.createListing(draftPayload, token);
      showToast('تم حفظ مسودة العقار بنجاح في حسابك وعلى الخادم.', 'success');
    } catch (err) {
      showToast('تم حفظ المسودة محلياً فقط. ' + (err.message || ''), 'warning');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Step Validation logic
  const validateStep = (stepNumber) => {
    const errs = {};

    if (stepNumber === 1) {
      if (!formData.accommodationType) {
        errs.accommodationType = 'يرجى اختيار نوع السكن المناسب من الخيارات أعلاه للمتابعة.';
      }
    } else if (stepNumber === 2) {
      if (!formData.title.trim()) {
        errs.title = 'يرجى إدخال عنوان واضح للإعلان.';
      } else if (formData.title.trim().length < 5) {
        errs.title = 'يجب ألا يقل عنوان الإعلان عن 5 أحرف.';
      }

      if (!formData.description.trim()) {
        errs.description = 'يرجى كتابة وصف موجز ومفيد للسكن.';
      } else if (formData.description.trim().length < 15) {
        errs.description = 'الوصف قصير جداً، يرجى كتابة 15 حرفاً على الأقل لشرح مزايا العقار للطلاب.';
      }

      if (!formData.bedrooms || Number(formData.bedrooms) < 1) {
        errs.bedrooms = 'عدد الغرف مطلوب ويجب أن يكون 1 على الأقل.';
      }

      if (!formData.bathrooms || Number(formData.bathrooms) < 1) {
        errs.bathrooms = 'عدد الحمامات مطلوب.';
      }

      if (!formData.area || Number(formData.area) < 10) {
        errs.area = 'يرجى إدخال المساحة التقريبية بالمتر المربع (10 م² على الأقل).';
      }

      if (formData.totalBeds && formData.availableBeds) {
        if (Number(formData.availableBeds) > Number(formData.totalBeds)) {
          errs.availableBeds = 'عدد الأسِرّة المتاحة لا يمكن أن يتجاوز إجمالي الأسِرّة.';
        }
      }
    } else if (stepNumber === 3) {
      if (!formData.governorate) {
        errs.governorate = 'يرجى اختيار المحافظة.';
      }
      if (!formData.city) {
        errs.city = 'يرجى اختيار المدينة أو المنطقة الجامعية.';
      }
      if (!formData.district.trim()) {
        errs.district = 'يرجى كتابة اسم الحي أو المنطقة (مثال: الحي السابع أو مصدق).';
      }
      if (!formData.monthlyPrice) {
        errs.monthlyPrice = 'يرجى إدخال قيمة الإيجار الشهري بالجنيه المصري.';
      } else if (isNaN(Number(formData.monthlyPrice)) || Number(formData.monthlyPrice) <= 0) {
        errs.monthlyPrice = 'قيمة الإيجار يجب أن تكون رقماً موجباً أكبر من صفر.';
      }
    } else if (stepNumber === 4) {
      if (isUploadingMedia) {
        errs.images = 'جارٍ رفع الصور إلى Cloudinary، يرجى الانتظار حتى اكتمال العملية.';
      } else if (!formData.images || formData.images.length === 0) {
        errs.images = 'يجب إضافة صورة واحدة على الأقل للعقار قبل المتابعة لمعاينة الإعلان.';
      }
    } else if (stepNumber === 5) {
      if (!formData.contactPhone || !formData.contactPhone.trim()) {
        errs.contactPhone = 'يرجى إدخال رقم الهاتف الأساسي لتواصل الطلاب معك.';
      } else if (!validateEgyptianPhoneInput(formData.contactPhone)) {
        errs.contactPhone = 'رقم الهاتف غير صحيح. يرجى إدخال رقم محمول مصري مكون من 11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015.';
      }

      if (!formData.useSamePhoneForWhatsapp && formData.whatsappPhone && formData.whatsappPhone.trim()) {
        if (!validateEgyptianPhoneInput(formData.whatsappPhone)) {
          errs.whatsappPhone = 'رقم الواتساب غير صحيح. يرجى إدخال رقم محمول مصري يبدأ بـ 010 أو 011 أو 012 أو 015.';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (!visitedSteps.includes(nextStep)) {
        setVisitedSteps([...visitedSteps, nextStep]);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (stepNum) => {
    if (visitedSteps.includes(stepNum) || stepNum < currentStep) {
      setCurrentStep(stepNum);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Robust Cloudinary Media Upload & Management Handlers
  const handleFilesSelected = async (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const maxFilesAllowed = 10;
    const currentCount = formData.images.length;

    const newRejections = [];
    const validImageFiles = [];

    for (const file of fileList) {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);

      // If user dropped or selected a video here, route it to handleVideoSelected
      if (isVideo) {
        handleVideoSelected([file]);
        continue;
      }

      const isImage = allowedImageMimes.includes(file.type) || ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext);
      if (!isImage) {
        newRejections.push({
          name: file.name,
          reason: 'صيغة غير مدعومة. يسمح فقط بالصور (JPG, PNG, WEBP).',
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        newRejections.push({
          name: file.name,
          reason: 'حجم الصورة يتجاوز الحد الأقصى (10 ميجابايت).',
        });
        continue;
      }

      if (currentCount + validImageFiles.length >= maxFilesAllowed) {
        newRejections.push({
          name: file.name,
          reason: `تجاوز الحد الأقصى (${maxFilesAllowed} صور للعقار الواحد).`,
        });
        continue;
      }

      validImageFiles.push(file);
    }

    if (newRejections.length > 0) {
      setFileRejections(prev => [...prev, ...newRejections]);
    }

    if (validImageFiles.length === 0) {
      return;
    }

    setErrors(prev => ({ ...prev, images: null }));

    const newQueueItems = validImageFiles.map(file => ({
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      isVideo: false,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
      error: null,
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    setIsUploadingMedia(true);

    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const uploadedItems = await mediaApi.uploadMedia(validImageFiles, { folderType: 'property_image' }, activeToken);

      if (uploadedItems && uploadedItems.length > 0) {
        const newUrls = uploadedItems.map(m => m.secure_url || m.url).filter(Boolean);

        setFormData(prev => ({
          ...prev,
          media: [...(prev.media || []), ...uploadedItems],
          images: [...prev.images, ...newUrls],
        }));

        newQueueItems.forEach(item => {
          if (item.previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });

        const uploadedItemIds = new Set(newQueueItems.map(q => q.id));
        setUploadQueue(prev => prev.filter(q => !uploadedItemIds.has(q.id)));
        showToast(`تم رفع ${uploadedItems.length} صور بنجاح إلى Cloudinary.`);
      }
    } catch (err) {
      console.warn('Upload error from Cloudinary API:', err);
      setUploadQueue(prev =>
        prev.map(item => {
          const matched = newQueueItems.find(q => q.id === item.id);
          return matched ? { ...item, status: 'error', error: err.message || 'فشل رفع الملف.' } : item;
        })
      );
      showToast('تعذر رفع الصور إلى Cloudinary: ' + (err.message || 'خطأ في الاتصال'), 'warning');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Dedicated Video Upload Handler (Max 1 video, 100MB limit)
  const handleVideoSelected = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.mov'].includes(ext);

    if (!isVideo) {
      setFileRejections(prev => [
        ...prev,
        { name: file.name, reason: 'صيغة الفيديو غير مدعومة. يسمح فقط بـ (MP4, WEBM, MOV).' },
      ]);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setFileRejections(prev => [
        ...prev,
        {
          name: file.name,
          reason: `حجم ملف الفيديو (${(file.size / (1024 * 1024)).toFixed(1)}MB) يتجاوز الحد الأقصى المسموح به (100 ميجابايت).`,
        },
      ]);
      return;
    }

    const queueId = `video-${Date.now()}`;
    const blobPreview = URL.createObjectURL(file);
    const videoQueueItem = {
      id: queueId,
      file,
      name: file.name,
      size: file.size,
      isVideo: true,
      previewUrl: blobPreview,
      status: 'uploading',
      error: null,
    };

    setUploadQueue(prev => [videoQueueItem, ...prev]);
    setIsUploadingMedia(true);

    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const uploadedItems = await mediaApi.uploadMedia([file], { folderType: 'property_video' }, activeToken);

      if (uploadedItems && uploadedItems.length > 0) {
        const vidItem = uploadedItems[0];
        
        // If old video had public_id and is being replaced, clean it up
        if (formData.video?.public_id && formData.video.public_id !== vidItem.public_id) {
          mediaApi.deleteMedia(formData.video.public_id, { resourceType: 'video' }, activeToken).catch(() => {});
        }

        setFormData(prev => ({
          ...prev,
          video: vidItem,
          media: [...(prev.media || []).filter(m => m.resource_type !== 'video'), vidItem],
        }));

        if (blobPreview.startsWith('blob:')) {
          URL.revokeObjectURL(blobPreview);
        }

        setUploadQueue(prev => prev.filter(q => q.id !== queueId));
        showToast('تم رفع فيديو العقار ومعالجته بنجاح على Cloudinary!');
      }
    } catch (err) {
      console.warn('Video upload error:', err);
      setUploadQueue(prev =>
        prev.map(q => q.id === queueId ? { ...q, status: 'error', error: err.message || 'فشل رفع الفيديو.' } : q)
      );
      showToast('تعذر رفع الفيديو: ' + (err.message || 'خطأ في الاتصال'), 'warning');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (!formData.video) return;
    const oldVideo = formData.video;

    setFormData(prev => ({
      ...prev,
      video: null,
      media: (prev.media || []).filter(m => m.resource_type !== 'video' && m.public_id !== oldVideo.public_id),
    }));

    if (oldVideo.public_id) {
      try {
        const activeToken = token || localStorage.getItem('sakanly_token');
        await mediaApi.deleteMedia(oldVideo.public_id, { resourceType: 'video' }, activeToken);
      } catch (err) {
        console.warn('Failed to delete video from Cloudinary:', err);
      }
    }
    showToast('تمت إزالة الفيديو من الإعلان.');
  };

  const handleMoveImage = (currentIndex, direction) => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= formData.images.length) return;

    setFormData(prev => {
      const newImages = [...prev.images];
      const temp = newImages[currentIndex];
      newImages[currentIndex] = newImages[targetIndex];
      newImages[targetIndex] = temp;

      return { ...prev, images: newImages };
    });
  };

  const handleRetryUpload = async (queueItem) => {
    setUploadQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'uploading', error: null } : q));
    setIsUploadingMedia(true);

    try {
      const activeToken = token || localStorage.getItem('sakanly_token');
      const uploadedItems = await mediaApi.uploadMedia([queueItem.file], { folderType: 'property_image' }, activeToken);

      if (uploadedItems && uploadedItems.length > 0) {
        const newUrls = uploadedItems.map(m => m.secure_url || m.url).filter(Boolean);
        setFormData(prev => ({
          ...prev,
          media: [...(prev.media || []), ...uploadedItems],
          images: [...prev.images, ...newUrls],
        }));

        if (queueItem.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(queueItem.previewUrl);
        }

        setUploadQueue(prev => prev.filter(q => q.id !== queueItem.id));
        showToast('تم رفع الملف بنجاح!');
      }
    } catch (err) {
      setUploadQueue(prev => prev.map(q => q.id === queueItem.id ? { ...q, status: 'error', error: err.message || 'فشل الرفع' } : q));
      showToast('فشل إعادة المحاولة: ' + (err.message || ''), 'warning');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveQueueItem = (queueId) => {
    setUploadQueue(prev => {
      const target = prev.find(q => q.id === queueId);
      if (target?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(q => q.id !== queueId);
    });
  };

  const handleRemoveImage = async (indexToRemove) => {
    const targetUrl = formData.images[indexToRemove];
    const itemToRemove = (formData.media || []).find(m => (m.secure_url === targetUrl || m.url === targetUrl));

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
      media: (prev.media || []).filter(m => (m.secure_url !== targetUrl && m.url !== targetUrl)),
    }));

    if (itemToRemove?.public_id) {
      try {
        const activeToken = token || localStorage.getItem('sakanly_token');
        await mediaApi.deleteMedia(itemToRemove.public_id, { resourceType: itemToRemove.resource_type || 'image' }, activeToken);
      } catch (err) {
        console.warn('Failed to delete media from Cloudinary:', err);
      }
    }
    showToast('تمت إزالة الصورة من الإعلان.');
  };

  const handleSetPrimaryImage = (indexToPrimary) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [chosenUrl] = newImages.splice(indexToPrimary, 1);
      newImages.unshift(chosenUrl);

      let newMedia = [...(prev.media || [])];
      const mediaIdx = newMedia.findIndex(m => m.secure_url === chosenUrl || m.url === chosenUrl);
      if (mediaIdx > -1) {
        const [chosenMedia] = newMedia.splice(mediaIdx, 1);
        newMedia.unshift(chosenMedia);
      }

      return { ...prev, images: newImages, media: newMedia };
    });
    showToast('تم تعيين الصورة كغلاف رئيسي للإعلان.');
  };

  // Amenities toggle
  const handleToggleAmenity = (amenity) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Final Submit / Publish Handler
  const handleFinalSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4) || !validateStep(5)) {
      return;
    }

    // Strict UI Check: Block publishing if unverified
    if (!isOwnerVerified) {
      setErrors({
        form: 'لا يمكنك نشر العقار للعامة قبل اكتمال توثيق حسابك واعتماده. يمكنك حفظ الإعلان كمسودة مؤقتة.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        governorate: formData.governorate,
        city: formData.city,
        district: formData.district.trim(),
        address: formData.address.trim() || `${formData.city}، ${formData.district}`,
        accommodationType: formData.accommodationType,
        genderPreference: formData.genderPreference,
        monthlyPrice: Number(formData.monthlyPrice),
        deposit: Number(formData.deposit) || Number(formData.monthlyPrice),
        utilitiesCost: Number(formData.utilitiesCost) || 0,
        bedrooms: Number(formData.bedrooms) || 1,
        bathrooms: Number(formData.bathrooms) || 1,
        area: Number(formData.area) || 50,
        totalBeds: Number(formData.totalBeds) || 1,
        availableBeds: Number(formData.availableBeds) || 1,
        description: formData.description.trim(),
        media: formData.media || [],
        images: formData.images,
        video: formData.video,
        amenities: formData.amenities,
        contactPhone: formData.contactPhone.trim(),
        whatsappPhone: formData.useSamePhoneForWhatsapp
          ? formData.contactPhone.trim()
          : (formData.whatsappPhone ? formData.whatsappPhone.trim() : null),
        showContactPhone: Boolean(formData.showContactPhone),
        nearbyUniversities: [
          { name: `جامعة ${formData.governorate === 'الجيزة' ? 'القاهرة' : 'عين شمس'}`, distance: '10 دقائق بالمواصلات' }
        ],
        isFurnished: true,
        isVerified: false,
        status: 'pending_review',
        featured: false,
        createdAt: new Date().toISOString(),
      };

      const result = await propertyApi.createListing(payload, token);
      
      // Clear draft on successful submit
      try {
        localStorage.removeItem('sakanly_property_draft');
      } catch {
        // ignore
      }

      if (onSuccess) {
        onSuccess(result || payload);
      }
    } catch (err) {
      if (err.code === 'OWNER_NOT_VERIFIED') {
        setErrors({
          form: 'لا يمكنك نشر العقار قبل اكتمال توثيق حسابك واعتماده من قِبل إدارة سكنلي.',
        });
      } else {
        setErrors({ form: err.message || 'فشل إرسال الإعلان. يرجى مراجعة البيانات والمحاولة مجدداً.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToVerification = () => {
    if (onNavigateVerification) {
      onNavigateVerification();
    } else {
      navigate('/owner/verification');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div
          role="status"
          className={`p-3.5 text-xs sm:text-sm rounded-2xl border flex items-center justify-between shadow-sm animate-fade-in ${
            toastType === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-slate-600 hover:text-slate-900 text-xs font-bold px-2">✕</button>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-sakanly-muted mb-1.5 flex-wrap">
            <button onClick={onCancel} className="hover:text-sakanly-primary transition-colors flex items-center gap-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة لعقاراتي</span>
            </button>
            <span>/</span>
            <span className="text-sakanly-primary font-bold">إضافة عقار جديد</span>
            <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
              /owner/properties/new
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-sakanly-dark flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-sakanly-primary" />
            <span>إضافة عقار جديد</span>
          </h1>
        </div>

        {/* Save Draft Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs disabled:opacity-60"
          >
            {isSavingDraft ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-slate-500" />
            )}
            <span>{isSavingDraft ? 'جارٍ الحفظ...' : 'حفظ كمسودة'}</span>
          </button>
        </div>
      </div>

      {/* 6-Step Stepper (Ordered Right to Left RTL) */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-4 sm:p-6 shadow-xs" aria-label="شريط مراحل إضافة العقار">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-3 relative">
          {stepsConfig.map((s) => {
            const isCurrent = currentStep === s.number;
            const isCompleted = currentStep > s.number;
            const isClickable = visitedSteps.includes(s.number) || s.number < currentStep;

            return (
              <button
                type="button"
                key={s.number}
                onClick={() => handleStepClick(s.number)}
                disabled={!isClickable}
                className={`flex flex-col items-center text-center group transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {/* Circle Indicator */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all shadow-xs ${
                    isCurrent
                      ? 'bg-sakanly-primary text-white ring-4 ring-teal-100'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : s.number}
                </div>

                {/* Step Title */}
                <span
                  className={`text-[11px] sm:text-xs font-bold mt-2 truncate w-full ${
                    isCurrent
                      ? 'text-sakanly-primary'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar line */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div
            className="bg-sakanly-primary h-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (stepsConfig.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-8 shadow-sm space-y-6">

        {/* Global Error Banner */}
        {errors.form && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs sm:text-sm rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span className="font-bold">{errors.form}</span>
            </div>
            {!isOwnerVerified && (
              <button
                type="button"
                onClick={goToVerification}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
              >
                توثيق الحساب الآن
              </button>
            )}
          </div>
        )}

        {/* ========================================================
            STEP 1: HOUSING TYPE (نوع السكن)
           ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-sakanly-dark">
                الخطوة 1: نوع السكن
              </h2>
              <p className="text-xs text-sakanly-muted mt-0.5">
                حدد طبيعة الوحدة السكنية التي ترغب في عرضها للطلاب الجامعيين
              </p>
            </div>

            {errors.accommodationType && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errors.accommodationType}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="radiogroup" aria-label="أنواع السكن المتاحة">
              {housingTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.accommodationType === type.id;

                return (
                  <div
                    key={type.id}
                    onClick={() => {
                      setFormData({ ...formData, accommodationType: type.id });
                      setErrors(prev => ({ ...prev, accommodationType: null }));
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setFormData({ ...formData, accommodationType: type.id });
                        setErrors(prev => ({ ...prev, accommodationType: null }));
                      }
                    }}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between text-right group outline-none focus:ring-2 focus:ring-sakanly-primary/40 ${
                      isSelected
                        ? 'border-sakanly-primary bg-teal-50/70 shadow-md ring-2 ring-sakanly-primary/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                    }`}
                  >
                    {/* Top Icon and Radio Circle */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isSelected ? 'bg-sakanly-primary text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Custom Radio Circle */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-sakanly-primary bg-sakanly-primary' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    {/* Texts */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] bg-white border border-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded-full inline-block">
                        {type.badge}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-sakanly-dark">
                        {type.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {type.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 2: DETAILS (التفاصيل والمواصفات)
           ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-sakanly-dark">
                الخطوة 2: تفاصيل العقار
              </h2>
              <p className="text-xs text-sakanly-muted mt-0.5">
                أدخل تفاصيل ومواصفات السكن بدقة لمساعدة الطلاب في المقارنة والحجز
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                عنوان الإعلان <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: شقة طلابية هادئة 3 غرف بجوار جامعة عين شمس ومحطة المترو"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                className={`w-full p-3 bg-slate-50 border rounded-2xl outline-none transition-all ${
                  errors.title ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-slate-200 focus:border-sakanly-primary focus:bg-white'
                }`}
              />
              {errors.title && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                وصف العقار <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="وضح مواصفات السكن، الأجهزة المتوفرة، القرب من الكليات ومحطات النقل، وقواعد السكن الهادئ..."
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                }}
                className={`w-full p-3 bg-slate-50 border rounded-2xl outline-none resize-none transition-all ${
                  errors.description ? 'border-rose-400 focus:ring-1 focus:ring-rose-400' : 'border-slate-200 focus:border-sakanly-primary focus:bg-white'
                }`}
              />
              {errors.description && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.description}</p>}
            </div>

            {/* Rooms, Baths, Area, Student Preference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  عدد الغرف <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 3"
                  value={formData.bedrooms}
                  onChange={(e) => {
                    setFormData({ ...formData, bedrooms: e.target.value });
                    if (errors.bedrooms) setErrors(prev => ({ ...prev, bedrooms: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-center ${
                    errors.bedrooms ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                  }`}
                />
                {errors.bedrooms && <p className="text-rose-600 font-bold mt-1 text-[10px]">{errors.bedrooms}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  عدد الحمامات <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 1"
                  value={formData.bathrooms}
                  onChange={(e) => {
                    setFormData({ ...formData, bathrooms: e.target.value });
                    if (errors.bathrooms) setErrors(prev => ({ ...prev, bathrooms: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-center ${
                    errors.bathrooms ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                  }`}
                />
                {errors.bathrooms && <p className="text-rose-600 font-bold mt-1 text-[10px]">{errors.bathrooms}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  المساحة بالمتر المربع (م²) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="10"
                  placeholder="مثال: 110"
                  value={formData.area}
                  onChange={(e) => {
                    setFormData({ ...formData, area: e.target.value });
                    if (errors.area) setErrors(prev => ({ ...prev, area: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold text-center ${
                    errors.area ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                  }`}
                />
                {errors.area && <p className="text-rose-600 font-bold mt-1 text-[10px]">{errors.area}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">نوع الطلاب المفضل</label>
                <select
                  value={formData.genderPreference}
                  onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-sakanly-primary"
                >
                  <option value="any">متاح للجميع</option>
                  <option value="male">طلاب شباب (ذكور)</option>
                  <option value="female">طالبات (إناث)</option>
                </select>
              </div>
            </div>

            {/* Beds Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-teal-50/40 rounded-2xl border border-teal-100">
              <div>
                <label className="block font-bold text-slate-800 mb-1">إجمالي عدد الأسِرّة في السكن</label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 4"
                  value={formData.totalBeds}
                  onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-center"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">الأسِرّة الشاغرة المتاحة حالياً</label>
                <input
                  type="number"
                  min="0"
                  placeholder="مثال: 2"
                  value={formData.availableBeds}
                  onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-emerald-600 text-center"
                />
                {errors.availableBeds && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.availableBeds}</p>}
              </div>
            </div>

            {/* Amenities Multi-Select */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">
                التجهيزات والمميزات المتوفرة (اختر ما ينطبق)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableAmenitiesList.map((amenity) => {
                  const isChecked = formData.amenities.includes(amenity);
                  return (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                        isChecked
                          ? 'border-sakanly-primary bg-teal-50 text-sakanly-primary font-bold shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-sakanly-primary border-sakanly-primary text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="truncate text-[11px]">{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            STEP 3: LOCATION & PRICE (الموقع والسعر)
           ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-sakanly-dark">
                الخطوة 3: الموقع والسعر
              </h2>
              <p className="text-xs text-sakanly-muted mt-0.5">
                حدد المحافظة والمدينة بدقة لتسهيل وصول الطلاب، وحدد الإيجار الشهري بالجنيه المصري
              </p>
            </div>

            {/* Governorate, City & District */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  المحافظة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.governorate}
                  onChange={(e) => {
                    const newGov = e.target.value;
                    setFormData({
                      ...formData,
                      governorate: newGov,
                      city: '', // Reset city on governorate change
                    });
                    if (errors.governorate) setErrors(prev => ({ ...prev, governorate: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold ${
                    errors.governorate ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                  }`}
                >
                  <option value="">-- اختر المحافظة --</option>
                  {governoratesData.map((gov) => (
                    <option key={gov.name} value={gov.name}>{gov.name}</option>
                  ))}
                </select>
                {errors.governorate && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.governorate}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  المدينة / المركز الجامعي <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.city}
                  disabled={!formData.governorate}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    if (errors.city) setErrors(prev => ({ ...prev, city: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold ${
                    !formData.governorate ? 'opacity-60 cursor-not-allowed' : 'text-sakanly-primary'
                  } ${errors.city ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'}`}
                >
                  <option value="">
                    {formData.governorate ? '-- اختر المدينة / المركز --' : '-- اختر المحافظة أولاً --'}
                  </option>
                  {availableCities.map((cityName) => (
                    <option key={cityName} value={cityName}>{cityName}</option>
                  ))}
                </select>
                {errors.city && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.city}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  الحي أو المنطقة بالتحديد <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: الحي السابع أو شارع مصدق"
                  value={formData.district}
                  onChange={(e) => {
                    setFormData({ ...formData, district: e.target.value });
                    if (errors.district) setErrors(prev => ({ ...prev, district: null }));
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none ${
                    errors.district ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                  }`}
                />
                {errors.district && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.district}</p>}
              </div>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                العنوان بالتفصيل والقرب من المعالم الجامعية
              </label>
              <input
                type="text"
                placeholder="مثال: أمام بوابة كلية التجارة، 5 دقائق مشياً من محطة المترو"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary outline-none"
              />
            </div>

            {/* Price, Deposit & Utilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  الإيجار الشهري المطلوب <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="مثال: 3500"
                    value={formData.monthlyPrice}
                    onChange={(e) => {
                      setFormData({ ...formData, monthlyPrice: e.target.value });
                      if (errors.monthlyPrice) setErrors(prev => ({ ...prev, monthlyPrice: null }));
                    }}
                    className={`w-full p-2.5 pl-14 bg-slate-50 border rounded-xl font-bold text-sakanly-primary outline-none ${
                      errors.monthlyPrice ? 'border-rose-400' : 'border-slate-200 focus:border-sakanly-primary'
                    }`}
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-[11px] pointer-events-none">
                    ج.م / شهر
                  </span>
                </div>
                {errors.monthlyPrice && <p className="text-rose-600 font-bold mt-1 text-[11px]">{errors.monthlyPrice}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  مبلغ التأمين المسترد (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 3500"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    className="w-full p-2.5 pl-14 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-[11px] pointer-events-none">
                    ج.م
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  متوسط الفواتير الشهرية التقديري
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="مثال: 300"
                    value={formData.utilitiesCost}
                    onChange={(e) => setFormData({ ...formData, utilitiesCost: e.target.value })}
                    className="w-full p-2.5 pl-14 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-[11px] pointer-events-none">
                    ج.م / شهر
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            STEP 4: PHOTOS & VIDEO UPLOAD (رفع الصور والفيديو والمعاينة)
           ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-sakanly-dark flex items-center gap-2">
                  <Film className="w-5 h-5 text-sakanly-primary" />
                  <span>الخطوة 4: معرض صور وفيديوهات العقار</span>
                </h2>
                <p className="text-xs text-sakanly-muted mt-0.5">
                  ارفع صوراً حقيقية واضحة للغرف والمرافق، ويمكنك إضافة فيديو واحد لمعاينة تفصيلية للعقار.
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  formData.images.length > 0
                    ? 'bg-teal-50 text-sakanly-primary border-teal-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  الصور: {formData.images.length} من 10
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  formData.video
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  الفيديو: {formData.video ? '1 من 1' : '0 من 1 (اختياري)'}
                </span>
              </div>
            </div>

            {/* File Rejections Alert */}
            {fileRejections.length > 0 && (
              <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-2xl border border-rose-200 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>تعذر قبول بعض الملفات المختارة:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileRejections([])}
                    className="text-[11px] text-rose-600 hover:underline font-bold"
                  >
                    إخفاء التنبيه
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pr-2">
                  {fileRejections.map((rej, i) => (
                    <li key={i}>
                      <strong>{rej.name}</strong>: {rej.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.images && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errors.images}</span>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFilesSelected(e.dataTransfer.files);
                }
              }}
              className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed text-center transition-all flex flex-col items-center justify-center space-y-4 ${
                isDragging
                  ? 'border-sakanly-primary bg-teal-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-sakanly-primary hover:bg-slate-50/80 bg-slate-50/40'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-sakanly-dark">
                  اسحب وأفلت ملفات الصور أو الفيديو هنا
                </h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  حتى 10 صور (JPG, PNG, WebP بحد أقصى 10MB للصورة) • فيديو واحد (MP4, WebM بحد أقصى 100MB)
                </p>
              </div>

              {/* 2 Separate Upload Buttons */}
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  type="button"
                  disabled={isUploadingMedia || formData.images.length >= 10}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer select-none text-xs"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>إضافة صور العقار (حتى 10)</span>
                </button>

                <button
                  type="button"
                  disabled={isUploadingMedia || Boolean(formData.video)}
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-xs transition-colors cursor-pointer select-none text-xs"
                >
                  <Video className="w-4 h-4" />
                  <span>{formData.video ? 'تم رفع الفيديو (1/1)' : 'إضافة فيديو العقار (100MB كحد أقصى)'}</span>
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                disabled={isUploadingMedia}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesSelected(e.target.files);
                  }
                  e.target.value = '';
                }}
              />

              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                disabled={isUploadingMedia}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleVideoSelected(e.target.files);
                  }
                  e.target.value = '';
                }}
              />
            </div>

            {/* Active Upload Queue / Progress */}
            {uploadQueue.length > 0 && (
              <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <Loader2 className={`w-3.5 h-3.5 ${isUploadingMedia ? 'animate-spin text-sakanly-primary' : 'text-slate-400'}`} />
                    <span>حالة معالجة ورفع الملفات على Cloudinary ({uploadQueue.length})</span>
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.isVideo ? (
                          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
                            <Video className="w-5 h-5" />
                          </div>
                        ) : item.previewUrl ? (
                          <img src={item.previewUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-slate-800 truncate">{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {formatFileSize(item.size)} • {item.isVideo ? 'فيديو' : 'صورة'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {item.status === 'uploading' && (
                          <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>جارٍ الرفع...</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <>
                            <span className="text-[10px] text-rose-600 font-bold truncate max-w-[120px]" title={item.error}>
                              {item.error || 'فشل الرفع'}
                            </span>
                            <button
                              type="button"
                              onClick={() => item.isVideo ? handleVideoSelected([item.file]) : handleRetryUpload(item)}
                              className="p-1 text-teal-600 hover:bg-teal-50 rounded-lg"
                              title="إعادة المحاولة"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQueueItem(item.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                              title="إلغاء وحذف"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Video Card Section */}
            {formData.video && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white rounded-3xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Film className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                        فيديو معاينة العقار (معتمد وجاهز)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        يتم تشغيل الفيديو بدون تشغيل تلقائي لمنح الطالب تحكماً كاملاً بالصوت والسرعة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-amber-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                      title="استبدال الفيديو الحالي"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>استبدال</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                      title="حذف الفيديو نهائياً"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                {/* Embedded Video Preview Player */}
                <div className="relative aspect-video max-h-[300px] rounded-2xl overflow-hidden bg-black border border-amber-200/80 shadow-md">
                  <video
                    src={formData.video.secure_url || formData.video.url}
                    poster={formData.video.thumbnail_url || formData.video.poster_url || getVideoPosterUrl(formData.video.secure_url || formData.video.url)}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                  >
                    متصفحك لا يدعم تشغيل هذا الفيديو.
                  </video>
                </div>
              </div>
            )}

            {/* Empty State when NO images selected */}
            {formData.images.length === 0 && uploadQueue.length === 0 && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">لم يتم اختيار أي صور حتى الآن</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  اختر صوراً حقيقية من جهازك، أو يمكنك استخدام النماذج التجريبية بالأسفل لاختبار المظهر سريعاً.
                </p>
              </div>
            )}

            {/* Selected & Uploaded Images Gallery */}
            {formData.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-sakanly-primary" />
                    <span>الصور المرفوعة للعقار ({formData.images.length} من 10)</span>
                  </h4>
                  <span className="text-[11px] text-sakanly-muted">
                    استخدم الأسهم لإعادة ترتيب الصور، أو انقر «غلاف» لتعيين الصورة الرئيسية
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {formData.images.map((imgUrl, index) => {
                    const isCover = index === 0;
                    return (
                      <div
                        key={index}
                        className={`relative rounded-2xl overflow-hidden aspect-video border-2 shadow-2xs group bg-slate-900 transition-all ${
                          isCover ? 'border-sakanly-primary ring-2 ring-sakanly-primary/30' : 'border-slate-200'
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(imgUrl, { width: 320, height: 200, crop: 'fill' })}
                          alt={`صورة العقار ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Primary badge */}
                        {isCover && (
                          <span className="absolute top-2 right-2 bg-sakanly-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            الغلاف الرئيسي
                          </span>
                        )}

                        {/* Order pill */}
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                          {index + 1}
                        </span>

                        {/* Action Overlay */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          {/* Move Right in RTL */}
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'left')}
                              className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl transition-colors shadow-xs"
                              title="تقديم للأمام"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Set Cover */}
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(index)}
                              className="px-2 py-1 bg-sakanly-primary text-white rounded-xl text-[10px] font-bold hover:bg-sakanly-primary-hover transition-colors shadow-xs"
                              title="تعيين كغلاف رئيسي"
                            >
                              غلاف
                            </button>
                          )}

                          {/* Move Left in RTL */}
                          {index < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'right')}
                              className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-xl transition-colors shadow-xs"
                              title="تأخير للخلف"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Samples Quick Helper for fast demo testing */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">نماذج صور للتجربة والاختبار السريع (اختياري):</span>
                <span className="text-[11px] text-slate-400">انقر على أي صورة لإضافتها لصورك</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {curatedSampleImages.map((sample, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      if (!formData.images.includes(sample.url)) {
                        setFormData(prev => ({ ...prev, images: [...prev.images, sample.url] }));
                        setErrors(prev => ({ ...prev, images: null }));
                        showToast(`تمت إضافة ${sample.label}`);
                      }
                    }}
                    className="relative rounded-xl overflow-hidden aspect-video border border-slate-200 hover:border-sakanly-primary transition-all group"
                  >
                    <img src={sample.url} alt={sample.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      + إضافة للصورة
                    </span>
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                      {sample.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            STEP 5: CONTACT INFORMATION (بيانات التواصل مع المالك)
           ======================================================== */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-sakanly-dark flex items-center gap-2">
                  <Phone className="w-5 h-5 text-sakanly-primary" />
                  <span>الخطوة 5: بيانات التواصل مع المالك</span>
                </h2>
                <p className="text-xs text-sakanly-muted mt-0.5">
                  حدد أرقام التواصل التي تظهر للطلاب الجامعيين عند رغبتهم في الاتصال بك أو الاستفسار عن السكن
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                  formData.showContactPhone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {formData.showContactPhone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>عرض الرقم مفعّل للطلاب</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>الرقم محجوب (تواصل عبر الشات فقط)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Primary Phone */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                  رقم الهاتف الأساسي للاتصال <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100 transition-all">
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 flex items-center gap-1.5 shrink-0 select-none">
                    <span>🇪🇬</span>
                    <span dir="ltr" className="font-mono">+20</span>
                  </span>
                  <input
                    type="tel"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        contactPhone: val,
                        whatsappPhone: prev.useSamePhoneForWhatsapp ? val : prev.whatsappPhone,
                      }));
                      if (errors.contactPhone) {
                        setErrors(prev => ({ ...prev, contactPhone: null }));
                      }
                    }}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="flex-1 p-2.5 text-xs sm:text-sm text-slate-900 outline-none font-mono placeholder:text-slate-300"
                  />
                </div>
                {errors.contactPhone ? (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.contactPhone}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    أدخل رقم محمول مصري مكون من 11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015
                  </p>
                )}
              </div>

              {/* WhatsApp Phone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                    رقم الواتساب (WhatsApp) <span className="text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={formData.useSamePhoneForWhatsapp}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData(prev => ({
                          ...prev,
                          useSamePhoneForWhatsapp: checked,
                          whatsappPhone: checked ? prev.contactPhone : '',
                        }));
                      }}
                      className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="font-bold text-[#0F766E]">نفس رقم الهاتف للواتساب</span>
                  </label>
                </div>

                <div className={`flex items-center rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all ${
                  formData.useSamePhoneForWhatsapp ? 'opacity-60 bg-slate-50 cursor-not-allowed' : 'focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100'
                }`}>
                  <span className="px-3 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 flex items-center gap-1.5 shrink-0 select-none">
                    <span>💬</span>
                    <span dir="ltr" className="font-mono">+20</span>
                  </span>
                  <input
                    type="tel"
                    id="whatsappPhone"
                    name="whatsappPhone"
                    disabled={formData.useSamePhoneForWhatsapp}
                    value={formData.useSamePhoneForWhatsapp ? formData.contactPhone : formData.whatsappPhone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, whatsappPhone: e.target.value }));
                      if (errors.whatsappPhone) {
                        setErrors(prev => ({ ...prev, whatsappPhone: null }));
                      }
                    }}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="flex-1 p-2.5 text-xs sm:text-sm text-slate-900 outline-none font-mono placeholder:text-slate-300 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
                {errors.whatsappPhone && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.whatsappPhone}</span>
                  </p>
                )}
              </div>

            </div>

            {/* Permission Toggle Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#0F766E]" />
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                    إظهار رقم الهاتف للطلاب في صفحة الإعلان
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                  عند تفعيل هذا الخيار، سيظهر زر الاتصال المباشر وزر محادثة الواتساب لجميع الطلاب المسجلين بالمنصة.
                  عند التعطيل، سيتواصل الطلاب معك حصرياً عبر شات سكنلي وطلبات المعاينة داخل الموقع دون معرفة رقمك الشخصي.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.showContactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, showContactPhone: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0F766E]"></div>
                <span className="mr-3 text-xs font-bold text-slate-700">
                  {formData.showContactPhone ? 'مفعل' : 'معطل'}
                </span>
              </label>
            </div>

            {/* Live Student Preview Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-teal-50/20 to-white border border-teal-200/60 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-teal-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-[10px]">
                    👁️
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0B3D3A]">
                    معاينة حية: كيف يرى الطلاب قسم التواصل في إعلانك
                  </h4>
                </div>
                <span className="text-[10px] text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full font-bold">
                  محاكاة واجهة الطالب
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5 max-w-md mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-sm border border-teal-200">
                    {(owner?.name || owner?.fullName || 'م').charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <span>{owner?.name || owner?.fullName || 'مالك العقار'}</span>
                      {isOwnerVerified && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-bold">
                          موثق
                        </span>
                      )}
                    </h5>
                    <p className="text-[10px] text-slate-400">مالك السكن • استجابة سريعة</p>
                  </div>
                </div>

                {formData.showContactPhone ? (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">رقم التواصل:</span>
                      <span className="font-bold font-mono text-[#0F766E]" dir="ltr">
                        {formData.contactPhone || '01XXXXXXXXX'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="py-2.5 px-3 bg-[#0F766E] text-white font-bold rounded-xl text-center text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-default">
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال بالمالك</span>
                      </div>
                      <div className="py-2.5 px-3 bg-emerald-600 text-white font-bold rounded-xl text-center text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-default">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center space-y-1">
                    <p className="font-bold text-xs">🔒 رقم هاتف المالك محجوب بناءً على رغبته</p>
                    <p className="text-[10px] text-amber-800">
                      يمكن للطلاب التواصل معك مجاناً عبر طلب المعاينة أو المحادثة الفورية داخل المنصة.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            STEP 6: PREVIEW (معاينة الإعلان قبل النشر)
           ======================================================== */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-sakanly-dark flex items-center gap-2">
                  <Eye className="w-5 h-5 text-sakanly-primary" />
                  <span>الخطوة 6: معاينة الإعلان</span>
                </h2>
                <p className="text-xs text-sakanly-muted mt-0.5">
                  معاينة حقيقية تحاكي كيفية ظهور الإعلان للطلاب بناءً على بياناتك المدخلة
                </p>
              </div>

              {isOwnerVerified ? (
                <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  حسابك معتمد - جاهز للنشر
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  حساب غير موثق - متاح الحفظ كمسودة
                </span>
              )}
            </div>

            {/* Disclaimer Banner */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>تنويه:</strong> هذه المعاينة تحاكي كيفية ظهور الإعلان للطلاب الجامعيين، ولا تعني نشر العقار للعامة حتى الآن.
              </span>
            </div>

            {/* Unverified Owner Warning Banner with Link */}
            {!isOwnerVerified && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="block text-amber-950 font-bold mb-0.5">
                      لا يمكنك نشر العقار قبل اكتمال توثيق حسابك واعتماده
                    </strong>
                    حسابك كمالك غير معتمد حالياً ({owner?.verificationStatus === 'pending_review' ? 'طلبك قيد المراجعة الإدارية' : 'لم تبدأ التوثيق بعد'}). لحماية أمان الطلاب، يُسمح لك بحفظ العقار كمسودة فقط.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={goToVerification}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shrink-0 text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>صفحة توثيق المالك</span>
                </button>
              </div>
            )}

            {/* Student Preview Card Mockup */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-sakanly-border overflow-hidden shadow-card">
              {/* Main Image Header */}
              <div className="relative aspect-video max-h-[340px] w-full bg-slate-100 overflow-hidden flex items-center justify-center">
                {formData.images.length > 0 ? (
                  <img
                    src={formData.images[0]}
                    alt={formData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-400 space-y-2">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="font-bold text-xs">لا توجد صورة غلاف مرفوعة بعد</p>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <span className="bg-sakanly-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {housingTypes.find(t => t.id === formData.accommodationType)?.title || 'نوع السكن'}
                  </span>
                  <span className="bg-slate-900/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {formData.genderPreference === 'male' ? 'طلاب شباب' : formData.genderPreference === 'female' ? 'طالبات بنات' : 'متاح للجميع'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  {formData.video && (
                    <span className="bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <Film className="w-3.5 h-3.5" />
                      <span>فيديو معاينة</span>
                    </span>
                  )}
                  {formData.images.length > 0 && (
                    <span className="bg-black/70 text-white text-xs px-2.5 py-1 rounded-full font-mono backdrop-blur-xs">
                      {formData.images.length} صور
                    </span>
                  )}
                </div>
              </div>

              {/* Body Details */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-sakanly-dark leading-snug">
                      {formData.title || 'عنوان السكن الطلابي'}
                    </h3>
                    <p className="text-xs text-sakanly-muted flex items-center gap-1.5 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sakanly-primary" />
                      <span>{formData.governorate || 'المحافظة'} • {formData.city || 'المدينة'} • {formData.district || 'الحي'}</span>
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-lg sm:text-xl font-extrabold text-sakanly-primary font-cairo">
                      {formData.monthlyPrice ? Number(formData.monthlyPrice).toLocaleString('ar-EG') : '0'} ج.م
                    </span>
                    <span className="text-[11px] text-slate-500 block">شهرياً</span>
                  </div>
                </div>

                {/* Specs Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الأسِرّة المتاحة</span>
                    <strong className="text-xs font-bold text-slate-800">
                      {formData.availableBeds || '0'} / {formData.totalBeds || '0'} سرير
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الغرف</span>
                    <strong className="text-xs font-bold text-slate-800">{formData.bedrooms || '0'} غرف</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">الحمامات</span>
                    <strong className="text-xs font-bold text-slate-800">{formData.bathrooms || '0'} حمام</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">المساحة</span>
                    <strong className="text-xs font-bold text-slate-800">{formData.area || '0'} م²</strong>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 mb-1">وصف السكن:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {formData.description || 'لم يتم إدخال وصف للسكن بعد.'}
                  </p>
                </div>

                {/* Amenities */}
                {formData.amenities.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 mb-2">المميزات والتجهيزات:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.amenities.map(amenity => (
                        <span key={amenity} className="text-[11px] bg-teal-50 text-sakanly-primary font-semibold px-2.5 py-1 rounded-full border border-teal-100 flex items-center gap-1">
                          <Check className="w-3 h-3 text-teal-600" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information Preview Block */}
                <div className="p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
                  <h4 className="font-bold text-xs text-[#0F766E] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>بيانات التواصل المعتمدة:</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400">الهاتف الأساسي: </span>
                      <strong className="font-mono text-slate-800" dir="ltr">{formData.contactPhone || 'غير محدد'}</strong>
                    </div>
                    {formData.whatsappPhone && !formData.useSamePhoneForWhatsapp && (
                      <div>
                        <span className="text-slate-400">واتساب: </span>
                        <strong className="font-mono text-emerald-700" dir="ltr">{formData.whatsappPhone}</strong>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400">حالة الظهور للطلاب: </span>
                      <strong className={formData.showContactPhone ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                        {formData.showContactPhone ? 'متاح ومفعل' : 'محجوب (تواصل عبر الشات فقط)'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick edit links */}
            <div className="flex items-center justify-center gap-3 text-xs text-sakanly-muted pt-2 flex-wrap">
              <span>هل تريد تعديل شيء قبل الإرسال؟</span>
              <button type="button" onClick={() => setCurrentStep(1)} className="text-sakanly-primary hover:underline font-bold">نوع السكن</button>
              <span>•</span>
              <button type="button" onClick={() => setCurrentStep(2)} className="text-sakanly-primary hover:underline font-bold">التفاصيل</button>
              <span>•</span>
              <button type="button" onClick={() => setCurrentStep(3)} className="text-sakanly-primary hover:underline font-bold">الموقع والسعر</button>
              <span>•</span>
              <button type="button" onClick={() => setCurrentStep(4)} className="text-sakanly-primary hover:underline font-bold">الصور</button>
              <span>•</span>
              <button type="button" onClick={() => setCurrentStep(5)} className="text-sakanly-primary hover:underline font-bold">بيانات التواصل</button>
            </div>
          </div>
        )}

        {/* Action Buttons Bar (Bottom of Form) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
          
          {/* Previous Button */}
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                id="wizard-prev-btn"
                onClick={handlePrev}
                disabled={isSubmitting || isSavingDraft}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الخطوة السابقة</span>
              </button>
            ) : (
              <button
                type="button"
                id="wizard-cancel-btn"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                إلغاء والعودة
              </button>
            )}
          </div>

          {/* Next / Submit Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
            {currentStep < 6 ? (
              <button
                type="button"
                id="wizard-next-btn"
                onClick={handleNext}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                <span>الخطوة التالية</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* If unverified: Show draft button + verification button */}
                {!isOwnerVerified ? (
                  <>
                    <button
                      type="button"
                      id="wizard-save-draft-bottom-btn"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
                    >
                      <Save className="w-4 h-4 text-slate-500" />
                      <span>{isSavingDraft ? 'جارٍ الحفظ...' : 'حفظ كمسودة خاصة'}</span>
                    </button>
                    <button
                      type="button"
                      id="wizard-verify-account-btn"
                      onClick={goToVerification}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>توثيق الحساب للنشر</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    id="wizard-publish-btn"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-teal-700/20 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ إرسال العقار للمراجعة والنشر...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>إرسال العقار للمراجعة والنشر</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
