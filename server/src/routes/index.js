import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import listingsRoutes from './listingsRoutes.js';
import authRoutes from './authRoutes.js';
import messagesRoutes from './messagesRoutes.js';
import mediaRoutes from './mediaRoutes.js';
import favoritesRoutes from './favoritesRoutes.js';
import notificationsRoutes from './notificationsRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/listings', listingsRoutes);
router.use('/auth', authRoutes);
router.use('/messages', messagesRoutes);
router.use('/media', mediaRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/admin', adminRoutes);

export default router;

