import { NotificationsStore } from '../data/mockNotificationsData.js';
import { Notification } from '../models/Notification.js';
import { isMongoConnected } from '../config/database.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class NotificationsController {
  static async getNotifications(req, res, next) {
    try {
      let notifications = [];
      if (isMongoConnected()) {
        try {
          const dbNotifs = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).lean();
          if (dbNotifs && dbNotifs.length > 0) {
            notifications = dbNotifs;
          }
        } catch (dbErr) {
          console.warn('⚠️ [NotificationsController] DB query error, falling back to cache:', dbErr.message);
        }
      }

      // Merge with in-memory store so newly created items are immediately present
      const cached = NotificationsStore.getByRecipient(req.user.id);
      for (const item of cached) {
        const existingIdx = notifications.findIndex(n => n.id === item.id);
        if (existingIdx === -1) {
          notifications.push(item);
        }
      }

      // Sort by newest first
      notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const unreadCount = notifications.filter(n => !n.isRead).length;

      return ApiResponse.success(res, {
        notifications,
        total: notifications.length,
        unreadCount,
      }, 'Notifications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      let notif = NotificationsStore.getById(id);
      if (!notif && isMongoConnected()) {
        notif = await Notification.findOne({ id }).lean();
      }
      if (!notif) {
        return ApiResponse.error(res, 'الإشعار غير موجود', 404);
      }

      // Strict ownership check: Cannot touch another user's notification
      if (notif.recipientId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'غير مصرح: لا تملك صلاحية تعديل إشعار يخص مستخدماً آخر.',
        });
      }

      const updated = NotificationsStore.markAsRead(id, req.user.id);
      if (isMongoConnected()) {
        await Notification.updateOne({ id }, { $set: { isRead: true } });
      }

      return ApiResponse.success(res, updated || { ...notif, isRead: true }, 'تم تعيين الإشعار كمقروء');
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const count = NotificationsStore.markAllAsRead(req.user.id);
      if (isMongoConnected()) {
        await Notification.updateMany({ recipientId: req.user.id, isRead: false }, { $set: { isRead: true } });
      }
      return ApiResponse.success(res, { markedCount: count }, 'تم تعيين جميع الإشعارات كمقروءة');
    } catch (err) {
      next(err);
    }
  }
}
