import { ApiResponse } from '../utils/apiResponse.js';

export const validateListingQuery = (req, res, next) => {
  const { minPrice, maxPrice } = req.query;

  if (minPrice && (isNaN(Number(minPrice)) || Number(minPrice) < 0)) {
    return ApiResponse.error(res, 'minPrice must be a positive number', 400);
  }

  if (maxPrice && (isNaN(Number(maxPrice)) || Number(maxPrice) < 0)) {
    return ApiResponse.error(res, 'maxPrice must be a positive number', 400);
  }

  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    return ApiResponse.error(res, 'minPrice cannot exceed maxPrice', 400);
  }

  next();
};

export const validateInquiry = (req, res, next) => {
  const listingId = req.body.listingId;
  const fullName = req.body.fullName || req.body.applicant?.fullName || req.user?.fullName;
  const phone = req.body.phone || req.body.applicant?.phone || req.user?.phone;

  if (!listingId) {
    return ApiResponse.error(res, 'معرف العقار (listingId) مطلوب لإرسال طلب المعاينة', 400);
  }
  if (!fullName) {
    return ApiResponse.error(res, 'الاسم الكامل مطلوب لإرسال طلب المعاينة', 400);
  }
  if (!phone) {
    return ApiResponse.error(res, 'رقم الهاتف مطلوب للتواصل وتأكيد المعاينة', 400);
  }

  next();
};

export const validateCreateListing = (req, res, next) => {
  const { title, accommodationType, city, monthlyPrice } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length < 5) {
    return ApiResponse.error(res, 'عنوان الإعلان مطلوب ويجب أن يحتوي على 5 أحرف على الأقل', 400);
  }

  const validTypes = ['entire_apartment', 'private_room', 'shared_room', 'individual_bed'];
  if (!accommodationType || !validTypes.includes(accommodationType)) {
    return ApiResponse.error(res, 'نوع السكن غير صالح. يرجى اختيار نوع سكن معتمد', 400);
  }

  if (!city || typeof city !== 'string' || !city.trim()) {
    return ApiResponse.error(res, 'المدينة مطلوبة لتحديد موقع السكن', 400);
  }

  if (!monthlyPrice || isNaN(Number(monthlyPrice)) || Number(monthlyPrice) <= 0) {
    return ApiResponse.error(res, 'قيمة الإيجار الشهري يجب أن تكون رقماً موجباً بالجنيه المصري', 400);
  }

  next();
};

