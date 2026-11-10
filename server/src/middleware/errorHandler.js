import { ApiResponse } from '../utils/apiResponse.js';
import { config } from '../config/index.js';

export const errorHandler = (err, req, res, next) => {
  const isProd = config?.isProduction || process.env.NODE_ENV === 'production';

  // Only log full stack in development
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error Handler]:', err.stack || err.message);
  }

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'حدث خطأ غير متوقع في الخادم.';

  // 1. Sanitize MongoDB / Mongoose CastErrors (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'المعرّف المطلوب غير صالح أو بصيغة غير متوافقة.';
  }

  // 2. Sanitize Mongoose ValidationErrors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map(e => e.message);
    message = errors.length > 0 ? errors.join(', ') : 'بيانات الإدخال غير صالحة أو غير مكتملة.';
  }

  // 3. Sanitize MongoDB Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    message = 'هذا السجل (أو البريد الإلكتروني) مسجل بالفعل مسبقاً في النظام.';
  }

  // 4. Sanitize JSON parse error
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'صيغة بيانات الطلب (JSON) غير صالحة.';
  }

  // 5. Hide internal 500 details in production
  if (statusCode === 500 && isProd) {
    message = 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.';
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    !isProd && process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

