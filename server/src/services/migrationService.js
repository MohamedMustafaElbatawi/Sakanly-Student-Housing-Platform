import bcrypt from 'bcryptjs';
import { User, Listing, Inquiry, Conversation, Notification, PlatformSettings, Favorite } from '../models/index.js';
import { users as mockUsersList, userStore } from '../data/mockUsers.js';
import { mockListings } from '../data/mockListings.js';
import { ListingsService } from './listingsService.js';
import { initialInquiries, InquiriesStore } from '../data/mockInquiriesData.js';
import { initialConversations } from '../data/mockMessagesData.js';
import { MessagesService } from './messagesService.js';
import { initialNotifications, NotificationsStore } from '../data/mockNotificationsData.js';
import { FavoritesStore } from '../data/mockFavoritesData.js';
import { AuditLog } from '../data/auditLog.js';
import { PlatformSettingsStore } from '../data/platformSettings.js';
import { isMongoConnected } from '../config/database.js';

let migrationExecuted = false;

export const runMigrations = async () => {
  if (!isMongoConnected()) {
    return { success: false, message: 'MongoDB not connected, skipping migration.' };
  }

  if (migrationExecuted) {
    return { success: true, message: 'Migrations already executed in this process.' };
  }

  console.log('🔄 [Migration] Checking & seeding initial data to MongoDB Atlas...');

  try {
    // 0. Super Admin Auto-Synchronization from Environment
    const envAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().replace(/^["']+|["']+$/g, '').toLowerCase();
    const envAdminPassword = process.env.SUPER_ADMIN_PASSWORD?.replace(/^["']+|["']+$/g, '');
    const envAdminName = process.env.SUPER_ADMIN_NAME?.replace(/^["']+|["']+$/g, '') || 'إدارة منصة سكنلي (Super Admin)';
    const envAdminPhone = process.env.SUPER_ADMIN_PHONE?.replace(/^["']+|["']+$/g, '') || '01000000001';

    if (envAdminEmail && envAdminPassword) {
      const adminDoc = await User.findOne({
        $or: [
          { id: 'usr-super-admin-root' },
          { email: envAdminEmail },
          { role: 'super_admin' },
        ],
      });

      const matchesExisting = adminDoc?.password ? bcrypt.compareSync(envAdminPassword, adminDoc.password) : false;

      if (!adminDoc) {
        const hashedPassword = bcrypt.hashSync(envAdminPassword, 12);
        await User.create({
          id: 'usr-super-admin-root',
          fullName: envAdminName,
          email: envAdminEmail,
          phone: envAdminPhone,
          password: hashedPassword,
          role: 'super_admin',
          avatar: '',
          isVerified: true,
          verificationStatus: 'verified',
          isGoogleUser: false,
          suspended: false,
          createdAt: new Date().toISOString(),
        });
        console.log('🛡️ [Migration] Super Admin seeded successfully in MongoDB Atlas.');
      } else if (!matchesExisting || adminDoc.role !== 'super_admin' || adminDoc.email !== envAdminEmail) {
        const hashedPassword = bcrypt.hashSync(envAdminPassword, 12);
        await User.findOneAndUpdate(
          { _id: adminDoc._id },
          {
            $set: {
              email: envAdminEmail,
              password: hashedPassword,
              role: 'super_admin',
              fullName: envAdminName,
              phone: envAdminPhone,
              isVerified: true,
              verificationStatus: 'verified',
              suspended: false,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        console.log('🛡️ [Migration] Synchronized Super Admin credentials and role in MongoDB Atlas.');
      }
    }

    // 1. Users
    let userCount = 0;
    for (const u of mockUsersList) {
      const { ...userData } = u;
      const cleanEmail = userData.email ? userData.email.toLowerCase() : '';
      const queryConditions = [];
      if (userData.id) queryConditions.push({ id: userData.id });
      if (cleanEmail) queryConditions.push({ email: cleanEmail });

      const existing = queryConditions.length > 0 ? await User.findOne({ $or: queryConditions }) : null;
      if (!existing) {
        try {
          await User.create(userData);
          userCount++;
        } catch (err) {
          if (err.code === 11000) {
            // Already exists in Atlas under duplicate constraint
            userCount++;
          } else {
            throw err;
          }
        }
      } else {
        userCount++;
      }
    }

    // 2. Listings
    let listingCount = 0;
    for (const l of mockListings) {
      await Listing.findOneAndUpdate(
        { id: l.id },
        { $setOnInsert: l },
        { upsert: true, returnDocument: 'after' }
      );
      listingCount++;
    }

    // 3. Inquiries
    for (const inq of initialInquiries) {
      await Inquiry.findOneAndUpdate(
        { id: inq.id },
        { $setOnInsert: inq },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // 4. Conversations
    for (const conv of initialConversations) {
      await Conversation.findOneAndUpdate(
        { id: conv.id },
        { $setOnInsert: conv },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // 5. Notifications
    for (const notif of initialNotifications) {
      await Notification.findOneAndUpdate(
        { id: notif.id },
        { $setOnInsert: notif },
        { upsert: true, returnDocument: 'after' }
      );
    }

    // 6. Platform Settings
    await PlatformSettings.findOneAndUpdate(
      { key: 'global_settings' },
      {
        $setOnInsert: {
          key: 'global_settings',
          settings: {
            platformName: 'منصة سكنلي - Sakanly',
            platformTagline: 'المنصة الطلابية الأولى لسكن آمن وموثوق بمحيط الجامعات المصرية',
            platformFeePercentage: 0,
            maintenanceMode: false,
            allowStudentRegistration: true,
            allowOwnerRegistration: true,
            requireOwnerVerificationForListing: true,
            autoApproveVerifiedOwnerListings: false,
            contactEmail: 'support@sakanly.com',
            contactPhone: '01000000001',
            termsVersion: '2026.1',
            securityPolicy: {
              maxLoginAttempts: 5,
              sessionTimeoutMinutes: 60,
              enforceStrongPasswords: true,
              allowDirectMessaging: true,
            },
          },
          securityLogs: [
            {
              id: `sec-${Date.now()}-01`,
              type: 'system_boot',
              ip: '127.0.0.1',
              user: 'system',
              role: 'system',
              description: 'تم تهيئة وتأكيد قاعدة بيانات MongoDB Atlas لمنصة سكنلي.',
              severity: 'info',
              timestamp: new Date().toISOString(),
            },
          ],
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    // 7. Seed initial favorites
    await Favorite.findOneAndUpdate(
      { userId: 'usr-student-001' },
      { $setOnInsert: { userId: 'usr-student-001', listingIds: ['prop-001'] } },
      { upsert: true, returnDocument: 'after' }
    );
    await Favorite.findOneAndUpdate(
      { userId: 'usr-email-001' },
      { $setOnInsert: { userId: 'usr-email-001', listingIds: ['prop-004'] } },
      { upsert: true, returnDocument: 'after' }
    );

    // 8. Hydrate all in-memory stores with MongoDB Atlas documents
    await Promise.all([
      userStore.syncFromDB(),
      ListingsService.syncFromDB(),
      InquiriesStore.syncFromDB(),
      MessagesService.syncFromDB(),
      FavoritesStore.syncFromDB(),
      NotificationsStore.syncFromDB(),
      AuditLog.syncFromDB(),
      PlatformSettingsStore.syncFromDB(),
    ]);

    migrationExecuted = true;
    console.log(`✅ [Migration] Completed successfully. Synced users (${userCount}) and listings (${listingCount}).`);
    return { success: true, userCount, listingCount };
  } catch (error) {
    migrationExecuted = false;
    console.error('❌ [Migration] Error during MongoDB data sync:', error.message);
    throw error;
  }
};
