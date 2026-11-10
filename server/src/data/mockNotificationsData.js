import { Notification } from '../models/Notification.js';
import { isMongoConnected } from '../config/database.js';

export const initialNotifications = [
  // Owner 1 (Ahmed El-Shennawy) notifications
  {
    id: 'notif-01',
    recipientId: 'usr-owner-001',
    title: 'طلب معاينة جديد',
    message: 'قدم الطالب أحمد علي طلباً لمعاينة شقة عين شمس.',
    time: 'منذ ساعتين',
    type: 'request',
    isRead: false,
    createdAt: '2026-10-20T14:20:00Z',
  },
  {
    id: 'notif-02',
    recipientId: 'usr-owner-001',
    title: 'تأكيد موعد معاينة',
    message: 'تم إرسال تأكيد الموعد للطالبة نادية إبراهيم بنجاح.',
    time: 'منذ يوم',
    type: 'success',
    isRead: true,
    createdAt: '2026-10-19T11:10:00Z',
  },
  {
    id: 'notif-03',
    recipientId: 'usr-owner-001',
    title: 'تحديث توثيق الحساب',
    message: 'تم التحقق من بيانات الهوية وسند الملكية لعقاراتك المسجلة بنجاح.',
    time: 'منذ 3 أيام',
    type: 'verification',
    isRead: true,
    createdAt: '2026-10-17T09:00:00Z',
  },

  // Owner 2 (Tarek Abdelsalam) notifications
  {
    id: 'notif-04',
    recipientId: 'usr-owner-002',
    title: 'طلب معاينة جديد',
    message: 'قدمت الطالبة سارة إبراهيم طلباً لمعاينة استوديو جامعة 6 أكتوبر.',
    time: 'منذ يوم',
    type: 'request',
    isRead: false,
    createdAt: '2026-10-21T09:15:00Z',
  },
  {
    id: 'notif-05',
    recipientId: 'usr-owner-002',
    title: 'تذكير باستكمال التوثيق',
    message: 'يرجى رفع صورة بطاقة الرقم القومي لاعتماد حساب المالك ونشر العقارات للطلاب.',
    time: 'منذ يومين',
    type: 'verification',
    isRead: false,
    createdAt: '2026-10-20T08:00:00Z',
  },

  // Student 1 (Ahmed Ali) notifications
  {
    id: 'notif-06',
    recipientId: 'usr-student-001',
    title: 'تم قبول طلب المعاينة',
    message: 'وافق م. أحمد الشناوي على طلب المعاينة لشقة عين شمس.',
    time: 'منذ 3 ساعات',
    type: 'success',
    isRead: false,
    createdAt: '2026-10-20T15:00:00Z',
  },
];

let currentNotifications = [...initialNotifications];

const persistNotifToDB = (notif) => {
  if (!isMongoConnected() || !notif) return;
  Notification.findOneAndUpdate(
    { id: notif.id },
    { $set: notif },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [NotificationsStore] Failed to persist notification to MongoDB:', err.message);
  });
};

export class NotificationsStore {
  static async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbNotifs = await Notification.find({}).lean();
      if (dbNotifs && dbNotifs.length > 0) {
        for (const dbn of dbNotifs) {
          const idx = currentNotifications.findIndex(n => n.id === dbn.id);
          if (idx >= 0) {
            currentNotifications[idx] = { ...currentNotifications[idx], ...dbn };
          } else {
            currentNotifications.push(dbn);
          }
        }
        console.log(`✅ [NotificationsStore] Hydrated ${dbNotifs.length} notifications from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [NotificationsStore] Error syncing notifications from MongoDB:', err.message);
    }
  }

  static getAll() {
    return [...currentNotifications];
  }

  static getByRecipient(recipientId) {
    return currentNotifications.filter(n => n.recipientId === recipientId);
  }

  static getById(id) {
    return currentNotifications.find(n => n.id === id) || null;
  }

  static create(data) {
    const newNotif = {
      id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: data.time || 'الآن',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...data,
    };
    currentNotifications.unshift(newNotif);
    persistNotifToDB(newNotif);
    return newNotif;
  }

  static markAsRead(id, recipientId) {
    const notif = currentNotifications.find(n => n.id === id && n.recipientId === recipientId);
    if (!notif) return null;
    notif.isRead = true;
    persistNotifToDB(notif);
    return notif;
  }

  static markAllAsRead(recipientId) {
    let count = 0;
    currentNotifications.forEach(n => {
      if (n.recipientId === recipientId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (isMongoConnected()) {
      Notification.updateMany(
        { recipientId, isRead: false },
        { $set: { isRead: true } }
      ).catch(err => {
        console.error('⚠️ [NotificationsStore] Failed to mark all as read in Mongo:', err.message);
      });
    }
    return count;
  }
}
