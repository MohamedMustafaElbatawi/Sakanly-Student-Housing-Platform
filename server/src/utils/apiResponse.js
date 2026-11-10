import { isMongoConnected } from '../config/database.js';

export class ApiResponse {
  static success(res, data = {}, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      success: true,
      statusCode,
      message,
      data,
      isDemo: !isMongoConnected(),
      timestamp: new Date().toISOString(),
    });
  }

  static error(res, message = 'Something went wrong', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      status: 'error',
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      isDemo: !isMongoConnected(),
      timestamp: new Date().toISOString(),
    });
  }
}
