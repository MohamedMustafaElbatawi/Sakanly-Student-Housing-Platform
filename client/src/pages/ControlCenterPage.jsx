import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  FileCheck2,
  ShieldCheck,
  Flag,
  CalendarClock,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Bell,
  Activity,
  Settings,
  ShieldAlert,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Clock,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Sliders,
  Send,
  Radio,
  ArrowRight,
  Info,
  CheckCheck,
  FileText,
  File,
  ScanFace,
  CreditCard,
  Smartphone,
  Loader2,
  MapPin,
  DollarSign,
  Video,
  Bed,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import { adminApi } from '../services/adminApi.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

// ─── Formatters & Style Constants ─────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const statusColors = {
  verified: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending_review: 'bg-amber-50 text-amber-800 border-amber-200',
  needs_correction: 'bg-orange-50 text-orange-900 border-orange-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  not_started: 'bg-slate-50 text-slate-700 border-slate-200',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  paused: 'bg-amber-50 text-amber-800 border-amber-200',
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  pending_owner_confirmation: 'bg-amber-50 text-amber-800 border-amber-200',
  pending_admin_review: 'bg-rose-50 text-rose-800 border-rose-200',
  action_taken: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  dismissed: 'bg-slate-50 text-slate-600 border-slate-200',
};

const statusLabels = {
  verified: 'معتمد وموثق',
  pending_review: 'قيد المراجعة الإدارية',
  needs_correction: 'مطلوب تعديل الإعلان',
  rejected: 'مرفوض',
  not_started: 'غير مبدوء',
  not_applicable: 'طالب',
  active: 'نشط ومعروض',
  paused: 'موقوف مؤقتاً',
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  pending_owner_confirmation: 'بانتظار موافقة المالك',
  pending_admin_review: 'بانتظار قرار الإدارة',
  action_taken: 'تم اتخاذ إجراء',
  dismissed: 'تم التجاهل/مغلق',
};

const accommodationLabels = {
  private_room: 'غرفة خاصة مستقلة',
  shared_room: 'غرفة مشتركة',
  entire_apartment: 'شقة كاملة مستقلة',
  individual_bed: 'سرير فردي في غرفة',
};

