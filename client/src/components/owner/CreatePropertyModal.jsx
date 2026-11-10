import React, { useState, useEffect, useRef } from 'react';
import {
  X, Building, CheckCircle2, AlertCircle, Plus, Image as ImageIcon, Phone, Smartphone,
  Film, Video, Trash2, ChevronRight, ChevronLeft, RefreshCw, Loader2, Upload, Star
} from 'lucide-react';
import { validateEgyptianPhoneInput } from './AddPropertyWizard.jsx';
import { mediaApi } from '../../services/api.js';
import { getOptimizedImageUrl, getVideoPosterUrl, formatFileSize } from '../../utils/cloudinary.js';

export const CreatePropertyModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  ownerName = 'المالك',
  owner = null,
}) => {
  const isOwnerVerified = Boolean(owner?.verificationStatus === 'verified' || owner?.isVerified);
  const [formData, setFormData] = useState({
    title: '',
    city: 'مدينة نصر',
    district: '',
    accommodationType: 'entire_apartment',
    genderPreference: 'male',
    monthlyPrice: '',
    deposit: '',
    totalBeds: '3',
    availableBeds: '3',
    bedrooms: '2',
    bathrooms: '1',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'],
    amenities: ['واي فاي', 'تكييف', 'مكتب للمذاكرة', 'غسالة ملابس'],
  });

  const [video, setVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [videoUploadState, setVideoUploadState] = useState({ uploading: false, progress: 0, error: '' });
  const [imageUploadQueue, setImageUploadQueue] = useState([]);
  const [fileRejections, setFileRejections] = useState([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const initialImgs = Array.isArray(initialData.images) && initialData.images.length > 0
        ? [...initialData.images]
        : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'];

      const initialVid = initialData.video || null;
      setVideo(initialVid);
      setVideoPreviewUrl(typeof initialVid === 'string' ? initialVid : initialVid?.secure_url || initialVid?.url || null);

      setFormData({
        title: initialData.title || '',
        city: initialData.city || 'مدينة نصر',
        district: initialData.district || '',
        accommodationType: initialData.accommodationType || 'entire_apartment',
        genderPreference: initialData.genderPreference || 'male',
        monthlyPrice: String(initialData.monthlyPrice || ''),
        deposit: String(initialData.deposit || ''),
        totalBeds: String(initialData.totalBeds || '3'),
        availableBeds: String(initialData.availableBeds || '3'),
        bedrooms: String(initialData.bedrooms || '2'),
        bathrooms: String(initialData.bathrooms || '1'),
        description: initialData.description || '',
        imageUrl: initialImgs[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        images: initialImgs,
        amenities: initialData.amenities || ['واي فاي', 'تكييف'],
        contactPhone: initialData.contactPhone || initialData.owner?.phone || owner?.phone || '',
        whatsappPhone: initialData.whatsappPhone || '',
        useSamePhoneForWhatsapp: !initialData.whatsappPhone || initialData.whatsappPhone === (initialData.contactPhone || initialData.owner?.phone),
        showContactPhone: initialData.showContactPhone !== false,
      });
    } else {
      setVideo(null);
      setVideoPreviewUrl(null);
      setFormData({
        title: '',
        city: 'مدينة نصر',
        district: '',
        accommodationType: 'entire_apartment',
        genderPreference: 'male',
        monthlyPrice: '',
        deposit: '',
        totalBeds: '3',
        availableBeds: '3',
        bedrooms: '2',
        bathrooms: '1',
        description: '',
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'],
        amenities: ['واي فاي', 'تكييف', 'مكتب للمذاكرة', 'غسالة ملابس'],
        contactPhone: owner?.phone || '',
        whatsappPhone: '',
        useSamePhoneForWhatsapp: true,
        showContactPhone: true,
      });
    }
    setNewImageUrl('');
    setError('');
    setFileRejections([]);
    setImageUploadQueue([]);
  }, [initialData, isOpen]);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFiles = 10;
    const currentImgs = formData.images || [];

    const rejections = [];
    const valid = [];

    for (const f of files) {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      const isAllowed = allowedMimes.includes(f.type) || ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
      if (!isAllowed) {
        rejections.push(`الملف ${f.name} بصيغة غير مدعومة. يسمح بـ JPG, PNG, WebP فقط.`);
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        rejections.push(`الصورة ${f.name} تتجاوز الحد الأقصى 10MB.`);
        continue;
      }
      if (currentImgs.length + valid.length >= maxFiles) {
        rejections.push(`تم بلوغ الحد الأقصى للصور (${maxFiles} صور).`);
        break;
      }
      valid.push(f);
    }

    if (rejections.length > 0) {
      setFileRejections(prev => [...prev, ...rejections]);
    }

    if (!valid.length) {
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    setIsUploadingMedia(true);
    const queueItems = valid.map((f, i) => ({
      id: `img-up-${Date.now()}-${i}`,
      name: f.name,
      file: f,
      progress: 20,
      preview: URL.createObjectURL(f),
      status: 'uploading',
    }));
    setImageUploadQueue(prev => [...prev, ...queueItems]);

    try {
      const uploaded = await mediaApi.uploadMedia(valid, { folderType: 'property_image' });
      const uploadedUrls = uploaded.map(u => u.secure_url || u.url);
      setFormData(prev => {
        const combined = [...(prev.images || []), ...uploadedUrls];
        return {
          ...prev,
          images: combined,
          imageUrl: prev.imageUrl || combined[0],
        };
      });
      setImageUploadQueue(prev => prev.filter(q => !queueItems.some(item => item.id === q.id)));
    } catch (err) {
      setFileRejections(prev => [...prev, err.message || 'فشل رفع الصور إلى الخادم']);
      setImageUploadQueue(prev => prev.filter(q => !queueItems.some(item => item.id === q.id)));
    } finally {
      setIsUploadingMedia(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedVideoExts = ['.mp4', '.webm', '.mov'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isVideo = file.type.startsWith('video/') || allowedVideoExts.includes(ext);

    if (!isVideo) {
      setFileRejections(prev => [...prev, 'صيغة الفيديو غير مدعومة. يسمح فقط بصيغ MP4 و WebM و MOV.']);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setFileRejections(prev => [...prev, `حجم الفيديو (${(file.size / (1024 * 1024)).toFixed(1)}MB) يتجاوز الحد الأقصى المسموح به (100MB).`]);
      if (videoInputRef.current) videoInputRef.current.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
    setVideoUploadState({ uploading: true, progress: 30, error: '' });
    setIsUploadingMedia(true);

    try {
      const uploaded = await mediaApi.uploadMedia([file], { folderType: 'property_video' });
      const vidObj = uploaded[0];
      setVideo(vidObj);
      setVideoPreviewUrl(vidObj?.secure_url || vidObj?.url || previewUrl);
      setVideoUploadState({ uploading: false, progress: 100, error: '' });
    } catch (err) {
      setVideoUploadState({ uploading: false, progress: 0, error: err.message || 'فشل رفع الفيديو' });
      setFileRejections(prev => [...prev, err.message || 'فشل رفع ملف الفيديو']);
    } finally {
      setIsUploadingMedia(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideo(null);
    setVideoPreviewUrl(null);
    setVideoUploadState({ uploading: false, progress: 0, error: '' });
  };

  const handleMoveImage = (idx, direction) => {
    // In RTL layout: 'left' moves towards later indices (+1), 'right' moves towards earlier indices (-1)
    const newIdx = direction === 'left' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= formData.images.length) return;
    const updated = [...formData.images];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newIdx, 0, moved);
    setFormData(prev => ({
      ...prev,
      images: updated,
      imageUrl: updated[0],
    }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('يرجى إدخال عنوان الإعلان.');
      return;
    }
    if (!formData.monthlyPrice || Number(formData.monthlyPrice) <= 0) {
      setError('يرجى إدخال قيمة الإيجار الشهري.');
      return;
    }

    if (formData.contactPhone && formData.contactPhone.trim()) {
      if (!validateEgyptianPhoneInput(formData.contactPhone)) {
        setError('رقم الهاتف الأساسي غير صحيح. يرجى إدخال رقم محمول مصري يبدأ بـ 010 أو 011 أو 012 أو 015.');
        return;
      }
    }

    if (!formData.useSamePhoneForWhatsapp && formData.whatsappPhone && formData.whatsappPhone.trim()) {
      if (!validateEgyptianPhoneInput(formData.whatsappPhone)) {
        setError('رقم الواتساب غير صحيح. يرجى إدخال رقم محمول مصري يبدأ بـ 010 أو 011 أو 012 أو 015.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        id: initialData?.id || `prop-${Date.now()}`,
        title: formData.title.trim(),
        governorate: 'القاهرة',
        city: formData.city,
        district: formData.district || 'الحي السابع',
        address: `${formData.city}، ${formData.district || 'بالقرب من الجامعة'}`,
        accommodationType: formData.accommodationType,
        genderPreference: formData.genderPreference,
        monthlyPrice: Number(formData.monthlyPrice),
        deposit: Number(formData.deposit) || Number(formData.monthlyPrice),
        utilitiesCost: 350,
        bedrooms: Number(formData.bedrooms) || 2,
        bathrooms: Number(formData.bathrooms) || 1,
        totalBeds: Number(formData.totalBeds) || 3,
        availableBeds: Number(formData.availableBeds) || 2,
        description: formData.description.trim() || 'وحدة سكنية مجهزة ومناسبة للطلاب الجامعيين.',
        images: Array.isArray(formData.images) && formData.images.length > 0 
          ? (formData.images.includes(formData.imageUrl) ? formData.images : [formData.imageUrl, ...formData.images])
          : [formData.imageUrl],
        video: video || null,
        amenities: formData.amenities,
        contactPhone: formData.contactPhone?.trim() || null,
        whatsappPhone: formData.useSamePhoneForWhatsapp
          ? (formData.contactPhone?.trim() || null)
          : (formData.whatsappPhone?.trim() || null),
        showContactPhone: Boolean(formData.showContactPhone),
        nearbyUniversities: [{ name: 'جامعة عين شمس / القاهرة', distance: '10 دقائق' }],
        isFurnished: true,
        isVerified: Boolean(initialData?.isVerified && initialData?.status === 'active'),
        status: isOwnerVerified ? (initialData?.status === 'rejected' ? 'pending_review' : (initialData?.status || 'pending_review')) : 'draft',
        featured: false,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        owner: {
          id: initialData?.owner?.id || 'own-me',
          name: ownerName,
          phone: initialData?.owner?.phone || '+20100000000',
          avatar: initialData?.owner?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          verificationStatus: 'verified_owner',
          memberSince: '2026',
        },
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإعلان.');
    } finally {
      setSubmitting(false);
    }
  };

  const sampleImages = [
    { label: 'شقة مودرن', url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80' },
    { label: 'غرفة ثنائية', url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=80' },
    { label: 'استوديو راقي', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80' },
    { label: 'غرفة فردية', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-modal border border-slate-200 my-8 space-y-5 animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-sakanly-dark">
                {initialData ? 'تعديل بيانات السكن' : 'إضافة عقار أو سرير جديد للإيجار'}
              </h3>
              <p className="text-xs text-sakanly-muted">
                أدخل مواصفات الوحدة وسيتم تفعيلها فورياً في حسابك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isOwnerVerified && (
          <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-2xl border border-amber-200/90 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">تنبيه: حسابك غير معتمد بعد</span>
              <span className="text-[11px] opacity-90 block">
                سيتم حفظ هذا العقار كـ <strong>مسودة خاصة</strong> ولن يظهر للطلاب في نتائج البحث إلا بعد استكمال واعتماد توثيق حساب المالك.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              عنوان الإعلان السكني <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: شقة طلابية راقية 3 غرف بجوار جامعة عين شمس"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary focus:bg-white outline-none"
            />
          </div>

          {/* City & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المدينة</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="مدينة نصر">مدينة نصر (القاهرة)</option>
                <option value="الدقي">الدقي والمهندسين (الجيزة)</option>
                <option value="القاهرة الجديدة">التجمع الخامس (القاهرة)</option>
                <option value="مدينة 6 أكتوبر">مدينة 6 أكتوبر (الجيزة)</option>
                <option value="الشيخ زايد">الشيخ زايد (الجيزة)</option>
                <option value="مصر الجديدة">مصر الجديدة (القاهرة)</option>
                <option value="المعادي">المعادي وحلوان</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الحي / المنطقة</label>
              <input
                type="text"
                placeholder="مثال: الحي السابع أو مصدق"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Type & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع السكن</label>
              <select
                value={formData.accommodationType}
                onChange={(e) => setFormData({ ...formData, accommodationType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="entire_apartment">شقة كاملة للطلاب</option>
                <option value="individual_bed">سرير فردي (سكن مشترك)</option>
                <option value="private_room">غرفة خاصة مستقلة</option>
                <option value="shared_room">غرفة مشتركة</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع الطلاب المفضل</label>
              <select
                value={formData.genderPreference}
                onChange={(e) => setFormData({ ...formData, genderPreference: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="male">طلاب شباب فقط</option>
                <option value="female">طالبات بنات فقط</option>
                <option value="any">متاح للجميع</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                الإيجار الشهري (ج.م) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="500"
                placeholder="مثال: 3500"
                value={formData.monthlyPrice}
                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary focus:bg-white outline-none font-bold text-sakanly-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">مبلغ التأمين (ج.م)</label>
              <input
                type="number"
                min="0"
                placeholder="مثال: 3500"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Beds Capacity */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">إجمالي الأسِرّة</label>
              <input
                type="number"
                min="1"
                value={formData.totalBeds}
                onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الأسِرّة المتاحة</label>
              <input
                type="number"
                min="0"
                max={formData.totalBeds}
                value={formData.availableBeds}
                onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عدد الغرف</label>
              <input
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عدد الحمامات</label>
              <input
                type="number"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold"
              />
            </div>
          </div>

          {/* Media & Video Management Section */}
          <div className="space-y-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            {/* Hidden file inputs */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoSelected}
              className="hidden"
            />

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-sakanly-primary" />
                  <span>معرض الصور والفيديو</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({formData.images?.length || 0}/10 صور {video ? '+ فيديو' : ''})
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  الصور بصيغة JPG/PNG/WebP حتى 10MB، وفيديو العقار حتى 100MB (MP4/WebM).
                </p>
              </div>

              {/* Upload Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isUploadingMedia || (formData.images?.length >= 10)}
                  onClick={() => imageInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-sakanly-primary text-slate-700 hover:text-sakanly-primary rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-sakanly-primary" />
                  <span>إضافة صور</span>
                </button>

                <button
                  type="button"
                  disabled={isUploadingMedia}
                  onClick={() => videoInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-teal-50 border border-teal-200 hover:border-teal-400 text-teal-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Video className="w-3.5 h-3.5 text-teal-600" />
                  <span>{video ? 'استبدال الفيديو' : 'إضافة فيديو'}</span>
                </button>
              </div>
            </div>

            {/* Uploading Queue & Rejection Notifications */}
            {isUploadingMedia && (
              <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-xs animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600 shrink-0" />
                <span>جارٍ رفع ومعالجة الوسائط على Cloudinary، يرجى الانتظار...</span>
              </div>
            )}

            {fileRejections.length > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-800 text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    تنبيهات رفع الملفات:
                  </span>
                  <button
                    type="button"
                    onClick={() => setFileRejections([])}
                    className="text-[10px] text-rose-600 hover:underline"
                  >
                    إغلاق
                  </button>
                </div>
                {fileRejections.map((rej, i) => (
                  <p key={i} className="text-[10px] text-rose-700 leading-tight">
                    • {typeof rej === 'string' ? rej : (rej.name ? `${rej.name}: ${rej.reason}` : JSON.stringify(rej))}
                  </p>
                ))}
              </div>
            )}

            {/* Video Section (if attached or preview exists) */}
            {videoPreviewUrl && (
              <div className="p-3 bg-white rounded-xl border border-teal-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-teal-600" />
                    فيديو العقار التوضيحي
                    {videoUploadState.uploading && (
                      <span className="text-[10px] font-normal text-teal-600 animate-pulse">
                        (جارٍ الرفع...)
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      title="استبدال الفيديو بملف آخر"
                    >
                      <RefreshCw className="w-3 h-3" />
                      استبدال
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold flex items-center gap-1 transition-colors"
                      title="حذف الفيديو"
                    >
                      <Trash2 className="w-3 h-3" />
                      حذف
                    </button>
                  </div>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-slate-900 max-h-48 flex items-center justify-center">
                  <video
                    src={videoPreviewUrl}
                    controls
                    preload="metadata"
                    className="w-full max-h-48 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Images Grid */}
            {Array.isArray(formData.images) && formData.images.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 block">
                  يمكنك النقر على النجمة لجعل الصورة هي الرئيسية، واستخدام الأسهم لترتيب العرض:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {formData.images.map((img, idx) => {
                    const isPrimary = formData.imageUrl === img || (!formData.imageUrl && idx === 0);
                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all bg-white shadow-xs aspect-video ${
                          isPrimary
                            ? 'border-sakanly-primary ring-2 ring-sakanly-primary/30'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={typeof img === 'string' ? img : img?.secure_url || img?.url}
                          alt={`صورة ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-1 right-1 flex items-center gap-1">
                          {isPrimary && (
                            <span className="bg-sakanly-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              رئيسية
                            </span>
                          )}
                        </div>

                        {/* Action Overlay */}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, imageUrl: img }))}
                              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-transform hover:scale-105"
                              title="جعلها الصورة الرئيسية"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reorder Buttons */}
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'right')}
                              className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-transform hover:scale-105"
                              title="تقديم للأمام"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {idx < formData.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 'left')}
                              className="p-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-transform hover:scale-105"
                              title="تأخير للخلف"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {formData.images.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.images.filter((_, i) => i !== idx);
                                setFormData(prev => ({
                                  ...prev,
                                  images: updated,
                                  imageUrl: prev.imageUrl === img ? updated[0] : prev.imageUrl,
                                }));
                              }}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-transform hover:scale-105"
                              title="حذف الصورة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-500">لا توجد صور مرفوعة بعد. انقر على «إضافة صور» بالأعلى.</p>
              </div>
            )}

            {/* Presets & External URL (Collapsible/Auxiliary) */}
            <details className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
              <summary className="cursor-pointer font-bold select-none text-slate-700 hover:text-sakanly-primary">
                + إضافة صور جاهزة أو رابط مباشر
              </summary>
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sampleImages.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        const currentImgs = Array.isArray(formData.images) ? [...formData.images] : [];
                        if (!currentImgs.includes(img.url)) {
                          currentImgs.push(img.url);
                        }
                        setFormData({ ...formData, imageUrl: img.url, images: currentImgs });
                      }}
                      className="relative rounded-lg overflow-hidden aspect-video border border-slate-200 hover:border-slate-400 transition-all text-right"
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-bold">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="رابط صورة خارجية..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 p-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg outline-none font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        const currentImgs = Array.isArray(formData.images) ? [...formData.images] : [];
                        if (!currentImgs.includes(newImageUrl.trim())) {
                          currentImgs.push(newImageUrl.trim());
                        }
                        setFormData({ ...formData, imageUrl: newImageUrl.trim(), images: currentImgs });
                        setNewImageUrl('');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors shrink-0"
                  >
                    + إضافة
                  </button>
                </div>
              </div>
            </details>
          </div>

          {/* Contact Information (بيانات التواصل مع المالك) */}
          <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-[#0B3D3A] flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#0F766E]" />
                <span>بيانات التواصل مع المالك</span>
              </h4>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={formData.showContactPhone}
                  onChange={(e) => setFormData({ ...formData, showContactPhone: e.target.checked })}
                  className="rounded text-[#0F766E] focus:ring-teal-500 w-3.5 h-3.5"
                />
                <span className="font-bold text-slate-700">إظهار الرقم للطلاب في الإعلان</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  رقم الهاتف الأساسي للاتصال <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-teal-500">
                  <span className="px-2.5 py-2 bg-slate-50 text-slate-600 text-xs font-bold border-l border-slate-200 shrink-0 font-mono" dir="ltr">
                    +20
                  </span>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        contactPhone: val,
                        whatsappPhone: formData.useSamePhoneForWhatsapp ? val : formData.whatsappPhone,
                      });
                    }}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="w-full p-2 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">رقم واتساب (اختياري)</label>
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-slate-500 select-none">
                    <input
                      type="checkbox"
                      checked={formData.useSamePhoneForWhatsapp}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({
                          ...formData,
                          useSamePhoneForWhatsapp: checked,
                          whatsappPhone: checked ? formData.contactPhone : '',
                        });
                      }}
                      className="rounded text-[#0F766E] w-3 h-3"
                    />
                    <span>نفس الرقم</span>
                  </label>
                </div>
                <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden focus-within:border-teal-500">
                  <span className="px-2.5 py-2 bg-slate-50 text-slate-600 text-xs font-bold border-l border-slate-200 shrink-0 font-mono" dir="ltr">
                    +20
                  </span>
                  <input
                    type="tel"
                    disabled={formData.useSamePhoneForWhatsapp}
                    value={formData.useSamePhoneForWhatsapp ? formData.contactPhone : formData.whatsappPhone}
                    onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    className="w-full p-2 text-xs font-mono outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">وصف السكن والمرافق القريبة</label>
            <textarea
              rows={2}
              placeholder="اكتب تفاصيل إضافية عن الفرش، الأجهزة الكهربائية، والمسافة للجامعة..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submitting
                ? 'جارٍ الحفظ...'
                : initialData
                ? 'حفظ التعديلات'
                : isOwnerVerified
                ? 'نشر السكن الآن'
                : 'حفظ كمسودة خاصة'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
