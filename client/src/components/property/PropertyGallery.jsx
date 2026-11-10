import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Video as VideoIcon,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { getOptimizedImageUrl, isVideoMedia, getVideoPosterUrl } from '../../utils/cloudinary.js';

export const PropertyGallery = ({ images = [], video = null, media = [], title = '' }) => {
  // Normalize all incoming media into a structured list
  const normalizedItems = React.useMemo(() => {
    const list = [];
    const seenUrls = new Set();

    // 1. Process explicit video prop if provided
    if (video) {
      const vUrl = typeof video === 'string' ? video : (video.secure_url || video.url);
      if (vUrl && !seenUrls.has(vUrl)) {
        seenUrls.add(vUrl);
        list.push({
          type: 'video',
          url: vUrl,
          poster: typeof video === 'object' && (video.thumbnail_url || video.poster_url)
            ? (video.thumbnail_url || video.poster_url)
            : getVideoPosterUrl(vUrl),
          title: 'فيديو المعاينة',
        });
      }
    }

    // 2. Process media array if provided
    if (Array.isArray(media) && media.length > 0) {
      media.forEach((m) => {
        const url = typeof m === 'string' ? m : (m.secure_url || m.url);
        if (!url || seenUrls.has(url)) return;
        seenUrls.add(url);

        const isVid = (typeof m === 'object' && m.resource_type === 'video') || isVideoMedia(url);
        if (isVid) {
          list.push({
            type: 'video',
            url,
            poster: typeof m === 'object' && (m.thumbnail_url || m.poster_url)
              ? (m.thumbnail_url || m.poster_url)
              : getVideoPosterUrl(url),
            title: 'فيديو العقار',
          });
        } else {
          list.push({
            type: 'image',
            url,
            title: `صورة ${list.length + 1}`,
          });
        }
      });
    }

    // 3. Process images array
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((item) => {
        const url = typeof item === 'string' ? item : (item.secure_url || item.url);
        if (!url || seenUrls.has(url)) return;
        seenUrls.add(url);

        const isVid = isVideoMedia(url);
        if (isVid) {
          list.push({
            type: 'video',
            url,
            poster: getVideoPosterUrl(url),
            title: 'فيديو العقار',
          });
        } else {
          list.push({
            type: 'image',
            url,
            title: `صورة ${list.length + 1}`,
          });
        }
      });
    }

    // Fallback if empty
    if (list.length === 0) {
      list.push({
        type: 'image',
        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1280&q=80',
        title: 'صورة افتراضية',
      });
    }

    return list;
  }, [images, video, media]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Touch Swipe coordinates
  const [touchStartX, setTouchStartX] = useState(null);

  // Video element reference to stop playback on switch
  const videoRef = useRef(null);

  // Find video index if any
  const videoItemIndex = normalizedItems.findIndex(item => item.type === 'video');
  const hasVideo = videoItemIndex !== -1;

  // Next / Prev Navigation
  const prevMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentIndex(prev => (prev === 0 ? normalizedItems.length - 1 : prev - 1));
  }, [normalizedItems.length]);

  const nextMedia = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setCurrentIndex(prev => (prev === normalizedItems.length - 1 ? 0 : prev + 1));
  }, [normalizedItems.length]);

  // Lightbox Navigation
  const openLightbox = (index) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
  };

  const prevLightbox = useCallback(() => {
    setZoomLevel(1);
    setLightboxIndex(prev => (prev === 0 ? normalizedItems.length - 1 : prev - 1));
  }, [normalizedItems.length]);

  const nextLightbox = useCallback(() => {
    setZoomLevel(1);
    setLightboxIndex(prev => (prev === normalizedItems.length - 1 ? 0 : prev + 1));
  }, [normalizedItems.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') prevLightbox();
      if (e.key === 'ArrowLeft') nextLightbox();
      if (e.key === '+' || e.key === '=') setZoomLevel(z => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoomLevel(z => Math.max(z - 0.25, 0.75));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, prevLightbox, nextLightbox]);

  // Touch handling for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        // Swipe left -> Next media (in RTL: previous index or next)
        nextMedia();
      } else {
        // Swipe right -> Prev media
        prevMedia();
      }
    }
    setTouchStartX(null);
  };

  const currentItem = normalizedItems[currentIndex] || normalizedItems[0];
  const isVideoActive = currentItem.type === 'video';

  return (
    <div className="space-y-3 font-cairo select-none" dir="rtl">
      
      {/* ─── Top Controls Bar (Video jump button + Media counter) ─── */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {hasVideo && (
            <button
              type="button"
              onClick={() => {
                if (videoRef.current) videoRef.current.pause();
                setCurrentIndex(videoItemIndex);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs shadow-xs active:scale-95 ${
                currentIndex === videoItemIndex
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-teal-50 hover:bg-teal-100 text-sakanly-primary border border-teal-200'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>مشاهدة فيديو العقار</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </button>
          )}

          <span className="text-slate-500 font-medium hidden sm:inline">
            {normalizedItems.filter(i => i.type === 'image').length} صور
            {hasVideo && ' • فيديو معاينة'}
          </span>
        </div>

        {/* Counter Badge */}
        <div className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-200">
          {isVideoActive ? (
            <VideoIcon className="w-3.5 h-3.5 text-amber-600" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-sakanly-primary" />
          )}
          <span>{currentIndex + 1} من {normalizedItems.length}</span>
        </div>
      </div>

      {/* ─── Main Viewport (Image or Video) ─── */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-sakanly-border shadow-md group"
      >
        {isVideoActive ? (
          <div className="w-full h-full flex items-center justify-center bg-black relative">
            <video
              ref={videoRef}
              key={currentItem.url}
              src={currentItem.url}
              poster={currentItem.poster}
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              className="w-full h-full object-contain"
            >
              متصفحك لا يدعم تشغيل هذا الفيديو.
            </video>
          </div>
        ) : (
          <div
            onClick={() => openLightbox(currentIndex)}
            className="w-full h-full cursor-zoom-in relative"
          >
            <img
              src={getOptimizedImageUrl(currentItem.url, { width: 1280, height: 720, crop: 'limit' })}
              alt={`${title} - ${currentItem.title}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Click to expand pill */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>تكبير الصورة (Lightbox)</span>
            </div>
          </div>
        )}

        {/* Navigation Arrows */}
        {normalizedItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevMedia}
              aria-label="السابق"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all active:scale-95 z-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={nextMedia}
              aria-label="التالي"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-lg transition-all active:scale-95 z-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {/* ─── Thumbnails Strip ─── */}
      {normalizedItems.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-2 sakanly-scrollbar touch-pan-x -mx-1 px-1">
          {normalizedItems.map((item, idx) => {
            const isVid = item.type === 'video';
            const thumbUrl = isVid
              ? (item.poster || getVideoPosterUrl(item.url))
              : getOptimizedImageUrl(item.url, { width: 160, height: 100, crop: 'fill' });

            const isSelected = currentIndex === idx;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (videoRef.current) videoRef.current.pause();
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all bg-slate-900 group ${
                  isSelected
                    ? 'border-sakanly-primary ring-2 ring-sakanly-primary/30 scale-[1.02] shadow-sm'
                    : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-400'
                }`}
              >
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`مصغرة ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                    <VideoIcon className="w-5 h-5" />
                  </div>
                )}

                {/* Video Play Badge on thumbnail */}
                {isVid && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                      فيديو
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Fullscreen Lightbox Modal ─── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 animate-fade-in select-none"
          dir="rtl"
        >
          {/* Lightbox Header Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm sm:text-base text-white line-clamp-1">
                {title || 'معرض صور العقار'}
              </span>
              <span className="text-xs text-slate-400 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                {lightboxIndex + 1} / {normalizedItems.length}
              </span>
            </div>

            {/* Zoom & Close Controls */}
            <div className="flex items-center gap-2">
              {normalizedItems[lightboxIndex]?.type !== 'video' && (
                <>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="تكبير (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.75))}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="تصغير (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="إعادة ضبط الحجم"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={closeLightbox}
                className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-colors mr-2"
                title="إغلاق المعرض (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden my-4">
            {normalizedItems[lightboxIndex]?.type === 'video' ? (
              <video
                src={normalizedItems[lightboxIndex].url}
                poster={normalizedItems[lightboxIndex].poster}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
              >
                متصفحك لا يدعم تشغيل هذا الفيديو.
              </video>
            ) : (
              <div
                className="transition-transform duration-200 cursor-grab active:cursor-grabbing flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={getOptimizedImageUrl(normalizedItems[lightboxIndex].url, { width: 1920, height: 1080, crop: 'limit' })}
                  alt={`عرض كامل ${lightboxIndex + 1}`}
                  className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl select-none"
                  draggable={false}
                />
              </div>
            )}

            {/* Prev / Next Buttons in Lightbox */}
            {normalizedItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevLightbox}
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
                  title="السابق (سهم يمين)"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextLightbox}
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-all active:scale-95"
                  title="التالي (سهم يسار)"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails Strip */}
          <div className="flex justify-center gap-2 overflow-x-auto py-2 shrink-0 sakanly-scrollbar max-w-2xl mx-auto">
            {normalizedItems.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setLightboxIndex(idx);
                }}
                className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  lightboxIndex === idx
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={item.type === 'video' ? (item.poster || getVideoPosterUrl(item.url)) : getOptimizedImageUrl(item.url, { width: 100, height: 70, crop: 'fill' })}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
