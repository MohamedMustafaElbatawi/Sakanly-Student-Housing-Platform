import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import { User } from '../models/User.js';
import { Listing } from '../models/Listing.js';
import { Notification } from '../models/Notification.js';
import { userStore } from '../data/mockUsers.js';
import { ListingsService } from '../services/listingsService.js';
import { NotificationsStore } from '../data/mockNotificationsData.js';
import { InquiriesStore } from '../data/mockInquiriesData.js';
import { ListingsController } from '../controllers/listingsController.js';
import { NotificationsController } from '../controllers/notificationsController.js';
import { normalizeEgyptianPhone, toInternationalFormat } from '../services/smsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
  };
  return res;
};

const mockNext = (err) => {
  if (err) throw err;
};

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 SAKANLY OWNER DASHBOARD & CONTACT PHONE TEST SUITE');
  console.log('======================================================\n');

  await connectDB();

  const testOwnerAId = `test-own-a-${Date.now()}`;
  const testOwnerBId = `test-own-b-${Date.now()}`;
  const testStudentId = `test-std-${Date.now()}`;

  const ownerA = {
    id: testOwnerAId,
    fullName: 'المالك حسام فوزي',
    email: `hossam.${Date.now()}@sakanly-test.com`,
    phone: '+201011112222',
    role: 'owner',
    isVerified: true,
    verificationStatus: 'verified',
  };

  const ownerB = {
    id: testOwnerBId,
    fullName: 'المالك وائل النجار',
    email: `wael.${Date.now()}@sakanly-test.com`,
    phone: '+201133334444',
    role: 'owner',
    isVerified: true,
    verificationStatus: 'verified',
  };

  const student = {
    id: testStudentId,
    fullName: 'الطالب كريم سعيد',
    email: `karim.${Date.now()}@sakanly-test.com`,
    role: 'student',
  };

  userStore.findAll().push(ownerA, ownerB, student);

  let createdListingId = null;

  try {
    // -----------------------------------------------------------------
    // Scenario 1: Owner adds property with valid contact phone and whatsapp
    // -----------------------------------------------------------------
    console.log('--- 1. Testing Owner Adds Property with Valid Egyptian Contact Phone ---');
    {
      const req = {
        user: ownerA,
        body: {
          title: 'شقة مفروشة فاخرة للطلاب بالدقي',
          city: 'الدقي والمهندسين',
          district: 'مصدق',
          governorate: 'الجيزة',
          accommodationType: 'entire_apartment',
          monthlyPrice: 12500,
          contactPhone: '01012345678',
          whatsappPhone: '01198765432',
          showContactPhone: true,
          status: 'pending_review',
        },
      };
      const res = mockRes();
      ListingsController.createListing(req, res, mockNext);

      assert.strictEqual(res.statusCode, 201, 'Should return HTTP 201 Created');
      assert.strictEqual(res.jsonData.success, true);
      const listing = res.jsonData.data;
      createdListingId = listing.id;

      assert.strictEqual(listing.contactPhone, '+201012345678', 'Contact phone must be normalized to +20 format');
      assert.strictEqual(listing.whatsappPhone, '+201198765432', 'WhatsApp phone must be normalized to +20 format');
      assert.strictEqual(listing.showContactPhone, true, 'showContactPhone must be true');
      console.log('  ✅ [PASS] Property created with valid contact numbers and normalized to E.164');
    }

    // -----------------------------------------------------------------
    // Scenario 2: Validate Data Persistence in MongoDB Atlas
    // -----------------------------------------------------------------
    console.log('\n--- 2. Testing Persistence of Contact Details in MongoDB Atlas ---');
    {
      // Wait brief moment for async mongoose save
      await new Promise(r => setTimeout(r, 600));
      const dbDoc = await Listing.findOne({ id: createdListingId }).lean();
      assert(dbDoc, 'Listing must exist in MongoDB Atlas');
      assert.strictEqual(dbDoc.contactPhone, '+201012345678', 'MongoDB contactPhone must match');
      assert.strictEqual(dbDoc.whatsappPhone, '+201198765432', 'MongoDB whatsappPhone must match');
      assert.strictEqual(dbDoc.showContactPhone, true, 'MongoDB showContactPhone must match');
      console.log('  ✅ [PASS] Contact phone, whatsapp, and permission flag verified in MongoDB Atlas');
    }

    // -----------------------------------------------------------------
    // Scenario 3: Owner Updates Contact Information
    // -----------------------------------------------------------------
    console.log('\n--- 3. Testing Owner Updating Contact Information ---');
    {
      const req = {
        user: ownerA,
        params: { id: createdListingId },
        body: {
          contactPhone: '01234567890',
          whatsappPhone: '01512345678',
          showContactPhone: true,
        },
      };
      const res = mockRes();
      ListingsController.updateListing(req, res, mockNext);

      assert.strictEqual(res.statusCode, 200);
      const updated = res.jsonData.data;
      assert.strictEqual(updated.contactPhone, '+201234567890');
      assert.strictEqual(updated.whatsappPhone, '+201512345678');

      // Verify update in MongoDB
      await new Promise(r => setTimeout(r, 600));
      const dbDoc = await Listing.findOne({ id: createdListingId }).lean();
      assert.strictEqual(dbDoc.contactPhone, '+201234567890');
      assert.strictEqual(dbDoc.whatsappPhone, '+201512345678');
      console.log('  ✅ [PASS] Contact information updated successfully and persisted to MongoDB');
    }

    // -----------------------------------------------------------------
    // Scenario 4: Student views approved property with showContactPhone enabled
    // -----------------------------------------------------------------
    console.log('\n--- 4. Testing Student Viewing Approved Property (showContactPhone: true) ---');
    {
      // Simulate admin approval
      ListingsService.updateStatus(createdListingId, 'active');
      await Listing.updateOne({ id: createdListingId }, { $set: { status: 'active', isVerified: true } });

      const req = {
        user: student,
        params: { id: createdListingId },
      };
      const res = mockRes();
      ListingsController.getListingById(req, res, mockNext);

      assert.strictEqual(res.statusCode, 200);
      const studentView = res.jsonData.data.listing;
      assert.strictEqual(studentView.contactPhone, '+201234567890', 'Student should see contact phone');
      assert.strictEqual(studentView.whatsappPhone, '+201512345678', 'Student should see whatsapp phone');
      assert.strictEqual(studentView.showContactPhone, true);
      console.log('  ✅ [PASS] Student can see contact phone & WhatsApp on approved property');
    }

    // -----------------------------------------------------------------
    // Scenario 5: Student views approved property when showContactPhone is disabled
    // -----------------------------------------------------------------
    console.log('\n--- 5. Testing Privacy: Student cannot see contact phone when showContactPhone: false ---');
    {
      // Owner disables contact phone display
      const updateReq = {
        user: ownerA,
        params: { id: createdListingId },
        body: {
          showContactPhone: false,
        },
      };
      const updateRes = mockRes();
      ListingsController.updateListing(updateReq, updateRes, mockNext);
      assert.strictEqual(updateRes.statusCode, 200);

      // Student views property
      const viewReq = {
        user: student,
        params: { id: createdListingId },
      };
      const viewRes = mockRes();
      ListingsController.getListingById(viewReq, viewRes, mockNext);

      assert.strictEqual(viewRes.statusCode, 200);
      const studentView = viewRes.jsonData.data.listing;
      assert.strictEqual(studentView.contactPhone, null, 'contactPhone must be stripped/null for student');
      assert.strictEqual(studentView.whatsappPhone, null, 'whatsappPhone must be stripped/null for student');
      assert.strictEqual(studentView.showContactPhone, false);

      // But owner viewing their own property can still see their saved numbers
      const ownerViewReq = {
        user: ownerA,
        params: { id: createdListingId },
      };
      const ownerViewRes = mockRes();
      ListingsController.getListingById(ownerViewReq, ownerViewRes, mockNext);
      assert.strictEqual(ownerViewRes.jsonData.data.listing.contactPhone, '+201234567890', 'Owner can still see own numbers');
      console.log('  ✅ [PASS] Privacy enforced: Contact numbers completely stripped from student response');
    }

    // -----------------------------------------------------------------
    // Scenario 6: Contact action link formats (tel & whatsapp)
    // -----------------------------------------------------------------
    console.log('\n--- 6. Testing Dial and WhatsApp Link Formatting ---');
    {
      const rawPhone = '+201234567890';
      const cleanTel = `tel:${rawPhone.replace(/\s+/g, '')}`;
      const cleanWaDigits = rawPhone.replace(/\D/g, '');
      const waLink = `https://wa.me/${cleanWaDigits}`;

      assert.strictEqual(cleanTel, 'tel:+201234567890', 'tel: link format valid');
      assert.strictEqual(waLink, 'https://wa.me/201234567890', 'wa.me link format valid');
      console.log('  ✅ [PASS] Telephone dialer and WhatsApp chat links format cleanly');
    }

    // -----------------------------------------------------------------
    // Scenario 7: New Notification Generated & Retrieved for Owner
    // -----------------------------------------------------------------
    console.log('\n--- 7. Testing Notification Generation & Retrieval for Owner ---');
    {
      const createdNotif = NotificationsStore.create({
        recipientId: testOwnerAId,
        title: 'طلب معاينة جديد 📅',
        message: 'قدم الطالب كريم سعيد طلباً لمعاينة شقة الدقي.',
        type: 'request',
        targetId: createdListingId,
        targetType: 'inquiry',
      });

      assert(createdNotif.id, 'Notification must receive an ID');
      assert.strictEqual(createdNotif.isRead, false);

      const req = { user: ownerA };
      const res = mockRes();
      await NotificationsController.getNotifications(req, res, mockNext);

      assert.strictEqual(res.statusCode, 200);
      const notifs = res.jsonData.data.notifications;
      const found = notifs.find(n => n.id === createdNotif.id);
      assert(found, 'Created notification must be retrieved in owner notification list');
      assert.strictEqual(found.recipientId, testOwnerAId);
      assert.strictEqual(res.jsonData.data.unreadCount >= 1, true, 'Unread count must be >= 1');
      console.log('  ✅ [PASS] New notification appears in Owner A dashboard with correct unread count');
    }

    // -----------------------------------------------------------------
    // Scenario 8: Mark Single Notification as Read Updates Unread Count
    // -----------------------------------------------------------------
    console.log('\n--- 8. Testing Marking Single Notification as Read ---');
    {
      const reqListBefore = { user: ownerA };
      const resListBefore = mockRes();
      await NotificationsController.getNotifications(reqListBefore, resListBefore, mockNext);
      const countBefore = resListBefore.jsonData.data.unreadCount;

      // Find an unread notification
      const unreadNotif = resListBefore.jsonData.data.notifications.find(n => !n.isRead);
      assert(unreadNotif, 'Should have at least one unread notification');

      const reqMark = { user: ownerA, params: { id: unreadNotif.id } };
      const resMark = mockRes();
      await NotificationsController.markAsRead(reqMark, resMark, mockNext);

      assert.strictEqual(resMark.statusCode, 200);
      assert.strictEqual(resMark.jsonData.data.isRead, true);

      const reqListAfter = { user: ownerA };
      const resListAfter = mockRes();
      await NotificationsController.getNotifications(reqListAfter, resListAfter, mockNext);
      const countAfter = resListAfter.jsonData.data.unreadCount;

      assert.strictEqual(countAfter, countBefore - 1, 'Unread count should decrease by 1');
      console.log('  ✅ [PASS] Marking single notification as read updates unread count accurately');
    }

    // -----------------------------------------------------------------
    // Scenario 9: Mark All as Read
    // -----------------------------------------------------------------
    console.log('\n--- 9. Testing Mark All Notifications as Read ---');
    {
      // Add a couple more notifications
      NotificationsStore.create({ recipientId: testOwnerAId, title: 'إشعار 1', message: 'تنبيه 1', type: 'info' });
      NotificationsStore.create({ recipientId: testOwnerAId, title: 'إشعار 2', message: 'تنبيه 2', type: 'info' });

      const reqMarkAll = { user: ownerA };
      const resMarkAll = mockRes();
      await NotificationsController.markAllAsRead(reqMarkAll, resMarkAll, mockNext);

      assert.strictEqual(resMarkAll.statusCode, 200);

      const reqList = { user: ownerA };
      const resList = mockRes();
      await NotificationsController.getNotifications(reqList, resList, mockNext);

      assert.strictEqual(resList.jsonData.data.unreadCount, 0, 'All notifications must be read');
      console.log('  ✅ [PASS] Mark all as read resets unread count to 0');
    }

    // -----------------------------------------------------------------
    // Scenario 10: Multi-Tenant Notification Isolation & IDOR Protection
    // -----------------------------------------------------------------
    console.log('\n--- 10. Testing Notification Isolation & Cross-Owner Protection ---');
    {
      // Create a private notification specifically for Owner A
      const notifA = NotificationsStore.create({
        recipientId: testOwnerAId,
        title: 'إشعار خاص جداً بالمالك أ',
        message: 'بيانات مالية وسندات ملكية خاصة',
        type: 'verification',
      });

      // Owner B fetches their notifications
      const reqB = { user: ownerB };
      const resB = mockRes();
      await NotificationsController.getNotifications(reqB, resB, mockNext);

      const ownerBNotifs = resB.jsonData.data.notifications;
      const leakedNotif = ownerBNotifs.find(n => n.id === notifA.id);
      assert.strictEqual(leakedNotif, undefined, 'Owner B must NEVER see Owner A notifications');

      // Owner B attempts to maliciously mark Owner A notification as read (IDOR attack)
      const attackReq = { user: ownerB, params: { id: notifA.id } };
      const attackRes = mockRes();
      await NotificationsController.markAsRead(attackReq, attackRes, mockNext);

      assert.strictEqual(attackRes.statusCode, 403, 'Should block cross-owner notification access with 403');
      assert.strictEqual(attackRes.jsonData.code, 'FORBIDDEN');
      console.log('  ✅ [PASS] Cross-owner isolation verified: Owner B cannot view or tamper with Owner A notifications');
    }

    console.log('\n======================================================');
    console.log('🎉 ALL 10 OWNER DASHBOARD & CONTACT TESTS PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    // Clean up test data
    if (createdListingId) {
      await Listing.deleteOne({ id: createdListingId }).catch(() => {});
      ListingsService.delete(createdListingId);
    }
    await Notification.deleteMany({ recipientId: { $in: [testOwnerAId, testOwnerBId] } }).catch(() => {});
    await disconnectDB();
  }
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
