import { initialConversations } from '../data/mockMessagesData.js';
import { Conversation, Report } from '../models/index.js';
import { isMongoConnected } from '../config/database.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { SocketService } from './socketService.js';

// In-memory conversations store
let conversations = [...initialConversations];

const initialReports = [
  {
    id: 'rep-01',
    conversationId: 'conv-01',
    reportedBy: 'usr-owner-001',
    reporterName: 'م. أحمد الشناوي',
    reason: 'محتوى غير لائق أو رسائل مزعجة',
    status: 'pending_admin_review',
    createdAt: '2026-10-21T15:00:00Z',
  },
  {
    id: 'rep-02',
    conversationId: 'conv-03',
    reportedBy: 'usr-owner-001',
    reporterName: 'م. أحمد الشناوي',
    reason: 'طلب معلومات حساسة أو محاولة احتيال خارج المنصة',
    status: 'pending_admin_review',
    createdAt: '2026-10-22T11:20:00Z',
  },
];

let reports = [...initialReports];

const persistConvToDB = (conv) => {
  if (!isMongoConnected() || !conv) return;
  Conversation.findOneAndUpdate(
    { id: conv.id },
    { $set: conv },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [MessagesService] Failed to persist conversation to MongoDB:', err.message);
  });
};

const persistReportToDB = (report) => {
  if (!isMongoConnected() || !report) return;
  Report.findOneAndUpdate(
    { id: report.id },
    { $set: report },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [MessagesService] Failed to persist report to MongoDB:', err.message);
  });
};

export class MessagesService {
  static async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbConvs = await Conversation.find({}).lean();
      if (dbConvs && dbConvs.length > 0) {
        for (const dbc of dbConvs) {
          const idx = conversations.findIndex(c => c.id === dbc.id);
          if (idx >= 0) {
            conversations[idx] = { ...conversations[idx], ...dbc };
          } else {
            conversations.push(dbc);
          }
        }
        console.log(`✅ [MessagesService] Hydrated ${dbConvs.length} conversations from MongoDB Atlas.`);
      }

