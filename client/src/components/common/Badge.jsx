import React from 'react';
import { ShieldCheck, Users, Bed, Home, Key } from 'lucide-react';

export const AccommodationBadge = ({ type, className = '' }) => {
  switch (type) {
    case 'individual_bed':
      return (
        <span className={`inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
          <Bed className="w-3.5 h-3.5 text-amber-600" />
          سرير فردي
        </span>
      );
    case 'private_room':
      return (
        <span className={`inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
          <Key className="w-3.5 h-3.5 text-teal-600" />
          غرفة خاصة
        </span>
      );
    case 'shared_room':
      return (
        <span className={`inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
          <Users className="w-3.5 h-3.5 text-blue-600" />
          غرفة مشتركة
        </span>
      );
    case 'entire_apartment':
    default:
      return (
        <span className={`inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
          <Home className="w-3.5 h-3.5 text-emerald-600" />
          شقة كاملة
        </span>
      );
  }
};

export const GenderBadge = ({ gender, className = '' }) => {
  switch (gender) {
    case 'female':
      return (
        <span className={`inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
          طالبات فقط
        </span>
      );
    case 'male':
      return (
        <span className={`inline-flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
          طلاب شباب
        </span>
      );
    case 'any':
    default:
      return (
        <span className={`inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
          متاح للجميع
        </span>
      );
  }
};

export const VerifiedBadge = ({ className = '', text = 'مالك موثق' }) => {
  return (
    <span className={`inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full ${className}`}>
      <ShieldCheck className="w-3.5 h-3.5 text-sakanly-verified" />
      {text}
    </span>
  );
};
