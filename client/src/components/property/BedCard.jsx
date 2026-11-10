import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, MapPin, Bed, Users, GraduationCap, ArrowLeft, ShieldCheck } from 'lucide-react';
import { GenderBadge } from '../common/Badge.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export const BedCard = ({ property }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const propertyId = property.id || property._id;
  const favorited = isFavorite(propertyId, property._id);

  // Determine accommodation badge label
  const isIndividual = property.accommodationType === 'individual_bed';
  const typeLabel = isIndividual ? 'سرير فردي' : 'غرفة مشتركة';

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full focus-within:ring-2 focus-within:ring-sakanly-primary/30" dir="rtl">
      
      {/* 1. Uniform Aspect Ratio Photo Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 shrink-0">
        <img
          src={property.images && property.images.length > 0 ? property.images[0] : '/shared-beds-promo.jpg'}
          alt={property.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Top Badges: Type & Favorite Toggle */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10 pointer-events-auto">
          {/* Accommodation Type Badge */}
          <span className="inline-flex items-center gap-1.5 bg-[#0B3D3A]/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-white/10">
            <Bed className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>{typeLabel}</span>
          </span>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) {
                const returnPath = location.pathname + location.search;
                navigate(`/login?redirect=${encodeURIComponent(returnPath)}`, {
                  state: {
                    from: returnPath,
                    action: 'favorite',
                    message: 'سجّل دخولك للاستفادة من هذه الخدمة وحفظ العقار في المفضلة.',
                  },
                });
                return;
              }
              toggleFavorite(propertyId);
            }}
            aria-label="إضافة إلى المفضلة"
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center justify-center text-slate-600 hover:text-rose-500 shadow-md transition-all active:scale-90"
          >
            <Heart className={`w-4 h-4 transition-colors ${favorited ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>

        {/* Bottom Badges: Gender & Verified */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
          <div>
            {property.genderPreference && (
              <GenderBadge gender={property.genderPreference} className="shadow-sm" />
            )}
          </div>

          {property.isVerified && (
            <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-emerald-700 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>موثق</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Card Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
            <span className="truncate">{property.city} • {property.district}</span>
          </div>

          {/* Title */}
          <Link
            to={`/property/${propertyId}`}
            className="block group-hover:text-[#0F766E] transition-colors focus:outline-none"
          >
            <h4 className="font-cairo font-bold text-base text-slate-900 line-clamp-1 leading-snug mb-3">
              {property.title}
            </h4>
          </Link>

          {/* Key Specs Pill Box */}
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="truncate">
                السعة: <strong className="font-bold text-slate-800">{property.totalBeds || 2} طلاب</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bed className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                المتاح: <strong className="font-bold text-emerald-600">{property.availableBeds || 1} سرير</strong>
              </span>
            </div>
          </div>

          {/* Nearby University (if available) */}
          {property.nearbyUniversities && property.nearbyUniversities.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
              <GraduationCap className="w-4 h-4 text-[#0F766E] shrink-0" />
              <span className="font-medium truncate">{property.nearbyUniversities[0].name}</span>
              <span className="text-[11px] text-slate-400 shrink-0">({property.nearbyUniversities[0].distance})</span>
            </div>
          )}

          {/* Amenities Preview */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {property.amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-lg border border-slate-200/50"
                >
                  {amenity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 3. Footer: Price & CTA Button */}
        <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-slate-400 font-semibold leading-none mb-0.5">
              السعر الشهري
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-cairo font-bold text-lg sm:text-xl text-[#0F766E] leading-none">
                {property.monthlyPrice?.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-medium text-slate-500">ج.م / شهر</span>
            </div>
          </div>

          <Link
            to={`/property/${propertyId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-white bg-[#0F766E] hover:bg-[#0B3D3A] shadow-sm hover:shadow transition-all duration-200 active:scale-95 shrink-0"
          >
            <span>عرض التفاصيل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </article>
  );
};