      const dbReports = await Report.find({}).lean();
      if (dbReports && dbReports.length > 0) {
        for (const dbr of dbReports) {
          const idx = reports.findIndex(r => r.id === dbr.id);
          if (idx >= 0) {
            reports[idx] = { ...reports[idx], ...dbr };
          } else {
            reports.push(dbr);
          }
        }
        console.log(`✅ [MessagesService] Hydrated ${dbReports.length} reports from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [MessagesService] Error syncing messages from MongoDB:', err.message);
    }
  }

  /**
   * Get all conversations accessible by user (Owner or Student)
   */
  static getConversations(userId, role) {
    let result = [];
    if (role === 'admin' || role === 'super_admin') {
      result = [...conversations];
    } else if (role === 'owner') {
      result = conversations.filter(c => c.ownerId === userId);
    } else if (role === 'student') {
      result = conversations.filter(c => c.studentId === userId);
    }

    // Sort from newest to oldest by last updated or created message
    result.sort((a, b) => {
      const timeA = a.messages && a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].createdAt).getTime() : 0;
      const timeB = b.messages && b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  }

  /**
   * Start or get existing conversation between student and owner for a property
   */
  static initiateConversation({
    studentId,
    studentName,
    studentAvatar,
    ownerId,
    ownerName,
    ownerAvatar,
    ownerPhone,
    propertyId,
    propertyTitle,
    propertyImage,
    propertyPrice,
    propertyType,
    propertyCity,
    initialMessage,
  }) {
    // Check if conversation already exists for this student, owner, and property
    let conv = conversations.find(
      c => c.studentId === studentId && c.ownerId === ownerId && c.propertyId === propertyId
    );

    if (!conv) {
      // Fallback search by studentId and propertyId
      conv = conversations.find(c => c.studentId === studentId && c.propertyId === propertyId);
    }

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ownerId: ownerId,
        ownerName: ownerName || 'مالك العقار',
        ownerAvatar: ownerAvatar || '',
        ownerPhone: ownerPhone || '',
        studentId: studentId,
        studentName: studentName || 'طالب سكنلي',
        studentAvatar: studentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        propertyId: propertyId,
        propertyTitle: propertyTitle || 'سكن طلابي',
        propertyImage: propertyImage || '',
        propertyPrice: Number(propertyPrice) || 0,
        propertyType: propertyType || 'entire_apartment',
        propertyCity: propertyCity || 'القاهرة',
        lastMessage: initialMessage || 'بدء المحادثة',
        lastMessageTime: 'الآن',
        unreadCount: 0,
        unreadCountOwner: 0,
        unreadCountStudent: 0,
        messages: [],
      };
      conversations.unshift(conv);
    } else {
      // Backfill property / owner info if it was missing
      if (propertyImage && !conv.propertyImage) conv.propertyImage = propertyImage;
      if (propertyPrice && !conv.propertyPrice) conv.propertyPrice = Number(propertyPrice);
      if (propertyType && !conv.propertyType) conv.propertyType = propertyType;
      if (propertyCity && !conv.propertyCity) conv.propertyCity = propertyCity;
      if (ownerName && !conv.ownerName) conv.ownerName = ownerName;
      if (ownerAvatar && !conv.ownerAvatar) conv.ownerAvatar = ownerAvatar;
      if (ownerPhone && !conv.ownerPhone) conv.ownerPhone = ownerPhone;
    }

    if (initialMessage && initialMessage.trim()) {
      const newMsg = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'student',
        senderId: studentId,
        senderName: studentName || 'طالب سكنلي',
        text: initialMessage.trim(),
        attachments: [],
        createdAt: now.toISOString(),
        time: timeFormatted,
        read: false,
      };
      conv.messages.push(newMsg);
      conv.lastMessage = newMsg.text;
      conv.lastMessageTime = 'الآن';
      conv.unreadCountOwner = (conv.unreadCountOwner || 0) + 1;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }

    persistConvToDB(conv);

    if (conv.ownerId) {
      SocketService.emitToUser(conv.ownerId, 'conversation_updated', conv);
    }

    return conv;
  }

  /**
   * Get single conversation with full message history and marks unread messages as read
   */
  static getConversationById(convId, userId, role) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return null;

    // Strict Authorization check: user must be participant in this conversation
    if (role !== 'admin' && role !== 'super_admin') {
      if (role === 'owner' && conv.ownerId !== userId) {
        const error = new Error('غير مصرح: لا تملك صلاحية الاطلاع على هذه المحادثة');
        error.status = 403;
        error.code = 'NOT_CONVERSATION_OWNER';
        throw error;
      }
      if (role === 'student' && conv.studentId !== userId) {
        const error = new Error('غير مصرح: لا يمكنك قراءة محادثة مستخدم آخر');
        error.status = 403;
        error.code = 'NOT_CONVERSATION_STUDENT';
        throw error;
      }
    }

    // Mark unread messages as read for this participant
    if (role === 'owner') {
      conv.unreadCountOwner = 0;
      conv.messages.forEach(m => {
        if (m.sender === 'student') m.read = true;
      });
    } else {
      conv.unreadCountStudent = 0;
      conv.messages.forEach(m => {
        if (m.sender === 'owner') m.read = true;
      });
    }
    conv.unreadCount = (conv.unreadCountOwner || 0) + (conv.unreadCountStudent || 0);

    persistConvToDB(conv);
    SocketService.emitConversationRead(conv.id, userId);

    return conv;
  }

  /**
   * Explicitly mark conversation as read
   */
  static markAsRead(convId, userId, role) {
    return this.getConversationById(convId, userId, role);
  }

  /**
   * Send a new message inside conversation
   */
  static sendMessage(convId, userId, role, text, senderName = '', attachments = []) {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) {
      const error = new Error('المحادثة غير موجودة');
      error.status = 404;
      throw error;
    }

    // Strict Authorization check: user must be participant in this conversation
    if (role !== 'admin' && role !== 'super_admin') {
      if (role === 'owner' && conv.ownerId !== userId) {
        const error = new Error('غير مصرح: لا يمكنك إرسال رسائل في محادثة تخص مالكاً آخر');
        error.status = 403;
        error.code = 'NOT_CONVERSATION_OWNER';
        throw error;
      }
      if (role === 'student' && conv.studentId !== userId) {
        const error = new Error('غير مصرح: لا يمكنك إرسال رسائل في محادثة مستخدم آخر');
        error.status = 403;
        error.code = 'NOT_CONVERSATION_STUDENT';
        throw error;
      }
    }

    const trimmed = (text || '').trim();
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!trimmed && !hasAttachments) {
      const error = new Error('محتوى الرسالة فارغ');
      error.status = 400;
      throw error;
    }

    if (trimmed.length > 2000) {
      const error = new Error('طول الرسالة يتجاوز الحد الأقصى المسموح (2000 حرف)');
      error.status = 400;
      throw error;
    }

    // Validate attachments: only allow safe image structures
    const sanitizedAttachments = (attachments || []).map(att => {
      const url = typeof att === 'string' ? att : (att.secure_url || att.url || '');
      return {
        url,
        secure_url: url,
        public_id: att.public_id || '',
        format: att.format || 'jpg',
        bytes: Number(att.bytes) || 0,
        name: att.name || 'image.jpg',
        resource_type: 'image',
      };
    }).filter(att => att.url);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: role === 'owner' ? 'owner' : 'student',
      senderId: userId,
      senderName: senderName || (role === 'owner' ? (conv.ownerName || 'المالك') : (conv.studentName || 'الطالب')),
      text: trimmed,
      attachments: sanitizedAttachments,
      createdAt: now.toISOString(),
      time: timeFormatted,
      read: false,
    };

    conv.messages.push(newMsg);
    conv.lastMessage = trimmed || (sanitizedAttachments.length ? '📷 صورة مرفقة' : '');
    conv.lastMessageTime = 'الآن';

    // Increment unread count for the other party
    if (role === 'student') {
      conv.unreadCountOwner = (conv.unreadCountOwner || 0) + 1;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    } else {
      conv.unreadCountStudent = (conv.unreadCountStudent || 0) + 1;
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }

    persistConvToDB(conv);

    // Emit live message to the conversation room
    SocketService.emitNewMessage(conv.id, newMsg, conv);

    // Notify recipient of new message
    const recipientId = role === 'student' ? conv.ownerId : conv.studentId;
    if (recipientId) {
      SocketService.emitToUser(recipientId, 'conversation_updated', conv);

      NotificationsStore.create({
        recipientId,
        title: role === 'student' ? 'رسالة جديدة من طالب 💬' : 'رسالة جديدة من المالك 💬',
        message: `${newMsg.senderName}: "${trimmed.length > 60 ? trimmed.substring(0, 60) + '...' : (trimmed || '📷 أرسل صورة جديدة')}"`,
        type: 'message',
        targetId: conv.id,
        targetType: 'conversation',
      });
    }

    return {
      message: newMsg,
      conversation: conv,
    };
  }

  /**
   * Get unread messages count for a user across all their conversations
   */
  static getUnreadCount(userId, role) {
    if (!userId) return 0;
    const userConvs = this.getConversations(userId, role);
    return userConvs.reduce((acc, conv) => {
      const count = role === 'owner'
        ? (conv.unreadCountOwner ?? conv.unreadCount ?? 0)
        : (conv.unreadCountStudent ?? conv.unreadCount ?? 0);
      return acc + count;
    }, 0);
  }

  /**
   * Update viewing request status linked to conversation (accept/reject)
   */
  static updateViewingRequestStatus(requestId, userId, role, newStatus) {
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(newStatus)) {
      const error = new Error('حالة طلب المعاينة غير صالحة');
      error.status = 400;
      throw error;
    }

    // Find conversation containing this viewing request
    const conv = conversations.find(c => c.viewingRequest && c.viewingRequest.id === requestId);
    if (!conv || !conv.viewingRequest) {
      const error = new Error('طلب المعاينة غير موجود');
      error.status = 404;
      throw error;
    }

    // Strict Ownership check
    if (role !== 'admin' && role !== 'super_admin' && conv.ownerId !== userId) {
      const error = new Error('غير مصرح: لا يمكنك تعديل طلب معاينة لعقار مسجل لمالك آخر');
      error.status = 403;
      error.code = 'NOT_PROPERTY_OWNER';
      throw error;
    }

    conv.viewingRequest.status = newStatus;

    // Add automated audit message in the conversation stream
    const statusArabic = newStatus === 'accepted' ? 'قبول' : newStatus === 'rejected' ? 'اعتذار عن' : newStatus;
    const sysMsg = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'owner',
      senderId: userId,
      senderName: 'المالك',
      text: `تم ${statusArabic} موعد المعاينة المحدد بتاريخ ${conv.viewingRequest.date} الساعة ${conv.viewingRequest.time}.`,
      attachments: [],
      createdAt: new Date().toISOString(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isSystemNotification: true,
      read: false,
    };
    conv.messages.push(sysMsg);
    conv.lastMessage = sysMsg.text;
    conv.lastMessageTime = 'الآن';

    persistConvToDB(conv);

    SocketService.emitNewMessage(conv.id, sysMsg, conv);

    if (conv.studentId) {
      SocketService.emitToUser(conv.studentId, 'conversation_updated', conv);

      NotificationsStore.create({
        recipientId: conv.studentId,
        title: newStatus === 'accepted' ? 'تمت الموافقة على موعد المعاينة 📅' : (newStatus === 'rejected' ? 'تم الاعتذار عن موعد المعاينة' : 'تحديث حالة موعد المعاينة'),
        message: `قام المالك بتحديث موعد المعاينة لعقار "${conv.propertyTitle}": تم ${statusArabic} الطلب.`,
        type: newStatus === 'accepted' ? 'success' : 'warning',
        targetId: conv.id,
        targetType: 'conversation',
      });
    }

    return {
      viewingRequest: conv.viewingRequest,
      conversation: conv,
    };
  }

  /**
   * Report conversation for moderation
   */
  static reportConversation(convId, userId, reason) {
    const reportEntry = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversationId: convId,
      reportedBy: userId,
      reason: (reason || '').trim() || 'إساءة استخدام أو محتوى غير لائق',
      createdAt: new Date().toISOString(),
      status: 'pending_admin_review',
    };
    reports.push(reportEntry);
    persistReportToDB(reportEntry);
    return reportEntry;
  }

  static getAllReports() {
    return reports;
  }

  static resolveReport(reportId, action, notes) {
    const report = reports.find(r => r.id === reportId);
    if (!report) return null;
    report.status = action === 'dismiss' ? 'dismissed' : 'action_taken';
    report.resolvedAt = new Date().toISOString();
    report.notes = notes || '';
    persistReportToDB(report);
    return report;
  }
}
