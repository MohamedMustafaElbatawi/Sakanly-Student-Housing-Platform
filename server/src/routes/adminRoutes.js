import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/adminAuth.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

// جميع routes محمية بـ requireSuperAdmin
router.use(requireSuperAdmin);

// Dashboard stats
router.get('/stats', adminController.getAdminStats);

// Admin profile
router.get('/me', adminController.getAdminProfile);

// Users management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/suspend', adminController.suspendUser);
router.patch('/users/:id/unsuspend', adminController.unsuspendUser);

// Owners management & performance metrics
router.get('/owners', adminController.getOwners);

// Verification queue
router.get('/owners/verification-queue', adminController.getVerificationQueue);
router.get('/owners/:id/verification-docs', adminController.getOwnerVerificationDocs);
router.post('/owners/:id/verify', adminController.verifyOwner);
router.post('/owners/:id/reject', adminController.rejectOwner);
router.post('/owners/:id/request-correction', adminController.requestOwnerCorrection);

// Listings management & moderation
router.get('/listings', adminController.getAllListings);
router.get('/listings/:id', adminController.getAdminListingById);
router.patch('/listings/:id/status', adminController.updateListingStatus);

// Inquiries / Viewing Requests
router.get('/inquiries', adminController.getAllInquiries);

// Reports management
router.get('/reports', adminController.getAllReports);
router.patch('/reports/:id/resolve', adminController.resolveReport);

// Platform Conversations & Chat System Indicators
router.get('/conversations', adminController.getAllConversations);
router.get('/chat-metrics', adminController.getChatMetrics);

// System Notifications & Broadcast
router.get('/notifications', adminController.getAllNotifications);
router.post('/notifications/broadcast', adminController.broadcastNotification);

// Analytics & Commercial KPIs
router.get('/analytics', adminController.getAnalytics);

// Platform Settings & Configuration
router.get('/settings', adminController.getPlatformSettings);
router.patch('/settings', adminController.updatePlatformSettings);

// Security, Access Logs & Password
router.get('/security/logs', adminController.getSecurityLogs);
router.post('/security/change-password', adminController.changeAdminPassword);

// Audit log
router.get('/audit-log', adminController.getAuditLog);

export default router;
