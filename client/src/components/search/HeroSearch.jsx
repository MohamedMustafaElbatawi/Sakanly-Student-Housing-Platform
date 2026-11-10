import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Home, DollarSign } from 'lucide-react';
import { LocationPicker } from './LocationPicker.jsx';

export const HeroSearch = () => {
  const navigate = useNavigate();
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [accommodationType, setAccommodationType] = useState('');
  const [budget, setBudget] = useState('');

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    
    if (selectedLocations.length > 0) {
      selectedLocations.forEach(loc => params.append('locations', loc));
    }
    if (accommodationType) {
      params.append('accommodationType', accommodationType);
    }
    if (budget) {
      // Extract numeric value from budget if string has extra text
      const numericBudget = budget.toString().replace(/[^0-9]/g, '');
      if (numericBudget) {
        params.append('maxPrice', numericBudget);
      }
    }

    navigate(`/browse?${params.toString()}`);
  };

  const handlePopularClick = (areaName) => {
    const updated = selectedLocations.includes(areaName)
      ? selectedLocations
      : [...selectedLocations, areaName];
    setSelectedLocations(updated);

    const params = new URLSearchParams();
    updated.forEach(l => params.append('locations', l));
    if (accommodationType) params.append('accommodationType', accommodationType);
    if (budget) {
      const numericBudget = budget.toString().replace(/[^0-9]/g, '');
      if (numericBudget) params.append('maxPrice', numericBudget);
    }
    navigate(`/browse?${params.toString()}`);
  };

  const popularAreas = ['مدينة نصر', 'المعادي', 'الدقي', 'الشيخ زايد'];

  return (
    <div className="w-full max-w-[820px] mx-auto" dir="rtl">
      {/* Capsule Search Container */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl lg:rounded-full p-2.5 sm:p-2 lg:h-[64px] shadow-2xl shadow-teal-950/25 border border-white/60 flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-0 transition-all duration-300 relative z-30"
      >
        {/* 1. Multi-Select Location Picker */}
        <LocationPicker
          selectedLocations={selectedLocations}
          onChange={setSelectedLocations}
          placeholder="المحافظة، المدينة، المنطقة..."
        />

        {/* Divider 1 */}
        <div className="hidden lg:block w-[1px] h-8 bg-slate-200 shrink-0 mx-1" />

        {/* 2. Accommodation Type Select */}
        <div className="flex-1 flex items-center gap-2 px-3 sm:px-4 py-2 lg:py-0">
          <Home className="w-5 h-5 text-sakanly-primary shrink-0 opacity-80" />
          <div className="flex-1 text-right">
            <label htmlFor="hero-accommodation-type" className="block text-[10px] font-bold text-slate-400 leading-none mb-1">
              نوع السكن
            </label>
            <select
              id="hero-accommodation-type"
              aria-label="نوع السكن"
              value={accommodationType}
              onChange={(e) => setAccommodationType(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="">جميع الأنواع</option>
              <option value="entire_apartment">شقة</option>
              <option value="private_room">غرفة</option>
              <option value="individual_bed">سرير</option>
            </select>
          </div>
        </div>

        {/* Divider 2 */}
        <div className="hidden lg:block w-[1px] h-8 bg-slate-200 shrink-0 mx-1" />

        {/* 3. Monthly Budget */}
        <div className="flex-1 flex items-center gap-2 px-3 sm:px-4 py-2 lg:py-0">
          <DollarSign className="w-5 h-5 text-sakanly-primary shrink-0 opacity-80" />
          <div className="flex-1 text-right">
            <label htmlFor="hero-budget-input" className="block text-[10px] font-bold text-slate-400 leading-none mb-1">
              الميزانية الشهرية
            </label>
            <input
              id="hero-budget-input"
              aria-label="الميزانية الشهرية"
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="حتى 5,000 ج.م"
              className="w-full bg-transparent text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
            />
          </div>
        </div>

        {/* 4. Teal Search Button */}
        <button
          type="submit"
          className="lg:h-[50px] px-7 py-3 rounded-xl lg:rounded-full bg-[#0F766E] hover:bg-[#115E59] active:bg-[#0B3D3A] text-white font-cairo font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all duration-200 hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          <span>بحث</span>
        </button>
      </form>

      {/* Popular Search Tags Under Search Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/90">
        <span className="font-semibold text-white/80">الأكثر بحثاً:</span>
        <div className="inline-flex flex-wrap items-center gap-1.5">
          {popularAreas.map((area, idx) => {
            const isSelected = selectedLocations.includes(area);
            return (
              <React.Fragment key={area}>
                <button
                  type="button"
                  onClick={() => handlePopularClick(area)}
                  className={`font-bold transition-all px-2 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-amber-400 text-slate-900 shadow-xs'
                      : 'text-white hover:text-[#F59E0B] underline-offset-4 hover:underline'
                  }`}
                >
                  {area}
                  {isSelected && ' ✓'}
                </button>
                {idx < popularAreas.length - 1 && (
                  <span className="text-white/40">،</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
