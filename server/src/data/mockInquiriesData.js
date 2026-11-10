import { Inquiry } from '../models/Inquiry.js';
import { isMongoConnected } from '../config/database.js';

export const initialInquiries = [
  {
    id: 'req-01',
    applicant: {
      id: 'usr-student-001',
      fullName: 'أحمد علي (طالب تجريبي)',
      phone: '01012345678',
      email: 'student@sakanly.com',
    },
    ownerId: 'usr-owner-001',
    listingId: 'prop-001',
    listingTitle: 'شقة طلابية مودرن مجهزة بالكامل بالقرب من جامعة عين شمس',
    moveInDate: '2026-10-25',
    message: 'أرغب في حجز موعد للمعاينة يوم السبت القادم',
    status: 'pending_owner_confirmation',
    createdAt: '2026-10-20T14:20:00Z',
  },
  {
    id: 'req-02',
    applicant: {
      id: 'usr-student-001',
      fullName: 'أحمد علي (طالب تجريبي)',
      phone: '01012345678',
      email: 'student@sakanly.com',
    },
    ownerId: 'usr-owner-001',
    listingId: 'prop-002',
    listingTitle: 'سرير فردي في غرفة ثنائية راقية للبنات - الدقي',
    moveInDate: '2026-10-26',
    message: 'جاهز للتعاقد بعد المعاينة',
    status: 'accepted',
    createdAt: '2026-10-19T11:10:00Z',
  },
  {
    id: 'req-03',
    applicant: {
      id: 'usr-email-001',
      fullName: 'سارة إبراهيم',
      phone: '01511223344',
      email: 'sara.email@sakanly.com',
    },
    ownerId: 'usr-owner-002',
    listingId: 'prop-004',
    listingTitle: 'استوديو شبابي مستقل بجوار جامعة 6 أكتوبر',
    moveInDate: '2026-10-28',
    message: 'يرغب في معرفة سرعة الإنترنت وتوافر موقف سيارات',
    status: 'pending_owner_confirmation',
    createdAt: '2026-10-21T09:15:00Z',
  },
];

let currentInquiries = [...initialInquiries];

const persistInquiryToDB = (inquiry) => {
  if (!isMongoConnected() || !inquiry) return;
  Inquiry.findOneAndUpdate(
    { id: inquiry.id },
    { $set: inquiry },
    { upsert: true, returnDocument: 'after' }
  ).catch(err => {
    console.error('⚠️ [InquiriesStore] Failed to persist inquiry to MongoDB:', err.message);
  });
};

export class InquiriesStore {
  static async syncFromDB() {
    if (!isMongoConnected()) return;
    try {
      const dbInquiries = await Inquiry.find({}).lean();
      if (dbInquiries && dbInquiries.length > 0) {
        for (const dbi of dbInquiries) {
          const idx = currentInquiries.findIndex(i => i.id === dbi.id);
          if (idx >= 0) {
            currentInquiries[idx] = { ...currentInquiries[idx], ...dbi };
          } else {
            currentInquiries.push(dbi);
          }
        }
        console.log(`✅ [InquiriesStore] Hydrated ${dbInquiries.length} inquiries from MongoDB Atlas.`);
      }
    } catch (err) {
      console.error('❌ [InquiriesStore] Error syncing inquiries from MongoDB:', err.message);
    }
  }

  static getAll() {
    return [...currentInquiries];
  }

  static getByOwner(ownerId) {
    return currentInquiries.filter(item => item.ownerId === ownerId);
  }

  static getByStudent(studentId) {
    return currentInquiries.filter(item => item.applicant?.id === studentId);
  }

  static getById(id) {
    return currentInquiries.find(item => item.id === id) || null;
  }

  static create(inquiryData) {
    const newInquiry = {
      id: inquiryData.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: inquiryData.status || 'pending_owner_confirmation',
      createdAt: new Date().toISOString(),
      ...inquiryData,
    };
    currentInquiries.unshift(newInquiry);
    persistInquiryToDB(newInquiry);
    return newInquiry;
  }

  static updateStatus(id, newStatus) {
    const inquiry = currentInquiries.find(item => item.id === id);
    if (!inquiry) return null;
    inquiry.status = newStatus;
    inquiry.updatedAt = new Date().toISOString();
    persistInquiryToDB(inquiry);
    return inquiry;
  }
}