// ─── Reusable UI Atoms ────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'teal', onClick }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-[#0F766E] border-teal-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex items-start gap-4 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#0F766E]/40' : ''
      }`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${colorMap[color] || colorMap.teal}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-bold">{label}</p>
        <p className="text-2xl font-black text-[#1E293B] mt-1">{value ?? '0'}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

const LoadingState = ({ text = 'جارٍ جلب البيانات الحقيقية من الخادم...' }) => (
  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
    <div className="w-8 h-8 border-3 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-bold text-slate-600">{text}</p>
  </div>
);

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 text-center">
    <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center border border-slate-100">
      <Icon className="w-6 h-6 text-slate-300" />
    </div>
    <p className="font-bold text-slate-700 text-sm">{title}</p>
    {subtitle && <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{subtitle}</p>}
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <div
    role="status"
    className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-bold animate-fade-in border ${
      type === 'success'
        ? 'bg-emerald-600 text-white border-emerald-500'
        : 'bg-rose-600 text-white border-rose-500'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
    <span>{message}</span>
    <button onClick={onClose} className="text-white/80 hover:text-white mr-2 text-xs font-bold">✕</button>
  </div>
);

// ─── TAB 1: OVERVIEW (الرئيسية) ────────────────────────────────────────────────
const TabOverview = ({ stats, onTabChange }) => {
  if (!stats) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1E293B]">مركز قيادة ومؤشرات منصة سكنلي</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            نظرة شاملة ولحظية على نمو المستخدمين والوحدات السكنية والأنشطة التشغيلية
          </p>
        </div>
        <span className="text-[11px] font-mono bg-teal-50 text-[#0F766E] border border-teal-200 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
          تحديث مباشر: {new Date().toLocaleTimeString('ar-EG')}
        </span>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="إجمالي المستخدمين"
          value={stats.users?.total}
          sub={`${stats.users?.students} طلاب • ${stats.users?.owners} ملاك`}
          color="teal"
          onClick={() => onTabChange('users')}
        />
        <StatCard
          icon={Building2}
          label="إجمالي العقارات"
          value={stats.listings?.total}
          sub={`${stats.listings?.active} نشط ومتاح • ${stats.listings?.pending} قيد المراجعة`}
          color="emerald"
          onClick={() => onTabChange('listings')}
        />
        <StatCard
          icon={ShieldCheck}
          label="طلبات توثيق الملاك"
          value={stats.verification?.pending}
          sub={`${stats.verification?.verified} موثق • ${stats.verification?.rejected} مرفوض`}
          color="amber"
          onClick={() => onTabChange('verification')}
        />
        <StatCard
          icon={Flag}
          label="بلاغات مفتوحة"
          value={stats.reports?.pending}
          sub={`${stats.reports?.total} إجمالي البلاغات المسجلة`}
          color="red"
          onClick={() => onTabChange('reports')}
        />
      </div>

      {/* Quick Visual Growth & Activity Indicator */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F766E]" />
              <span>معدل نمو المنصة والنشاط الأسبوعي</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">مقارنة نمو الحسابات ونشر الوحدات السكنية</p>
          </div>
          <button
            onClick={() => onTabChange('analytics')}
            className="text-xs font-bold text-[#0F766E] hover:underline"
          >
            فتح التحليلات المتقدمة ←
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">حسابات الطلاب</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stats.users?.students ?? 0}</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              +14% هذا الشهر
            </span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">ملاك العقارات</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stats.users?.owners ?? 0}</p>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
              {stats.verification?.verified ?? 0} موثق رسمياً
            </span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">طلبات المعاينة</p>
            <p className="text-xl font-black text-slate-800 mt-1">{stats.inquiries?.total ?? 0}</p>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
              {stats.inquiries?.accepted ?? 0} موعد مقبول
            </span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-500">الحسابات المعلقة</p>
            <p className="text-xl font-black text-rose-700 mt-1">{stats.users?.suspended ?? 0}</p>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full inline-block mt-1">
              إجراءات انضباطية
            </span>
          </div>
        </div>
      </div>

      {/* Breakdowns & Intervention Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Verification Queue Preview */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#1E293B] mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              <span>طابور توثيق الملاك</span>
            </span>
            <button
              onClick={() => onTabChange('verification')}
              className="text-xs text-[#0F766E] font-bold hover:underline"
            >
              فحص ({stats.verification?.pending ?? 0})
            </button>
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-amber-900 font-bold">بانتظار المراجعة والاعتماد:</span>
              <span className="font-black text-amber-950 text-sm">{stats.verification?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50">
              <span className="text-slate-600">ملاك معتمدون وموثقون:</span>
              <span className="font-bold text-emerald-700">{stats.verification?.verified ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50">
              <span className="text-slate-600">طلبات مرفوضة ومستبعدة:</span>
              <span className="font-bold text-rose-700">{stats.verification?.rejected ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Listings Moderation Status */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#1E293B] mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0F766E]" />
              <span>مراجعة ونشر العقارات</span>
            </span>
            <button
              onClick={() => onTabChange('moderation')}
              className="text-xs text-[#0F766E] font-bold hover:underline"
            >
              طابور المراجعة
            </button>
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50">
              <span className="text-slate-600">عقارات معتمدة ونشطة:</span>
              <span className="font-bold text-emerald-700">{stats.listings?.active ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-amber-900 font-bold">إعلانات بانتظار الاعتماد:</span>
              <span className="font-black text-amber-950 text-sm">{stats.listings?.pending ?? 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-50">
              <span className="text-slate-600">إعلانات موقوفة مؤقتاً:</span>
              <span className="font-bold text-slate-700">{stats.listings?.paused ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Urgent Interventions & Safety */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1E293B] mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>الأمان والتدخلات العاجلة</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="text-rose-900 font-bold">بلاغات مستخدمين مفتوحة:</span>
                <span className="font-black text-rose-700 text-sm">{stats.reports?.pending ?? 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl">
                <span className="text-slate-600">حسابات مقيدة أو معلقة:</span>
                <span className="font-bold text-slate-800">{stats.users?.suspended ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onTabChange('reports')}
              className="text-rose-700 font-bold hover:underline"
            >
              معالجة البلاغات ←
            </button>
            <button
              onClick={() => onTabChange('security')}
              className="text-slate-500 font-bold hover:underline"
            >
              سجل الأمان
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 2: USERS MANAGEMENT (المستخدمون) ─────────────────────────────────────
const TabUsers = ({ token, showToast, refreshStats }) => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [inspectUser, setInspectUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await adminApi.getUsers(token, params);
      setUsers(res.data?.users || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, search, roleFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleSuspendConfirm = async () => {
    if (!suspendModal) return;
    setProcessingId(suspendModal.id);
    try {
      await adminApi.suspendUser(token, suspendModal.id, suspendReason.trim());
      showToast(`تم تعليق حساب ${suspendModal.fullName} بنجاح.`);
      setSuspendModal(null);
      setSuspendReason('');
      fetchUsers();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnsuspend = async (user) => {
    setProcessingId(user.id);
    try {
      await adminApi.unsuspendUser(token, user.id);
      showToast(`تم رفع التعليق وإعادة تفعيل حساب ${user.fullName}.`);
      fetchUsers();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">إدارة حسابات المستخدمين والطلاب</h2>
          <p className="text-xs text-slate-500 mt-0.5">البحث، فلترة الأدوار، ومتابعة النشاط وتعليق الحسابات المخالفة</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو البريد..."
              className="pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-xs w-48 sm:w-56 outline-none focus:border-[#0F766E] transition-all bg-white"
            />
          </div>

          {['', 'student', 'owner'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                roleFilter === r
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {r === '' ? 'الجميع' : r === 'student' ? 'الطلاب' : 'الملاك'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب حسابات المستخدمين..." />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="لا توجد نتائج مطابقة" subtitle="جرب تعديل كلمة البحث أو فلتر الدور." />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">المستخدم</th>
                  <th className="p-3.5 font-bold">نوع الحساب</th>
                  <th className="p-3.5 font-bold">حالة التوثيق</th>
                  <th className="p-3.5 font-bold">تاريخ التسجيل</th>
                  <th className="p-3.5 font-bold">حالة الحساب</th>
                  <th className="p-3.5 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.fullName?.charAt(0) || '؟'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.role === 'owner' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u.role === 'owner' ? 'مالك عقار' : 'طالب جامعي'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          statusColors[u.verificationStatus] || 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {statusLabels[u.verificationStatus] || u.verificationStatus || '—'}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="p-3.5">
                      {u.suspended ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                          معلق إدارياً
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          نشط وطبيعي
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectUser(u)}
                          className="p-1.5 text-slate-500 hover:text-[#0F766E] border border-slate-200 hover:border-[#0F766E] rounded-lg bg-white"
                          title="عرض تفاصيل الحساب"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {u.suspended ? (
                          <button
                            onClick={() => handleUnsuspend(u)}
                            disabled={processingId === u.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>تفعيل</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendModal(u);
                              setSuspendReason('');
                            }}
                            disabled={processingId === u.id}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Ban className="w-3 h-3" />
                            <span>تعليق</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect User Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-[#1E293B]">تفاصيل الحساب</h3>
              <button onClick={() => setInspectUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">الاسم الكامل:</span>
                <span className="font-bold text-slate-800">{inspectUser.fullName}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">البريد الإلكتروني:</span>
                <span className="font-mono text-slate-800">{inspectUser.email}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">رقم الهاتف:</span>
                <span className="font-mono text-slate-800">{inspectUser.phone || 'غير مسجل'}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">نوع الحساب:</span>
                <span className="font-bold text-slate-800">{inspectUser.role === 'owner' ? 'مالك عقار' : 'طالب'}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">حالة التوثيق:</span>
                <span className="font-bold text-slate-800">{statusLabels[inspectUser.verificationStatus] || inspectUser.verificationStatus}</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-xl">
                <span className="text-slate-500">تاريخ التسجيل:</span>
                <span className="font-mono text-slate-800">{formatDate(inspectUser.createdAt)}</span>
              </div>
              {inspectUser.suspended && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <p className="font-bold">الحساب معلق إدارياً</p>
                  {inspectUser.suspendReason && <p className="mt-1">السبب: {inspectUser.suspendReason}</p>}
                </div>
              )}
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectUser(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-rose-600">
              <Ban className="w-5 h-5 shrink-0" />
              <span>تأكيد تعليق حساب: {suspendModal.fullName}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              عند تعليق الحساب سيتم منع المستخدم من تسجيل الدخول أو نشر عقارات جديدة:
            </p>
            <textarea
              rows={3}
              placeholder="اكتب سبب التعليق هنا..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSuspendModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSuspendConfirm}
                disabled={processingId === suspendModal.id}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                تأكيد تعليق الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 3: OWNERS MANAGEMENT (الملاك) ─────────────────────────────────────────
const TabOwners = ({ token, showToast, refreshStats }) => {
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVerification, setFilterVerification] = useState('all');

  const fetchOwners = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterVerification !== 'all') params.verificationStatus = filterVerification;
      const res = await adminApi.getOwners(token, params);
      setOwners(res.data?.owners || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, search, filterVerification, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchOwners, 300);
    return () => clearTimeout(timer);
  }, [fetchOwners]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">سجل ومؤشرات أداء ملاك العقارات</h2>
          <p className="text-xs text-slate-500 mt-0.5">متابعة وحدات كل مالك، حالة التوثيق، ومعدل استجابته لطلبات المعاينة</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المالك أو هاتفه..."
              className="pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-xs w-48 sm:w-56 outline-none focus:border-[#0F766E] transition-all bg-white"
            />
          </div>

          {['all', 'verified', 'pending_review', 'not_started'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterVerification(statusKey)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                filterVerification === statusKey
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {statusKey === 'all'
                ? 'الكل'
                : statusKey === 'verified'
                ? 'المعتمدون'
                : statusKey === 'pending_review'
                ? 'قيد الفحص'
                : 'غير موثقين'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب مؤشرات الملاك..." />
      ) : owners.length === 0 ? (
        <EmptyState icon={UserCheck} title="لا يوجد ملاك مطابقون" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {owners.map((owner) => (
            <div key={owner.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                    {owner.fullName?.charAt(0) || 'م'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{owner.fullName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{owner.email}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{owner.phone || 'هاتف غير مسجل'}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    statusColors[owner.verificationStatus] || 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {statusLabels[owner.verificationStatus] || owner.verificationStatus}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400">العقارات</p>
                  <p className="font-bold text-xs text-slate-800 mt-0.5">{owner.listingsCount ?? 0}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400">النشطة</p>
                  <p className="font-bold text-xs text-emerald-700 mt-0.5">{owner.activeListingsCount ?? 0}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <p className="text-[10px] text-slate-400">الاستجابة</p>
                  <p className="font-bold text-xs text-[#0F766E] mt-0.5">{owner.responseRate || '100%'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>تاريخ التسجيل: {formatDate(owner.createdAt)}</span>
                {owner.suspended && (
                  <span className="text-rose-600 font-bold">الحساب معلق</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── INSPECT LISTING MODAL (فحص تفاصيل الإعلان المتكامل) ──────────────────────────
const InspectListingModal = ({
  listing,
  onClose,
  onApprove,
  onReject,
  onRequestCorrection,
  processingId,
}) => {
  if (!listing) return null;

  // Extract all media: images array and media array
  const mediaList = [];
  if (Array.isArray(listing.media) && listing.media.length > 0) {
    listing.media.forEach((m) => {
      if (typeof m === 'string') {
        mediaList.push({ type: 'image', url: m });
      } else if (m && (m.url || m.secure_url)) {
        const isVid =
          m.resource_type === 'video' ||
          (m.secure_url || m.url).toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
        mediaList.push({
          type: isVid ? 'video' : 'image',
          url: m.secure_url || m.url,
        });
      }
    });
  }
  if (Array.isArray(listing.images)) {
    listing.images.forEach((imgUrl) => {
      if (!mediaList.some((m) => m.url === imgUrl)) {
        mediaList.push({ type: 'image', url: imgUrl });
      }
    });
  }
  if (listing.video || listing.videoUrl) {
    const vUrl = listing.video || listing.videoUrl;
    if (!mediaList.some((m) => m.url === vUrl)) {
      mediaList.unshift({ type: 'video', url: vUrl });
    }
  }

  const [activeIdx, setActiveIdx] = useState(0);
  const currentMedia = mediaList[activeIdx] || (listing.images?.[0] ? { type: 'image', url: listing.images[0] } : null);

  const priceVal = listing.monthlyPrice || listing.price || 0;
  const depositVal = listing.deposit || 0;
  const utilitiesVal = listing.utilitiesCost || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[listing.status] || 'bg-slate-100 text-slate-700'}`}>
                {statusLabels[listing.status] || listing.status}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                المعرّف: {listing.id}
              </span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#1E293B] mt-1 truncate">
              {listing.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/property/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-500 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1 transition-all"
              title="معاينة في صفحة العقار"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">معاينة الطالب</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Media Player / Carousel */}
          <div className="space-y-3">
            <div className="w-full h-64 sm:h-80 rounded-2xl bg-slate-900 overflow-hidden flex items-center justify-center relative border border-slate-200">
              {currentMedia ? (
                currentMedia.type === 'video' ? (
                  <video
                    src={currentMedia.url}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={currentMedia.url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Building2 className="w-12 h-12 stroke-[1.5]" />
                  <p className="text-xs">لا توجد صور أو وسائط مرفوعة</p>
                </div>
              )}

              {mediaList.length > 0 && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                  {currentMedia?.type === 'video' ? <Video className="w-3 h-3 text-amber-400" /> : <ImageIcon className="w-3 h-3 text-teal-400" />}
                  <span>{activeIdx + 1} من {mediaList.length}</span>
                </div>
              )}
            </div>

            {/* Media Thumbnails */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {mediaList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      activeIdx === idx
                        ? 'border-[#0F766E] ring-2 ring-[#0F766E]/20 scale-102'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {m.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                        <Video className="w-5 h-5 text-amber-400" />
                      </div>
                    ) : (
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[8px] font-mono px-1 rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-bold block">الإيجار الشهري</span>
              <span className="text-base sm:text-lg font-black text-[#0F766E] mt-0.5 block">
                {priceVal.toLocaleString('ar-EG')} ج.م
              </span>
              <span className="text-[10px] text-slate-400">شهرياً للمستأجر</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-bold block">التأمين والمرافق</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">
                تأمين: {depositVal.toLocaleString('ar-EG')} ج.م
              </span>
              <span className="text-[10px] text-slate-500">
                مرافق: {utilitiesVal > 0 ? `${utilitiesVal.toLocaleString('ar-EG')} ج.م` : 'مشمولة'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-bold block">المساحة والغرف</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">
                {listing.bedrooms || 1} غرف • {listing.bathrooms || 1} حمام
              </span>
              <span className="text-[10px] text-slate-500">
                المساحة: {listing.area ? `${listing.area} م²` : 'غير محددة'}
              </span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[11px] text-slate-400 font-bold block">الأسرة ونوع السكن</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block">
                {listing.availableBeds || 1} من {listing.totalBeds || 1} سرير متاح
              </span>
              <span className="text-[10px] text-slate-500 truncate block">
                {accommodationLabels[listing.accommodationType] || listing.accommodationType || 'سكن طلاب'}
              </span>
            </div>
          </div>

          {/* Specifications, Location, and Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location & Address */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                <MapPin className="w-4 h-4 text-[#0F766E]" />
                <span>الموقع والعنوان التفصيلي</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold">المحافظة والمدينة: </span>
                {listing.governorate ? `${listing.governorate} — ` : ''}{listing.city} {listing.district ? `(${listing.district})` : ''}
              </p>
              {listing.address && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">العنوان: </span>
                  {listing.address}
                </p>
              )}
              {Array.isArray(listing.nearbyUniversities) && listing.nearbyUniversities.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 block">الجامعات القريبة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.nearbyUniversities.map((u, i) => (
                      <span key={i} className="text-[11px] bg-teal-50 text-teal-800 border border-teal-100 px-2 py-0.5 rounded-lg">
                        {u.name} {u.distance ? `• ${u.distance}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preferences & Accommodation Specs */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">
                <Bed className="w-4 h-4 text-[#0F766E]" />
                <span>المواصفات وتفضيلات السكن</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">تفضيل الجنس</span>
                  <span className="font-bold">
                    {listing.genderPreference === 'female' ? 'طالبات فقط (بنات)' : listing.genderPreference === 'male' ? 'طلاب فقط (شباب)' : 'متاح للجميع'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">حالة الفرش</span>
                  <span className="font-bold">
                    {listing.isFurnished ? 'مفروش بالكامل' : 'غير مفروش'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">تاريخ الإرسال</span>
                  <span className="font-bold text-[11px]">
                    {formatDate(listing.submittedAt || listing.createdAt)}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">توثيق العقار</span>
                  <span className={`font-bold text-[11px] ${listing.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {listing.isVerified ? 'معتمد وموثق' : 'بانتظار الاعتماد'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-700">الوصف الكامل للإعلان</h5>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700">المرافق والخدمات المتوفرة ({listing.amenities.length}):</h5>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((item, i) => (
                  <span key={i} className="text-xs bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1 rounded-xl flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner Details Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0B3D3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {listing.owner?.name ? listing.owner.name.substring(0, 2) : 'مالك'}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1E293B]">
                  المالك: {listing.owner?.name || 'غير محدد'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  الهاتف: {listing.owner?.phone || 'بدون هاتف'} {listing.owner?.email ? `• ${listing.owner.email}` : ''}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  معرّف المالك: {listing.owner?.id || '—'}
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              listing.owner?.isVerified ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {listing.owner?.isVerified ? 'حساب المالك موثق' : 'حساب المالك قيد المراجعة'}
            </span>
          </div>

          {/* Previous Rejection or Correction Reason Banner if present */}
          {listing.rejectionReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                سبب الرفض المسجل سابقاً:
              </span>
              <p className="pr-5 text-[11px] leading-relaxed">{listing.rejectionReason}</p>
            </div>
          )}
          {listing.correctionReason && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-xs text-orange-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                ملاحظات التعديل المطلوبة:
              </span>
              <p className="pr-5 text-[11px] leading-relaxed">{listing.correctionReason}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {listing.status !== 'rejected' && onReject && (
              <button
                onClick={() => onReject(listing)}
                disabled={processingId === listing.id}
                className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>رفض الإعلان</span>
              </button>
            )}

            {listing.status !== 'needs_correction' && onRequestCorrection && (
              <button
                onClick={() => onRequestCorrection(listing)}
                disabled={processingId === listing.id}
                className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Edit3 className="w-4 h-4" />
                <span>طلب تعديل</span>
              </button>
            )}

            {listing.status !== 'active' && onApprove && (
              <button
                onClick={() => onApprove(listing)}
                disabled={processingId === listing.id}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>موافقة ونشر الإعلان</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 4: PROPERTIES / LISTINGS (العقارات) ──────────────────────────────────
const TabListings = ({ token, showToast, refreshStats }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionModal, setCorrectionModal] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getListings(token, params);
      setListings(res.data?.listings || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, search, statusFilter, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, 300);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const handleStatusChange = async (listingId, newStatus, title) => {
    setProcessingId(listingId);
    try {
      await adminApi.updateListingStatus(token, listingId, newStatus);
      showToast(`تم تغيير حالة إعلان "${title}" بنجاح إلى: ${statusLabels[newStatus] || newStatus}`);
      fetchListings();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprove = async (item) => {
    setProcessingId(item.id);
    try {
      await adminApi.updateListingStatus(token, item.id, 'active');
      showToast(`تمت الموافقة ونشر إعلان "${item.title}" بنجاح.`);
      setInspectItem(null);
      fetchListings();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim() || !rejectModal) return;
    setProcessingId(rejectModal.id);
    try {
      await adminApi.updateListingStatus(token, rejectModal.id, 'rejected', rejectionReason.trim());
      showToast(`تم رفض الإعلان وإخطار المالك بنجاح.`);
      setRejectModal(null);
      setRejectionReason('');
      setInspectItem(null);
      fetchListings();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCorrectionConfirm = async () => {
    if (!correctionReason.trim() || !correctionModal) return;
    setProcessingId(correctionModal.id);
    try {
      await adminApi.updateListingStatus(token, correctionModal.id, 'needs_correction', '', correctionReason.trim());
      showToast(`تم إرسال طلب التعديل للمالك بنجاح.`);
      setCorrectionModal(null);
      setCorrectionReason('');
      setInspectItem(null);
      fetchListings();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">دليل الوحدات السكنية والإعلانات</h2>
          <p className="text-xs text-slate-500 mt-0.5">الإجمالي: {total} إعلان مسجل في المنصة</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالعنوان أو المدينة..."
              className="pr-8 pl-3 py-2 border border-slate-200 rounded-xl text-xs w-48 sm:w-56 outline-none focus:border-[#0F766E] transition-all bg-white"
            />
          </div>

          {['', 'active', 'paused', 'pending_review', 'needs_correction', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === s
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {s === '' ? 'الكل' : s === 'active' ? 'النشطة' : s === 'paused' ? 'الموقوفة' : s === 'pending_review' ? 'قيد المراجعة' : s === 'needs_correction' ? 'مطلوب تعديل' : 'المرفوضة'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب العقارات..." />
      ) : listings.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد عقارات مطابقة" />
      ) : (
        <div className="space-y-3">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 min-w-0">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-100 ring-1 ring-slate-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-xs sm:text-sm text-[#1E293B] truncate max-w-md">{item.title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        statusColors[item.status] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {statusLabels[item.status] || item.status || 'غير محدد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {item.city}، {item.district || item.governorate} • {(item.monthlyPrice || item.price)?.toLocaleString('ar-EG')} ج.م / شهرياً
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    المالك: {item.owner?.name || '—'} {item.owner?.phone ? `(${item.owner.phone})` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                <button
                  onClick={() => navigate(`/control-center/listings/review/${item.id}`)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0F766E] border border-teal-200 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>فحص الإعلان</span>
                </button>

                {item.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'active', item.title)}
                    disabled={processingId === item.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تفعيل</span>
                  </button>
                )}

                {item.status !== 'paused' && (
                  <button
                    onClick={() => handleStatusChange(item.id, 'paused', item.title)}
                    disabled={processingId === item.id}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>إيقاف مؤقت</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Listing Modal */}
      {inspectItem && (
        <InspectListingModal
          listing={inspectItem}
          onClose={() => setInspectItem(null)}
          onApprove={handleApprove}
          onReject={(item) => {
            setRejectModal(item);
            setRejectionReason('');
          }}
          onRequestCorrection={(item) => {
            setCorrectionModal(item);
            setCorrectionReason('');
          }}
          processingId={processingId}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>رفض إعلان: {rejectModal.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى كتابة سبب رفض الإعلان لتسجيله في سجل التدقيق وإشعار المالك به:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: صور غير واضحة، تفاصيل الموقع غير مكتملة، أو السعر غير مطابق للوصف..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || processingId === rejectModal.id}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-orange-600">
              <Edit3 className="w-5 h-5 shrink-0" />
              <span>طلب تعديل إعلان: {correctionModal.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى توضيح التعديلات أو النواقص المطلوبة من المالك لإعادة إرسال الإعلان:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: يرجى رفع صور أوضح للغرفة من الداخل، وإرفاق تكلفة استهلاك المرافق بدقة..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCorrectionModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCorrectionConfirm}
                disabled={!correctionReason.trim() || processingId === correctionModal.id}
                className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                إرسال طلب التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 5: MODERATION (مراجعة الإعلانات) ──────────────────────────────────────
const TabModeration = ({ token, showToast, refreshStats }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('pending_review'); // 'pending_review' | 'needs_correction' | 'paused' | 'all'
  const [processingId, setProcessingId] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionModal, setCorrectionModal] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');

  const fetchModerationQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 100 };
      if (filterTab !== 'all') {
        params.status = filterTab;
      } else {
        params.status = 'all';
      }
      const res = await adminApi.getListings(token, params);
      const all = res.data?.listings || [];

      if (filterTab === 'all') {
        // Show all pending review, needs correction, paused, or unverified
        setListings(all.filter((l) => l.status === 'pending_review' || l.status === 'needs_correction' || l.status === 'paused' || !l.isVerified));
      } else {
        setListings(all.filter((l) => l.status === filterTab));
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, filterTab, showToast]);

  useEffect(() => {
    fetchModerationQueue();
  }, [fetchModerationQueue]);

  const handleApprove = async (item) => {
    setProcessingId(item.id);
    try {
      await adminApi.updateListingStatus(token, item.id, 'active');
      showToast(`تمت الموافقة ونشر إعلان "${item.title}" بنجاح.`);
      setInspectItem(null);
      fetchModerationQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim() || !rejectModal) return;
    setProcessingId(rejectModal.id);
    try {
      await adminApi.updateListingStatus(token, rejectModal.id, 'rejected', rejectionReason.trim());
      showToast(`تم رفض الإعلان وتوثيق سبب الرفض وإخطار المالك بنجاح.`);
      setRejectModal(null);
      setRejectionReason('');
      setInspectItem(null);
      fetchModerationQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCorrectionConfirm = async () => {
    if (!correctionReason.trim() || !correctionModal) return;
    setProcessingId(correctionModal.id);
    try {
      await adminApi.updateListingStatus(token, correctionModal.id, 'needs_correction', '', correctionReason.trim());
      showToast(`تم إرسال طلب استكمال وتعديل الإعلان للمالك بنجاح.`);
      setCorrectionModal(null);
      setCorrectionReason('');
      setInspectItem(null);
      fetchModerationQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filterTabs = [
    { id: 'pending_review', label: 'قيد المراجعة الإدارية' },
    { id: 'needs_correction', label: 'مطلوب تعديل' },
    { id: 'paused', label: 'موقوفة مؤقتاً' },
    { id: 'all', label: 'جميع المعلقات' },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">طابور فحص ومراجعة الإعلانات</h2>
          <p className="text-xs text-slate-500 mt-0.5">التأكد من دقة الصور والأسعار ومواصفات السكن قبل إتاحته للطلاب</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  filterTab === tab.id
                    ? 'bg-white text-[#0B3D3A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchModerationQueue}
            className="p-2 text-slate-500 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all shrink-0"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ فحص طابور المراجعة..." />
      ) : listings.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title={
            filterTab === 'pending_review'
              ? 'لا توجد إعلانات قيد المراجعة حالياً'
              : filterTab === 'needs_correction'
              ? 'لا توجد إعلانات بانتظار تعديل المالك'
              : 'طابور المراجعة فارغ'
          }
          subtitle="جميع الإعلانات المسجلة مفحوصة ومعتمدة حالياً."
        />
      ) : (
        <div className="space-y-4">
          {listings.map((item) => {
            const priceVal = item.monthlyPrice || item.price || 0;
            const imagesCount = item.images?.length || item.media?.length || 0;
            const submittedDate = formatDate(item.submittedAt || item.createdAt);
            const locationStr = [item.governorate, item.city, item.district || item.address].filter(Boolean).join('، ');

            return (
              <div key={item.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4 hover:border-slate-200 transition-all">
                {/* Header & Core Info Row */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Primary Image Thumbnail */}
                    <div
                      onClick={() => navigate(`/control-center/listings/review/${item.id}`)}
                      className="relative shrink-0 cursor-pointer group"
                      title="فحص الإعلان ومراجعته بالكامل"
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-20 h-20 rounded-2xl object-cover border border-slate-100 ring-1 ring-slate-100 group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                      {imagesCount > 0 && (
                        <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                          <ImageIcon className="w-2.5 h-2.5" />
                          <span>{imagesCount}</span>
                        </span>
                      )}
                    </div>

                    {/* Detailed Metadata (7 Requirements) */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* 1. اسم العقار */}
                        <h4
                          onClick={() => navigate(`/control-center/listings/review/${item.id}`)}
                          className="font-bold text-sm sm:text-base text-[#1E293B] hover:text-[#0F766E] cursor-pointer transition-colors"
                          title="فحص الإعلان ومراجعته بالكامل"
                        >
                          {item.title}
                        </h4>
                        {/* 7. حالة المراجعة */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[item.status] || 'bg-slate-100 text-slate-700'}`}>
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>

                      {/* 2. اسم المالك وبياناته */}
                      <p className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                        <span className="text-slate-400">المالك:</span>
                        <span className="font-bold text-slate-900">{item.owner?.name || 'غير محدد'}</span>
                        {item.owner?.phone && (
                          <span className="text-slate-500 font-mono text-[11px]">({item.owner.phone})</span>
                        )}
                        {item.owner?.isVerified && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded-md">موثق</span>
                        )}
                      </p>

                      {/* 3. السعر */}
                      <p className="text-xs text-[#0F766E] font-bold flex items-center gap-2 flex-wrap">
                        <span>{priceVal.toLocaleString('ar-EG')} ج.م / شهرياً</span>
                        {item.deposit > 0 && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            • التأمين: {item.deposit.toLocaleString('ar-EG')} ج.م
                          </span>
                        )}
                        {item.utilitiesCost > 0 && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            • المرافق: {item.utilitiesCost.toLocaleString('ar-EG')} ج.م
                          </span>
                        )}
                      </p>

                      {/* 4. الموقع */}
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{locationStr || 'الموقع غير محدد'}</span>
                      </p>

                      {/* 5. تاريخ الإرسال و 6. عدد الصور */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>تاريخ التقديم: {submittedDate}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-slate-400" />
                          <span>{imagesCount} صور مرفوعة</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-start flex-wrap">
                    {/* 6. زر فحص الإعلان */}
                    <button
                      onClick={() => navigate(`/control-center/listings/review/${item.id}`)}
                      className="px-3 py-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[#0F766E] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>فحص الإعلان</span>
                    </button>

                    <button
                      onClick={() => handleApprove(item)}
                      disabled={processingId === item.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>موافقة ونشر</span>
                    </button>

                    <button
                      onClick={() => {
                        setCorrectionModal(item);
                        setCorrectionReason('');
                      }}
                      disabled={processingId === item.id}
                      className="px-3 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>طلب تعديل</span>
                    </button>

                    <button
                      onClick={() => {
                        setRejectModal(item);
                        setRejectionReason('');
                      }}
                      disabled={processingId === item.id}
                      className="px-3 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>رفض</span>
                    </button>
                  </div>
                </div>

                {/* Description snippet */}
                {item.description && (
                  <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                    <span className="font-bold text-slate-700">الوصف المعلن: </span>
                    {item.description}
                  </div>
                )}

                {/* Nearby Universities */}
                {Array.isArray(item.nearbyUniversities) && item.nearbyUniversities.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap text-xs text-teal-800">
                    <span className="font-bold">الجامعات المحيطة:</span>
                    {item.nearbyUniversities.map((u, idx) => (
                      <span key={idx} className="bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100 text-[11px]">
                        {u.name} {u.distance ? `(${u.distance})` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Gallery preview row if multiple images */}
                {Array.isArray(item.images) && item.images.length > 1 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 overflow-x-auto py-1">
                      {item.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInspectItem(item)}
                          className="shrink-0 group relative cursor-pointer"
                        >
                          <img
                            src={imgUrl}
                            alt={`صورة ${idx + 1}`}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 group-hover:opacity-80 transition-opacity"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-[9px] text-white px-1 rounded font-mono">{idx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Listing Modal */}
      {inspectItem && (
        <InspectListingModal
          listing={inspectItem}
          onClose={() => setInspectItem(null)}
          onApprove={handleApprove}
          onReject={(item) => {
            setRejectModal(item);
            setRejectionReason('');
          }}
          onRequestCorrection={(item) => {
            setCorrectionModal(item);
            setCorrectionReason('');
          }}
          processingId={processingId}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>رفض إعلان: {rejectModal.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى كتابة سبب رفض الإعلان لتسجيله في سجل التدقيق وإخطار المالك به:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: صور غير واضحة، تفاصيل الموقع غير مكتملة، أو السعر غير مطابق للوصف..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || processingId === rejectModal.id}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-orange-600">
              <Edit3 className="w-5 h-5 shrink-0" />
              <span>طلب تعديل إعلان: {correctionModal.title}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى توضيح التعديلات أو النواقص المطلوبة من المالك لإعادة نشر الإعلان:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: يرجى رفع صور واضحة للحمام والمطبخ، وتوضيح تكلفة استهلاك الكهرباء والمياه..."
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCorrectionModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCorrectionConfirm}
                disabled={!correctionReason.trim() || processingId === correctionModal.id}
                className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                إرسال طلب التعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 6: VERIFICATION QUEUE (توثيق الملاك) ──────────────────────────────────
const TabVerification = ({ token, showToast, refreshStats }) => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctionModal, setCorrectionModal] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedIssueCheckboxes, setSelectedIssueCheckboxes] = useState([]);
  const [inspectModal, setInspectModal] = useState(null);
  const [inspectDocs, setInspectDocs] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getVerificationQueue(token, filterStatus);
      setOwners(res.data?.owners || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, filterStatus, showToast]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Navigate to dedicated Full Page Review experience
  const handleOpenInspect = (owner) => {
    if (!owner?.id) {
      showToast('معرف المالك غير صالح', 'error');
      return;
    }
    navigate(`/control-center/owner-verification/${owner.id}`);
  };

  // Keep modal fetcher available as fallback
  const handleOpenInspectModal = async (owner) => {
    if (!owner?.id) {
      showToast('معرف المالك غير صالح', 'error');
      return;
    }
    setInspectModal(owner);
    setInspectDocs(null);
    setInspectError('');
    setInspectLoading(true);
    try {
      const res = await adminApi.getOwnerVerificationDocs(token, owner.id);
      if (!res?.success || !res?.data) {
        throw new Error(res?.message || 'تعذر تحميل مستندات التوثيق من الخادم.');
      }
      setInspectDocs(res.data);
    } catch (err) {
      console.error('[Admin Inspect] Failed to fetch verification documents for owner ID:', owner.id);
      setInspectError(err.message || 'تعذر جلب مستندات التوثيق من الخادم.');
      showToast(err.message || 'تعذر جلب مستندات التوثيق', 'error');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleVerify = async (owner) => {
    setProcessingId(owner.id);
    try {
      await adminApi.verifyOwner(token, owner.id);
      showToast(`تم اعتماد وتوثيق هوية المالك ${owner.fullName} بنجاح.`);
      if (inspectModal?.id === owner.id) setInspectModal(null);
      fetchQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim() || !rejectModal) return;
    setProcessingId(rejectModal.id);
    try {
      await adminApi.rejectOwner(token, rejectModal.id, rejectionReason.trim());
      showToast(`تم رفض طلب توثيق ${rejectModal.fullName}.`);
      setRejectModal(null);
      setRejectionReason('');
      if (inspectModal?.id === rejectModal.id) setInspectModal(null);
      fetchQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCorrectionConfirm = async () => {
    if (!correctionModal) return;
    const combinedReason = [
      selectedIssueCheckboxes.length > 0 ? `الملاحظات: ${selectedIssueCheckboxes.join('، ')}` : '',
      correctionReason.trim(),
    ].filter(Boolean).join('\n');

    if (!combinedReason.trim()) {
      showToast('يرجى تحديد النواقص أو كتابة سبب طلب التعديل.', 'error');
      return;
    }

    setProcessingId(correctionModal.id);
    try {
      await adminApi.requestOwnerCorrection(token, correctionModal.id, combinedReason, selectedIssueCheckboxes);
      showToast(`تم إرسال طلب استكمال وتعديل المستندات لـ ${correctionModal.fullName}.`);
      setCorrectionModal(null);
      setCorrectionReason('');
      setSelectedIssueCheckboxes([]);
      if (inspectModal?.id === correctionModal.id) setInspectModal(null);
      fetchQueue();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleCorrectionCheckbox = (issue) => {
    setSelectedIssueCheckboxes((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  return (
    <div className="space-y-4 animate-fade-in font-cairo">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">مراجعة هويات وسندات ملكية الملاك (Verification Queue)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            تدقيق مستندات بطاقة الرقم القومي والسيلفي الحي وإثبات الملكية لضمان سلامة الطلاب ومصداقية المنصة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'pending_review', label: 'قيد المراجعة' },
            { key: 'needs_correction', label: 'مطلوب استكمال' },
            { key: 'verified', label: 'المعتمدون' },
            { key: 'rejected', label: 'المرفوضون' },
            { key: 'all', label: 'الكل' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilterStatus(item.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                filterStatus === item.key
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={fetchQueue}
            className="p-1.5 text-slate-500 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50"
            title="تحديث القائمة"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب طابور التوثيق..." />
      ) : owners.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="لا توجد طلبات توثيق في هذه الفئة"
          subtitle="ستظهر هنا طلبات ملاك العقارات الراغبين في اعتماد وتوثيق هوياتهم."
        />
      ) : (
        <div className="space-y-3">
          {owners.map((owner) => (
            <div
              key={owner.id}
              className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center font-bold text-base shrink-0 border border-teal-100">
                  {owner.fullName?.charAt(0) || 'م'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-[#1E293B] truncate">{owner.fullName}</h4>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        statusColors[owner.verificationStatus] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {statusLabels[owner.verificationStatus] || owner.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {owner.email} {owner.phone ? `• ${owner.phone}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    تاريخ التقديم: {formatDate(owner.submittedAt || owner.createdAt)}
                  </p>

                  {owner.needsCorrectionReason && (
                    <p className="text-xs text-orange-900 bg-orange-50 border border-orange-200 p-2.5 rounded-xl mt-2 leading-relaxed">
                      <strong>طلب التعديل المرسل:</strong> {owner.needsCorrectionReason}
                    </p>
                  )}

                  {owner.rejectionReason && (
                    <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl mt-2 leading-relaxed">
                      <strong>سبب الرفض المسجل:</strong> {owner.rejectionReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
                {/* 1. Inspect Documents Button */}
                <button
                  onClick={() => handleOpenInspect(owner)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>فحص المستندات</span>
                </button>

                {/* 2. Verify Button */}
                {owner.verificationStatus !== 'verified' && (
                  <button
                    onClick={() => handleVerify(owner)}
                    disabled={processingId === owner.id}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {processingId === owner.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>اعتماد الهوية</span>
                  </button>
                )}

                {/* 3. Request Correction Button */}
                {owner.verificationStatus !== 'verified' && (
                  <button
                    onClick={() => {
                      setCorrectionModal(owner);
                      setCorrectionReason(owner.needsCorrectionReason || '');
                      setSelectedIssueCheckboxes([]);
                    }}
                    disabled={processingId === owner.id}
                    className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-850 border border-orange-250 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                    <span>طلب استكمال</span>
                  </button>
                )}

                {/* 4. Reject Button */}
                {owner.verificationStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectModal(owner);
                      setRejectionReason(owner.rejectionReason || '');
                    }}
                    disabled={processingId === owner.id}
                    className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>رفض</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL 1: INSPECT DOCUMENTS MODAL ─────────────────────────────── */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1E293B]">
                    فحص ملف ومستندات توثيق المالك: {inspectModal.fullName}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {inspectModal.id} • {inspectModal.email}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setInspectModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectLoading ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#0F766E]" />
                <p className="text-sm font-bold text-slate-700">جارٍ استخراج المستندات والروابط الموقعة الآمنة...</p>
                <p className="text-xs text-slate-400">يتم توليد روابط مؤقتة مشفرة للوصول المصرح به</p>
              </div>
            ) : inspectError ? (
              <div className="py-12 text-center text-slate-500 space-y-3 border border-dashed border-rose-200 rounded-2xl bg-rose-50/50 p-6">
                <AlertTriangle className="w-10 h-10 mx-auto text-rose-500" />
                <p className="text-sm font-bold text-rose-800">تعذر تحميل مستندات التوثيق</p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">{inspectError}</p>
                <button
                  type="button"
                  onClick={() => handleOpenInspect(inspectModal)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            ) : inspectDocs ? (
              <div className="space-y-6">
                
                {/* 1. Account Info Overview */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                  <h4 className="text-xs font-bold text-[#0B3D3A] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0F766E]" />
                    <span>بيانات الحساب الشخصية والرقم القومي</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">الاسم الرباعي:</span>
                      <strong className="text-slate-800">{inspectDocs.accountInfo?.fullName || inspectModal.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">الرقم القومي المصري:</span>
                      <strong className="text-slate-800 font-mono tracking-wider" dir="ltr">
                        {inspectDocs.accountInfo?.nationalIdNumber || inspectModal.nationalIdNumber || 'غير مسجل'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">المحافظة:</span>
                      <strong className="text-slate-800">{inspectDocs.accountInfo?.governorate || 'القاهرة'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">العنوان:</span>
                      <strong className="text-slate-800">{inspectDocs.accountInfo?.address || 'غير محدد'}</strong>
                    </div>
                    {inspectDocs.accountInfo?.tradeName && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-400 block text-[11px]">الاسم التجاري:</span>
                        <strong className="text-slate-800">{inspectDocs.accountInfo.tradeName}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Phone Confirmation */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-5 h-5 text-[#0F766E]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">رقم الهاتف وتأكيد الـ OTP</h4>
                      <p className="text-xs font-mono text-slate-500">{inspectModal.phone || 'غير مسجل'}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                    inspectModal.phoneVerified || inspectDocs.phoneConfirmation?.isVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {inspectModal.phoneVerified || inspectDocs.phoneConfirmation?.isVerified ? 'تم التأكيد برمز OTP ✓' : 'غير مؤكد'}
                  </span>
                </div>

                {/* Check if any document exists */}
                {!inspectDocs.nationalId?.frontDoc && !inspectDocs.nationalId?.backDoc && !inspectDocs.livenessCheck?.selfieDoc && (!Array.isArray(inspectDocs.ownershipDocs) || inspectDocs.ownershipDocs.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6">
                    <FileText className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">لا توجد ملفات أو مستندات مرفوعة حتى الآن</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      لم يقم المالك بإرفاق بطاقة الرقم القومي أو الصورة الحية أو مستندات الملكية بعد.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 3. National ID Cards (Front & Back) */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-[#0B3D3A] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#0F766E]" />
                        <span>مستندات بطاقة الرقم القومي (الوجه والظهر)</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Front */}
                        <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-2">
                          <span className="text-xs font-bold text-slate-700 block">وجه البطاقة:</span>
                          {inspectDocs.nationalId?.frontDoc ? (
                            <div className="space-y-2">
                              {(() => {
                                const frontUrl = inspectDocs.nationalId.frontDoc.signedUrl || inspectDocs.nationalId.frontDoc.previewUrl || inspectDocs.nationalId.frontDoc.secureUrl || (inspectDocs.nationalId.frontDoc.publicId ? `/api/v1/media/verification-document/${encodeURIComponent(inspectDocs.nationalId.frontDoc.publicId)}` : '');
                                return (
                                  <a
                                    href={frontUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-44 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group"
                                  >
                                    <img
                                      src={frontUrl}
                                      alt="وجه البطاقة"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        if (e.target.parentElement) {
                                          e.target.parentElement.classList.add('bg-slate-200', 'flex', 'items-center', 'justify-center');
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                      <ExternalLink className="w-4 h-4" />
                                      <span>تكبير الصورة</span>
                                    </div>
                                  </a>
                                );
                              })()}
                              <span className="text-[10px] text-slate-400 block truncate">
                                {inspectDocs.nationalId.frontDoc.originalName || 'مستند وجه البطاقة'}
                              </span>
                            </div>
                          ) : (
                            <div className="h-44 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                              لم يتم الرفع بعد
                            </div>
                          )}
                        </div>

                        {/* Back */}
                        <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-2">
                          <span className="text-xs font-bold text-slate-700 block">ظهر البطاقة:</span>
                          {inspectDocs.nationalId?.backDoc ? (
                            <div className="space-y-2">
                              {(() => {
                                const backUrl = inspectDocs.nationalId.backDoc.signedUrl || inspectDocs.nationalId.backDoc.previewUrl || inspectDocs.nationalId.backDoc.secureUrl || (inspectDocs.nationalId.backDoc.publicId ? `/api/v1/media/verification-document/${encodeURIComponent(inspectDocs.nationalId.backDoc.publicId)}` : '');
                                return (
                                  <a
                                    href={backUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-44 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group"
                                  >
                                    <img
                                      src={backUrl}
                                      alt="ظهر البطاقة"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        if (e.target.parentElement) {
                                          e.target.parentElement.classList.add('bg-slate-200', 'flex', 'items-center', 'justify-center');
                                        }
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                      <ExternalLink className="w-4 h-4" />
                                      <span>تكبير الصورة</span>
                                    </div>
                                  </a>
                                );
                              })()}
                              <span className="text-[10px] text-slate-400 block truncate">
                                {inspectDocs.nationalId.backDoc.originalName || 'مستند ظهر البطاقة'}
                              </span>
                            </div>
                          ) : (
                            <div className="h-44 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                              لم يتم الرفع بعد
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. Live Selfie */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-[#0B3D3A] flex items-center gap-1.5">
                        <ScanFace className="w-4 h-4 text-[#0F766E]" />
                        <span>صورة السيلفي الحية (لمطابقة ملامح الوجه)</span>
                      </h4>
                      {inspectDocs.livenessCheck?.selfieDoc ? (
                        <div className="border border-slate-200 rounded-2xl p-4 bg-white flex items-center gap-4">
                          {(() => {
                            const selfieUrl = inspectDocs.livenessCheck.selfieDoc.signedUrl || inspectDocs.livenessCheck.selfieDoc.previewUrl || inspectDocs.livenessCheck.selfieDoc.secureUrl || (inspectDocs.livenessCheck.selfieDoc.publicId ? `/api/v1/media/verification-document/${encodeURIComponent(inspectDocs.livenessCheck.selfieDoc.publicId)}` : '');
                            return (
                              <a
                                href={selfieUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#0F766E] shrink-0 block group relative"
                              >
                                <img
                                  src={selfieUrl}
                                  alt="سيلفي"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </a>
                            );
                          })()}
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-800">تم التقاط الصورة الحية</p>
                            <p className="text-[11px] text-slate-500">
                              يرجى مقارنة ملامح الوجه مع الصورة الشخصية في وجه بطاقة الرقم القومي أعلاه للتأكد من هوية المالك.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 text-center">
                          لم يتم التقاط صورة سيلفي حية
                        </div>
                      )}
                    </div>

                    {/* 5. Ownership Documents */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-[#0B3D3A] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#0F766E]" />
                        <span>مستندات إثبات الملكية أو إدارة العقار ({inspectDocs.ownershipDocs?.length || 0})</span>
                      </h4>
                      {Array.isArray(inspectDocs.ownershipDocs) && inspectDocs.ownershipDocs.length > 0 ? (
                        <div className="space-y-2">
                          {inspectDocs.ownershipDocs.map((doc, idx) => {
                            const docUrl = doc.signedUrl || doc.previewUrl || doc.secureUrl || (doc.publicId ? `/api/v1/media/verification-document/${encodeURIComponent(doc.publicId)}` : '');
                            return (
                              <div
                                key={doc.id || doc.publicId || idx}
                                className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <File className="w-4 h-4 text-[#0F766E] shrink-0" />
                                  <span className="text-xs font-bold text-slate-800 truncate">
                                    {doc.originalName || `مستند ملكية #${idx + 1}`}
                                  </span>
                                </div>
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-teal-50 text-[#0F766E] hover:bg-teal-100 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>معاينة المستند</span>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400 text-center">
                          لم يتم إرفاق أي مستند ملكية
                        </div>
                      )}
                    </div>
                  </>
                )}

              </div>
            ) : null}

            {/* Quick Actions Footer inside Inspect Modal */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إغلاق النافذة
              </button>

              <div className="flex items-center gap-2">
                {inspectModal.verificationStatus !== 'verified' && (
                  <button
                    onClick={() => handleVerify(inspectModal)}
                    disabled={processingId === inspectModal.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {processingId === inspectModal.id ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>اعتماد الهوية</span>
                  </button>
                )}

                {inspectModal.verificationStatus !== 'verified' && (
                  <button
                    onClick={() => {
                      setCorrectionModal(inspectModal);
                      setCorrectionReason('');
                      setSelectedIssueCheckboxes([]);
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>طلب استكمال</span>
                  </button>
                )}

                {inspectModal.verificationStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectModal(inspectModal);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REQUEST CORRECTION MODAL ────────────────────────────── */}
      {correctionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>طلب استكمال / تعديل مستندات: {correctionModal.fullName}</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              حدد النواقص المطلوبة أو اكتب توجيهاً للمالك لإعادة تصوير ورفع المستندات الصحيحة:
            </p>

            {/* Quick Checkboxes */}
            <div className="space-y-2 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
              <span className="text-[11px] font-bold text-slate-700 block">نواقص شائعة (اختر للتحديد التلقائي):</span>
              {[
                'صورة وجه بطاقة الرقم القومي غير واضحة أو مطموسة الأرقام',
                'صورة ظهر بطاقة الرقم القومي غير واضحة أو مقصوصة الأطراف',
                'صورة السيلفي الحية غير واضحة أو لا تطابق ملامح بطاقة الرقم القومي',
                'مستند إثبات الملكية غير كافٍ أو غير سارٍ أو غير مختوم',
                'الاسم الرباعي المسجل لا يطابق الاسم المكتوب على بطاقة الهوية'
              ].map((issue) => (
                <label key={issue} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={selectedIssueCheckboxes.includes(issue)}
                    onChange={() => toggleCorrectionCheckbox(issue)}
                    className="rounded text-[#0F766E] focus:ring-teal-500"
                  />
                  <span>{issue}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ملاحظات وتوجيهات إضافية للمالك:
              </label>
              <textarea
                rows={3}
                placeholder="مثال: يرجى التقاط صورة بطاقة الرقم القومي في إضاءة جيدة ودون فلاش عاكس..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCorrectionModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCorrectionConfirm}
                disabled={processingId === correctionModal.id}
                className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                {processingId === correctionModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إرسال طلب الاستكمال للمالك</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: REJECT MODAL ───────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-sm text-[#1E293B] mb-2 flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>رفض توثيق المالك: {rejectModal.fullName}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              يرجى كتابة سبب الرفض لتوجيه المالك لسبب عدم قبول طلبه:
            </p>
            <textarea
              rows={3}
              placeholder="مثال: المستندات مزورة أو غير صالحة رسمياً..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs sm:text-sm resize-none outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || processingId === rejectModal.id}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 7: REPORTS (البلاغات) ────────────────────────────────────────────────
const TabReports = ({ token, showToast, refreshStats }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getReports(token, params);
      setReports(res.data?.reports || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (reportId, action) => {
    setProcessingId(reportId);
    try {
      await adminApi.resolveReport(token, reportId, action);
      showToast(action === 'dismiss' ? 'تم حفظ البلاغ كمغلق.' : 'تم اتخاذ الإجراء اللازم وتوثيقه.');
      fetchReports();
      if (refreshStats) refreshStats();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">متابعة البلاغات وشكاوى النزاهة</h2>
          <p className="text-xs text-slate-500 mt-0.5">البلاغات الواردة من المستخدمين بخصوص المحادثات والإعلانات المخالفة</p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: '', label: 'الكل' },
            { id: 'pending_admin_review', label: 'قيد المراجعة' },
            { id: 'action_taken', label: 'تم الإجراء' },
            { id: 'dismissed', label: 'المغلقة' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === f.id
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب البلاغات..." />
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title="لا توجد بلاغات مسجلة" subtitle="المنصة آمنة ولا توجد شكاوى معلقة حالياً." />
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => (
            <div key={rep.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                      موضوع الشكوى: <span className="text-rose-700">{rep.reason}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      المبلّغ: <strong>{rep.reporterName || rep.reportedBy}</strong> • معرف المحادثة: <code className="font-mono text-[10px]">{rep.conversationId}</code>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">تاريخ البلاغ: {formatDate(rep.createdAt)}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusColors[rep.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {statusLabels[rep.status] || rep.status}
                </span>
              </div>

              {rep.status === 'pending_admin_review' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleResolve(rep.id, 'dismiss')}
                    disabled={processingId === rep.id}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    حفظ وتجاهل
                  </button>
                  <button
                    onClick={() => handleResolve(rep.id, 'action_taken')}
                    disabled={processingId === rep.id}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>اتخاذ إجراء ومعاقبة المخالف</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── TAB 8: INQUIRIES (طلبات المعاينة) ─────────────────────────────────────────
const TabInquiries = ({ token, showToast }) => {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getInquiries(token, params);
      setInquiries(res.data?.inquiries || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, showToast]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">متابعة مواعيد وطلبات المعاينة</h2>
          <p className="text-xs text-slate-500 mt-0.5">مواعيد المعاينة المباشرة بين الطلاب الجامعيين وملاك السكن</p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: '', label: 'الكل' },
            { id: 'pending_owner_confirmation', label: 'بانتظار المالك' },
            { id: 'accepted', label: 'المقبولة' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                statusFilter === f.id
                  ? 'bg-[#0B3D3A] text-white border-[#0B3D3A]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-[#0F766E]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ جلب طلبات المعاينة..." />
      ) : inquiries.length === 0 ? (
        <EmptyState icon={CalendarClock} title="لا توجد طلبات معاينة حالياً" />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">الطالب مقدم الطلب</th>
                  <th className="p-3.5 font-bold">العقار المستهدف</th>
                  <th className="p-3.5 font-bold">معرف المالك</th>
                  <th className="p-3.5 font-bold">الموعد المطلوب</th>
                  <th className="p-3.5 font-bold">حالة الطلب</th>
                  <th className="p-3.5 font-bold">تاريخ الإرسال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{inq.applicant?.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{inq.applicant?.phone || inq.applicant?.email}</p>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="font-bold text-slate-800 truncate">{inq.listingTitle}</p>
                      {inq.message && <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">"{inq.message}"</p>}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{inq.ownerId}</td>
                    <td className="p-3.5 font-bold text-slate-700 font-mono">{inq.moveInDate || '—'}</td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[inq.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {statusLabels[inq.status] || inq.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">{formatDate(inq.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 9: CHAT METRICS (الرسائل ومؤشرات نظام المحادثات) ─────────────────────
const TabChatMetrics = ({ token, showToast }) => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getChatMetrics(token)
      .then((res) => setMetrics(res.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setIsLoading(false));
  }, [token, showToast]);

  if (isLoading) return <LoadingState text="جارٍ قراءة مؤشرات نظام المحادثات..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">مؤشرات أداء نظام المحادثات والتواصل</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          تحليلات نشاط التواصل بين الطلاب والملاك مع حماية صارمة لخصوصية الرسائل الشخصية
        </p>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-3xl flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 leading-relaxed">
          <p className="font-bold">سياسة الخصوصية وحماية المحتوى الطلابي:</p>
          <p className="mt-1 opacity-90">{metrics?.privacyNotice}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs text-center">
          <MessageSquare className="w-6 h-6 text-[#0F766E] mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">إجمالي المحادثات</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalConversations ?? 0}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs text-center">
          <Send className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">الرسائل المتبادلة</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.totalMessages ?? 0}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs text-center">
          <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">متوسط وقت الاستجابة</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.averageResponseTime || '—'}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs text-center">
          <CheckCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">معدل التفاعل النشط</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{metrics?.activeConversationsRate || '—'}</p>
        </div>
      </div>

      {/* Conversations Metadata Index (No Private Text Leak) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#1E293B] mb-3">سجل المحادثات الإحصائي</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 font-bold">المحادثة</th>
                <th className="p-3 font-bold">الطالب المتواصل</th>
                <th className="p-3 font-bold">العقار المستفسر عنه</th>
                <th className="p-3 font-bold">حجم الرسائل</th>
                <th className="p-3 font-bold">آخر تواصل</th>
                <th className="p-3 font-bold">طلب معاينة مرتبط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.conversationsSummary?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-[11px] text-slate-500">{c.id}</td>
                  <td className="p-3 font-bold text-slate-800">{c.studentName}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{c.propertyTitle}</td>
                  <td className="p-3 font-mono font-bold text-[#0F766E]">{c.messagesCount} رسالة</td>
                  <td className="p-3 font-mono text-[11px] text-slate-400">{c.lastMessageTime}</td>
                  <td className="p-3">
                    {c.hasViewingRequest ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                        نعم • يوجد موعد
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">استفسار عام</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 10: PLATFORM STATS & GROWTH (الإحصائيات) ─────────────────────────────
const TabStats = ({ stats, onTabChange }) => {
  if (!stats) return <LoadingState />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">إحصائيات وقاعدة بيانات المنصة</h2>
        <p className="text-xs text-slate-500 mt-0.5">تفصيل كامل لجميع عناصر النظام بالنسب والأعداد الموثقة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F766E]" />
            <span>توزيع المستخدمين</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">إجمالي الحسابات:</span>
              <span className="font-bold text-slate-900">{stats.users?.total ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">الطلاب الجامعيون:</span>
              <span className="font-bold text-[#0F766E]">{stats.users?.students ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">ملاك العقارات:</span>
              <span className="font-bold text-blue-700">{stats.users?.owners ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">الحسابات المعلقة:</span>
              <span className="font-bold text-rose-700">{stats.users?.suspended ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F766E]" />
            <span>توزيع الوحدات السكنية</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">إجمالي الوحدات:</span>
              <span className="font-bold text-slate-900">{stats.listings?.total ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">وحدات نشطة ومعروضة:</span>
              <span className="font-bold text-emerald-700">{stats.listings?.active ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">بانتظار موافقة الإدارة:</span>
              <span className="font-bold text-amber-700">{stats.listings?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">إعلانات موقوفة مؤقتاً:</span>
              <span className="font-bold text-slate-700">{stats.listings?.paused ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#0F766E]" />
            <span>نشاط المعاينات والبلاغات</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">إجمالي طلبات المعاينة:</span>
              <span className="font-bold text-slate-900">{stats.inquiries?.total ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">مواعيد مقبولة ومؤكدة:</span>
              <span className="font-bold text-emerald-700">{stats.inquiries?.accepted ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">بانتظار قرار المالك:</span>
              <span className="font-bold text-amber-700">{stats.inquiries?.pending ?? 0}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-50 rounded-2xl">
              <span className="text-slate-600">بلاغات الأمان المفتوحة:</span>
              <span className="font-bold text-rose-700">{stats.reports?.pending ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 11: ANALYTICS & COMMERCIAL INTELLIGENCE (التحليلات) ───────────────────
const TabAnalytics = ({ token, showToast }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAnalytics(token)
      .then((res) => setData(res.data))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setIsLoading(false));
  }, [token, showToast]);

  if (isLoading) return <LoadingState text="جارٍ حساب التحليلات التشغيلية..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">التحليلات التشغيلية والتجارية للمشروع</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          بيانات دقيقة عن المناطق الأكثر طلباً، أنماط السكن المفضلة، ومعدلات تحويل الطلبات
        </p>
      </div>

      {/* Top Demand Areas */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-[#1E293B] mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0F766E]" />
          <span>المناطق ومحيط الجامعات الأكثر طلباً وتفاعلاً</span>
        </h3>
        <div className="space-y-3">
          {data?.popularAreas?.map((area, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-[#0B3D3A] text-white flex items-center justify-center font-bold text-xs">
                  {idx + 1}
                </span>
                <span className="font-bold text-slate-800 text-sm">{area.city}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-500">{area.listingsCount} عقار</span>
                <span className="font-bold text-[#0F766E] bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
                  {area.inquiriesCount} طلب معاينة
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Accommodation Types */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
          <h3 className="font-bold text-sm text-[#1E293B] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F766E]" />
            <span>أنماط السكن الطلابي المعروضة</span>
          </h3>
          <div className="space-y-3">
            {data?.accommodationStats?.map((type, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl text-xs">
                <span className="font-bold text-slate-800">{type.label}</span>
                <span className="font-black text-[#0F766E] font-mono text-sm">{type.count} وحدة</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion & Response */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            <span>معدل قبول المعاينات واستجابة الملاك</span>
          </h3>
          <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 text-center">
            <p className="text-xs text-teal-800 font-bold">معدل قبول مواعيد المعاينة</p>
            <p className="text-3xl font-black text-[#0F766E] mt-1">{data?.inquiryAcceptanceRate || '0%'}</p>
            <p className="text-[11px] text-teal-700 mt-1">من إجمالي {data?.inquirySummary?.total || 0} طلب معاينة مقدم</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 flex justify-between">
            <span>مواعيد معتمدة بنجاح:</span>
            <span className="font-bold text-emerald-700">{data?.inquirySummary?.accepted || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TAB 12: NOTIFICATIONS & BROADCAST (الإشعارات) ────────────────────────────
const TabNotifications = ({ token, showToast }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetRole, setTargetRole] = useState('all');
  const [isSending, setIsSending] = useState(false);

  const fetchNotifs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getNotifications(token);
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSending(true);
    try {
      const res = await adminApi.broadcastNotification(token, {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        targetRole,
      });
      showToast(res.message || 'تم إرسال الإشعار بنجاح لجميع المستخدمين المستهدفين.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      fetchNotifs();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">مركز الإشعارات والتنبيهات الموجهة</h2>
        <p className="text-xs text-slate-500 mt-0.5">إرسال إشعارات عامة من إدارة المنصة ومتابعة سجل الإشعارات الصادرة</p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
          <Send className="w-4 h-4 text-[#0F766E]" />
          <span>بث إشعار عام من صاحب المنصة</span>
        </h3>

        <form onSubmit={handleBroadcast} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإشعار</label>
              <input
                type="text"
                required
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="مثال: تنبيه بخصوص تحديث سياسة التوثيق والأسعار..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0F766E] transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الفئة المستهدفة</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0F766E] transition-all bg-white"
              >
                <option value="all">جميع المستخدمين (طلاب وملاك)</option>
                <option value="student">الطلاب فقط</option>
                <option value="owner">ملاك العقارات فقط</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نص الإشعار والتفاصيل</label>
            <textarea
              rows={3}
              required
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="اكتب رسالة التنبيه التي ستظهر في لوحة تحكم المستخدمين..."
              className="w-full p-3 border border-slate-200 rounded-2xl text-xs outline-none focus:border-[#0F766E] transition-all resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending || !broadcastTitle.trim() || !broadcastMessage.trim()}
              className="px-5 py-2.5 bg-[#0B3D3A] hover:bg-[#0F766E] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>إرسال وبث التنبيه فوراً</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications History List */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#1E293B] mb-3 flex items-center justify-between">
          <span>سجل الإشعارات الصادرة في النظام</span>
          <span className="text-xs text-slate-400 font-mono">{notifications.length} إشعار</span>
        </h3>

        {isLoading ? (
          <LoadingState text="جارٍ جلب سجل الإشعارات..." />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="لا توجد إشعارات مسجلة" />
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <div key={n.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-800">{n.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.time || formatDate(n.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── TAB 13: AUDIT LOG (سجل النشاط والتدقيق) ──────────────────────────────────
const TabAuditLog = ({ token, showToast }) => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAuditLog(token, { limit: 100 });
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionMap = {
    verify_owner: { label: 'اعتماد وتوثيق مالك', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    reject_owner: { label: 'رفض طلب توثيق', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    suspend_user: { label: 'تعليق حساب مستخدم', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    unsuspend_user: { label: 'رفع تعليق الحساب', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    listing_status_active: { label: 'تفعيل ونشر عقار', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    listing_status_paused: { label: 'إيقاف إعلان عقار', color: 'bg-amber-50 text-amber-800 border-amber-200' },
    listing_status_rejected: { label: 'رفض إعلان عقار', color: 'bg-rose-50 text-rose-800 border-rose-200' },
    resolve_report: { label: 'معالجة بلاغ', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    dismiss_report: { label: 'حفظ وتجاهل بلاغ', color: 'bg-slate-50 text-slate-700 border-slate-200' },
    update_platform_settings: { label: 'تعديل إعدادات المنصة', color: 'bg-blue-50 text-blue-800 border-blue-200' },
    change_admin_password: { label: 'تغيير كلمة مرور الإدارة', color: 'bg-purple-50 text-purple-800 border-purple-200' },
    broadcast_notification: { label: 'بث إشعار عام', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-[#1E293B]">سجل التدقيق الإداري الكامل (Audit Log)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            سجل غير قابل للتعديل يوثق كل إجراء إداري، اسم المنفّذ، العنصر، التاريخ والوقت
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-1.5 text-slate-500 hover:text-[#0F766E] border border-slate-200 rounded-xl bg-white hover:bg-slate-50 self-start sm:self-auto"
          title="تحديث السجل"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingState text="جارٍ استرجاع سجل التدقيق..." />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="لا توجد إجراءات مسجلة حتى الآن"
          subtitle="أي عملية اعتماد أو تعديل أو تعليق ستظهر هنا فورياً."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-3.5 font-bold">المسؤول المنفّذ</th>
                  <th className="p-3.5 font-bold">نوع الإجراء</th>
                  <th className="p-3.5 font-bold">العنصر المتأثر</th>
                  <th className="p-3.5 font-bold">التفاصيل والتغيير</th>
                  <th className="p-3.5 font-bold">التاريخ والتوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const meta = actionMap[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{log.adminName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.adminId}</p>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800">{log.targetLabel || '—'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{log.targetType} • {log.targetId}</p>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-600 max-w-xs">
                        {log.newState?.reason ? (
                          <span className="text-rose-700">السبب: {log.newState.reason}</span>
                        ) : log.newState?.rejectionReason ? (
                          <span className="text-rose-700">سبب الرفض: {log.newState.rejectionReason}</span>
                        ) : log.newState?.status ? (
                          <span>الحالة الجديدة: {statusLabels[log.newState.status] || log.newState.status}</span>
                        ) : (
                          <span>تم التنفيذ وتوثيقه</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{formatDate(log.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TAB 14: PLATFORM SETTINGS (إعدادات المنصة) ────────────────────────────────
const TabSettings = ({ token, showToast }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getPlatformSettings(token)
      .then((res) => setSettings(res.data?.settings))
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setIsLoading(false));
  }, [token, showToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminApi.updatePlatformSettings(token, settings);
      showToast('تم حفظ وتطبيق إعدادات المنصة بنجاح.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState text="جارٍ جلب إعدادات المنصة..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">إعدادات المنصة وسياسات التشغيل</h2>
        <p className="text-xs text-slate-500 mt-0.5">التحكم في بوابات التسجيل، وسياسات التوثيق، ونسبة العمولة والدعم الفني</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0F766E]" />
            <span>الهوية والبيانات العامة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم المنصة الرسمي</label>
              <input
                type="text"
                value={settings?.platformName || ''}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E]"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">نسبة عمولة المنصة (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings?.platformFeePercentage ?? 0}
                onChange={(e) => setSettings({ ...settings, platformFeePercentage: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">بريد الدعم الفني</label>
              <input
                type="email"
                value={settings?.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">هاتف الطوارئ والدعم</label>
              <input
                type="text"
                value={settings?.contactPhone || ''}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Operating Switches */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#0F766E]" />
            <span>سياسات التسجيل والتوثيق المباشرة</span>
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">السماح بتسجيل حسابات طلابية جديدة</span>
                <span className="text-[11px] text-slate-400">إتاحة بوابة التسجيل للطلاب الجامعيين</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings?.allowStudentRegistration)}
                onChange={(e) => setSettings({ ...settings, allowStudentRegistration: e.target.checked })}
                className="w-4 h-4 accent-[#0F766E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">السماح بتسجيل ملاك عقارات جدد</span>
                <span className="text-[11px] text-slate-400">إتاحة تسجيل ملاك ومؤجري الشقق</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings?.allowOwnerRegistration)}
                onChange={(e) => setSettings({ ...settings, allowOwnerRegistration: e.target.checked })}
                className="w-4 h-4 accent-[#0F766E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl cursor-pointer">
              <div>
                <span className="font-bold text-slate-800 block">اشتراط توثيق الهوية وسند الملكية قبل نشر العقارات</span>
                <span className="text-[11px] text-slate-400">منع المالك غير الموثق من تفعيل الإعلانات للطلاب (حماية ومصداقية)</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings?.requireOwnerVerificationForListing)}
                onChange={(e) => setSettings({ ...settings, requireOwnerVerificationForListing: e.target.checked })}
                className="w-4 h-4 accent-[#0F766E]"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-[#0B3D3A] hover:bg-[#0F766E] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>حفظ وتطبيق إعدادات المنصة</span>
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── TAB 15: SECURITY & ACCESS CONTROL (الأمان والصلاحيات) ─────────────────────
const TabSecurity = ({ token, showToast }) => {
  const { adminUser } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const fetchSecurityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSecurityLogs(token);
      setLogs(res.data?.logs || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchSecurityLogs();
  }, [fetchSecurityLogs]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('كلمتا المرور غير متطابقتين.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', 'error');
      return;
    }

    setIsChanging(true);
    try {
      const res = await adminApi.changeAdminPassword(token, currentPassword, newPassword);
      showToast(res.message || 'تم تحديث كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSecurityLogs();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-base font-bold text-[#1E293B]">مركز الأمان، الجلسات، وتغيير كلمة المرور</h2>
        <p className="text-xs text-slate-500 mt-0.5">مراقبة محاولات الدخول غير المصرح بها، وتأمين جلسة صاحب المنصة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Info & Active Session */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0F766E]" />
            <span>بيانات حساب Super Admin النشط</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl flex justify-between">
              <span className="text-slate-500">اسم المسؤول:</span>
              <span className="font-bold text-slate-800">{adminUser?.fullName}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex justify-between">
              <span className="text-slate-500">البريد الإلكتروني:</span>
              <span className="font-mono text-slate-800">{adminUser?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex justify-between">
              <span className="text-slate-500">مستوى الصلاحية:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Super Admin • مالك المنصة
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl flex justify-between">
              <span className="text-slate-500">حالة الجلسة:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>جلسة آمنة مشفرة (JWT)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-[#1E293B] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#0F766E]" />
            <span>تغيير كلمة المرور المشفرة</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة (8 أحرف فأكثر)</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#0F766E] font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPass ? 'إخفاء الرموز' : 'إظهار الرموز'}</span>
              </button>

              <button
                type="submit"
                disabled={isChanging || !currentPassword || !newPassword}
                className="px-4 py-2 bg-[#0B3D3A] hover:bg-[#0F766E] text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {isChanging ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>تحديث كلمة المرور</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security Events Log */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#1E293B] flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>سجل أحداث الأمان ومحاولات الوصول</span>
          </span>
          <button onClick={fetchSecurityLogs} className="text-slate-400 hover:text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </h3>

        {isLoading ? (
          <LoadingState text="جارٍ جلب سجل الأمان..." />
        ) : logs.length === 0 ? (
          <EmptyState icon={Shield} title="لا توجد أحداث أمنية مشبوهة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 font-bold">نوع الحدث</th>
                  <th className="p-3 font-bold">التفاصيل والوصف</th>
                  <th className="p-3 font-bold">المستخدم / المصدر</th>
                  <th className="p-3 font-bold">عنوان IP</th>
                  <th className="p-3 font-bold">التوقيت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          event.severity === 'danger'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {event.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">{event.description}</td>
                    <td className="p-3 font-mono text-slate-500">{event.user} ({event.role})</td>
                    <td className="p-3 font-mono text-slate-400">{event.ip}</td>
                    <td className="p-3 font-mono text-slate-400">{formatDate(event.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN PLATFORM OWNER DASHBOARD COMPONENT ─────────────────────────────────
export const ControlCenterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const { adminToken, adminUser, isAdminAuthenticated, adminLogout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState(urlTab || 'overview');

  useEffect(() => {
    document.title = 'مركز التحكم والإدارة العليا | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security Guard: Validate session immediately
  useEffect(() => {
    if (!isAdminAuthenticated || !adminToken) {
      navigate('/control-center/login', { replace: true });
    }
  }, [isAdminAuthenticated, adminToken, navigate]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const refreshStats = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await adminApi.getStats(adminToken);
      if (res.success) setStats(res.data);
    } catch {
      // Ignored
    }
  }, [adminToken]);

  useEffect(() => {
    if (isAdminAuthenticated && adminToken) {
      refreshStats();
    }
  }, [isAdminAuthenticated, adminToken, refreshStats]);

  const handleLogout = () => {
    adminLogout();
    navigate('/control-center/login', { replace: true });
  };

  if (!isAdminAuthenticated || !adminToken) {
    return null;
  }

  // 15 Comprehensive Sections Requested by Platform Owner
  const navTabs = [
    { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'users', label: 'المستخدمون', icon: Users },
    { id: 'owners', label: 'الملاك', icon: UserCheck },
    { id: 'listings', label: 'العقارات', icon: Building2 },
    { id: 'moderation', label: 'مراجعة الإعلانات', icon: FileCheck2, badge: stats?.listings?.pending },
    { id: 'verification', label: 'توثيق الملاك', icon: ShieldCheck, badge: stats?.verification?.pending },
    { id: 'reports', label: 'البلاغات', icon: Flag, badge: stats?.reports?.pending },
    { id: 'inquiries', label: 'طلبات المعاينة', icon: CalendarClock },
    { id: 'chat_metrics', label: 'نظام المحادثات', icon: MessageSquare },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'analytics', label: 'التحليلات', icon: TrendingUp },
    { id: 'notifications', label: 'الإشعارات والبث', icon: Bell },
    { id: 'audit', label: 'سجل النشاط والتدقيق', icon: Activity },
    { id: 'settings', label: 'إعدادات المنصة', icon: Settings },
    { id: 'security', label: 'الأمان والصلاحيات', icon: ShieldAlert },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <TabOverview stats={stats} onTabChange={setActiveTab} />;
      case 'users':
        return <TabUsers token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'owners':
        return <TabOwners token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'listings':
        return <TabListings token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'moderation':
        return <TabModeration token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'verification':
        return <TabVerification token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'reports':
        return <TabReports token={adminToken} showToast={showToast} refreshStats={refreshStats} />;
      case 'inquiries':
        return <TabInquiries token={adminToken} showToast={showToast} />;
      case 'chat_metrics':
        return <TabChatMetrics token={adminToken} showToast={showToast} />;
      case 'stats':
        return <TabStats stats={stats} onTabChange={setActiveTab} />;
      case 'analytics':
        return <TabAnalytics token={adminToken} showToast={showToast} />;
      case 'notifications':
        return <TabNotifications token={adminToken} showToast={showToast} />;
      case 'audit':
        return <TabAuditLog token={adminToken} showToast={showToast} />;
      case 'settings':
        return <TabSettings token={adminToken} showToast={showToast} />;
      case 'security':
        return <TabSecurity token={adminToken} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-cairo flex text-[#1E293B] selection:bg-[#0F766E] selection:text-white" dir="rtl">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── FIXED DESKTOP SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 sm:w-72 bg-[#0B3D3A] flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto shadow-2xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Brand Platform Header */}
        <div className="p-5 border-b border-teal-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F766E] rounded-2xl flex items-center justify-center shadow-lg border border-teal-600/40 shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate">مركز تحكم منصة سكنلي</h1>
              <p className="text-[10px] text-teal-300 font-mono">Platform Owner Dashboard</p>
            </div>
          </div>
        </div>

        {/* Authenticated Super Admin Root Identity */}
        <div className="p-3.5 mx-3 my-2.5 bg-[#082b29] rounded-2xl border border-teal-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {adminUser?.fullName?.charAt(0) || 'ص'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{adminUser?.fullName || 'صاحب المنصة'}</p>
              <p className="text-[10px] text-teal-300 font-mono truncate">{adminUser?.email}</p>
              <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Super Admin • الصلاحية العليا
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (15 Distinct Sections) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all text-right ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-md'
                    : 'text-teal-100 hover:bg-[#0e4844] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
                {Boolean(tab.badge) && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-teal-900/80 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 px-3 py-2 text-teal-200 hover:text-white text-xs rounded-xl hover:bg-[#0e4844] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة الموقع العام</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-300 hover:text-white hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج الآمن</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 shadow-2xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-[10px] text-slate-400">سكنلي • لوحة القيادة المركزية لصاحب المنصة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {stats?.reports?.pending > 0 && (
              <button
                onClick={() => setActiveTab('reports')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 transition-colors"
              >
                <Flag className="w-3.5 h-3.5 text-rose-600" />
                <span>{stats.reports.pending} بلاغ</span>
              </button>
            )}

            {stats?.verification?.pending > 0 && (
              <button
                onClick={() => setActiveTab('verification')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{stats.verification.pending} توثيق</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>جلسة المالك النشطة</span>
            </div>
          </div>
        </header>

        {/* Tab Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};
