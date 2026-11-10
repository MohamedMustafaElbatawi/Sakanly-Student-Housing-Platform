// Separation of Owner Dashboard Data and Metadata

export const initialOwnerRequests = [
  {
    id: 'req-01',
    studentName: 'محمود عبد الفتاح',
    university: 'هندسة عين شمس',
    phone: '01011223344',
    date: '2026-10-25',
    time: '04:30 م',
    propertyId: 'prop-001',
    propertyTitle: 'شقة طلابية مودرن مجهزة بالكامل بالقرب من جامعة عين شمس',
    status: 'pending', // pending, accepted, rejected
    createdAt: '2026-10-20T14:20:00Z',
    notes: 'طالب بالسنة الثالثة - يبحث عن سرير لغرفة ثنائية',
  },
  {
    id: 'req-02',
    studentName: 'نادية إبراهيم',
    university: 'طب قصر العيني',
    phone: '01122334455',
    date: '2026-10-26',
    time: '02:00 م',
    propertyId: 'prop-002',
    propertyTitle: 'سرير فردي في غرفة ثنائية راقية للبنات - الدقي',
    status: 'accepted',
    createdAt: '2026-10-19T11:10:00Z',
    notes: 'جاهزة للتعاقد الفوري بعد المعاينة',
  },
  {
    id: 'req-03',
    studentName: 'أحمد طاهر',
    university: 'حاسبات ومعلومات القاهرة',
    phone: '01233445566',
    date: '2026-10-28',
    time: '05:00 م',
    propertyId: 'prop-004',
    propertyTitle: 'استوديو شبابي مستقل بجوار جامعة 6 أكتوبر',
    status: 'pending',
    createdAt: '2026-10-21T09:15:00Z',
    notes: 'يرغب في معرفة سرعة الإنترنت وتوافر موقف سيارات',
  },
];

export const initialOwnerNotifications = [
  {
    id: 'notif-01',
    title: 'طلب معاينة جديد',
    message: 'قدم الطالب أحمد طاهر طلباً لمعاينة استوديو جامعة 6 أكتوبر.',
    time: 'منذ ساعتين',
    type: 'request',
    isRead: false,
  },
  {
    id: 'notif-02',
    title: 'تأكيد موعد معاينة',
    message: 'تم إرسال تأكيد الموعد للطالبة نادية إبراهيم بنجاح.',
    time: 'منذ يوم',
    type: 'success',
    isRead: true,
  },
  {
    id: 'notif-03',
    title: 'تحديث توثيق الحساب',
    message: 'تم التحقق من بيانات الهوية وسند الملكية لعقاراتك المسجلة.',
    time: 'منذ 3 أيام',
    type: 'verification',
    isRead: true,
  },
];

export const propertyStatusConfig = {
  active: {
    label: 'نشط',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  pending: {
    label: 'بانتظار المراجعة',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  pending_review: {
    label: 'قيد المراجعة الإدارية',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  rented: {
    label: 'مؤجر بالكامل',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  paused: {
    label: 'متوقف مؤقتاً',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  draft: {
    label: 'مسودة (خاصة)',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  rejected: {
    label: 'مرفوض',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};
