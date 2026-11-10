import { ApiResponse } from '../utils/apiResponse.js';
import { isMongoConnected } from '../config/database.js';

export class HealthController {
  static getHealth(req, res) {
    const isDbUp = isMongoConnected();
    const healthData = {
      service: 'Sakanly Express API',
      status: 'UP',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: isDbUp ? 'connected' : 'in-memory-fallback',
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      message: 'سيرفر سكنلي يعمل بنجاح ومستعد لاستقبال الطلبات',
    };

    return ApiResponse.success(res, healthData, 'Sakanly API is fully healthy');
  }
}
