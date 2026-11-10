/**
 * Cloudinary Media Helper Utilities for Sakanly Frontend
 * Implements f_auto, q_auto optimizations and automatic video poster frame generation
 */

/**
 * Check if a URL or media item represents a video
 */
export const isVideoMedia = (mediaItem) => {
  if (!mediaItem) return false;
  if (typeof mediaItem === 'object') {
    if (mediaItem.resource_type === 'video') return true;
    const url = mediaItem.secure_url || mediaItem.url || '';
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(url);
  }
  if (typeof mediaItem === 'string') {
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(mediaItem) || mediaItem.includes('/video/upload/');
  }
  return false;
};

/**
 * Automatically inject f_auto, q_auto transformations on Cloudinary URLs
 * Returns original URL unmodified if not hosted on Cloudinary
 */
export const getOptimizedImageUrl = (urlOrItem, options = {}) => {
  if (!urlOrItem) return '';

  const rawUrl = typeof urlOrItem === 'object'
    ? (urlOrItem.secure_url || urlOrItem.url || '')
    : urlOrItem;

  if (typeof rawUrl !== 'string' || !rawUrl) return '';

  // If not a Cloudinary URL, return as-is
  if (!rawUrl.includes('res.cloudinary.com')) {
    return rawUrl;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations = [`f_${format}`, `q_${quality}`];
  if (width) transformations.push(`w_${width}`);
  if (height) {
    transformations.push(`h_${height}`);
    transformations.push(`c_${crop}`);
  }

  const transformString = transformations.join(',');

  // If transformation already present in URL
  if (rawUrl.includes('/upload/f_auto') || rawUrl.includes('/upload/q_auto')) {
    return rawUrl;
  }

  // Inject transformation right after /upload/
  return rawUrl.replace('/upload/', `/upload/${transformString}/`);
};

/**
 * Generate a poster image URL for a Cloudinary video by changing extension to .jpg
 */
export const getVideoPosterUrl = (videoUrlOrItem) => {
  if (!videoUrlOrItem) return '';
  if (typeof videoUrlOrItem === 'object') {
    if (videoUrlOrItem.thumbnail_url) return videoUrlOrItem.thumbnail_url;
    if (videoUrlOrItem.poster_url) return videoUrlOrItem.poster_url;
  }
  const rawUrl = typeof videoUrlOrItem === 'object'
    ? (videoUrlOrItem.secure_url || videoUrlOrItem.url || '')
    : videoUrlOrItem;

  if (typeof rawUrl !== 'string' || !rawUrl) return '';

  if (rawUrl.includes('res.cloudinary.com')) {
    // Cloudinary automatically extracts first frame as jpg thumbnail when changing extension
    const withoutExt = rawUrl.substring(0, rawUrl.lastIndexOf('.')) || rawUrl;
    return getOptimizedImageUrl(`${withoutExt}.jpg`, { quality: 'auto', format: 'auto' });
  }

  return '';
};

/**
 * Format raw byte size into human readable string
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
