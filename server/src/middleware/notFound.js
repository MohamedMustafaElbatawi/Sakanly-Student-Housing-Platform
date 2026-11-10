import { ApiResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res) => {
  return ApiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
