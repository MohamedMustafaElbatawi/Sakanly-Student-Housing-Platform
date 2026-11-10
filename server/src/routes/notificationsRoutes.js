import { Router } from 'express';
import { NotificationsController } from '../controllers/notificationsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// All notification routes strictly require authenticated user
router.use(requireAuth);

router.get('/', NotificationsController.getNotifications);
router.patch('/:id/read', NotificationsController.markAsRead);
router.post('/mark-all-read', NotificationsController.markAllAsRead);

export default router;
