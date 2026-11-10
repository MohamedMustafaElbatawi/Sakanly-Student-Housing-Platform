import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, Search, X, Frown, WifiOff, RotateCw, AlertTriangle } from 'lucide-react';
import { PropertyCard } from '../components/property/PropertyCard.jsx';
import { FilterSidebar } from '../components/search/FilterSidebar.jsx';
import { FilterDrawer } from '../components/common/FilterDrawer.jsx';
import { propertyApi, favoritesApi } from '../services/api.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const BrowsePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, token } = useAuth();
  const { favorites } = useFavorites();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Initialize filters from query params
  const parseLocationsFromParams = (params) => {
    const rawLocs = params.getAll('locations');
    if (rawLocs && rawLocs.length > 0) {
      return rawLocs.flatMap(l => l.split(',')).map(l => l.trim()).filter(Boolean);
    }
    const singleLoc = params.get('locations');
    if (singleLoc) {
      return singleLoc.split(',').map(l => l.trim()).filter(Boolean);
    }
    if (params.get('city')) return [params.get('city').trim()];
    if (params.get('governorate')) return [params.get('governorate').trim()];
    return [];
  };

  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('q') || '',
    locations: parseLocationsFromParams(searchParams),
    governorate: searchParams.get('governorate') || '',
    city: searchParams.get('city') || '',
    district: searchParams.get('district') || '',
    accommodationType: searchParams.get('accommodationType') || '',
    genderPreference: searchParams.get('gender') || '',
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 0,
    isFurnished: searchParams.get('isFurnished') === 'true' ? true : null,
    isVerified: searchParams.get('isVerified') === 'true' ? true : null,
    sortBy: searchParams.get('sortBy') || 'recommended',
  }));

  // Set SEO document title
  useEffect(() => {
    document.title = 'تصفح السكن الطلابي في مصر | سكنلي';
    return () => {
      document.title = 'سكنلي | Sakanly — منصة سكن الطلاب الأولى في مصر';
    };
  }, []);

  // Re-sync filters whenever searchParams changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchParams.get('q') || '',
      locations: parseLocationsFromParams(searchParams),
      governorate: searchParams.get('governorate') || '',
      city: searchParams.get('city') || '',
      district: searchParams.get('district') || '',
      accommodationType: searchParams.get('accommodationType') || '',
      genderPreference: searchParams.get('gender') || '',
      minPrice: Number(searchParams.get('minPrice')) || 0,
      maxPrice: Number(searchParams.get('maxPrice')) || 0,
      isFurnished: searchParams.get('isFurnished') === 'true' ? true : null,
      isVerified: searchParams.get('isVerified') === 'true' ? true : null,
      sortBy: searchParams.get('sortBy') || 'recommended',
    }));
  }, [searchParams]);

  const favoritesOnly = searchParams.get('favoritesOnly') === 'true' || location.pathname === '/favorites';

  // Guard: Favorites are private to authenticated users
  useEffect(() => {
    if (favoritesOnly && !isAuthenticated) {
      navigate('/login?redirect=/favorites', {
        state: {
          from: '/favorites',
          message: 'سجّل دخولك للاستفادة من هذه الخدمة واستعراض قائمة المفضلة.',
        },
        replace: true,
      });
    }
  }, [favoritesOnly, isAuthenticated, navigate]);

  const handleRetry = () => {
    setError(null);
    setRetryKey(prev => prev + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchListings = async () => {
      setLoading(true);
      setError(null);
      try {
        if (favoritesOnly && isAuthenticated) {
          const activeToken = token || localStorage.getItem('sakanly_token');
          const favRes = await favoritesApi.getFavorites(activeToken);
          if (favRes && Array.isArray(favRes.properties) && favRes.properties.length > 0) {
            setProperties(favRes.properties);
            setError(null);
            setLoading(false);
            return;
          }
        }
        const res = await propertyApi.getProperties(filters, { signal: controller.signal });
        setProperties(res.listings || []);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Fetch listings error:', err);
        setError(err.message || 'تعذر الاتصال بخادم سكنلي. يرجى التأكد من تشغيل السيرفر أو التحقق من الاتصال بالإنترنت.');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();

    return () => {
      controller.abort();
    };
  }, [filters, favoritesOnly, isAuthenticated, token, retryKey]);

  // If viewing favorites only
  const displayedProperties = useMemo(() => {
    if (favoritesOnly) {
      return properties.filter(p => favorites.includes(String(p.id)) || (p._id && favorites.includes(String(p._id))));
    }
    return properties;
  }, [properties, favoritesOnly, favorites]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      locations: [],
      governorate: '',
      city: '',
      district: '',
      accommodationType: '',
      genderPreference: '',
      minPrice: 0,
      maxPrice: 0,
      isFurnished: null,
      isVerified: null,
      sortBy: 'recommended',
    });
    setSearchParams({});
  };

  // Remove individual filter chip
  const removeFilter = (key) => {
    setFilters(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'number' ? 0 : typeof prev[key] === 'boolean' ? null : '',
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Top Banner / Title Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-sakanly-border">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-sakanly-primary mb-1">
            <span>استكشاف السكن الطلابي</span>
            {favoritesOnly && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">قائمة المفضلة</span>}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-sakanly-dark leading-snug">
            {favoritesOnly ? 'سكناتي المحفوظة في المفضلة' : 'دليل وحدات السكن والأسِرّة في مصر'}
          </h1>
          <p className="text-xs sm:text-[13px] text-sakanly-muted mt-1">
            {displayedProperties.length} خيار متاح مطابق لمعاييرك
          </p>
        </div>

        {/* Search bar inside page & mobile filter button */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {/* Quick Keyword Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            <input
              type="text"
              aria-label="ابحث بحي أو جامعة"
              placeholder="ابحث بحي أو جامعة..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="w-full pr-9 pl-3 py-2 text-xs bg-white border border-sakanly-border rounded-xl focus:border-sakanly-primary outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {/* Sort selector */}
            <div className="relative shrink-0 flex-1 sm:flex-initial">
              <select
                aria-label="ترتيب النتائج"
                value={filters.sortBy}
                onChange={e => setFilters({ ...filters, sortBy: e.target.value })}
                className="w-full sm:w-auto py-2 px-3 text-xs font-bold bg-white border border-sakanly-border rounded-xl text-slate-700 focus:border-sakanly-primary outline-none cursor-pointer"
              >
                <option value="recommended">الموصى به</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>

            {/* Mobile Filter Sheet Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden flex items-center justify-center gap-1.5 py-2 px-3 bg-sakanly-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-sakanly-primary-hover shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>تصفية</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {((filters.locations && filters.locations.length > 0) || filters.city || filters.accommodationType || filters.genderPreference || filters.maxPrice > 0 || filters.isVerified || filters.isFurnished || filters.search) && (
        <div className="flex items-center gap-2 flex-wrap mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500">الفلاتر المطبقة:</span>

          {Array.isArray(filters.locations) && filters.locations.map(loc => (
            <span key={loc} className="inline-flex items-center gap-1.5 text-xs bg-white border border-teal-300 text-teal-800 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
              <span>{loc}</span>
              <button
                type="button"
                onClick={() => {
                  const updated = filters.locations.filter(l => l !== loc);
                  setFilters(prev => ({ ...prev, locations: updated, city: '', governorate: '' }));
                  const params = new URLSearchParams(searchParams);
                  params.delete('locations');
                  params.delete('city');
                  params.delete('governorate');
                  updated.forEach(u => params.append('locations', u));
                  setSearchParams(params);
                }}
                className="text-slate-400 hover:text-rose-600 transition-colors"
                title="إزالة هذا الموقع"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {(!filters.locations || filters.locations.length === 0) && filters.city && (
            <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-lg">
              المدينة: {filters.city}
              <button onClick={() => removeFilter('city')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.accommodationType && (
            <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-lg">
              النوع: {filters.accommodationType === 'individual_bed' ? 'سرير فردي' : filters.accommodationType === 'private_room' ? 'غرفة خاصة' : filters.accommodationType === 'shared_room' ? 'غرفة مشتركة' : 'شقة كاملة'}
              <button onClick={() => removeFilter('accommodationType')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.maxPrice > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-white border border-slate-300 text-slate-800 px-2.5 py-1 rounded-lg">
              حتى: {filters.maxPrice} ج.م
              <button onClick={() => removeFilter('maxPrice')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
            </span>
          )}

          {filters.isVerified && (
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1 rounded-lg">
              موثق فقط
              <button onClick={() => removeFilter('isVerified')} className="hover:text-rose-500"><X className="w-3 h-3" /></button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-rose-600 hover:underline mr-auto"
          >
            مسح الكل
          </button>
        </div>
      )}

      {/* Main Content Grid: Desktop Sidebar + Listings Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-1 sticky top-24">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            totalResults={displayedProperties.length}
          />
        </div>

        {/* Listings Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="py-20 text-center space-y-3" role="status">
              <div className="w-10 h-10 border-4 border-sakanly-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-sakanly-muted font-bold">جارٍ تحميل وتحديث الوحدات السكنية المتاحة...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-10 text-center space-y-4 shadow-sm" role="alert">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">تعذر الاتصال بخادم سكنلي</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {error}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F766E] hover:bg-[#0B3D3A] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>إعادة المحاولة</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all"
                >
                  إعادة تعيين الفلاتر
                </button>
              </div>
            </div>
          ) : displayedProperties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sakanly-border p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Frown className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-sakanly-dark">لم نجد وحدات تطابق هذه التصفية</h3>
                <p className="text-xs sm:text-sm text-sakanly-muted mt-1 max-w-md mx-auto">
                  جرب توسيع نطاق الميزانية، أو اختيار مدينة أخرى قريبة من جامعتك، أو إلغاء بعض معايير التصفية.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-sakanly-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-sakanly-primary-hover transition-colors"
              >
                عرض كافة الشقق والأسِرّة المتاحة
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Drawer */}
      <FilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        totalResults={displayedProperties.length}
      />

    </div>
  );
};
