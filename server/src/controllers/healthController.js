import { ApiResponse } from '../utils/apiResponse.js';
import { isMongoConnected } from '../config/database.js';
import { config } from '../config/index.js';

export class HealthController {
  static getHealth(req, res) {
    const isDbUp = isMongoConnected();
    const isProd = config.isProduction || process.env.NODE_ENV === 'production';

    const healthData = {
      service: 'Sakanly Express API',
      status: 'UP',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
      database: isDbUp ? 'connected' : (isProd ? 'disconnected' : 'in-memory-fallback'),
      message: 'سيرفر سكنلي يعمل بنجاح ومستعد لاستقبال الطلبات',
    };

    // Include system diagnostics in non-production environments only
    // Kept hidden in production to prevent OS/platform fingerprinting
    if (!isProd) {
      healthData.system = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };
    }

    return ApiResponse.success(res, healthData, 'Sakanly API is fully healthy');
  }
}

