import React from 'react';
import { RotateCcw, Check, ShieldCheck, Home, Key, Users, Bed } from 'lucide-react';
import { egyptianGovernorates } from '../../data/mockProperties.js';
import { LocationPicker } from './LocationPicker.jsx';

export const FilterSidebar = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const handleAccommodationToggle = (type) => {
    onChange({
      ...filters,
      accommodationType: filters.accommodationType === type ? '' : type,
    });
  };

  const handleGenderToggle = (gender) => {
    onChange({
      ...filters,
      genderPreference: filters.genderPreference === gender ? '' : gender,
    });
  };

  return (
    <aside className="bg-white rounded-2xl border border-sakanly-border p-5 shadow-card space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-sakanly-border">
        <div>
          <h3 className="font-bold text-base text-sakanly-dark">تصفية النتائج</h3>
          <p className="text-xs text-sakanly-muted">{totalResults} وحدة متاحة تطابق بحثك</p>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-sakanly-primary hover:text-teal-700 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة ضبط
        </button>
      </div>

      {/* 1. Location / Multi-Select Location Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700">المواقع والمناطق المختارة</label>
        <div className="bg-slate-50 border border-sakanly-border rounded-xl">
          <LocationPicker
            selectedLocations={filters.locations || []}
            onChange={newLocs => onChange({ ...filters, locations: newLocs, city: '' })}
            placeholder="جميع مناطق مصر..."
          />
        </div>
      </div>

      {/* 2. Accommodation Type */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-700">نوع الإقامة</label>
        <div className="space-y-1.5">
          {[
            { id: 'individual_bed', label: 'سرير فردي (سكن اقتصادي)', icon: Bed },
            { id: 'private_room', label: 'غرفة خاصة مستقلة', icon: Key },
            { id: 'shared_room', label: 'غرفة مشتركة', icon: Users },
            { id: 'entire_apartment', label: 'شقة طلابية كاملة', icon: Home },
          ].map(item => {
            const Icon = item.icon;
            const active = filters.accommodationType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleAccommodationToggle(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  active
                    ? 'bg-teal-50 border-sakanly-primary text-sakanly-primary'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${active ? 'text-sakanly-primary' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <Check className="w-4 h-4 text-sakanly-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Monthly Budget Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-bold text-slate-700">الحد الأقصى للإيجار الشهري</label>
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
          className="w-full accent-sakanly-primary cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
          <span>1,000 ج.م</span>
          <span>7,500 ج.م</span>
          <span>15,000 ج.م</span>
        </div>
      </div>

      {/* 4. Gender Category */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-700">نوع السكن الطلابي</label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'male', label: 'شباب' },
            { id: 'female', label: 'طالبات' },
            { id: '', label: 'الكل' },
          ].map(g => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGenderToggle(g.id)}
              className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                filters.genderPreference === g.id
                  ? 'bg-sakanly-primary text-white border-sakanly-primary'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Additional Toggles (Furnished, Verified) */}
      <div className="space-y-3 pt-3 border-t border-sakanly-border">
        <label className="block text-xs font-bold text-slate-700">تفضيلات إضافية</label>
        
        {/* Verified Owner Toggle */}
        <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sakanly-verified" />
            <span className="text-xs font-bold text-slate-700">سكن موثق فقط</span>
          </div>
          <input
            type="checkbox"
            checked={filters.isVerified === true}
            onChange={e => onChange({ ...filters, isVerified: e.target.checked ? true : null })}
            className="w-4 h-4 accent-sakanly-primary rounded cursor-pointer"
          />
        </label>

        {/* Furnished Toggle */}
        <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100 transition-colors">
          <span className="text-xs font-bold text-slate-700">مفروش بالكامل ومجهز</span>
          <input
            type="checkbox"
            checked={filters.isFurnished === true}
            onChange={e => onChange({ ...filters, isFurnished: e.target.checked ? true : null })}
            className="w-4 h-4 accent-sakanly-primary rounded cursor-pointer"
          />
        </label>
      </div>

    </aside>
  );
};
