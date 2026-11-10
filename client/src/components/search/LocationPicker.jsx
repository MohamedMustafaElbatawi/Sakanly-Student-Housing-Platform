import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Search, Check, X, ChevronDown, CheckSquare, Square, RotateCcw } from 'lucide-react';
import { EGYPTIAN_LOCATIONS, getAllGovernorateNames, normalizeArabicText } from '../../data/locationsData.js';

export const LocationPicker = ({
  selectedLocations = [],
  onChange,
  onApply,
  placeholder = 'المحافظة، المدينة، المنطقة...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelected, setTempSelected] = useState(selectedLocations);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync tempSelected with external selectedLocations when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedLocations);
      // Auto focus search input after animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, selectedLocations]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Toggle single item in temp selection
  const handleToggle = (name) => {
    setTempSelected((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  // Toggle whole governorate and its children
  const handleGovernorateToggle = (gov) => {
    const isGovSelected = tempSelected.includes(gov.name);
    const districtNames = gov.districts.map(d => d.name);

    setTempSelected((prev) => {
      if (isGovSelected) {
        // Deselect governorate and all its districts
        return prev.filter(item => item !== gov.name && !districtNames.includes(item));
      } else {
        // Select governorate
        return [...prev, gov.name];
      }
    });
  };

  // Select all filtered items
  const handleSelectAll = () => {
    const allVisible = [];
    filteredHierarchy.forEach(gov => {
      if (gov.matchesGov) allVisible.push(gov.name);
      gov.districts.forEach(d => {
        if (!allVisible.includes(d.name)) allVisible.push(d.name);
      });
    });

    setTempSelected((prev) => {
      const set = new Set([...prev, ...allVisible]);
      return Array.from(set);
    });
  };

  // Clear all selections
  const handleClearAll = () => {
    setTempSelected([]);
  };

  // Commit selection
  const handleApply = () => {
    onChange(tempSelected);
    setIsOpen(false);
    if (onApply) onApply(tempSelected);
  };

  // Direct remove from chip without opening modal
  const handleRemoveChip = (e, locationToRemove) => {
    e.stopPropagation();
    const updated = selectedLocations.filter(loc => loc !== locationToRemove);
    onChange(updated);
  };

  // Filter hierarchy based on search query
  const filteredHierarchy = useMemo(() => {
    const cleanQ = normalizeArabicText(searchQuery.trim());
    if (!cleanQ) {
      return EGYPTIAN_LOCATIONS.map(gov => ({
        ...gov,
        matchesGov: true,
      }));
    }

    return EGYPTIAN_LOCATIONS.map(gov => {
      const matchesGov = normalizeArabicText(gov.name).includes(cleanQ);
      const matchingDistricts = gov.districts.filter(d => {
        const dNorm = normalizeArabicText(d.name);
        const aliasesNorm = (d.aliases || []).map(normalizeArabicText);
        return dNorm.includes(cleanQ) || aliasesNorm.some(a => a.includes(cleanQ));
      });

      if (matchesGov || matchingDistricts.length > 0) {
        return {
          ...gov,
          matchesGov,
          districts: matchingDistricts.length > 0 ? matchingDistricts : gov.districts,
        };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  // Total count of matching locations
  const totalFilteredCount = useMemo(() => {
    let count = 0;
    filteredHierarchy.forEach(g => {
      count += 1 + g.districts.length;
    });
    return count;
  }, [filteredHierarchy]);

  return (
    <div ref={containerRef} className="relative flex-1" dir="rtl">
      {/* Clickable Location Field Trigger */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 lg:py-0 cursor-pointer select-none group min-h-[46px]"
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <MapPin className="w-5 h-5 text-sakanly-primary shrink-0 opacity-80 group-hover:scale-110 transition-transform" />
        
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <label className="block text-[10px] font-bold text-slate-400 leading-none">
              الموقع
            </label>
            {selectedLocations.length > 0 && (
              <span className="text-[10px] font-bold text-sakanly-primary bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-200">
                {selectedLocations.length} محددة
              </span>
            )}
          </div>

          {/* Chips Display */}
          {selectedLocations.length === 0 ? (
            <div className="text-sm font-normal text-slate-400 truncate">
              {placeholder}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap overflow-hidden max-h-[30px]">
              {selectedLocations.slice(0, 2).map((loc) => (
                <span
                  key={loc}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg text-xs font-bold shrink-0 animate-scale-up"
                >
                  <span className="truncate max-w-[85px] sm:max-w-[120px]">{loc}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveChip(e, loc)}
                    className="text-teal-600 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition-colors"
                    title={`إزالة ${loc}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedLocations.length > 2 && (
                <span className="text-[11px] font-bold text-sakanly-primary bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-lg border border-slate-200 shrink-0">
                  +{selectedLocations.length - 2} أخرى
                </span>
              )}
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sakanly-primary' : ''
          }`}
        />
      </div>

      {/* Dropdown / Mobile Modal Sheet */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 lg:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`
              fixed bottom-0 inset-x-0 z-50 rounded-t-3xl max-h-[85vh]
              lg:absolute lg:bottom-auto lg:top-full lg:right-0 lg:left-auto lg:w-[460px] lg:rounded-2xl lg:max-h-[500px] lg:mt-3
              bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scale-up
            `}
            style={{ minHeight: '380px' }}
          >
            {/* Header / Search Input */}
            <div className="p-3.5 sm:p-4 border-b border-slate-100 space-y-3 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-sakanly-primary flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">اختر المواقع والمناطق</h3>
                    <p className="text-[11px] text-slate-500">
                      يمكنك اختيار محافظة كاملة أو تحديد مناطق متعددة
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  aria-label="ابحث عن محافظة، مدينة أو حي"
                  placeholder="ابحث عن محافظة، مدينة أو حي (مثال: نصر، زايد، المعادي)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-sakanly-primary focus:ring-2 focus:ring-teal-500/15 outline-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Selection Summary & Quick Actions */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-600">
                  <span>تم تحديد:</span>
                  <span className="text-sakanly-primary bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 text-[11px]">
                    {tempSelected.length} {tempSelected.length === 1 ? 'منطقة' : tempSelected.length === 2 ? 'منطقتان' : 'مناطق'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-sakanly-primary hover:text-teal-800 transition-colors flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3" />
                    <span>تحديد الكل</span>
                  </button>

                  <span className="text-slate-300">|</span>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>مسح الاختيارات</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hierarchical Location List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-h-[290px] sm:max-h-[320px]">
              {filteredHierarchy.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Search className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-bold text-slate-600">لم يتم العثور على موقع مطابق</p>
                  <p className="text-[11px] text-slate-400">جرب كتابة اسم حي أو مدينة أخرى</p>
                </div>
              ) : (
                filteredHierarchy.map((gov) => {
                  const isGovSelected = tempSelected.includes(gov.name);
                  const selectedDistrictsInGov = gov.districts.filter(d => tempSelected.includes(d.name)).length;

                  return (
                    <div key={gov.id} className="rounded-xl border border-slate-100 bg-slate-50/40 p-2.5 space-y-2">
                      {/* Governorate Header / Toggle */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isGovSelected}
                            onChange={() => handleGovernorateToggle(gov)}
                            className="rounded text-sakanly-primary focus:ring-teal-500 w-4 h-4 cursor-pointer accent-[#0F766E]"
                          />
                          <span className="font-bold text-xs text-slate-800">
                            {gov.name}
                            <span className="text-[10px] text-slate-500 font-normal mr-1.5">
                              (محافظة كاملة)
                            </span>
                          </span>
                        </label>

                        {selectedDistrictsInGov > 0 && (
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
                            {selectedDistrictsInGov} من مناطقها
                          </span>
                        )}
                      </div>

                      {/* Districts Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                        {gov.districts.map((district) => {
                          const isDistrictSelected = tempSelected.includes(district.name);
                          return (
                            <label
                              key={district.id}
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                isDistrictSelected
                                  ? 'bg-teal-50/80 border-teal-300 text-teal-900 font-bold shadow-2xs'
                                  : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDistrictSelected}
                                onChange={() => handleToggle(district.name)}
                                className="rounded text-sakanly-primary focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer accent-[#0F766E]"
                              />
                              <span className="truncate" title={district.name}>
                                {district.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer with Apply Button */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-initial px-6 py-2 bg-sakanly-primary hover:bg-sakanly-primary-hover active:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  تطبيق {tempSelected.length > 0 ? `(${tempSelected.length} مناطق)` : ''}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

