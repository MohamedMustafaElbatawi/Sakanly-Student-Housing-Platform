import React from 'react';
import { X, RotateCcw, ShieldCheck, Bed, Key, Users, Home } from 'lucide-react';
import { egyptianGovernorates } from '../../data/mockProperties.js';
import { LocationPicker } from '../search/LocationPicker.jsx';

export const FilterDrawer = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-modal border-t sm:border border-sakanly-border"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sakanly-border">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-sakanly-dark">فلترة السكن</h3>
            <span className="text-xs text-sakanly-primary bg-teal-50 px-2 py-0.5 rounded-full font-bold">
              {totalResults} نتيجة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 p-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {/* City / District / Multi-Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة أو الحي أو المحافظة</label>
            <div className="bg-slate-50 border border-sakanly-border rounded-xl">
              <LocationPicker
                selectedLocations={filters.locations || []}
                onChange={newLocs => onChange({ ...filters, locations: newLocs, city: '' })}
                placeholder="جميع مناطق مصر..."
              />
            </div>
          </div>

          {/* Accommodation Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">نوع الإقامة</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'individual_bed', label: 'سرير فردي', icon: Bed },
                { id: 'private_room', label: 'غرفة خاصة', icon: Key },
                { id: 'shared_room', label: 'غرفة مشتركة', icon: Users },
                { id: 'entire_apartment', label: 'شقة كاملة', icon: Home },
              ].map(item => {
                const active = filters.accommodationType === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        accommodationType: active ? '' : item.id,
                      })
                    }
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                      active
                        ? 'bg-teal-50 border-sakanly-primary text-sakanly-primary'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">الميزانية القصوى شهرياً</label>
              <span className="text-xs font-bold text-sakanly-primary">
                {filters.maxPrice ? `${filters.maxPrice.toLocaleString('ar-EG')} ج.م` : 'غير محدد'}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="15000"
              step="500"
              value={filters.maxPrice || 15000}
              onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full accent-sakanly-primary"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع السكن</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'male', label: 'شباب' },
                { id: 'female', label: 'طالبات' },
                { id: '', label: 'الكل' },
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange({ ...filters, genderPreference: g.id })}
                  className={`py-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    filters.genderPreference === g.id
                      ? 'bg-sakanly-primary text-white border-sakanly-primary'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sakanly-verified" />
                <span className="text-xs font-bold text-slate-700">سكن موثق فقط</span>
              </div>
              <input
                type="checkbox"
                checked={filters.isVerified === true}
                onChange={e => onChange({ ...filters, isVerified: e.target.checked ? true : null })}
                className="w-4 h-4 accent-sakanly-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-700">مفروش بالكامل</span>
              <input
                type="checkbox"
                checked={filters.isFurnished === true}
                onChange={e => onChange({ ...filters, isFurnished: e.target.checked ? true : null })}
                className="w-4 h-4 accent-sakanly-primary rounded"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sakanly-border bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-sakanly-primary hover:bg-sakanly-primary-hover text-white text-sm font-bold rounded-xl shadow-md transition-colors"
          >
            تطبيق النتائج ({totalResults})
          </button>
        </div>
      </div>
    </div>
  );
};
