import React, { useState } from 'react';
import { 
  Building, 
  Eye, 
  Edit3, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  PlusCircle, 
  AlertTriangle,
  Search,
  ExternalLink,
  MapPin,
  BedDouble,
  Bath,
  Home,
  Images,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { propertyStatusConfig } from '../../data/mockOwnerData.js';

const FALLBACK_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80';

const handlePropertyImageError = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_PROPERTY_IMAGE;
};

const accommodationTypeLabels = {
  entire_apartment: 'شقة كاملة',
  shared_room: 'غرفة مشتركة',
  private_room: 'غرفة خاصة',
  individual_bed: 'سرير فردي',
};

const accommodationTypeOptions = [
  { id: 'all', label: 'جميع الأنواع' },
  { id: 'entire_apartment', label: 'شقة كاملة' },
  { id: 'shared_room', label: 'غرفة مشتركة' },
  { id: 'private_room', label: 'غرفة خاصة' },
  { id: 'individual_bed', label: 'سرير فردي' },
];

export const OwnerPropertiesList = ({
  properties = [],
  owner = null,
  onOpenCreate,
  onToggleStatus,
  onDeleteProperty,
  onEditProperty,
  onNavigateVerification,
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    action: null,
    property: null,
    title: '',
    message: '',
  });
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    property: null,
  });

  // Gallery preview modal state
  const [galleryModal, setGalleryModal] = useState({
    isOpen: false,
    property: null,
    activeIndex: 0,
  });

  // Statistics calculations
  const totalCount = properties.length;
  const activeCount = properties.filter(p => (p.status || (p.isVerified ? 'active' : 'pending')) === 'active' || p.status === 'published').length;
  const draftCount = properties.filter(p => p.status === 'draft').length;
  const pendingCount = properties.filter(p => p.status === 'pending' || p.status === 'pending_review').length;
  const rejectedCount = properties.filter(p => p.status === 'rejected').length;
  const totalAvailableBeds = properties.reduce((acc, p) => acc + (Number(p.availableBeds) || 0), 0);

  // Filter properties by status, accommodation type, and search term
  const filtered = properties.filter((p) => {
    const status = p.status || (p.isVerified ? 'active' : 'pending');
    const matchesStatus = 
      filterStatus === 'all' || 
      status === filterStatus ||
      (filterStatus === 'active' && status === 'published') ||
      (filterStatus === 'pending' && (status === 'pending_review' || status === 'pending'));
    const matchesType = filterType === 'all' || p.accommodationType === filterType;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      (p.district && p.district.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q));
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleActionClick = (action, property) => {
    if (action === 'publish') {
      // Security enforcement: Check owner verification
      if (owner && owner.verificationStatus !== 'verified') {
        setVerificationModal({
          isOpen: true,
          property,
        });
        return;
      }

      setConfirmDialog({
        isOpen: true,
        action: 'publish',
        property,
        title: 'تأكيد نشر وتفعيل الإعلان',
        message: `هل ترغب في تفعيل نشر "${property.title}" وإتاحته للطلاب في نتائج البحث؟`,
      });
    } else if (action === 'pause') {
      setConfirmDialog({
        isOpen: true,
        action: 'pause',
        property,
        title: 'تأكيد إيقاف الإعلان مؤقتاً',
        message: `هل أنت متأكد من رغبتك في إيقاف عرض "${property.title}"؟ لن يظهر العقار للطلاب في نتائج البحث حتى تعيد تفعيله.`,
      });
    } else if (action === 'delete') {
      setConfirmDialog({
        isOpen: true,
        action: 'delete',
        property,
        title: 'تأكيد حذف الإعلان نهائياً',
        message: `تحذير: سيتم حذف عقار "${property.title}" وجميع بياناته من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه.`,
      });
    }
  };

  const handleConfirmAction = () => {
    const { action, property } = confirmDialog;
    if (action === 'pause' || action === 'publish') {
      if (onToggleStatus) {
        onToggleStatus(property.id, action === 'pause' ? 'paused' : 'active');
      }
    } else if (action === 'delete') {
      if (onDeleteProperty) {
        onDeleteProperty(property.id);
      }
    }
    setConfirmDialog({ isOpen: false, action: null, property: null, title: '', message: '' });
  };

  const openGallery = (property, index = 0) => {
    setGalleryModal({
      isOpen: true,
      property,
      activeIndex: index,
    });
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* 1. Header & Summary Stats Bar */}
      <div className="bg-white rounded-3xl border border-sakanly-border p-5 sm:p-6 shadow-sm space-y-5">
        
        {/* Top Header Row with Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-sakanly-dark flex items-center gap-2">
              <Building className="w-5 h-5 text-sakanly-primary" />
              <span>إدارة قائمة العقارات والوحدات</span>
              <span className="text-xs bg-teal-50 text-sakanly-primary px-2.5 py-0.5 rounded-full font-bold border border-teal-100">
                {properties.length} عقارات
              </span>
            </h2>
            <p className="text-xs text-sakanly-muted mt-0.5">
              عرض تفاصيل وحداتك السكنية، تعديل الأسعار، ومتابعة حالة النشر والأسِرّة الشاغرة
            </p>
          </div>

          {onOpenCreate && (
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>إضافة عقار جديد</span>
            </button>
          )}
        </div>

        {/* Quick KPI Stat Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">إجمالي العقارات</span>
              <span className="text-sm font-bold text-sakanly-dark">{totalCount}</span>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-emerald-800 block">العقارات النشطة</span>
              <span className="text-sm font-bold text-emerald-900">{activeCount}</span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <BedDouble className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-teal-800 block">الأسِرّة المتاحة</span>
              <span className="text-sm font-bold text-teal-900">{totalAvailableBeds} سرير</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-amber-800 block">مسودات ومراجعة</span>
              <span className="text-sm font-bold text-amber-900">{draftCount + pendingCount}</span>
            </div>
          </div>
        </div>

        {/* 2. Search & Filters Bar */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث بالعنوان، المنطقة، المدينة، أو الرمز التعريف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-sakanly-primary focus:bg-white outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Accommodation Type Dropdown */}
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold hidden sm:inline">نوع الوحدة:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-sakanly-primary"
              >
                {accommodationTypeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto sakanly-scrollbar pb-1.5 text-xs -mx-1 px-1 touch-pan-x">
            {[
              { id: 'all', label: 'الكل', count: properties.length },
              { id: 'active', label: 'منشور / نشط', count: activeCount },
              { id: 'pending', label: 'قيد المراجعة', count: pendingCount },
              { id: 'rejected', label: 'مرفوض', count: rejectedCount },
              { id: 'draft', label: 'مسودات خاصة', count: draftCount },
              { id: 'rented', label: 'مؤجر', count: properties.filter(p => p.status === 'rented').length },
              { id: 'paused', label: 'متوقف مؤقتاً', count: properties.filter(p => p.status === 'paused').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  filterStatus === tab.id
                    ? 'bg-sakanly-primary text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Properties Content: Table or Cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-sakanly-primary flex items-center justify-center mx-auto">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-sakanly-dark">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                ? 'لا توجد نتائج تطابق خيارات التصفية' 
                : 'لم تقم بإضافة أي عقارات حتى الآن'}
            </h3>
            <p className="text-xs text-sakanly-muted max-w-sm mx-auto">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'جرّب إعادة تعيين الفلاتر أو استخدام كلمات بحث مختلفة لإظهار بقية العقارات.'
                : 'ابدأ بعرض شقتك أو غرفتك للطلاب الجامعيين بأعلى درجات الموثوقية والأمان.'}
            </p>
            {onOpenCreate && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sakanly-primary text-white text-xs font-bold rounded-xl hover:bg-sakanly-primary-hover shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة عقار جديد الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            
            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-2xl border border-slate-200 overflow-hidden">
              <div className="max-h-[380px] xl:max-h-[440px] overflow-y-auto overflow-x-auto sakanly-scrollbar">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="p-3.5">العقار والمعرض</th>
                      <th className="p-3.5">الموقع والنوع</th>
                      <th className="p-3.5">الإيجار الشهري</th>
                      <th className="p-3.5">المواصفات والأسِرّة</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                  {filtered.map((property) => {
                    const statusKey = property.status || (property.isVerified ? 'active' : 'pending');
                    const cfg = propertyStatusConfig[statusKey] || propertyStatusConfig.active;
                    const imagesList = Array.isArray(property.images) && property.images.length > 0 
                      ? property.images 
                      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80'];
                    const primaryImg = imagesList[0];
                    const typeLabel = accommodationTypeLabels[property.accommodationType] || 'سكن طلابي';

                    return (
                      <tr key={property.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Image & Title & Gallery Opener */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div 
                              onClick={() => openGallery(property, 0)}
                              className="relative cursor-pointer group shrink-0"
                              title="انقر لفتح معرض الصور"
                            >
                              <img
                                src={primaryImg}
                                alt={property.title}
                                onError={handlePropertyImageError}
                                className="w-16 h-14 rounded-xl object-cover border border-slate-200 group-hover:opacity-90 transition-opacity"
                              />
                              {imagesList.length > 1 && (
                                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <Images className="w-2.5 h-2.5" />
                                  <span>{imagesList.length}</span>
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 max-w-xs">
                              <h4 className="font-bold text-sakanly-dark text-xs sm:text-[13px] line-clamp-1 hover:text-sakanly-primary transition-colors">
                                <Link to={`/property/${property.id}`} target="_blank">
                                  {property.title}
                                </Link>
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{property.id}
                                </span>
                                {property.featured && (
                                  <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                                    مميز
                                  </span>
                                )}
                              </div>
                              {statusKey === 'rejected' && property.rejectionReason && (
                                <div className="mt-1.5 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-start gap-1 leading-snug">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <span><strong className="font-bold">سبب الرفض:</strong> {property.rejectionReason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Location & Accommodation Type */}
                        <td className="p-3.5 text-slate-600">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 font-medium text-xs">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{property.city}</span>
                              {property.district && <span className="text-slate-400">• {property.district}</span>}
                            </div>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-100">
                              {typeLabel}
                            </span>
                          </div>
                        </td>

                        {/* Monthly Price */}
                        <td className="p-3.5">
                          <div className="font-bold text-sakanly-primary text-xs sm:text-sm font-cairo">
                            {Number(property.monthlyPrice).toLocaleString('ar-EG')} ج.م
                            <span className="text-[10px] text-slate-500 font-normal block">شهرياً</span>
                          </div>
                        </td>

                        {/* Capacity, Bedrooms & Beds */}
                        <td className="p-3.5 text-slate-600">
                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center gap-1 font-bold text-slate-700">
                              <BedDouble className="w-3.5 h-3.5 text-teal-600" />
                              <span>{property.availableBeds || property.totalBeds || 1}</span>
                              <span className="text-slate-400">/ {property.totalBeds || 1} سرير متاح</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {property.bedrooms || 1} غرف نوم • {property.bathrooms || 1} حمام
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            <span>{cfg.label}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            
                            {/* Preview Page */}
                            <Link
                              to={`/property/${property.id}`}
                              target="_blank"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-sakanly-primary hover:bg-teal-50 transition-colors"
                              title="معاينة صفحة العقار في تبويب جديد"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {/* Gallery Opener */}
                            <button
                              type="button"
                              onClick={() => openGallery(property, 0)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                              title="عرض معرض الصور"
                            >
                              <Images className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => onEditProperty && onEditProperty(property)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="تعديل بيانات وصور العقار"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Pause / Publish / Resubmit Toggle */}
                            {statusKey === 'rejected' ? (
                              <button
                                type="button"
                                onClick={() => handleActionClick('publish', property)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                title="إعادة التقديم للمراجعة الإدارية"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            ) : statusKey === 'pending' || statusKey === 'pending_review' ? (
                              <span
                                className="p-1.5 rounded-lg text-amber-500 cursor-not-allowed"
                                title="قيد المراجعة الإدارية حالياً من قِبل إدارة سكنلي"
                              >
                                <Clock className="w-4 h-4" />
                              </span>
                            ) : statusKey === 'paused' || statusKey === 'draft' ? (
                              <button
                                type="button"
                                onClick={() => handleActionClick('publish', property)}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title={statusKey === 'draft' ? 'نشر المسودة للطلاب' : 'إعادة النشر والتفعيل'}
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActionClick('pause', property)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="إيقاف مؤقت"
                              >
                                <PauseCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleActionClick('delete', property)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="حذف العقار نهائياً"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden space-y-4 max-h-[580px] sm:max-h-[680px] overflow-y-auto sakanly-scrollbar pr-0.5">
              {filtered.map((property) => {
                const statusKey = property.status || (property.isVerified ? 'active' : 'pending');
                const cfg = propertyStatusConfig[statusKey] || propertyStatusConfig.active;
                const imagesList = Array.isArray(property.images) && property.images.length > 0 
                  ? property.images 
                  : [FALLBACK_PROPERTY_IMAGE];
                const primaryImg = imagesList[0];
                const typeLabel = accommodationTypeLabels[property.accommodationType] || 'سكن طلابي';

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                  >
                    {/* Top Aspect-Ratio Image with Overlays */}
                    <div 
                      onClick={() => openGallery(property, 0)}
                      className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-100 overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={primaryImg}
                        alt={property.title}
                        onError={handlePropertyImageError}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Status Badge overlay (top right) */}
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold shadow-xs backdrop-blur-md ${cfg.bg} ${cfg.text} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Photos count pill (top left) */}
                      {imagesList.length > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <Images className="w-3 h-3" />
                          <span>{imagesList.length}</span>
                        </span>
                      )}

                      {/* Bottom Bar on Image: Price & Beds */}
                      <div className="absolute bottom-2.5 inset-x-2.5 flex items-end justify-between text-white pointer-events-none">
                        <div>
                          <div className="text-base sm:text-lg font-black tracking-tight drop-shadow-md">
                            {Number(property.monthlyPrice).toLocaleString('ar-EG')} <span className="text-[11px] font-normal opacity-90">ج.م / شهر</span>
                          </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                          <Users className="w-3 h-3 text-teal-700" />
                          <span>{property.availableBeds || property.totalBeds || 1} سرير متاح</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 space-y-3">
                      {/* Title & Location */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-sakanly-dark line-clamp-1">
                            {property.title}
                          </h4>
                          <span className="text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{property.city} • {property.district}</span>
                        </div>
                      </div>

                      {/* Rejection Alert if applicable */}
                      {statusKey === 'rejected' && property.rejectionReason && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-1.5 leading-snug">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">سبب الرفض: </span>
                            <span>{property.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Touch-Friendly Actions Grid */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 min-[420px]:grid-cols-4 gap-2">
                        <Link
                          to={`/property/${property.id}`}
                          target="_blank"
                          className="min-h-[38px] px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>معاينة</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => onEditProperty && onEditProperty(property)}
                          className="min-h-[38px] px-2 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                          <span>تعديل</span>
                        </button>

                        {/* Pause / Publish Toggle */}
                        {statusKey === 'rejected' ? (
                          <button
                            type="button"
                            onClick={() => handleActionClick('publish', property)}
                            className="min-h-[38px] px-2 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>إعادة تقديم</span>
                          </button>
                        ) : statusKey === 'pending' || statusKey === 'pending_review' ? (
                          <div className="min-h-[38px] px-2 py-1.5 bg-amber-50/60 border border-amber-200/60 text-amber-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>قيد المراجعة</span>
                          </div>
                        ) : statusKey === 'paused' || statusKey === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => handleActionClick('publish', property)}
                            className="min-h-[38px] px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                          >
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{statusKey === 'draft' ? 'نشر' : 'تفعيل'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActionClick('pause', property)}
                            className="min-h-[38px] px-2 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                          >
                            <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>إيقاف</span>
                          </button>
                        )}

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleActionClick('delete', property)}
                          className="min-h-[38px] px-2 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 active:scale-[0.98]"
                          title="حذف العقار"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Full Image Gallery Modal */}
      {galleryModal.isOpen && galleryModal.property && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-modal border border-slate-800 space-y-4 animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1">
                  معرض صور: {galleryModal.property.title}
                </h3>
                <span className="text-[11px] text-slate-400">
                  صورة {galleryModal.activeIndex + 1} من {galleryModal.property.images?.length || 1}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setGalleryModal({ isOpen: false, property: null, activeIndex: 0 })}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="إغلاق المعرض"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Active Image Display */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={galleryModal.property.images?.[galleryModal.activeIndex] || galleryModal.property.images?.[0]}
                alt={`صورة ${galleryModal.activeIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Prev / Next controls if multiple images */}
              {(galleryModal.property.images?.length || 0) > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const len = galleryModal.property.images.length;
                      setGalleryModal(prev => ({
                        ...prev,
                        activeIndex: (prev.activeIndex - 1 + len) % len,
                      }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const len = galleryModal.property.images.length;
                      setGalleryModal(prev => ({
                        ...prev,
                        activeIndex: (prev.activeIndex + 1) % len,
                      }));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {Array.isArray(galleryModal.property.images) && galleryModal.property.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {galleryModal.property.images.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setGalleryModal(prev => ({ ...prev, activeIndex: idx }))}
                    className={`relative rounded-xl overflow-hidden shrink-0 w-20 h-14 border-2 transition-all ${
                      galleryModal.activeIndex === idx
                        ? 'border-sakanly-primary ring-2 ring-sakanly-primary/30'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`مصغرة ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Verification Required Modal */}
      {verificationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-modal border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-sakanly-dark">
                  {owner?.verificationStatus === 'pending_review'
                    ? 'طلب التوثيق قيد المراجعة الإدارية'
                    : owner?.verificationStatus === 'rejected'
                    ? 'تم رفض طلب توثيق المالك'
                    : 'توثيق الحساب مطلوب لنشر العقارات'}
                </h3>
                <span className="text-[11px] text-amber-700 font-medium">إجراء أمني إلزامي لحماية الطلاب</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed space-y-2">
              {owner?.verificationStatus === 'pending_review' ? (
                <p>
                  طلب التوثيق الخاص بحسابك قيد التدقيق والمراجعة من قبل الإدارة. سيتم إخطارك وتفعيل إمكانية نشر العقارات فور مراجعة واعتماد مستندات الهوية وعقود الملكية.
                </p>
              ) : owner?.verificationStatus === 'rejected' ? (
                <div>
                  <p className="font-bold text-rose-800 mb-1">سبب الرفض المسجل من إدارة سكنلي:</p>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-rose-200">
                    {owner?.rejectionReason || 'المستندات غير واضحة أو ناقصة. يرجى إعادة رفع الهوية وسند الملكية.'}
                  </p>
                </div>
              ) : (
                <p>
                  وفقاً لسياسة منصة <strong>سكنلي</strong>، لا يمكن نشر أي عقار ليظهر للطلاب في نتائج البحث إلا بعد توثيق هوية المالك وسند ملكية العقار واعتماد الحساب من جهة المراجعة. تم حفظ عقارك كمسودة خاصة بأمان.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setVerificationModal({ isOpen: false, property: null })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationModal({ isOpen: false, property: null });
                  if (onNavigateVerification) {
                    onNavigateVerification();
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-sakanly-primary hover:bg-sakanly-primary-hover rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>
                  {owner?.verificationStatus === 'rejected'
                    ? 'إعادة تقديم الطلب'
                    : owner?.verificationStatus === 'pending_review'
                    ? 'متابعة حالة التوثيق'
                    : 'استكمال التوثيق الآن'}
                </span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Confirmation Dialog for Delete or Pause/Publish */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmDialog.action === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-sakanly-dark">
                  {confirmDialog.title}
                </h3>
                <span className="text-[11px] text-slate-400">إجراء أمني يتطلب التأكيد</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, action: null, property: null, title: '', message: '' })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                  confirmDialog.action === 'delete'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-sakanly-primary hover:bg-sakanly-primary-hover'
                }`}
              >
                تأكيد ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
