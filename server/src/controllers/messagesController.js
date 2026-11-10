import { MessagesService } from '../services/messagesService.js';
import { ListingsService } from '../services/listingsService.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class MessagesController {
  static getConversations(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const list = MessagesService.getConversations(req.user.id, req.user.role);
      return ApiResponse.success(res, {
        conversations: list,
        total: list.length,
      }, 'تم جلب المحادثات بنجاح');
    } catch (err) {
      next(err);
    }
  }

  static initiateConversation(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لبدء المحادثة مع المالك.',
        });
      }

      const {
        propertyId,
        propertyTitle,
        propertyImage,
        propertyPrice,
        propertyType,
        propertyCity,
        ownerId,
        ownerName,
        ownerAvatar,
        ownerPhone,
        initialMessage,
      } = req.body;

      if (!propertyId) {
        return res.status(400).json({
          success: false,
          message: 'معرف العقار مطلوب لبدء المحادثة.',
        });
      }

      const listing = ListingsService.getById(propertyId);
      const targetOwnerId = listing?.owner?.id || ownerId;
      const targetTitle = listing?.title || propertyTitle || 'سكن طلابي';
      const targetImage = listing?.images?.[0] || propertyImage || '';
      const targetPrice = listing?.monthlyPrice || propertyPrice || 0;
      const targetType = listing?.accommodationType || propertyType || 'entire_apartment';
      const targetCity = listing?.city || propertyCity || 'القاهرة';
      const targetOwnerName = listing?.owner?.name || ownerName || 'مالك العقار';
      const targetOwnerAvatar = listing?.owner?.avatar || ownerAvatar || '';
      const targetOwnerPhone = listing?.contactPhone || listing?.owner?.phone || ownerPhone || '';

      if (!targetOwnerId) {
        return res.status(404).json({
          success: false,
          message: 'العقار المطلوب غير موجود أو غير مرتبط بمالك مسجل.',
        });
      }

      const conversation = MessagesService.initiateConversation({
        studentId: req.user.id,
        studentName: req.user.fullName || req.user.name,
        studentAvatar: req.user.avatar,
        ownerId: targetOwnerId,
        ownerName: targetOwnerName,
        ownerAvatar: targetOwnerAvatar,
        ownerPhone: targetOwnerPhone,
        propertyId,
        propertyTitle: targetTitle,
        propertyImage: targetImage,
        propertyPrice: targetPrice,
        propertyType: targetType,
        propertyCity: targetCity,
        initialMessage,
      });

      return ApiResponse.success(res, { conversation }, 'تم بدء المحادثة بنجاح');
    } catch (err) {
      next(err);
    }
  }

  static getConversationById(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { id } = req.params;
      const conversation = MessagesService.getConversationById(id, req.user.id, req.user.role);
      if (!conversation) {
        return ApiResponse.error(res, 'المحادثة غير موجودة', 404);
      }

      return ApiResponse.success(res, { conversation }, 'تم جلب تفاصيل المحادثة بنجاح');
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      next(err);
    }
  }

  static markAsRead(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { id } = req.params;
      const conversation = MessagesService.markAsRead(id, req.user.id, req.user.role);
      if (!conversation) {
        return ApiResponse.error(res, 'المحادثة غير موجودة', 404);
      }

      return ApiResponse.success(res, { conversation }, 'تم تحديث حالة القراءة');
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      next(err);
    }
  }

  static sendMessage(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً لإرسال الرسائل.',
        });
      }

      const { id } = req.params;
      const { text, attachments } = req.body;

      const result = MessagesService.sendMessage(
        id,
        req.user.id,
        req.user.role,
        text,
        req.user.fullName || req.user.name,
        attachments
      );

      return ApiResponse.success(res, result, 'تم إرسال الرسالة بنجاح', 201);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      next(err);
    }
  }

  static getUnreadCount(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const unreadCount = MessagesService.getUnreadCount(req.user.id, req.user.role);
      return ApiResponse.success(res, { unreadCount }, 'تم جلب عدد الرسائل غير المقروءة');
    } catch (err) {
      next(err);
    }
  }

  static updateViewingRequestStatus(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { id } = req.params;
      const { status } = req.body;

      const result = MessagesService.updateViewingRequestStatus(
        id,
        req.user.id,
        req.user.role,
        status
      );

      return ApiResponse.success(res, result, 'تم تحديث حالة طلب المعاينة بنجاح');
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }
      next(err);
    }
  }

  static reportConversation(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يرجى تسجيل الدخول أولاً.',
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      const report = MessagesService.reportConversation(id, req.user.id, reason);
      return ApiResponse.success(res, { report }, 'تم استلام بلاغك وسيقوم فريق الدعم بفحصه في أقرب وقت.');
    } catch (err) {
      next(err);
    }
  }
}
