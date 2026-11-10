import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize2, GraduationCap } from 'lucide-react';
import { AccommodationBadge, GenderBadge, VerifiedBadge } from '../common/Badge.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getOptimizedImageUrl } from '../../utils/cloudinary.js';

export const PropertyCard = ({ property, featured = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const propertyId = property.id || property._id;
  const favorited = isFavorite(propertyId, property._id);

  const mainImage = property.images?.[0] || '';
  const optimizedMainImage = getOptimizedImageUrl(mainImage, { width: 640, height: 400, crop: 'fill' });

  return (
    <div className="group bg-white rounded-2xl border border-sakanly-border overflow-hidden shadow-card hover:shadow-card-hover hover:border-teal-200 transition-all duration-300 flex flex-col h-full">

      {/* Image Container with Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={optimizedMainImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=640&q=80'}
          alt={property.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=640&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out "
        />

        {/* Gradient Overlay for badges contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            <AccommodationBadge type={property.accommodationType} className="shadow-sm" />
            {property.isVerified && <VerifiedBadge text="موثق" className="shadow-sm" />}
          </div>

          {/* Favorite Button */}
          <button
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
            aria-label="إضافة للمفضلة"
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-white shadow-md transition-all active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                }`}
            />
          </button>
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between pointer-events-none">
          <GenderBadge gender={property.genderPreference} className="shadow-sm backdrop-blur-sm" />

          <div className="bg-sakanly-dark/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
            {property.availableBeds} {property.availableBeds === 1 ? 'مكان متاح' : 'أماكن متاحة'}
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>

          {/* Price & Location */}
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <span className="text-lg sm:text-xl font-bold text-sakanly-primary font-cairo">
                {property.monthlyPrice.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs text-sakanly-muted mr-1 font-medium">ج.م / شهرياً</span>
            </div>
            {property.utilitiesCost > 0 && (
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                + {property.utilitiesCost} ج فواتير
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/property/${propertyId}`} className="block group-hover:text-sakanly-primary transition-colors">
            <h3 className="text-[15px] sm:text-base font-bold text-sakanly-dark line-clamp-1 mb-2 leading-snug">
              {property.title}
            </h3>
          </Link>

          {/* Location Line */}
          <div className="flex items-center gap-1.5 text-xs text-sakanly-muted mb-3">
            <MapPin className="w-3.5 h-3.5 text-sakanly-primary shrink-0" />
            <span className="truncate">{property.governorate} • {property.city} • {property.district}</span>
          </div>

          {/* Nearby University Pill */}
          {property.nearbyUniversities && property.nearbyUniversities.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-lg border border-slate-100 mb-3">
              <GraduationCap className="w-3.5 h-3.5 text-sakanly-primary shrink-0" />
              <span className="truncate font-medium">{property.nearbyUniversities[0].name}</span>
              <span className="text-[11px] text-slate-400 mr-auto shrink-0 font-normal">
                ({property.nearbyUniversities[0].distance})
              </span>
            </div>
          )}

          {/* Key Specs Row */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-t border-sakanly-border pt-3">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} غرف</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} حمام</span>
            </div>
            {property.area && (
              <div className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{property.area} م²</span>
              </div>
            )}
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-4 mt-2">
          <Link
            to={`/property/${propertyId}`}
            className="w-full inline-flex items-center justify-center text-center py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold text-sakanly-primary bg-teal-50 hover:bg-sakanly-primary hover:text-white transition-all duration-200"
          >
            عرض التفاصيل والمعاينة
          </Link>
        </div>

      </div>

    </div>
  );
};
